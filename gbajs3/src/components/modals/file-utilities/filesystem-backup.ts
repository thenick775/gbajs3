import { BlobWriter, ZipWriter, type Entry } from '@zip.js/zip.js';

import {
  addLocalStorageToZip,
  addUint8ArrayToZip,
  readFileFromZipEntry,
  readZipEntriesFromBlob,
  restoreLocalStorageFromZip,
  stripLeadingSlashes,
  zipOptions
} from './zip.ts';

import type { FileNode, GBAEmulator } from '../../../emulator/mgba/mgba-emulator.tsx';

const flattenFiles = (node?: FileNode): string[] =>
  !node
    ? []
    : [
        ...(node.nextNeighbor ? flattenFiles(node.nextNeighbor) : []),
        ...(!node.isDir
          ? [node.path]
          : (node.children ?? []).flatMap(flattenFiles))
      ];

export const createFilesystemBackupBlob = async (
  emulator: GBAEmulator | null
): Promise<Blob> => {
  const blobWriter = new BlobWriter('application/zip');
  const writer = new ZipWriter<Blob>(blobWriter, zipOptions);
  const files = flattenFiles(emulator?.listAllFiles()).map(stripLeadingSlashes);

  await files.reduce(
    (chain, relPath) =>
      chain.then(async () => {
        const bytes = emulator?.getFile('/' + relPath);
        return bytes?.length
          ? addUint8ArrayToZip(writer, relPath, bytes).then(() => void 0)
          : Promise.resolve();
      }),
    Promise.resolve()
  );

  await addLocalStorageToZip(writer);

  return writer.close();
};

export const importZipToEmulatorFs = async (
  zipFile: File,
  writeFileToEmulator: (file: File) => Promise<void>
) => {
  const writeEntryToEmulator = async (entry: Entry) => {
    if (!entry.filename) return;
    if (entry.directory) return;

    if (entry.filename === 'local-storage.json') {
      await restoreLocalStorageFromZip(entry);
      return;
    }

    const file = await readFileFromZipEntry(entry);

    if (file) await writeFileToEmulator(file);
  };

  return readZipEntriesFromBlob(zipFile, writeEntryToEmulator);
};
