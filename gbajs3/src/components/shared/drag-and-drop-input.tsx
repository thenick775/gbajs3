import { useState } from 'react';
import { ErrorCode, useDropzone } from 'react-dropzone';
import { BiCloudUpload, BiError } from 'react-icons/bi';
import { styled, useTheme } from 'styled-components';

import { ErrorWithIcon } from './error-with-icon.tsx';
import { CenteredTextContainer } from './styled.tsx';

type DragAndDropInputProps = {
  ariaLabel: string;
  copy: string;
  hideErrors?: boolean;
  id: string;
  multiple?: boolean;
  name: string;
  onDrop: (acceptedFiles: File[]) => void;
  validFileExtensions: string[];
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

const validateFile = (validFileExtensions: string[]) => {
  let fileRequiredError =
    'One ' +
    validFileExtensions.slice(0, -1).join(', ') +
    `, or ${validFileExtensions.slice(-1)} file is required`;

  if (validFileExtensions.length == 1) {
    fileRequiredError = `At least one ${validFileExtensions[0]} file is required`;
  }

  return (file?: File | DataTransferItem) => {
    if (
      !(file instanceof File) ||
      (!!file && validFileExtensions.includes(`.${file.name.split('.').pop()}`))
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
          data-testid={`file-hidden-input`}
          {...getInputProps({
            name,
            accept: validFileExtensions.map((ext) => `${ext}`).join(',')
          })}
        />
        <BiCloudUploadLarge />
        <p>{copy}</p>
      </DropArea>
      {!!acceptedFileNames.length && (
        <CenteredTextContainer>
          <p>File{multiple && 's'} to upload:</p>
          {acceptedFileNames.map((name, idx) => (
            <p key={`${name}_${idx}`}>{name}</p>
          ))}
        </CenteredTextContainer>
      )}
      {!!fileRejections.length &&
        !hideErrors &&
        rejectedFileErrors.map((msg, idx) => (
          <ErrorWithIcon
            key={`${msg}_${idx}`}
            icon={<BiError style={{ color: theme.errorRed }} />}
            text={msg}
          />
        ))}
    </>
  );
};
