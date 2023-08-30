//declare module 'mGBA' {
declare namespace mGBA {
  export interface filePaths {
    root: string;
    cheatsPath: string;
    gamePath: string;
    savePath: string;
    saveStatePath: string;
  }

  export interface mGBAEmulator extends EmscriptenModule {
    // custom methods from preamble
    autoLoadCheats(): boolean;
    bindKey(bindingName: string, inputName: string): void;
    buttonPress(name: string): void;
    buttonUnpress(name: string): void;
    FSInit(callback?: () => void): void;
    FSSync(): void;
    getMainLoopTiming(): number;
    getSave(): Uint8Array;
    getVolume(): number;
    listRoms(): void;
    listSaves(): void;
    loadGame(romPath: string): boolean;
    loadState(slot: number): boolean;
    pauseGame(): void;
    quickReload(): void;
    quitGame(): void;
    quitMgba(): void;
    resumeGame(): void;
    saveState(slot: number): boolean;
    screenShot(callback: () => void): void;
    setMainLoopTiming(mode: number, value: number): void;
    setVolume(percent: number): void;
    toggleInput(enabled: boolean): void;
    uploadCheats(file: File, callback?: () => void): void;
    uploadRom(file: File, callback?: () => void): void;
    uploadSaveOrSaveState(file: File, callback?: () => void): void;
    // custom variables
    version: {
      projectName: string;
      projectVersion: string;
    };
    filePaths(): filePaths;
    gameName?: string;
    saveName?: string;
    // extra exported runtime methods
    FS: typeof FS;
    // NOTE: This version of emscripten (from 2019) does not use a valid thenable/promise,
    //       planning to update the mgba-wasm dockerfile in the near future on my fork.
    //       For now, updating type defs to get around the problem manually.
    //       See: https://github.com/emscripten-core/emscripten/issues/5820
    then: (callback: (Module: mGBAEmulator) => void) => mGBAEmulator;
  }

  // Note: see above note on then method, this function does NOT return a promise,
  //       async/await will fall into an infinite loop
  // eslint-disable-next-line import/no-default-export
  export default function mGBA(options: {
    canvas: HTMLCanvasElement;
  }): mGBAEmulator;
}

export = mGBA;
