import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { GBAEmulator, mGBAEmulator } from '../emulator/mgba/mgba-emulator.tsx';
import mGBA from '../emulator/mgba/wasm/mgba.js';

type useEmulatorProps = {
  canvas: HTMLCanvasElement | null;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  setIsRunning: Dispatch<SetStateAction<boolean>>;
};

export const useEmulator = ({
  canvas = null,
  setIsPaused,
  setIsRunning
}: useEmulatorProps) => {
  const [emulator, setEmulator] = useState<GBAEmulator | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (canvas) {
        const Module = await mGBA({ canvas });

        const mGBAVersion =
          Module.version.projectName + ' ' + Module.version.projectVersion;
        console.log(mGBAVersion);

        await Module.FSInit();

        const emulator = mGBAEmulator(Module, setIsPaused, setIsRunning);

        setEmulator(emulator);
      }
    };

    initialize();
  }, [canvas, setIsPaused, setIsRunning]);

  return emulator;
};
