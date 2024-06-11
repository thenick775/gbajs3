import { useCallback } from 'react';

import { fadeCanvas } from '../../components/screen/fade.ts';
import { useEmulatorContext, useRunningContext } from '../context.tsx';

export const useQuitGame = () => {
  const { canvas, emulator } = useEmulatorContext();
  const { isRunning, setIsRunning } = useRunningContext();

  const quitGame = useCallback(() => {
    if (isRunning) {
      fadeCanvas(canvas, emulator);
      emulator?.quitGame();
    }
    setIsRunning(false);
  }, [canvas, emulator, isRunning, setIsRunning]);

  return quitGame;
};
