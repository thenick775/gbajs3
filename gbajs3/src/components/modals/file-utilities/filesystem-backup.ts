import {
  createZipBlob,
  downloadZip,
  generateExportZipName,
  readZipFiles,
  stripLeadingSlashes,
  type ZipFile
} from './zip.ts';

import type {
  FileNode,
  GBAEmulator
} from '../../../emulator/mgba/mgba-emulator.tsx';

const flattenFiles = (node?: FileNode): string[] =>
  !node
    ? []
    : [
        ...(node.nextNeighbor ? flattenFiles(node.nextNeighbor) : []),
        ...(!node.isDir
          ? [node.path]
          : (node.children ?? []).flatMap(flattenFiles))
      ];

const getFilesystemBackupFiles = (emulator: GBAEmulator | null): ZipFile[] =>
  flattenFiles(emulator?.listAllFiles()).map((path) => ({
    zipPath: stripLeadingSlashes(path),
    read: () => emulator?.getFile(path)
  }));

export const createFilesystemBackupBlob = async (
  emulator: GBAEmulator | null
): Promise<Blob> => createZipBlob(getFilesystemBackupFiles(emulator));

export const exportEmulatorFsToZip = async (
  emulator: GBAEmulator | null
): Promise<void> =>
  downloadZip(generateExportZipName(), getFilesystemBackupFiles(emulator));

export const importZipToEmulatorFs = async (
  zipFile: File,
  writeFileToEmulator: (file: File) => Promise<void>
) => {
  const files = await readZipFiles(zipFile);

  await Promise.allSettled(files.map((file) => writeFileToEmulator(file)));
};
