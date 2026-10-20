import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmulatorSettingsModal } from './emulator-settings.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import { emulatorSettingsLocalStorageKey } from '../../context/emulator/consts.ts';
import * as contextHooks from '../../hooks/context.tsx';
import * as addCallbackHooks from '../../hooks/emulator/use-add-callbacks.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import type { CoreCallbackOptions } from '../../hooks/emulator/use-add-callbacks.tsx';
import type { coreSettings } from '@thenick775/mgba-wasm';

describe('<EmulatorSettingsModal />', () => {
  const defaultSampleRates = [22050, 32000, 44100, 48000];
  const defaultAudioBufferSizes = [256, 512, 768, 1024, 1536, 2048, 3072, 4096];

  beforeEach(async () => {
    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        defaultAudioSampleRates: () => defaultSampleRates,
        defaultAudioBufferSizes: () => defaultAudioBufferSizes,
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));
  });

  it('renders modal with form fields', () => {
    renderWithContext(<EmulatorSettingsModal />);

    expect(screen.getByLabelText('Emulator Settings Form')).toBeInTheDocument();
    expect(screen.getByLabelText('Frame Skip')).toBeInTheDocument();
  });

  it('updates frame only value', async () => {
    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByRole('tab', { name: 'Video' }));
    const frameSkipInput = screen.getByLabelText('Frame Skip');

    await userEvent.clear(frameSkipInput);
    await userEvent.type(frameSkipInput, '5');

    expect(frameSkipInput).toHaveValue(5);
  });

  it('toggles checkboxes', async () => {
    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByRole('tab', { name: 'Audio' }));
    const checkbox = screen.getByLabelText('Mute on rewind');
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it('submits the form and saves default values', async () => {
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const setCoreSettingsSpy: (coreSettings: coreSettings) => void = vi.fn();

    const { useAddCallbacks: originalCallbacks } = await vi.importActual<
      typeof addCallbackHooks
    >('../../hooks/emulator/use-add-callbacks.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(
      () =>
        ({
          emulator: {
            setCoreSettings: setCoreSettingsSpy,
            defaultAudioSampleRates: () => defaultSampleRates,
            defaultAudioBufferSizes: () => defaultAudioBufferSizes,
            getCurrentAutoSaveStatePath: () => null
          }
        }) as ReturnType<typeof contextHooks.useEmulatorContext>
    );

    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockImplementation(() => ({
      ...originalCallbacks(),
      addCallbacks: addCallbacksSpy
    }));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(setItemSpy).toHaveBeenCalledWith(
      'emulatorSettings',
      '{"frameSkip":0,"baseFpsTarget":60,"rewindBufferCapacity":600,"rewindBufferInterval":1,"allowOpposingDirections":true,"muteOnFastForward":true,"muteOnSlowdown":true,"muteOnRewind":true,"saveFileSystemOnInGameSave":true,"saveFileSystemOnCreateUpdateDelete":true,"fileSystemNotificationsEnabled":true,"audioSampleRate":48000,"audioBufferSize":1024,"timestepSync":true,"videoSync":false,"audioSync":false,"threadedVideo":false,"rewindEnable":true,"showFpsCounter":false,"autoSaveStateTimerIntervalSeconds":30,"autoSaveStateEnable":true,"restoreAutoSaveStateOnLoad":true,"autoSaveStateLoadNotificationEnabled":true,"autoSaveStateCaptureNotificationEnabled":true,"slowdownEnabled":true}'
    );

    expect(addCallbacksSpy).toHaveBeenCalledOnce();
    expect(addCallbacksSpy).toHaveBeenCalledWith({
      autoSaveStateCaptureNotificationEnabled: true,
      autoSaveStateLoadNotificationEnabled: true,
      fileSystemNotificationsEnabled: true,
      saveFileSystemOnInGameSave: true
    });

    expect(setCoreSettingsSpy).toHaveBeenCalledOnce();
    expect(setCoreSettingsSpy).toHaveBeenCalledWith({
      allowOpposingDirections: true,
      audioBufferSize: 1024,
      audioSampleRate: 48000,
      audioSync: false,
      frameSkip: 0,
      baseFpsTarget: 60,
      rewindBufferCapacity: 600,
      rewindBufferInterval: 1,
      rewindEnable: true,
      showFpsCounter: false,
      threadedVideo: false,
      timestepSync: true,
      videoSync: false,
      autoSaveStateTimerIntervalSeconds: 30,
      autoSaveStateEnable: true,
      restoreAutoSaveStateOnLoad: true
    });
  });

  // TODO: refactor this test or add a new one surrounding the emulator settings tabs - should probably be broken down by tab
  it('submits the form and saves edited values', async () => {
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const setCoreSettingsSpy: (coreSettings: coreSettings) => void = vi.fn();

    const { useAddCallbacks: originalCallbacks } = await vi.importActual<
      typeof addCallbackHooks
    >('../../hooks/emulator/use-add-callbacks.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(
      () =>
        ({
          emulator: {
            setCoreSettings: setCoreSettingsSpy,
            getCurrentSaveName: () => 'current_save.sav',
            defaultAudioSampleRates: () => defaultSampleRates,
            defaultAudioBufferSizes: () => defaultAudioBufferSizes,
            getCurrentAutoSaveStatePath: () => null
          }
        }) as ReturnType<typeof contextHooks.useEmulatorContext>
    );

    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockImplementation(() => ({
      ...originalCallbacks(),
      addCallbacks: addCallbacksSpy
    }));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithContext(<EmulatorSettingsModal />);

    // TODO: test select inputs

    await userEvent.clear(screen.getByLabelText('Rewind Capacity'));
    await userEvent.type(screen.getByLabelText('Rewind Capacity'), '1000');
    await userEvent.clear(screen.getByLabelText('Rewind Interval'));
    await userEvent.type(screen.getByLabelText('Rewind Interval'), '10');
    await userEvent.clear(screen.getByLabelText('Save File Name'));
    await userEvent.type(
      screen.getByLabelText('Save File Name'),
      'custom_save_override.sav'
    );
    await userEvent.clear(screen.getByLabelText('Auto Save State Interval'));
    await userEvent.type(screen.getByLabelText('Auto Save State Interval'), '10');
    await userEvent.click(screen.getByLabelText('Allow opposing directions'));
    await userEvent.click(screen.getByLabelText('Rewind enabled'));
    await userEvent.click(screen.getByLabelText('Auto save state enabled'));
    await userEvent.click(screen.getByLabelText('Restore auto save state'));
    await userEvent.click(screen.getByLabelText('Slowdown enabled'));

    await userEvent.click(screen.getByRole('tab', { name: 'Audio' }));
    await userEvent.click(screen.getByLabelText('Mute on rewind'));
    await userEvent.click(screen.getByLabelText('Mute on fast forward'));
    await userEvent.click(screen.getByLabelText('Mute on slowdown'));

    await userEvent.click(screen.getByRole('tab', { name: 'Video' }));
    await userEvent.type(screen.getByLabelText('Frame Skip'), '25');
    await userEvent.clear(screen.getByLabelText('Base FPS Target'));
    await userEvent.type(screen.getByLabelText('Base FPS Target'), '30');
    await userEvent.click(screen.getByLabelText('Timestep Sync'));
    await userEvent.click(screen.getByLabelText('Video Sync'));
    await userEvent.click(screen.getByLabelText('Audio Sync'));
    await userEvent.click(screen.getByLabelText('FPS Counter'));
    await userEvent.click(screen.getByLabelText('Threaded Video'));

    await userEvent.click(screen.getByRole('tab', { name: 'File' }));
    await userEvent.click(
      screen.getByLabelText('Save file system on create / update / delete')
    );
    await userEvent.click(screen.getByLabelText('Save file system on in-game save'));

    await userEvent.click(screen.getByRole('tab', { name: 'Alert' }));
    await userEvent.click(screen.getByLabelText('File system notifications'));
    await userEvent.click(
      screen.getByLabelText('Auto save state capture notification')
    );
    await userEvent.click(
      screen.getByLabelText('Auto save state load notification')
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(setItemSpy).toHaveBeenCalledWith(
      'emulatorSettings',
      '{"frameSkip":25,"baseFpsTarget":30,"rewindBufferCapacity":1000,"rewindBufferInterval":10,"allowOpposingDirections":false,"muteOnFastForward":false,"muteOnSlowdown":false,"muteOnRewind":false,"saveFileSystemOnInGameSave":false,"saveFileSystemOnCreateUpdateDelete":false,"fileSystemNotificationsEnabled":false,"audioSampleRate":48000,"audioBufferSize":1024,"timestepSync":false,"videoSync":true,"audioSync":true,"threadedVideo":true,"rewindEnable":false,"showFpsCounter":true,"autoSaveStateTimerIntervalSeconds":10,"autoSaveStateEnable":false,"restoreAutoSaveStateOnLoad":false,"autoSaveStateLoadNotificationEnabled":false,"autoSaveStateCaptureNotificationEnabled":false,"slowdownEnabled":false,"saveFileName":"custom_save_override.sav"}'
    );

    expect(addCallbacksSpy).toHaveBeenCalledOnce();
    expect(addCallbacksSpy).toHaveBeenCalledWith({
      autoSaveStateCaptureNotificationEnabled: false,
      autoSaveStateLoadNotificationEnabled: false,
      fileSystemNotificationsEnabled: false,
      saveFileSystemOnInGameSave: false
    });

    expect(setCoreSettingsSpy).toHaveBeenCalledOnce();
    expect(setCoreSettingsSpy).toHaveBeenCalledWith({
      allowOpposingDirections: false,
      audioBufferSize: 1024,
      audioSampleRate: 48000,
      audioSync: true,
      frameSkip: 25,
      baseFpsTarget: 30,
      rewindBufferCapacity: 1000,
      rewindBufferInterval: 10,
      rewindEnable: false,
      showFpsCounter: true,
      threadedVideo: true,
      timestepSync: false,
      videoSync: true,
      autoSaveStateTimerIntervalSeconds: 10,
      autoSaveStateEnable: false,
      restoreAutoSaveStateOnLoad: false
    });
  });

  it('removes settings when reset button is clicked', async () => {
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const setCoreSettingsSpy: (coreSettings: coreSettings) => void = vi.fn();

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    const { useRunningContext: originalRunning } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');
    const { useAddCallbacks: originalCallbacks } = await vi.importActual<
      typeof addCallbackHooks
    >('../../hooks/emulator/use-add-callbacks.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(
      () =>
        ({
          emulator: {
            setCoreSettings: setCoreSettingsSpy,
            getCurrentSaveName: () => 'current_save.sav',
            defaultAudioSampleRates: () => defaultSampleRates,
            defaultAudioBufferSizes: () => defaultAudioBufferSizes,
            getCurrentAutoSaveStatePath: () => null
          }
        }) as ReturnType<typeof contextHooks.useEmulatorContext>
    );

    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockImplementation(() => ({
      ...originalCallbacks(),
      addCallbacks: addCallbacksSpy
    }));

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      ...originalRunning(),
      isRunning: true
    }));

    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(removeItemSpy).toHaveBeenCalledWith(emulatorSettingsLocalStorageKey);

    expect(addCallbacksSpy).toHaveBeenCalledOnce();
    expect(addCallbacksSpy).toHaveBeenCalledWith({
      autoSaveStateCaptureNotificationEnabled: true,
      autoSaveStateLoadNotificationEnabled: true,
      fileSystemNotificationsEnabled: true,
      saveFileSystemOnInGameSave: true
    });

    expect(setCoreSettingsSpy).toHaveBeenCalledWith({
      allowOpposingDirections: true,
      audioBufferSize: 1024,
      audioSampleRate: 48000,
      baseFpsTarget: 60,
      audioSync: false,
      frameSkip: 0,
      rewindBufferCapacity: 600,
      rewindBufferInterval: 1,
      rewindEnable: true,
      showFpsCounter: false,
      threadedVideo: false,
      timestepSync: true,
      videoSync: false,
      autoSaveStateTimerIntervalSeconds: 30,
      autoSaveStateEnable: true,
      restoreAutoSaveStateOnLoad: true
    });
  });

  it('displays current save name from emulator when running if no override is present', async () => {
    const { useRunningContext: originalRunning } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(
      () =>
        ({
          emulator: {
            getCurrentSaveName: () => 'current_save.sav',
            defaultAudioSampleRates: () => defaultSampleRates,
            defaultAudioBufferSizes: () => defaultAudioBufferSizes,
            getCurrentAutoSaveStatePath: () => null
          }
        }) as ReturnType<typeof contextHooks.useEmulatorContext>
    );

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      ...originalRunning(),
      isRunning: true
    }));

    renderWithContext(<EmulatorSettingsModal />);

    expect(screen.getByDisplayValue('current_save.sav')).toBeVisible();
  });

  it('closes modal using the close button', async () => {
    const closeModalSpy = vi.fn();
    const { useModalContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      closeModal: closeModalSpy
    }));

    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByText('Close', { selector: 'button' }));

    expect(closeModalSpy).toHaveBeenCalledOnce();
  });
});
