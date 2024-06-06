import { useState } from 'react';
import { ErrorCode, useDropzone } from 'react-dropzone';
import { BiCloudUpload, BiError } from 'react-icons/bi';
import { styled, useTheme } from 'styled-components';

import { ErrorWithIcon } from './error-with-icon.tsx';
import { CenteredTextContainer } from './styled.tsx';

type ExtensionList = (RegExp | string)[];

type DragAndDropInputProps = {
  ariaLabel: string;
  copy: string;
  hideAcceptedFiles?: boolean;
  hideErrors?: boolean;
  id: string;
  multiple?: boolean;
  name: string;
  onDrop: (acceptedFiles: File[]) => void;
  validFileExtensions: ExtensionList;
};

type DropAreaProps = {
  $isDragActive?: boolean;
};

const DropArea = styled.div<DropAreaProps>`
  cursor: pointer;
  border-color: ${({ theme }) => theme.blackRussian};
  background-color: ${({ $isDragActive = false, theme }) =>
    $isDragActive ? theme.arcticAirBlue : theme.aliceBlue2};
  border-width: 1px;
  border-style: dashed;
  padding: 0.5rem;
  text-align: center;
`;

const BiCloudUploadLarge = styled(BiCloudUpload)`
  height: 60px;
  width: auto;
`;

const hasValidFileExtension = (file: File, validExtensions: ExtensionList) => {
  const fileExtension = `.${file.name.split('.').pop()}`;

  return validExtensions.some((r) =>
    r instanceof RegExp ? !!r.exec(fileExtension) : r === fileExtension
  );
};

const validateFile = (validFileExtensions: ExtensionList) => {
  let fileRequiredError =
    'One ' +
    validFileExtensions.slice(0, -1).join(', ') +
    `, or ${validFileExtensions.slice(-1)} file is required`;

  if (validFileExtensions.length == 1) {
    fileRequiredError = `At least one ${validFileExtensions[0]} file is required`;
  }

  return (file?: File | DataTransferItem) => {
    if (
      !(file instanceof File) || // could be data transfer, ignore
      (!!file && hasValidFileExtension(file, validFileExtensions))
    )
      return null;

    return {
      message: fileRequiredError,
      code: ErrorCode.FileInvalidType
    };
  };
};

export const DragAndDropInput = ({
  ariaLabel,
  copy,
  hideAcceptedFiles,
  hideErrors,
  id,
  multiple = false,
  name,
  onDrop,
  validFileExtensions
}: DragAndDropInputProps) => {
  const theme = useTheme();
  const [acceptedFileNames, setAcceptedFileNames] = useState<string[]>([]);
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      multiple,
      onDrop: (acceptedFiles) => {
        setAcceptedFileNames(acceptedFiles.map((file) => file.name));
        onDrop?.(acceptedFiles);
      },
      onFileDialogCancel: () => {
        setAcceptedFileNames([]);
        onDrop?.([]);
      },
      validator: validateFile(validFileExtensions)
    });

  const rejectedFileErrors = [
    ...new Set(
      fileRejections
        .flatMap((rejection) => rejection.errors)
        .map((error) => error.message)
    )
  ];

  const accept = validFileExtensions.every((e) => typeof e === 'string')
    ? validFileExtensions.map((ext) => `${ext}`).join(',')
    : undefined;

  return (
    <>
      <DropArea
        {...getRootProps({
          id: id,
          $isDragActive: isDragActive,
          'aria-label': ariaLabel
        })}
      >
        <input
          data-testid={`hidden-file-input`}
          {...getInputProps({ accept, name })}
        />
        <BiCloudUploadLarge />
        <p>{copy}</p>
      </DropArea>
      {!!acceptedFileNames.length && !hideAcceptedFiles && (
        <CenteredTextContainer>
          <p>File{multiple && 's'} to upload:</p>
          {acceptedFileNames.map((name, idx) => (
            <p key={`${name}_${idx}`}>{name}</p>
          ))}
        </CenteredTextContainer>
      )}
      {!!fileRejections.length &&
        !hideErrors &&
        rejectedFileErrors.map((msg) => (
          <ErrorWithIcon
            key={msg}
            icon={<BiError style={{ color: theme.errorRed }} />}
            text={msg}
          />
        ))}
    </>
  );
};
