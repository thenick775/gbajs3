import { useEffect } from 'react';

import { useEmulatorContext, useRunningContext } from '../context.tsx';

// TODO: remove when no longer needed
const appendLog = (message: string) => {
  const timestamp = new Date().toISOString();
  const prev = localStorage.getItem('pageCloseLogs') || '';
  const newLog = `[${timestamp}] ${message}\n`;
  localStorage.setItem('pageCloseLogs', prev + newLog);
};

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const emulatorAutoSaveUnloadLocalStorageKey = 'unloadedAutoSaveState';

export const useUnloadEmulator = () => {
  const { emulator } = useEmulatorContext();
  const { isRunning } = useRunningContext();

  useEffect(() => {
    const handlePageHide = () => {
      if (!isRunning) return;

      console.log('in handlePageHide');

      const result = emulator?.forceAutoSaveState();
      appendLog(`forceAutoSaveState result: ${result}`);

      console.log('before autosavestatedata');
      const autoSaveStateData = emulator?.getAutoSaveState();
      console.log('after autosavestatedata', autoSaveStateData);

      if (autoSaveStateData) {
        const base64data = uint8ArrayToBase64(autoSaveStateData.data);

        localStorage.setItem(
          emulatorAutoSaveUnloadLocalStorageKey,
          JSON.stringify({
            filename: autoSaveStateData.autoSaveStateName,
            data: base64data,
            timestamp: new Date().toISOString()
          })
        );
      }
    };

    // window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', handlePageHide);
    return () => {
      // window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('visibilitychange', handlePageHide);
    };
  }, [emulator, isRunning]);
};
