import { useEffect } from 'react';

import { emulatorAutoSaveUnloadLocalStorageKey } from '../../context/emulator/consts.ts';
import { useEmulatorContext, useRunningContext } from '../context.tsx';

export const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const useUnloadEmulator = () => {
  const { emulator } = useEmulatorContext();
  const { isRunning } = useRunningContext();

  useEffect(() => {
    const handlePageHide = () => {
      if (!isRunning) return;

      const result = emulator?.forceAutoSaveState();
      const autoSaveStateData = emulator?.getAutoSaveState();

      if (result && autoSaveStateData) {
        const base64data = uint8ArrayToBase64(autoSaveStateData.data);

        localStorage.setItem(
          emulatorAutoSaveUnloadLocalStorageKey,
          JSON.stringify({
            filename: autoSaveStateData.autoSaveStateName,
            data: base64data,
            timestamp: new Date().toISOString(),
            event: 'pagehide'
          })
        );
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [emulator, isRunning]);
};
