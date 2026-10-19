import type { GBAEmulator } from '../../../emulator/mgba/mgba-emulator';

export const generateScreenshot = (emulator: GBAEmulator | null) => {
  if (!emulator) return null;

  const fileName = 'fade-copy.png';
  const filePath = emulator.filePaths().screenshotsPath + '/' + fileName;
  const successful = emulator.screenshot(fileName);

  if (!successful) return null;

  const fileBytes = emulator.getFile(filePath);

  emulator.deleteFile(filePath);

  return new Blob([fileBytes.slice()], { type: 'image/png' });
};
