import { useCallback, useEffect } from 'react';

import { useEmulatorContext, useRunningContext } from '../context.tsx';
import { useFadeCanvas } from '../use-fade-canvas.tsx';
import { generateScreenshot } from './screenshot/generate-screenshot.ts';

export const useStopLocalLinkSession = () => {
  const { canvas, emulator } = useEmulatorContext();
  const { isRunning, setIsRunning } = useRunningContext();
  const { startFade, cancelFade } = useFadeCanvas();

  useEffect(() => {
    if (isRunning) cancelFade();
  }, [isRunning, cancelFade]);

  const stopLocalLinkSession = useCallback(() => {
    if (emulator?.getLocalLinkStatus().running) {
      startFade(canvas, generateScreenshot(emulator));
      emulator.stopLocalLinkSession();
    }
    setIsRunning(false);
  }, [canvas, emulator, setIsRunning, startFade]);

  return stopLocalLinkSession;
};
