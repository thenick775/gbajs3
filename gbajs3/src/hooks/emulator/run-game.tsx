import { useLocalStorage } from '@uidotdev/usehooks';
import { useCallback } from 'react';

import {
  emTimingSetTimeout,
  emulatorGameNameLocalStorageKey,
  emulatorIsFastForwardOnStorageKey,
  emulatorKeyBindingsLocalStorageKey,
  emulatorVolumeLocalStorageKey
} from '../../context/emulator/consts.ts';
import { useEmulatorContext, useRunningContext } from '../context.tsx';

import type { KeyBinding } from '../../emulator/mgba/mgba-emulator.tsx';

export const useRunGame = () => {
  const { emulator } = useEmulatorContext();
  const { setIsRunning } = useRunningContext();
  const [, setStoredGameName] = useLocalStorage<string | undefined>(
    emulatorGameNameLocalStorageKey
  );
  const [currentKeyBindings] = useLocalStorage<KeyBinding[] | undefined>(
    emulatorKeyBindingsLocalStorageKey
  );
  const [currentEmulatorVolume] = useLocalStorage(
    emulatorVolumeLocalStorageKey,
    1
  );
  const [isFastForwardOn] = useLocalStorage(
    emulatorIsFastForwardOnStorageKey,
    false
  );

  const run = useCallback(
    (romPath: string) => {
      const isSuccessfulRun = emulator?.run(romPath);
      setIsRunning(!!isSuccessfulRun);
      setStoredGameName(romPath);
      emulator?.setVolume(currentEmulatorVolume);

      if (isSuccessfulRun) {
        if (currentKeyBindings) emulator?.remapKeyBindings(currentKeyBindings);

        if (isFastForwardOn && !emulator?.isFastForwardEnabled())
          emulator?.setFastForward(emTimingSetTimeout, 0);
      }

      return !!isSuccessfulRun;
    },
    [
      currentEmulatorVolume,
      currentKeyBindings,
      emulator,
      isFastForwardOn,
      setIsRunning,
      setStoredGameName
    ]
  );

  return run;
};
