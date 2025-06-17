import mGBA from '@thenick775/mgba-wasm';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useEffect, useState } from 'react';

import {
  mGBAEmulator,
  type GBAEmulator
} from '../emulator/mgba/mgba-emulator.tsx';

const emulatorAutoSaveUnloadLocalStorageKey = 'unloadedAutoSaveState';

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

type derp = {
  filename: string;
  data: string;
  timestamp: string;
};

export const useEmulator = (canvas: HTMLCanvasElement | null) => {
  const [emulator, setEmulator] = useState<GBAEmulator | null>(null);
  const [storedAutoSaveData] = useLocalStorage<derp | undefined>(
    emulatorAutoSaveUnloadLocalStorageKey
  );

  useEffect(() => {
    const initialize = async () => {
      if (canvas) {
        const Module = await mGBA({ canvas });

        const mGBAVersion =
          Module.version.projectName + ' ' + Module.version.projectVersion;
        console.log(mGBAVersion);

        await Module.FSInit();

        const emulator = mGBAEmulator(Module);

        if (storedAutoSaveData?.data && storedAutoSaveData?.filename) {
          const dataUint8 = base64ToUint8Array(storedAutoSaveData.data);

          await emulator?.uploadAutoSaveState(
            storedAutoSaveData.filename,
            dataUint8
          );
        }

        setEmulator(emulator);
      }
    };

    initialize();
  }, [canvas, storedAutoSaveData?.filename, storedAutoSaveData?.data]);

  return emulator;
};
