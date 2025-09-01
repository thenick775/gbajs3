import { Button, Checkbox, type CheckboxProps } from '@mui/material';
import { useId, useCallback } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useModalContext, useEmulatorContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useWriteFileToEmulator } from '../../hooks/emulator/use-write-file-to-emulator.tsx';
import { DragAndDropInput } from '../shared/drag-and-drop-input.tsx';

import type { FileTypes } from '../../emulator/mgba/mgba-emulator.tsx';

type InputProps = {
  allFiles: File[];
  romFileToRun?: string;
};

type RunRomCheckboxProps = {
  fileName: string;
} & Pick<CheckboxProps, 'checked' | 'onChange'>;

type AdditionalFileActionsProps = {
  fileName: string;
  selectedFileName?: string;
  setSelectedFileName: (name: string | null) => void;
  isChecked: boolean;
  isRomFile: boolean;
};

const orderFileNamesByExtension = (types?: FileTypes) => {
  if (!types) return;

  const specs = Object.values(types)
    .flat()
    .map((s) =>
      typeof s === 'string'
        ? (n: string) => n.toLowerCase().endsWith(s.toLowerCase())
        : (n: string) => s.regex.test(n)
    );

  const rank = (n: string) => {
    n = n.toLowerCase();
    const i = specs.findIndex((t) => t(n));
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };

  return (a: string, b: string) => rank(a) - rank(b);
};

const RunRomCheckboxProps = ({
  fileName,
  checked,
  onChange
}: RunRomCheckboxProps) => (
  <Checkbox
    slotProps={{ input: { 'aria-label': `Run ${fileName}` } }}
    checked={checked}
    onChange={onChange}
    sx={{ padding: '0 ' }}
  />
);

const AdditionalFileActions = ({
  fileName,
  isChecked,
  selectedFileName,
  setSelectedFileName,
  isRomFile
}: AdditionalFileActionsProps) => {
  if (!isRomFile) return;

  return (
    <RunRomCheckboxProps
      fileName={fileName}
      checked={isChecked || fileName === selectedFileName}
      onChange={() => setSelectedFileName(isChecked ? null : fileName)}
    />
  );
};

export const UploadFilesModal = () => {
  const { setIsModalOpen } = useModalContext();
  const { emulator } = useEmulatorContext();
  const writeFileToEmulator = useWriteFileToEmulator();
  const { syncActionIfEnabled } = useAddCallbacks();
  const { reset, handleSubmit, setValue, control, watch } =
    useForm<InputProps>();
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
    await Promise.all(allFiles.map((file) => writeFileToEmulator(file)));

    await syncActionIfEnabled();
    setIsModalOpen(false);
  };

  const allFiles = watch('allFiles');
  const firstRomName = allFiles?.find((file) =>
    emulator?.isFileExtensionOfType(file.name, 'rom')
  )?.name;
  const romFileToRun = watch('romFileToRun');

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
                sortAcceptedFiles={orderFileNamesByExtension(
                  emulator?.defaultFileTypes()
                )}
                multiple
                renderAdditionalFileActions={({ fileName }) => (
                  <AdditionalFileActions
                    selectedFileName={watch('romFileToRun')}
                    setSelectedFileName={(name) =>
                      setValue('romFileToRun', name ?? undefined)
                    }
                    isRomFile={
                      emulator?.isFileExtensionOfType(fileName, 'rom') ?? false
                    }
                    fileName={fileName}
                    isChecked={
                      (firstRomName === fileName && !romFileToRun) ||
                      romFileToRun === fileName
                    }
                  />
                )}
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
