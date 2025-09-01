import { Button } from '@mui/material';
import { useId, useCallback } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useModalContext, useEmulatorContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { DragAndDropInput } from '../shared/drag-and-drop-input.tsx';

type InputProps = {
  allFiles: File[];
};

export const UploadFilesModal = () => {
  const { setIsModalOpen } = useModalContext();
  const { emulator } = useEmulatorContext();
  const { syncActionIfEnabled } = useAddCallbacks();
  const { reset, handleSubmit, setValue, control } = useForm<InputProps>();
  const uploadPatchesFormId = useId();

  const validFileExtensions = Object.values(
    emulator?.defaultFileTypes() ?? {}
  ).flatMap((_) => _);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      reset();
      setValue('allFiles', acceptedFiles, { shouldValidate: true });
    },
    [reset, setValue]
  );

  const onSubmit: SubmitHandler<InputProps> = async ({ allFiles }) => {
    await Promise.all(
      allFiles.map(
        (patchFile) =>
          new Promise<void>((resolve) =>
            emulator?.uploadPatch(patchFile, resolve)
          )
      )
    );

    await syncActionIfEnabled();
    setIsModalOpen(false);
  };

  return (
    <>
      <ModalHeader title="Upload Files" />
      <ModalBody>
        <form
          id={uploadPatchesFormId}
          aria-label="Upload Patches Form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            control={control}
            name="allFiles"
            rules={{
              validate: (allFiles) =>
                allFiles?.length > 0 ||
                'At least one .ips/.ups/.bps file is required'
            }}
            render={({ field: { name, value }, fieldState: { error } }) => (
              <DragAndDropInput
                ariaLabel="Upload Files"
                id={`${uploadPatchesFormId}--drag-and-drop`}
                onDrop={onDrop}
                name={name}
                validFileExtensions={validFileExtensions}
                error={error?.message}
                hideAcceptedFiles={!value?.length}
                multiple
              >
                <p>
                  Drag and drop or click to upload roms, saves, cheats, or patch
                  files
                </p>
              </DragAndDropInput>
            )}
          />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button form={uploadPatchesFormId} type="submit" variant="contained">
          Upload
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
