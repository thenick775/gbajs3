import { useLocalStorage } from '@uidotdev/usehooks';
import { useCallback } from 'react';

import { useAddCallbacks } from './use-add-callbacks.tsx';
import {
  emulatorFFMultiplierLocalStorageKey,
  emulatorKeyBindingsLocalStorageKey,
  emulatorSettingsLocalStorageKey,
  emulatorVolumeLocalStorageKey
} from '../../context/emulator/consts.ts';
import { useEmulatorContext, useRunningContext } from '../context.tsx';

import type { EmulatorSettings } from '../../components/modals/emulator-settings.tsx';
import type { KeyBinding } from '../../emulator/mgba/mgba-emulator.tsx';

type LinkPlayerInput = {
  rom?: string;
  save?: string;
};

export type LocalLinkSessionOptions = {
  player1: LinkPlayerInput;
  player2: LinkPlayerInput;
};

export const useStartLocalLinkSession = () => {
  const { emulator } = useEmulatorContext();
  const { setIsRunning } = useRunningContext();
  const [currentEmulatorVolume] = useLocalStorage(
    emulatorVolumeLocalStorageKey,
    1
  );
  const [fastForwardMultiplier] = useLocalStorage(
    emulatorFFMultiplierLocalStorageKey,
    1
  );
  const [currentKeyBindings] = useLocalStorage<KeyBinding[] | undefined>(
    emulatorKeyBindingsLocalStorageKey
  );
  const [emulatorSettings] = useLocalStorage<EmulatorSettings>(
    emulatorSettingsLocalStorageKey,
    {
      saveFileSystemOnInGameSave: true,
      saveFileSystemOnCreateUpdateDelete: true,
      fileSystemNotificationsEnabled: true,
      allowOpposingDirections: true,
      muteOnFastForward: true,
      muteOnSlowdown: true,
      muteOnRewind: true,
      audioSampleRate: 48000,
      audioBufferSize: 1024,
      timestepSync: true,
      videoSync: false,
      audioSync: false,
      threadedVideo: false,
      rewindEnable: true,
      showFpsCounter: false,
      autoSaveStateLoadNotificationEnabled: true,
      autoSaveStateCaptureNotificationEnabled: true,
      slowdownEnabled: true
    }
  );
  const { addCallbacks } = useAddCallbacks();

  const startLocalLinkSession = useCallback(
    (formData: LocalLinkSessionOptions) => {
      const player1RomPath = `${emulator?.filePaths().gamePath}/${formData.player1.rom}`;
      const player2RomPath = `${emulator?.filePaths().gamePath}/${formData.player2.rom}`;
      const player1SavePath = formData.player1.save
        ? `${emulator?.filePaths().savePath}/${formData.player1.save}`
        : undefined;
      const player2SavePath = formData.player2.save
        ? `${emulator?.filePaths().savePath}/${formData.player2.save}`
        : undefined;

      emulator?.setVolume(currentEmulatorVolume);
      emulator?.setFastForwardMultiplier(fastForwardMultiplier);
      emulator?.setCoreSettings({
        audioSampleRate: emulatorSettings.audioSampleRate,
        audioBufferSize: emulatorSettings.audioBufferSize,
        baseFpsTarget: emulatorSettings.baseFpsTarget,
        rewindBufferCapacity: emulatorSettings.rewindBufferCapacity,
        rewindBufferInterval: emulatorSettings.rewindBufferInterval,
        showFpsCounter: emulatorSettings.showFpsCounter
      });

      const isSuccessfulRun = emulator?.startLocalLinkSession({
        player1: {
          romPath: player1RomPath,
          savePath: player1SavePath
        },
        player2: {
          romPath: player2RomPath,
          savePath: player2SavePath
        }
      });

      setIsRunning(!!isSuccessfulRun);

      if (isSuccessfulRun) {
        if (currentKeyBindings) emulator?.remapKeyBindings(currentKeyBindings);

        addCallbacks({
          saveFileSystemOnInGameSave:
            emulatorSettings.saveFileSystemOnInGameSave,
          fileSystemNotificationsEnabled:
            emulatorSettings.fileSystemNotificationsEnabled,
          autoSaveStateLoadNotificationEnabled:
            emulatorSettings.autoSaveStateLoadNotificationEnabled,
          autoSaveStateCaptureNotificationEnabled:
            emulatorSettings.autoSaveStateCaptureNotificationEnabled
        });

        emulator?.setCoreSettings({
          allowOpposingDirections: emulatorSettings.allowOpposingDirections,
          frameSkip: emulatorSettings.frameSkip
        });
      }

      return !!isSuccessfulRun;
    },
    [
      addCallbacks,
      currentEmulatorVolume,
      currentKeyBindings,
      emulator,
      emulatorSettings,
      fastForwardMultiplier,
      setIsRunning
    ]
  );

  return startLocalLinkSession;
};
