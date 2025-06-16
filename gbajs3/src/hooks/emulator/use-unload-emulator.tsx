import { useEffect } from 'react';

import { useEmulatorContext, useRunningContext } from '../context.tsx';

// TODO: remove when no longer needed
const appendLog = (message: string) => {
  const timestamp = new Date().toISOString();
  const prev = localStorage.getItem('pageCloseLogs') || '';
  const newLog = `[${timestamp}] ${message}\n`;
  localStorage.setItem('pageCloseLogs', prev + newLog);
};

export const useUnloadEmulator = () => {
  const { emulator } = useEmulatorContext();
  const { isRunning } = useRunningContext();

  useEffect(() => {
    const handlePageHide = () => {
      try {
        appendLog('pagehide: attempting auto-save');
        const result = emulator?.forceAutoSaveState();
        appendLog(`forceAutoSaveState result: ${result}`);

        const autosaveMount = emulator?.FS.lookupPath('/autosave', {}).node
          .mount;
        autosaveMount?.type.syncfs(
          autosaveMount,
          () => false,
          (err) => {
            if (err) {
              appendLog(`syncfs error: ${err}`);
            } else {
              appendLog(`syncfs success for /autosave`);
            }
          }
        );
      } catch (err) {
        appendLog(
          `pagehide error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [emulator, isRunning]);
};
