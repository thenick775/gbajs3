import {
  BlobReader,
  BlobWriter,
  ERR_UNSAFE_FILENAME,
  TextReader,
  TextWriter,
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipReader,
  ZipWriter,
  type Entry,
  type EntryMetaData,
  type FileEntry,
  type ZipWriterConstructorOptions
} from '@zip.js/zip.js';
import { z } from 'zod';

import { downloadBlob } from './blob.ts';

export type ZipFile = {
  zipPath: string;
  read: () => Uint8Array | undefined;
};

type ZipTarget = {
  writer: ZipWriter<Blob>;
  finalize: () => Promise<Blob>;
};

type UnsafeFilenameError = Error & {
  filename?: string;
};

const zipTypes: FilePickerAcceptType[] = [
  {
    description: 'ZIP archive',
    accept: { 'application/zip': ['.zip'] }
  }
];

const zipOptions = {
  level: 6,
  bufferedWrite: true
};

const storageSchema = z.record(z.string(), z.unknown());

export const generateExportZipName = (prefix = 'gbajs-files') =>
  `${prefix}-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-')}.zip`;

const setupZipTarget = async (
  name: string,
  opts: ZipWriterConstructorOptions
): Promise<ZipTarget> => {
  const usePicker = typeof window.showSaveFilePicker === 'function';

  // if showSaveFilePicker is available, we can stream into the downloaded file natively
  if (usePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: name,
      types: zipTypes
    });
    const sink = await handle.createWritable();
    const writer = new ZipWriter<Blob>(sink, opts);
    return { writer, finalize: () => writer.close() };
  }

  // else we build a blob in memory
  const blobWriter = new BlobWriter('application/zip');
  const writer = new ZipWriter<Blob>(blobWriter, opts);
  return {
    writer,
    finalize: async () => downloadBlob(name, await writer.close())
  };
};

/** zip requires leading slashes to be removed, for
 * consistency when unpacking across platforms
 * */
export const stripLeadingSlashes = (filePath: string) =>
  filePath.replace(/^\/+/, '');

export const isZipUnsafeFilenameError = (
  error: unknown
): error is UnsafeFilenameError =>
  error instanceof Error && error.message === ERR_UNSAFE_FILENAME;

const addLocalStorageToZip = (
  writer: ZipWriter<Blob>
): Promise<EntryMetaData> =>
  writer.add(
    'local-storage.json',
    new TextReader(JSON.stringify(localStorage)),
    zipOptions
  );

const restoreLocalStorageFromZip = async (entry: FileEntry): Promise<void> => {
  const textJson = await entry.getData(new TextWriter());
  const json = storageSchema.parse(JSON.parse(textJson));

  Object.entries(json).forEach(([k, v]) => {
    localStorage.setItem(k, String(v));
  });
};

const addUint8ArrayToZip = (
  writer: ZipWriter<Blob>,
  relativePath: string,
  bytes: Uint8Array
) => writer.add(relativePath, new Uint8ArrayReader(bytes), zipOptions);

const writeFilesToZip = async (writer: ZipWriter<Blob>, files: ZipFile[]) => {
  await files.reduce(
    (chain, { zipPath, read }) =>
      chain.then(async () => {
        const bytes = read();

        return bytes?.length
          ? addUint8ArrayToZip(writer, zipPath, bytes).then(() => void 0)
          : Promise.resolve();
      }),
    Promise.resolve()
  );

  await addLocalStorageToZip(writer);
};

export const createZipBlob = async (files: ZipFile[]): Promise<Blob> => {
  const blobWriter = new BlobWriter('application/zip');
  const writer = new ZipWriter<Blob>(blobWriter, zipOptions);

  await writeFilesToZip(writer, files);

  return writer.close();
};

export const downloadZip = async (
  name: string,
  files: ZipFile[]
): Promise<void> => {
  const { writer, finalize } = await setupZipTarget(name, zipOptions);

  await writeFilesToZip(writer, files);

  await finalize();
};

/**
 * Reads entries from a ZIP file and calls `onReadEntry` for each read file.
 *
 * @throws {Error} If the ZIP cannot be read, including when `zip.js`
 * rejects unsafe entries with `ERR_UNSAFE_FILENAME`.
 */
const readZipEntriesFromBlob = async (
  zipFile: File,
  onReadEntry: (entry: Entry) => Promise<void>
) => {
  const reader = new ZipReader(new BlobReader(zipFile));

  try {
    const entries = await reader.getEntries();

    await Promise.allSettled(entries.map(onReadEntry));
  } finally {
    await reader.close();
  }
};

const readFileFromZipEntry = async (entry: FileEntry) => {
  const bytes = await entry.getData(new Uint8ArrayWriter());
  const name = entry.filename.split('/').pop();

  return name
    ? new File(
        [new Blob([new Uint8Array(bytes)], { type: 'text/plain' })],
        name
      )
    : null;
};

export const readZipFiles = async (zipFile: File): Promise<File[]> => {
  const files: File[] = [];

  await readZipEntriesFromBlob(zipFile, async (entry) => {
    if (!entry.filename) return;
    if (entry.directory) return;

    if (entry.filename === 'local-storage.json') {
      await restoreLocalStorageFromZip(entry);
      return;
    }

    const file = await readFileFromZipEntry(entry);

    if (file) files.push(file);
  });

  return files;
};
