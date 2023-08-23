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
    if (canvas) {
      // Note: this is NOT a promise, see type def for more info
      mGBA({ canvas }).then((Module) => {
        const mGBAVersion =
          Module.version.projectName + ' ' + Module.version.projectVersion;
        console.log(mGBAVersion);

        Module.FSInit();

        const wrappedEmulator = mGBAEmulator(Module, setIsPaused, setIsRunning);
        setEmulator(wrappedEmulator);
      });
    }
  }, [canvas, setIsPaused, setIsRunning]);

  return emulator;
};
