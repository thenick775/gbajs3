import { Dispatch, SetStateAction } from 'react';

import { filePaths, mGBAEmulator as mGBAEmulatorTypeDef } from './wasm/mgba.js';

export type FileNode = {
  path: string;
  isDir: boolean;
  children?: FileNode[];
};

interface FsNode extends FS.FSNode {
  mode: number;
}

export type GBAEmulator = {
  // audioPolyfill: () => void;
  createSaveState: (slot: number) => boolean;
  // defaultKeyBindings: () => void; // return numbers map to keyboard keys -> react modern solutions??
  deleteSaveState: (slot: number) => void;
  deleteFile: (path: string) => void;
  disableKeyboardInput: () => void;
  // downloadSave: () => void; // redundant, use getcurrentsave
  enableKeyboardInput: () => void;
  getCurrentCheatsFile: () => Uint8Array;
  // getCurrentCheatsFileName: () => string; // maybe dont need?
  getCurrentGameName: () => string | undefined;
  getCurrentSave: () => Uint8Array | null;
  getCurrentSaveName: () => string | undefined;
  getVolume: () => number;
  // lcdFade: () => void; // put in screen
  listSaveStates: () => string[];
  listRoms: () => string[];
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
  listAllFiles: () => FileNode;
  fsSync: () => void;
};

export const mGBAEmulator = (
  mGBA: mGBAEmulatorTypeDef,
  setIsPaused: Dispatch<SetStateAction<boolean>>,
  setIsRunning: Dispatch<SetStateAction<boolean>>
): GBAEmulator => {
  const paths = mGBA.filePaths();

  const filepathToFileName = (
    path: string | undefined,
    extension?: string | undefined
  ) => {
    let fileName = path?.split('/')?.pop();
    if (extension) {
      const ext = '.' + fileName?.split('.')?.pop();
      fileName = fileName?.replace(ext, extension);
    }

    return fileName;
  };

  const listAllFiles = () => {
    const root: FileNode = { path: paths.root, isDir: true, children: [] };
    const ignorePaths = ['.', '..'];

    const recursiveRead = ({ path, children }: FileNode) => {
      for (const name of mGBA.FS.readdir(path)) {
        if (ignorePaths.includes(name)) continue;

        const currPath = `${path}/${name}`;
        const { mode } = mGBA.FS.lookupPath(currPath, {}).node as FsNode;
        const fileNode = {
          path: currPath,
          isDir: mGBA.FS.isDir(mode),
          children: []
        };

        children?.push(fileNode);
        if (fileNode.isDir) recursiveRead(fileNode);
      }
    };

    recursiveRead(root);

    return root;
  };

  return {
    createSaveState: (slot) => mGBA.saveState(slot),
    loadSaveState: (slot) => mGBA.loadState(slot),
    listSaveStates: () => mGBA.FS.readdir(paths.saveStatePath),
    listRoms: () => mGBA.FS.readdir(paths.gamePath),
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
    getCurrentGameName: () => filepathToFileName(mGBA.gameName),
    getCurrentSave: () => (mGBA.saveName ? mGBA.getSave() : null),
    getCurrentSaveName: () => filepathToFileName(mGBA.saveName),
    uploadCheats: (file, callback) => mGBA.uploadCheats(file, callback),
    uploadRom: (file, callback) => mGBA.uploadRom(file, callback),
    uploadSaveOrSaveState: (file, callback) =>
      mGBA.uploadSaveOrSaveState(file, callback),
    deleteSaveState: (slot) => {
      const saveStateName = filepathToFileName(mGBA.saveName, '.ss' + slot);
      const saveStatePath = paths.saveStatePath + '/' + saveStateName;

      mGBA.FS.unlink(saveStatePath);
    },
    deleteFile: (path) => {
      mGBA.FS.unlink(path);
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
    listAllFiles: listAllFiles,
    fsSync: () => mGBA.FSSync()
  };
};
