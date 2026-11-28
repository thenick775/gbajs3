import { useEffect, useState } from 'react';

import {
  mGBAEmulator,
  type GBAEmulator
} from '../emulator/mgba/mgba-emulator.tsx';

const initializeEmulator = async (canvas: HTMLCanvasElement) => {
  const { default: mGBA } = await import('@thenick775/mgba-wasm');
  const Module = await mGBA({ canvas });

  const mGBAVersion =
    Module.version.projectName + ' ' + Module.version.projectVersion;
  console.log(mGBAVersion);

  await Module.FSInit();

  return mGBAEmulator(Module);
};

export const useEmulator = (canvas: HTMLCanvasElement | null) => {
  const [emulator, setEmulator] = useState<GBAEmulator | null>(null);

  useEffect(() => {
    if (canvas) void initializeEmulator(canvas).then(setEmulator);
  }, [canvas]);

  return emulator;
};
