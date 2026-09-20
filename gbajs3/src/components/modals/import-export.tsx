import { Button } from '@mui/material';
import { useCallback, useId, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';

import {
  exportEmulatorFsToZip,
  importZipToEmulatorFs
} from './file-utilities/filesystem-backup.ts';
import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useWriteFileToEmulator } from '../../hooks/emulator/use-write-file-to-emulator.tsx';
import { DragAndDropInput } from '../shared/drag-and-drop-input.tsx';
import { isZipUnsafeFilenameError } from './file-utilities/zip.ts';

type InputProps = {
  zipFile: File;
};

const validFileExtensions = ['.zip'];

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
      if (isZipUnsafeFilenameError(error)) {
        setImportError(
          'ZIP contains an unsafe file path and cannot be imported'
        );
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
            await exportEmulatorFsToZip(emulator);
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
