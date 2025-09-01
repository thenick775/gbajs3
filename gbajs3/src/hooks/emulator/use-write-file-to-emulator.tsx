import { useCallback } from 'react';

import { useEmulatorContext } from '../context.tsx';

export const useWriteFileToEmulator = () => {
  const { emulator } = useEmulatorContext();

  const writeFileToEmulator = useCallback(
    async (file: File): Promise<void> => {
      const name = file.name;
      const nameLower = name.toLowerCase();

      if (emulator?.isFileExtensionOfType(nameLower, 'rom')) {
        return new Promise<void>((resolve) =>
          emulator.uploadRom(file, resolve)
        );
      } else if (emulator?.isFileExtensionOfType(nameLower, 'autosave')) {
        const arrayBuffer = await file.arrayBuffer();
        await emulator.uploadAutoSaveState(
          `${emulator.filePaths().autosave}/${name}`,
          new Uint8Array(arrayBuffer)
        );
        return;
      } else if (emulator?.isFileExtensionOfType(nameLower, 'save')) {
        return new Promise<void>((resolve) =>
          emulator.uploadSaveOrSaveState(file, resolve)
        );
      } else if (emulator?.isFileExtensionOfType(nameLower, 'cheat')) {
        return new Promise<void>((resolve) =>
          emulator.uploadCheats(file, resolve)
        );
      } else if (emulator?.isFileExtensionOfType(nameLower, 'patch')) {
        return new Promise<void>((resolve) =>
          emulator.uploadPatch(file, resolve)
        );
      } else if (emulator?.isFileExtensionOfType(nameLower, 'screenshot')) {
        return new Promise<void>((resolve) =>
          emulator.uploadScreenshot(file, resolve)
        );
      }
    },
    [emulator]
  );

  return writeFileToEmulator;
};
