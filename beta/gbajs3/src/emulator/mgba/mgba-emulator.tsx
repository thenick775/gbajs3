import { Dispatch, SetStateAction } from 'react';

import { filePaths, mGBAEmulator as mGBAEmulatorTypeDef } from './wasm/mgba.js';

export type GBAEmulator = {
  // audioPolyfill: () => void;
  createSaveState: (slot: number) => boolean;
  // defaultKeyBindings: () => void; // vancise return numbers map to keyboard keys -> react modern solutions??
  deleteSaveState: (slot: number) => void;
  disableKeyboardInput: () => void;
  // downloadSave: () => void; // redundant, use getcurrentsave
  enableKeyboardInput: () => void;
  getCurrentCheatsFile: () => Uint8Array;
  // getCurrentCheatsFileName: () => string; // maybe dont need?
  getCurrentSave: () => Uint8Array | null;
  getCurrentSaveName: () => string | undefined;
  getVolume: () => number;
  // lcdFade: () => void; // put in screen
  listSaveStates: () => string[];
  loadSaveState: (slot: number) => boolean;
  // parseCheatsString: () => void;
  // parseCheatsStringLibRetro: () => void;
  pause: () => void;
  quickReload: () => void;
  quitMgba: () => void;
  quitGame: () => void;
  remapKeyBinding: () => void;
  resume: () => void;
  run: (romPath: string) => boolean;
  screenShot: (callback: () => void) => void;
  setFastForward: (mode: number, value: number) => void;
  setVolume: (volumePercent: number) => void;
  simulateKeyDown: (keyId: string) => void;
  simulateKeyUp: (keyId: string) => void;
  uploadCheats: (file: File, callback?: () => void) => void;
  uploadRom: (file: File, callback?: () => void) => void;
  uploadSaveOrSaveState: (file: File, callback?: () => void) => void;
  filePaths: () => filePaths;
};

export const mGBAEmulator = (
  mGBA: mGBAEmulatorTypeDef,
  setIsPaused: Dispatch<SetStateAction<boolean>>,
  setIsRunning: Dispatch<SetStateAction<boolean>>
): GBAEmulator => {
  const paths = mGBA.filePaths();

  const filepathToFileName = (path: string | undefined, extension: string) => {
    let fileName = path?.split('/').pop();
    const ext = '.' + fileName?.split('.').pop();
    fileName = fileName?.replace(ext, extension);

    return fileName;
  };

  return {
    createSaveState: (slot) => mGBA.saveState(slot),
    loadSaveState: (slot) => mGBA.loadState(slot),
    listSaveStates: () => mGBA.FS.readdir(paths.saveStatePath),
    setVolume: (volumePercent) => mGBA.setVolume(volumePercent),
    getVolume: () => mGBA.getVolume(),
    enableKeyboardInput: () => mGBA.toggleInput(true),
    disableKeyboardInput: () => mGBA.toggleInput(false),
    simulateKeyDown: (keyId) => mGBA.buttonPress(keyId),
    simulateKeyUp: (keyId) => mGBA.buttonUnpress(keyId),
    setFastForward: (mode, value) => mGBA.setMainLoopTiming(mode, value),
    run: (romPath) => {
      setIsRunning(true);
      return mGBA.loadGame(romPath);
    },
    getCurrentSave: () => (mGBA.saveName ? mGBA.getSave() : null),
    getCurrentSaveName: () => mGBA.saveName,
    uploadCheats: (file, callback) => mGBA.uploadCheats(file, callback),
    uploadRom: (file, callback) => mGBA.uploadRom(file, callback),
    uploadSaveOrSaveState: (file, callback) =>
      mGBA.uploadSaveOrSaveState(file, callback),
    deleteSaveState: (slot) => {
      const saveStateName = filepathToFileName(mGBA.saveName, '.ss' + slot);
      const saveStatePath = paths.saveStatePath + '/' + saveStateName;

      mGBA.FS.unlink(saveStatePath);
    },
    pause: () => {
      setIsPaused(true);
      mGBA.pauseGame();
    },
    resume: () => {
      setIsPaused(false);
      mGBA.resumeGame();
    },
    quitGame: () => {
      setIsRunning(false);
      setIsPaused(false);
      mGBA.quitGame();
    },
    quitMgba: () => {
      setIsRunning(false);
      setIsPaused(false);
      mGBA.quitMgba();
    },
    quickReload: () => mGBA.quickReload(), // case handling from original js file, is it necessary??
    getCurrentCheatsFile: () => {
      const cheatsName = filepathToFileName(mGBA.gameName, '.cheats');

      return mGBA.FS.readFile(paths.cheatsPath + cheatsName);
    },
    screenShot: (copyCanvasCallback) => mGBA.screenShot(copyCanvasCallback),
    remapKeyBinding: () => undefined,
    filePaths: () => mGBA.filePaths(),
  };
};
