import { useCallback, useEffect } from 'react';

import { useEmulatorContext, useRunningContext } from '../context.tsx';
import { useFadeCanvas } from '../use-fade-canvas.tsx';
import { generateScreenshot } from './screenshot/generate-screenshot.ts';

export const useQuitGame = () => {
  const { canvas, emulator } = useEmulatorContext();
  const { isRunning, setIsRunning } = useRunningContext();
  const { startFade, cancelFade } = useFadeCanvas();

  useEffect(() => {
    if (isRunning) cancelFade();
  }, [isRunning, cancelFade]);

  const quitGame = useCallback(() => {
    if (isRunning) {
      startFade(canvas, generateScreenshot(emulator));
      emulator?.quitGame();
    }
    setIsRunning(false);
  }, [canvas, emulator, isRunning, setIsRunning, startFade]);

  return quitGame;
};
