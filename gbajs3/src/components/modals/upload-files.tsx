import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  type CheckboxProps
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useId, useCallback, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler
} from 'react-hook-form';
import { BiTrash } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useModalContext, useEmulatorContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useRunGame } from '../../hooks/emulator/use-run-game.tsx';
import { useWriteFileToEmulator } from '../../hooks/emulator/use-write-file-to-emulator.tsx';
import { DragAndDropInput } from '../shared/drag-and-drop-input.tsx';
import { StyledBiPlus } from '../shared/styled.tsx';

import type { FileTypes } from '../../emulator/mgba/mgba-emulator.tsx';

type InputProps = {
  files: File[];
  fileUrls: { url: string; type: keyof FileTypes }[];
  romToRun?: { fileName: string } | { romUrl: string } | null;
};

type RunRomCheckboxProps = {
  fileName: string;
} & Pick<CheckboxProps, 'checked' | 'onChange'>;

type AdditionalFileActionsProps = {
  fileName: string;
  setSelectedFileName: (name: string | null) => void;
  isChecked: boolean;
  isRomFile: boolean;
};

const defaultFileUrl: { url: string; type: keyof FileTypes } = {
  url: '',
  type: 'rom'
};

const GridContainer = styled('div')`
  display: grid;
`;

const GridItem = styled('div')<{ $isVisible: boolean }>`
  grid-area: 1 / 1;
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  min-width: 0;
`;

const UrlFieldContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const UrlInputsContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

const FileTypeContainer = styled('div')`
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 8px;
`;

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

// TODO: find a better place for this logic, slightly duplicated
const fetchFileFromUrl = async (fileUrl: URL) => {
  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`Received unexpected status code: ${res.status}`);
  }

  // extract file name from response headers if possible
  const fileName = res.headers
    .get('Content-Disposition')
    ?.split(';')
    .pop()
    ?.split('=')
    .pop()
    ?.replace(/"/g, '');

  const fallbackFileName = decodeURIComponent(
    fileUrl.pathname.split('/').pop() ?? 'unknown_external.unknown'
  );

  const blob = await res.blob();
  const file = new File([blob], fileName ?? fallbackFileName);

  return file;
};

const RunRomCheckbox = ({
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
  setSelectedFileName,
  isRomFile
}: AdditionalFileActionsProps) => {
  if (!isRomFile) return null;

  return (
    <RunRomCheckbox
      fileName={fileName}
      checked={isChecked}
      onChange={() => {
        setSelectedFileName(isChecked ? null : fileName);
      }}
    />
  );
};

export const UploadFilesModal = () => {
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const runGame = useRunGame();
  const writeFileToEmulator = useWriteFileToEmulator();
  const { syncActionIfEnabled } = useAddCallbacks();
  const [uploadType, setUploadType] = useState<'files' | 'urls'>('files');
  const uploadFilesFormId = useId();
  const {
    handleSubmit,
    setValue,
    control,
    watch,
    register,
    formState: { errors, isSubmitting }
  } = useForm<InputProps>({
    defaultValues: {
      files: [],
      fileUrls: [defaultFileUrl],
      romToRun: undefined
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fileUrls'
  });

  const validFileExtensions = Object.values(
    emulator?.defaultFileTypes() ?? {}
  ).flatMap((_) => _);

  const findFirstRomFile = (files: File[]) =>
    files.find((file) => emulator?.isFileExtensionOfType(file.name, 'rom'))
      ?.name;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setValue('files', acceptedFiles, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit: SubmitHandler<InputProps> = async ({
    files,
    fileUrls,
    romToRun
  }) => {
    const localRomCandidates = files.filter((file) =>
      emulator?.isFileExtensionOfType(file.name, 'rom')
    );

    await Promise.all(files.map((file) => writeFileToEmulator(file)));

    const activeFileUrls = fileUrls.filter((fileUrl) => !!fileUrl.url);

    const successfulUrlRomCandidates: { romUrl: string; fileName: string }[] =
      [];

    if (fileUrls.length > 0) {
      const externalFilesSettled = await Promise.allSettled(
        activeFileUrls.map(async ({ url, type }) => ({
          romUrl: url,
          file: await fetchFileFromUrl(new URL(url)),
          type
        }))
      );

      const successfulExternalUploads = externalFilesSettled.filter(
        (result) => result.status === 'fulfilled'
      );

      await Promise.all(
        successfulExternalUploads.map((result) =>
          writeFileToEmulator(result.value.file, result.value.type)
        )
      );

      successfulUrlRomCandidates.push(
        ...successfulExternalUploads
          .filter((result) => result.value.type === 'rom')
          .map((result) => ({
            romUrl: result.value.romUrl,
            fileName: result.value.file.name
          }))
      );
    }

    await syncActionIfEnabled();

    const selectedLocalRom: string | undefined =
      romToRun && 'fileName' in romToRun
        ? localRomCandidates.find((file) => file.name === romToRun.fileName)
            ?.name
        : undefined;

    const selectedUrlRom: string | undefined =
      romToRun && 'romUrl' in romToRun
        ? successfulUrlRomCandidates.find(
            (candidate) => candidate.romUrl === romToRun.romUrl
          )?.fileName
        : undefined;

    const gameToRun =
      romToRun === null
        ? null
        : [
            selectedLocalRom,
            selectedUrlRom,
            localRomCandidates[0]?.name,
            successfulUrlRomCandidates[0]?.fileName
          ].find((candidate) => candidate !== undefined);

    if (gameToRun) runGame(gameToRun);

    closeModal();
  };

  const files = watch('files');
  const firstRomName = findFirstRomFile(files);
  const romToRun = watch('romToRun');
  const fileUrls = watch('fileUrls');
  const firstUrlRom =
    firstRomName || romToRun !== undefined
      ? null
      : fileUrls.find((fileUrl) => fileUrl.url && fileUrl.type === 'rom')?.url;

  const handleUploadType = (
    _: React.MouseEvent<HTMLElement>,
    uploadType: 'files' | 'urls' | null
  ) => {
    if (uploadType) setUploadType(uploadType);
  };

  return (
    <>
      <ModalHeader title="Upload Files" />
      <ModalBody>
        <form
          id={uploadFilesFormId}
          aria-label="Upload Files Form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <GridContainer>
            <GridItem $isVisible={uploadType === 'files'}>
              <Controller
                control={control}
                name="files"
                rules={{
                  validate: (files) =>
                    files.length > 0 ||
                    uploadType === 'urls' ||
                    `At least one ${validFileExtensions
                      .map(
                        (ext) =>
                          `'${typeof ext === 'string' ? ext : ext.displayText}'`
                      )
                      .join(', ')} file is required`
                }}
                render={({ field: { name, value }, fieldState: { error } }) => (
                  <DragAndDropInput
                    ariaLabel="Upload Files"
                    id={`${uploadFilesFormId}--drag-and-drop`}
                    onDrop={onDrop}
                    name={name}
                    validFileExtensions={validFileExtensions}
                    error={error?.message}
                    hideAcceptedFiles={!value.length}
                    sortAcceptedFiles={orderFileNamesByExtension(
                      emulator?.defaultFileTypes()
                    )}
                    multiple
                    renderAdditionalFileActions={({ fileName }) => (
                      <AdditionalFileActions
                        setSelectedFileName={(name) => {
                          setValue(
                            'romToRun',
                            name ? { fileName: name } : null
                          );
                        }}
                        isRomFile={
                          emulator?.isFileExtensionOfType(fileName, 'rom') ??
                          false
                        }
                        fileName={fileName}
                        isChecked={
                          (!!romToRun &&
                            'fileName' in romToRun &&
                            romToRun.fileName === fileName) ||
                          (romToRun === undefined && firstRomName === fileName)
                        }
                      />
                    )}
                  >
                    <p>
                      Drag and drop or click to upload roms, saves, cheats, or
                      patch files
                    </p>
                  </DragAndDropInput>
                )}
              />
            </GridItem>
            <GridItem $isVisible={uploadType === 'urls'}>
              <UrlFieldContainer>
                {fields.map((item, index) => (
                  <div key={item.id}>
                    {index !== 0 && (
                      <Divider flexItem sx={{ margin: '10px 0' }} />
                    )}
                    <UrlInputsContainer>
                      <TextField
                        id={`${uploadFilesFormId}--file-url-${index}`}
                        error={!!errors.fileUrls?.[index]?.url}
                        label="URL"
                        size="small"
                        autoComplete="url"
                        variant="filled"
                        helperText={errors.fileUrls?.[index]?.url?.message}
                        aria-label="Upload File From URL"
                        fullWidth
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label={`Remove URL ${index}`}
                                  sx={{ padding: '5px' }}
                                  onClick={() => {
                                    remove(index);
                                  }}
                                >
                                  <BiTrash />
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                        {...register(`fileUrls.${index}.url`, {
                          validate: (fileUrl) => {
                            if (uploadType === 'urls') {
                              try {
                                if (!fileUrl) return 'Invalid url - empty';
                                new URL(fileUrl);
                              } catch {
                                return 'Invalid url';
                              }
                            }
                          }
                        })}
                      />
                      <FileTypeContainer>
                        <FormControl size="small">
                          <InputLabel>File Type</InputLabel>
                          <Controller
                            control={control}
                            name={`fileUrls.${index}.type`}
                            defaultValue={item.type}
                            render={({ field }) => (
                              <Select label="File Type" {...field}>
                                {Object.keys(
                                  emulator?.defaultFileTypes() ?? {
                                    rom: '.gba'
                                  }
                                ).map((fileType) => (
                                  <MenuItem key={fileType} value={fileType}>
                                    {fileType}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </FormControl>
                        {fileUrls[index]?.type === 'rom' && (
                          <FormControlLabel
                            sx={{ marginRight: 0 }}
                            control={
                              <Checkbox
                                disabled={!fileUrls[index]?.url}
                                checked={
                                  (!!romToRun &&
                                    'romUrl' in romToRun &&
                                    romToRun.romUrl === fileUrls[index]?.url) ||
                                  (romToRun === undefined &&
                                    firstUrlRom === fileUrls[index]?.url)
                                }
                                onChange={() => {
                                  setValue(
                                    'romToRun',
                                    !!romToRun &&
                                      'romUrl' in romToRun &&
                                      romToRun.romUrl === fileUrls[index]?.url
                                      ? null
                                      : fileUrls[index]?.url
                                        ? { romUrl: fileUrls[index].url }
                                        : null
                                  );
                                }}
                              />
                            }
                            label="Run rom"
                          />
                        )}
                      </FileTypeContainer>
                    </UrlInputsContainer>
                  </div>
                ))}
              </UrlFieldContainer>
              <IconButton
                aria-label="Add upload url"
                sx={{ padding: 0, marginTop: '10px' }}
                onClick={() => {
                  append(defaultFileUrl);
                }}
              >
                <StyledBiPlus />
              </IconButton>
            </GridItem>
          </GridContainer>
        </form>
      </ModalBody>
      <ModalFooter>
        <div style={{ width: '100%' }}>
          <ToggleButtonGroup
            value={uploadType}
            size="small"
            exclusive
            onChange={handleUploadType}
            aria-label="upload type"
          >
            <ToggleButton value="files" aria-label="files">
              Files
            </ToggleButton>
            <ToggleButton value="urls" aria-label="urls">
              Urls
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <Button
          style={{ minWidth: 'fit-content' }}
          form={uploadFilesFormId}
          type="submit"
          variant="contained"
          loading={isSubmitting}
        >
          Upload
        </Button>
        <Button
          style={{ minWidth: 'fit-content' }}
          variant="outlined"
          onClick={closeModal}
        >
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
