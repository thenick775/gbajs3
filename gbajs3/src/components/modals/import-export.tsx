import { Button } from '@mui/material';
import { ERR_UNSAFE_FILENAME } from '@zip.js/zip.js';
import { useCallback, useId, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';

import { downloadBlob } from './file-utilities/blob.ts';
import {
  createFilesystemBackupBlob,
  importZipToEmulatorFs
} from './file-utilities/filesystem-backup.ts';
import { generateExportZipName } from './file-utilities/zip.ts';
import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useWriteFileToEmulator } from '../../hooks/emulator/use-write-file-to-emulator.tsx';
import { DragAndDropInput } from '../shared/drag-and-drop-input.tsx';

type InputProps = {
  zipFile: File;
};

type UnsafeFilenameError = Error & {
  filename?: string;
};

const validFileExtensions = ['.zip'];

const isUnsafeFilenameError = (
  error: unknown
): error is UnsafeFilenameError =>
  error instanceof Error && error.message === ERR_UNSAFE_FILENAME;

export const ImportExportModal = () => {
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const writeFileToEmulator = useWriteFileToEmulator();
  const { syncActionIfEnabled } = useAddCallbacks();
  const {
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting }
  } = useForm<InputProps>();
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importFormId = useId();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setImportError(null);
      reset();
      setValue('zipFile', acceptedFiles[0], { shouldValidate: true });
    },
    [reset, setValue]
  );

  const onSubmit: SubmitHandler<InputProps> = async ({ zipFile }) => {
    setImportError(null);

    try {
      await importZipToEmulatorFs(zipFile, writeFileToEmulator);
    } catch (error) {
      if (isUnsafeFilenameError(error)) {
        setImportError('ZIP contains an unsafe file path and cannot be imported');
        return;
      }

      throw error;
    }

    await syncActionIfEnabled();
    closeModal();
  };

  return (
    <>
      <ModalHeader title="Import/Export" />
      <ModalBody>
        <form
          id={importFormId}
          aria-label="Upload Emulator Zip Form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            control={control}
            name="zipFile"
            rules={{
              validate: (zipFile?: File) =>
                !!zipFile || 'At least one export .zip file is required'
            }}
            render={({ field: { name, value }, fieldState: { error } }) => (
              <DragAndDropInput
                ariaLabel="Upload Saves"
                id={`${importFormId}--drag-and-drop`}
                onDrop={onDrop}
                name={name}
                validFileExtensions={validFileExtensions}
                error={error?.message ?? importError ?? undefined}
                hideAcceptedFiles={!value}
              >
                <p>
                  Drag and drop your exported zip file here, or click to upload
                </p>
              </DragAndDropInput>
            )}
          />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          form={importFormId}
          type="submit"
          variant="contained"
          loading={isSubmitting}
        >
          Import
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={async () => {
            setIsExportLoading(true);
            const backup = await createFilesystemBackupBlob(emulator);
            downloadBlob(generateExportZipName(), backup);
            setIsExportLoading(false);
          }}
          loading={isExportLoading}
        >
          Export
        </Button>
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
