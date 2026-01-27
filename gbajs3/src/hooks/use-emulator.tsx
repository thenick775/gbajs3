import mGBA from '@thenick775/mgba-wasm';
import { useEffect, useState } from 'react';

import {
  mGBAEmulator,
  type GBAEmulator
} from '../emulator/mgba/mgba-emulator.tsx';

// tmp: some terrible work to try and load the sourcemap+data files
import wasmUrl from '@thenick775/mgba-wasm/dist/mgba.wasm?url';
import dataUrl from '@thenick775/mgba-wasm/dist/mgba.data?url';
import wasmMapUrl from '@thenick775/mgba-wasm/dist/mgba.wasm.map?url';

export const useEmulator = (canvas: HTMLCanvasElement | null) => {
  const [emulator, setEmulator] = useState<GBAEmulator | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (canvas) {
        const Module = await mGBA({
          canvas,
          locateFile: (path, prefix) => {
            if (path.endsWith('.wasm')) return wasmUrl;
            if (path.endsWith('.data')) return dataUrl;
            if (path.endsWith('.wasm.map')) return wasmMapUrl;
            return prefix + path;
          }
        });

        const mGBAVersion =
          Module.version.projectName + ' ' + Module.version.projectVersion;
        console.log(mGBAVersion);

        await Module.FSInit();

        const emulator = mGBAEmulator(Module);

        setEmulator(emulator);
      }
    };

    void initialize();
  }, [canvas]);

  return emulator;
};
