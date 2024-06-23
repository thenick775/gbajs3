import { useState } from 'react';
import { ErrorCode, useDropzone } from 'react-dropzone';
import { BiCloudUpload, BiError } from 'react-icons/bi';
import { styled, useTheme } from 'styled-components';

import { ErrorWithIcon } from './error-with-icon.tsx';
import { CenteredTextContainer } from './styled.tsx';

import type { ReactNode } from 'react';

type Extension = RegexValidator | string;

type RegexValidator = {
  regex: RegExp;
  displayText: string;
};

type DragAndDropInputProps = {
  ariaLabel: string;
  children: ReactNode;
  error?: string;
  hideAcceptedFiles?: boolean;
  hideErrors?: boolean;
  id: string;
  multiple?: boolean;
  name: string;
  onDrop: (acceptedFiles: File[]) => void;
  validFileExtensions: Extension[];
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

const ErrorContainer = styled.div`
  padding-top: 3px;
`;

const hasValidFileExtension = (file: File, validExtensions: Extension[]) => {
  const fileExtension = `.${file.name.split('.').pop()}`;

  return validExtensions.some((e) =>
    typeof e === 'string' ? e === fileExtension : !!e.regex.exec(fileExtension)
  );
};

const getDescription = (extension: Extension) =>
  typeof extension === 'string' ? extension : extension.displayText;

const validateFile = (validFileExtensions: Extension[]) => {
  let fileRequiredError =
    'One ' +
    validFileExtensions.slice(0, -1).map(getDescription).join(', ') +
    `, or ${validFileExtensions.slice(-1)} file is required`;

  if (validFileExtensions.length == 1) {
    fileRequiredError = `At least one ${getDescription(
      validFileExtensions[0]
    )} file is required`;
  }

  return (file?: File | DataTransferItem) => {
    if (
      !(file instanceof File) ||
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
  children,
  error,
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
        onDrop(acceptedFiles);
      },
      validator: validateFile(validFileExtensions)
    });

  const rejectedFileErrors = error
    ? [error]
    : [
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
        <input data-testid={`hidden-file-input`} {...getInputProps({ name })} />
        <BiCloudUploadLarge />
        {children}
      </DropArea>
      {!!acceptedFileNames.length && !hideAcceptedFiles && (
        <CenteredTextContainer>
          <p>File{multiple && 's'} to upload:</p>
          {acceptedFileNames.map((name, idx) => (
            <p key={`${name}_${idx}`}>{name}</p>
          ))}
        </CenteredTextContainer>
      )}
      {!!rejectedFileErrors.length && !hideErrors && (
        <ErrorContainer>
          {rejectedFileErrors.map((msg) => (
            <ErrorWithIcon
              key={msg}
              icon={<BiError style={{ color: theme.errorRed }} />}
              text={msg}
            />
          ))}
        </ErrorContainer>
      )}
    </>
  );
};
