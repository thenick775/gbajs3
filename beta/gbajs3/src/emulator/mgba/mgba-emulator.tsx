import { Dispatch, SetStateAction } from 'react';

import { filePaths, mGBAEmulator as mGBAEmulatorTypeDef } from './wasm/mgba.js';

export type FileNode = {
  path: string;
  isDir: boolean;
  children?: FileNode[];
};

export type ParsedCheats = {
  desc: string;
  code: string;
  enable: boolean;
};

interface FsNode extends FS.FSNode {
  mode: number;
}

export type GBAEmulator = {
  // audioPolyfill: () => void;
  // defaultKeyBindings: () => void; // return numbers map to keyboard keys -> react modern solutions??
  // downloadSave: () => void; // redundant, use getcurrentsave
  // lcdFade: () => void; // put in screen
  autoLoadCheats: () => boolean;
  createSaveState: (slot: number) => boolean;
  deleteFile: (path: string) => void;
  deleteSaveState: (slot: number) => void;
  disableKeyboardInput: () => void;
  enableKeyboardInput: () => void;
  filePaths: () => filePaths;
  fsSync: () => void;
  getCurrentCheatsFile: () => Uint8Array;
  getCurrentCheatsFileName: () => string | undefined;
  getCurrentGameName: () => string | undefined;
  getCurrentSave: () => Uint8Array | null;
  getCurrentSaveName: () => string | undefined;
  getVolume: () => number;
  listAllFiles: () => FileNode;
  listRoms: () => string[];
  listSaveStates: () => string[];
  loadSaveState: (slot: number) => boolean;
  parseCheatsString: (cheatsStr: string) => ParsedCheats[];
  parsedCheatsToFile: (cheatsList: ParsedCheats[]) => File | null;
  pause: () => void;
  quickReload: () => void;
  quitGame: () => void;
  quitMgba: () => void;
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

  // NOTE: only libretro format supported at this time
  const parseCheatsString = (cheatsStr: string) => {
    const lines = cheatsStr.split('\n');
    const ignoreLines = ['cheats = ', ''];

    if (!lines?.[0]?.match('^cheats = [0-9]+$')) return [];

    const assembledCheats: {
      [cheatNumber: string]: {
        [cheatType: string]: string | boolean;
      };
    } = {};
    const propertyMap: { [key: string]: keyof ParsedCheats } = {
      desc: 'desc',
      code: 'code',
      enable: 'enable'
    };

    for (const cheatLine of lines) {
      if (ignoreLines.includes(cheatLine)) continue;

      const match = cheatLine.match(
        /^cheat([0-9]+)_([a-zA-Z]+)\s*=\s*"?([a-zA-Z0-9\s+:_]+)"?$/
      );

      if (match) {
        const [, cheatNumber, cheatType, value] = match;
        const propertyName = propertyMap[cheatType];
        assembledCheats[cheatNumber] = assembledCheats[cheatNumber] || {
          desc: '',
          code: '',
          enable: false
        };
        if (propertyName)
          assembledCheats[cheatNumber][propertyName] =
            propertyName === propertyMap.enable
              ? value.toLowerCase() === 'true'
              : value;
      }
    }

    return Object.values(assembledCheats) as ParsedCheats[];
  };

  const parsedCheatsToFile = (cheatsList: ParsedCheats[]) => {
    const libretroCheats = cheatsList.map((cheat, idx) => {
      return `cheat${idx}_desc = "${cheat.desc}"\ncheat${idx}_enable = ${cheat.enable}\ncheat${idx}_code = "${cheat.code}"\n`;
    });
    const header = `cheats = ${libretroCheats?.length}\n\n`;
    const cheatsFileName = filepathToFileName(mGBA.gameName, '.cheats');

    if (libretroCheats?.length && cheatsFileName) {
      const libretroCheatsFile = header + libretroCheats.join('\n');
      const blob = new Blob([libretroCheatsFile], { type: 'text/plain' });

      return new File([blob], cheatsFileName);
    }

    return null;
  };

  return {
    autoLoadCheats: mGBA.autoLoadCheats,
    createSaveState: mGBA.saveState,
    loadSaveState: mGBA.loadState,
    listSaveStates: () => mGBA.FS.readdir(paths.saveStatePath),
    listRoms: () => mGBA.FS.readdir(paths.gamePath),
    setVolume: mGBA.setVolume,
    getVolume: mGBA.getVolume,
    enableKeyboardInput: () => mGBA.toggleInput(true),
    disableKeyboardInput: () => mGBA.toggleInput(false),
    simulateKeyDown: mGBA.buttonPress,
    simulateKeyUp: mGBA.buttonUnpress,
    setFastForward: mGBA.setMainLoopTiming,
    run: (romPath) => {
      setIsRunning(true);
      return mGBA.loadGame(romPath);
    },
    getCurrentGameName: () => filepathToFileName(mGBA.gameName),
    getCurrentSave: () => (mGBA.saveName ? mGBA.getSave() : null),
    getCurrentSaveName: () => filepathToFileName(mGBA.saveName),
    uploadCheats: mGBA.uploadCheats,
    uploadRom: mGBA.uploadRom,
    uploadSaveOrSaveState: mGBA.uploadSaveOrSaveState,
    deleteSaveState: (slot) => {
      const saveStateName = filepathToFileName(mGBA.saveName, '.ss' + slot);
      const saveStatePath = `${paths.saveStatePath}/${saveStateName}`;

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
      const cheatsPath = `${paths.cheatsPath}/${cheatsName}`;
      const exists = mGBA.FS.analyzePath(cheatsPath).exists;

      return exists ? mGBA.FS.readFile(cheatsPath) : new Uint8Array();
    },
    getCurrentCheatsFileName: () =>
      filepathToFileName(mGBA.gameName, '.cheats'),
    screenShot: mGBA.screenShot,
    remapKeyBinding: () => undefined,
    filePaths: mGBA.filePaths,
    fsSync: mGBA.FSSync,
    listAllFiles,
    parseCheatsString,
    parsedCheatsToFile
  };
};
