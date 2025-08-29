import { Button } from '@mui/material';
import {
  ZipWriter,
  BlobWriter,
  Uint8ArrayReader,
  TextReader,
  ZipReader,
  BlobReader,
  Uint8ArrayWriter,
  TextWriter,
  type ZipWriterConstructorOptions
} from '@zip.js/zip.js';
import { useCallback, useId } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import {
  EmbeddedProductTour,
  type TourSteps
} from '../product-tour/embedded-product-tour.tsx';
import { DragAndDropInput } from '../shared/drag-and-drop-input.tsx';

import type {
  FileNode,
  GBAEmulator
} from '../../emulator/mgba/mgba-emulator.tsx';

type InputProps = {
  zipFile: File;
};

type ZipTarget = {
  writer: ZipWriter<unknown>;
  finalize: () => Promise<void>;
};

const ZIP_TYPES: FilePickerAcceptType[] = [
  {
    description: 'ZIP archive',
    accept: { 'application/zip': ['.zip'] }
  }
];

const validFileExtensions = ['.zip'];

const flattenFiles = (node?: FileNode): string[] =>
  !node
    ? []
    : [
        ...(node.nextNeighbor ? flattenFiles(node.nextNeighbor) : []),
        ...(!node.isDir
          ? [node.path]
          : (node.children ?? []).flatMap(flattenFiles))
      ];

const stripLeadingSlashes = (p: string) => p.replace(/^\/+/, '');

const pickZipName = (prefix = 'gbajs-files') =>
  `${prefix}-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-')}.zip`;

const downloadBlob = (name: string) => (blob: Blob) => {
  const link = document.createElement('a');
  link.download = name;
  link.href = URL.createObjectURL(blob);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
};

const setupZipTarget = async (
  name: string,
  opts: ZipWriterConstructorOptions
): Promise<ZipTarget> => {
  const usePicker = typeof window.showSaveFilePicker === 'function';

  // if showSaveFilePicker is available, we can stream into the downloaded file natively
  if (usePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: name,
      types: ZIP_TYPES
    });
    const sink = await handle.createWritable();
    const writer = new ZipWriter<void>(sink, opts);
    return { writer, finalize: () => writer.close().then(() => {}) };
  }

  // else we build a blob in memory
  const blobWriter = new BlobWriter('application/zip');
  const writer = new ZipWriter<Blob>(blobWriter, opts);
  return {
    writer,
    finalize: async () => downloadBlob(name)(await writer.close())
  };
};

const exportEmscriptenFsAsZip = async (
  emulator: GBAEmulator | null,
  { name = pickZipName(), level = 6 }: { name?: string; level?: number } = {}
): Promise<void> => {
  const files = flattenFiles(emulator?.listAllFiles())
    .map(stripLeadingSlashes)
    .filter(Boolean);

  const zipOptions: ZipWriterConstructorOptions = {
    level,
    bufferedWrite: true
  };
  const { writer, finalize } = await setupZipTarget(name, zipOptions);

  await files.reduce<Promise<void>>(
    (chain, relPath) =>
      chain.then(async () => {
        const bytes = emulator?.getFile('/' + relPath);
        return bytes && bytes.length
          ? writer
              .add(relPath, new Uint8ArrayReader(bytes), zipOptions)
              .then(() => void 0)
          : Promise.resolve();
      }),
    Promise.resolve()
  );

  writer.add(
    'local-storage.json',
    new TextReader(JSON.stringify(localStorage)),
    zipOptions
  );

  await finalize();
};

const writeFileToEmulator = async (
  emulator: GBAEmulator | null,
  absPath: string,
  data: File
) => {
  const nameLower = absPath.toLowerCase();

  if (
    nameLower.endsWith('.gba') ||
    nameLower.endsWith('.gbc') ||
    nameLower.endsWith('.gb') ||
    nameLower.endsWith('.zip') ||
    nameLower.endsWith('.7z')
  ) {
    emulator?.uploadRom(data);
    return;
  }
  if (nameLower.endsWith('_auto.ss')) {
    const arrayBuffer = await data.arrayBuffer();
    await emulator?.uploadAutoSaveState(absPath, new Uint8Array(arrayBuffer));
    return;
  }
  if (nameLower.endsWith('.sav') || nameLower.match(/\.ss[0-9]+/)) {
    emulator?.uploadSaveOrSaveState(data);
    return;
  }
  if (nameLower.endsWith('.cheats')) {
    emulator?.uploadCheats(data);
    return;
  }
  if (
    nameLower.endsWith('.ips') ||
    nameLower.endsWith('.ups') ||
    nameLower.endsWith('.bps')
  ) {
    emulator?.uploadPatch(data);
    return;
  }
  if (nameLower.endsWith('.png')) {
    emulator?.uploadScreenshot(data);
    return;
  }

  console.error(`No supported write path for ${absPath}`);
};

const restoreLocalStorageFromJson = (s: string) =>
  Object.entries(JSON.parse(s)).forEach(([k, v]) =>
    localStorage.setItem(k, String(v))
  );

const importZipToEmscriptenFs = async (
  emulator: GBAEmulator | null,
  zipFile: File
) => {
  const reader = new ZipReader(new BlobReader(zipFile));
  try {
    const entries = await reader.getEntries();
    for (const entry of entries) {
      if (!entry || !entry.filename) continue;
      if (entry.directory) continue;

      const normalized = entry.filename.replace(/\\/g, '/').replace(/^\/+/, '');

      if (normalized.includes('..')) {
        console.warn('Skipping unsafe path in ZIP:', normalized);
        continue;
      }

      if (normalized === 'local-storage.json') {
        const text = await entry.getData(new TextWriter());
        restoreLocalStorageFromJson(text);
        continue;
      }

      const bytes = await entry.getData(new Uint8ArrayWriter());
      const absPath = '/' + normalized;
      const file = new File(
        [new Blob([new Uint8Array(bytes)], { type: 'text/plain' })],
        absPath.split('/').pop() ?? 'invalid-fname'
      );

      await writeFileToEmulator(emulator, absPath, file);
    }
  } finally {
    await reader.close();
  }
};

export const ImportExportModal = () => {
  const { setIsModalOpen } = useModalContext();
  const { emulator } = useEmulatorContext();
  const { syncActionIfEnabled } = useAddCallbacks();
  const { reset, handleSubmit, setValue, control } = useForm<InputProps>();
  const importFormId = useId();
  const buttonBaseId = useId();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      reset();
      setValue('zipFile', acceptedFiles[0], { shouldValidate: true });
    },
    [reset, setValue]
  );

  const onSubmit: SubmitHandler<InputProps> = async ({ zipFile }) => {
    await importZipToEmscriptenFs(emulator, zipFile);
    await syncActionIfEnabled();
    setIsModalOpen(false);
  };

  const tourSteps: TourSteps = [
    {
      content: (
        <>
          <p>
            Use this area to drag and drop the exported zip file, or click to
            select a file.
          </p>
          <p>
            Uploaded exports should have an extension of:{' '}
            {validFileExtensions.map((ext) => `'${ext}'`).join(', ')}.
          </p>
        </>
      ),
      target: `#${CSS.escape(`${importFormId}--drag-and-drop`)}`
    },
    {
      content: <p>Use this button to import your zip file once loaded.</p>,
      target: `#${CSS.escape(`${buttonBaseId}-import`)}`
    },
    {
      content: (
        <p>
          Use this button to export a zip file containing your file system, and
          all emulator related settings/state.
        </p>
      ),
      target: `#${CSS.escape(`${buttonBaseId}-export`)}`
    }
  ];

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
              validate: (zipFile) =>
                !!zipFile || 'At least one export .zip file is required'
            }}
            render={({ field: { name, value }, fieldState: { error } }) => (
              <DragAndDropInput
                ariaLabel="Upload Saves"
                id={`${importFormId}--drag-and-drop`}
                onDrop={onDrop}
                name={name}
                validFileExtensions={validFileExtensions}
                error={error?.message}
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
          id={`${buttonBaseId}-import`}
          form={importFormId}
          type="submit"
          variant="contained"
        >
          Import
        </Button>
        <Button
          id={`${buttonBaseId}-export`}
          variant="contained"
          color="secondary"
          onClick={() => exportEmscriptenFsAsZip(emulator)}
        >
          Export
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
      <EmbeddedProductTour
        steps={tourSteps}
        completedProductTourStepName="hasCompletedImportExportTour"
      />
    </>
  );
};
