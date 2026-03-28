import { IconButton } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { ErrorCode, useDropzone } from 'react-dropzone';
import { BiCloudUpload, BiError, BiTrash } from 'react-icons/bi';

import { ErrorWithIcon } from './error-with-icon.tsx';

import type { Extension } from '../../emulator/mgba/mgba-emulator.tsx';

type DragAndDropInputProps = {
  ariaLabel: string;
  children: ReactNode;
  error?: string;
  hideAcceptedFiles?: boolean;
  sortAcceptedFiles?: (a: string, b: string) => number;
  hideErrors?: boolean;
  id: string;
  multiple?: boolean;
  name: string;
  onDrop: (acceptedFiles: File[]) => void;
  validFileExtensions: Extension[];
  renderAdditionalFileActions?: (fileInfo: {
    fileName: string;
    index: number;
  }) => ReactNode;
};

type DropAreaProps = {
  $isDragActive?: boolean;
};

const DropArea = styled('div')<DropAreaProps>`
  cursor: pointer;
  border: 2px dashed ${({ theme }) => theme.modalBorderStrong};
  background-color: ${({ $isDragActive = false, theme }) =>
    $isDragActive ? theme.modalHoverSurface : theme.modalDropzoneSurface};
  color: ${({ theme }) => theme.modalTextSecondary};
  padding: 0.75rem;
  text-align: center;
  border-radius: 10px;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.modalHoverSurface};
    border-color: ${({ theme }) => theme.gbaThemeBlue};
  }

  &:focus-within {
    border-color: ${({ theme }) => theme.gbaThemeBlue};
    box-shadow: 0 0 0 0.25rem ${({ theme }) => theme.focusRingPrimary};
  }
`;

const BiCloudUploadLarge = styled(BiCloudUpload)`
  height: 60px;
  width: auto;
  color: ${({ theme }) => theme.surfaceTextPrimary};
`;

const ErrorContainer = styled('div')`
  padding-top: 3px;
`;

const FileList = styled('ul')`
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  max-width: 100%;
  padding: 10px 5px 5px 5px;
  color: ${({ theme }) => theme.modalTextSecondary};

  > p {
    margin: 0;
    color: ${({ theme }) => theme.modalTextPrimary};
    font-weight: 500;
  }
`;

const AcceptedFile = styled('li')`
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  background: ${({ theme }) => theme.modalSurfaceElevated};
  border: 1px solid ${({ theme }) => theme.modalBorder};
  border-radius: 8px;
  padding: 0.5rem 0.75rem;

  > p {
    margin: 0;
    overflow: hidden;
    color: ${({ theme }) => theme.modalTextPrimary};
  }
`;

const IconSeparator = styled('div')`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StyledIconButton = styled(IconButton)`
  && {
    padding: 6px;
    border: 1px solid transparent;
    border-radius: 8px;
    color: ${({ theme }) => theme.modalTextSecondary};
    background: transparent;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease,
      box-shadow 120ms ease;

    &:hover {
      background-color: ${({ theme }) => theme.modalHoverSurface};
      border-color: ${({ theme }) => theme.modalBorderStrong};
      color: ${({ theme }) => theme.modalTextPrimary};
    }

    &:focus-visible {
      outline: none;
      background-color: ${({ theme }) => theme.modalHoverSurface};
      border-color: ${({ theme }) => theme.gbaThemeBlue};
      box-shadow: 0 0 0 0.25rem ${({ theme }) => theme.focusRingPrimary};
      color: ${({ theme }) => theme.modalTextPrimary};
    }
  }
`;

const StyledBiTrash = styled(BiTrash)`
  width: 18px;
  height: 18px;
`;

const AcceptedFiles = ({
  fileNames,
  renderAdditionalActions,
  onDeleteFile
}: {
  fileNames: string[];
  renderAdditionalActions?: (fileInfo: {
    fileName: string;
    index: number;
    totalFiles: number;
  }) => ReactNode;
  onDeleteFile: (fileName: string) => void;
}) => (
  <FileList>
    <p>File{fileNames.length > 1 && 's'} to upload:</p>
    {fileNames.map((fileName, index) => (
      <AcceptedFile key={`${fileName}_${index}`}>
        <p>{fileName}</p>
        <IconSeparator>
          {renderAdditionalActions?.({
            fileName,
            index,
            totalFiles: fileNames.length
          })}
          <StyledIconButton
            aria-label={`Delete ${fileName}`}
            onClick={() => {
              onDeleteFile(fileName);
            }}
          >
            <StyledBiTrash />
          </StyledIconButton>
        </IconSeparator>
      </AcceptedFile>
    ))}
  </FileList>
);

const hasValidFileExtension = (file: File, validExtensions: Extension[]) => {
  const fileExtension = `.${file.name.split('.').pop()}`;

  return validExtensions.some((e) =>
    typeof e === 'string' ? e === fileExtension : !!e.regex.exec(fileExtension)
  );
};

const getDescription = (extension: Extension) =>
  typeof extension === 'string' ? extension : extension.displayText;

const validateFile = (validFileExtensions: Extension[], multiple: boolean) => {
  if (!validFileExtensions.length) return undefined;

  const prefix = multiple ? 'At least one' : 'One';

  let fileRequiredError =
    `${prefix} ` +
    validFileExtensions.slice(0, -1).map(getDescription).join(', ') +
    `, or ${getDescription(validFileExtensions.slice(-1)[0])} file is required`;

  if (validFileExtensions.length === 1) {
    fileRequiredError = `${prefix} ${getDescription(
      validFileExtensions[0]
    )} file is required`;
  }

  return (file?: File | DataTransferItem) => {
    if (
      !(file instanceof File) ||
      hasValidFileExtension(file, validFileExtensions)
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
  sortAcceptedFiles,
  hideErrors,
  id,
  multiple = false,
  name,
  renderAdditionalFileActions,
  onDrop,
  validFileExtensions
}: DragAndDropInputProps) => {
  const theme = useTheme();
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      multiple,
      onDrop: (acceptedFiles) => {
        setAcceptedFiles(acceptedFiles);
        onDrop(acceptedFiles);
      },
      validator: validateFile(validFileExtensions, multiple)
    });

  const rejectedFileErrors = error
    ? [error]
    : fileRejections.length && acceptedFiles.length
      ? ['Some files were rejected']
      : [
          ...new Set(
            fileRejections
              .flatMap((rejection) => rejection.errors)
              .map((error) => error.message)
          )
        ];

  const onDeleteFile = (name: string) => {
    const files = acceptedFiles.filter((file) => file.name !== name);
    setAcceptedFiles(files);
    onDrop(files);
  };

  const acceptedFileNames = acceptedFiles
    .map((file) => file.name)
    .toSorted(sortAcceptedFiles ?? (() => 0));

  return (
    <>
      <DropArea
        {...getRootProps({
          id: id,
          $isDragActive: isDragActive,
          'aria-label': ariaLabel
        })}
      >
        <input data-testid="hidden-file-input" {...getInputProps({ name })} />
        <BiCloudUploadLarge />
        {children}
      </DropArea>
      {!!acceptedFileNames.length && !hideAcceptedFiles && (
        <AcceptedFiles
          fileNames={acceptedFileNames}
          onDeleteFile={onDeleteFile}
          renderAdditionalActions={renderAdditionalFileActions}
        />
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
