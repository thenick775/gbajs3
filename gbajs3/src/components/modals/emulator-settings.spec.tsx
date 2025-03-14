import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmulatorSettingsModal } from './emulator-settings.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import { emulatorSettingsLocalStorageKey } from '../../context/emulator/consts.ts';
import * as contextHooks from '../../hooks/context.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import type { coreSettings } from '@thenick775/mgba-wasm';

describe('<EmulatorSettingsModal />', () => {
  it('renders modal with form fields', () => {
    renderWithContext(<EmulatorSettingsModal />);

    expect(screen.getByLabelText('Emulator Settings Form')).toBeInTheDocument();
    expect(screen.getByText('Core:')).toBeInTheDocument();
    expect(screen.getByLabelText('Frame Skip')).toBeInTheDocument();
  });

  it('updates frame skip value', async () => {
    renderWithContext(<EmulatorSettingsModal />);

    const frameSkipInput = screen.getByLabelText('Frame Skip');

    await userEvent.clear(frameSkipInput);
    await userEvent.type(frameSkipInput, '5');

    expect(frameSkipInput).toHaveValue(5);
  });

  it('toggles checkboxes', async () => {
    renderWithContext(<EmulatorSettingsModal />);

    const checkbox = screen.getByLabelText('Mute on rewind');
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it('submits the form and saves default values', async () => {
    const setCoreSettingsSpy: (coreSettings: coreSettings) => void = vi.fn();

    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        setCoreSettings: setCoreSettingsSpy
      } as GBAEmulator
    }));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(setItemSpy).toHaveBeenCalledWith(
      'emulatorSettings',
      '{"frameSkip":0,"rewindBufferCapacity":600,"rewindBufferInterval":1,"allowOpposingDirections":true,"muteOnFastForward":true,"muteOnRewind":true,"saveFileSystemOnInGameSave":true,"saveFileSystemOnCreateUpdateDelete":true,"fileSystemNotificationsEnabled":true}'
    );

    expect(setCoreSettingsSpy).toHaveBeenCalledOnce();
    expect(setCoreSettingsSpy).toHaveBeenCalledWith({
      allowOpposingDirections: true,
      frameSkip: 0,
      rewindBufferCapacity: 600,
      rewindBufferInterval: 1
    });
  });

  it('submits the form and saves edited values', async () => {
    const setCoreSettingsSpy: (coreSettings: coreSettings) => void = vi.fn();

    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        setCoreSettings: setCoreSettingsSpy,
        getCurrentSaveName: () => 'current_save.sav'
      } as GBAEmulator
    }));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithContext(<EmulatorSettingsModal />);

    const frameSkipInput = screen.getByLabelText('Frame Skip');
    const rewindCapacityInput = screen.getByLabelText('Rewind Capacity');
    const rewindIntervalInput = screen.getByLabelText('Rewind Interval');
    const saveFileNameInput = screen.getByLabelText('Save File Name');

    const allowOpposingDirectionsCheckbox = screen.getByLabelText(
      'Allow opposing directions'
    );
    const fileSystemNotificationsCheckbox = screen.getByLabelText(
      'File system notifications'
    );
    const muteOnRewindCheckbox = screen.getByLabelText('Mute on rewind');
    const muteOnFastForwardCheckbox = screen.getByLabelText(
      'Mute on fast forward'
    );
    const saveFileSystemOnFSOperationCheckbox = screen.getByLabelText(
      'Save file system on create / update / delete'
    );
    const saveOnInGameSaveCheckbox = screen.getByLabelText(
      'Save file system on in-game save'
    );

    await userEvent.type(frameSkipInput, '25');

    await userEvent.clear(rewindCapacityInput);
    await userEvent.type(rewindCapacityInput, '1000');

    await userEvent.clear(rewindIntervalInput);
    await userEvent.type(rewindIntervalInput, '10');

    await userEvent.clear(saveFileNameInput);
    await userEvent.type(saveFileNameInput, 'custom_save_override.sav');

    await userEvent.click(allowOpposingDirectionsCheckbox);
    await userEvent.click(fileSystemNotificationsCheckbox);
    await userEvent.click(muteOnRewindCheckbox);
    await userEvent.click(muteOnFastForwardCheckbox);
    await userEvent.click(saveFileSystemOnFSOperationCheckbox);
    await userEvent.click(saveOnInGameSaveCheckbox);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(setItemSpy).toHaveBeenCalledWith(
      'emulatorSettings',
      '{"frameSkip":25,"rewindBufferCapacity":1000,"rewindBufferInterval":10,"allowOpposingDirections":false,"muteOnFastForward":false,"muteOnRewind":false,"saveFileSystemOnInGameSave":false,"saveFileSystemOnCreateUpdateDelete":false,"fileSystemNotificationsEnabled":false,"saveFileName":"custom_save_override.sav"}'
    );

    expect(setCoreSettingsSpy).toHaveBeenCalledOnce();
    expect(setCoreSettingsSpy).toHaveBeenCalledWith({
      frameSkip: 25,
      rewindBufferCapacity: 1000,
      rewindBufferInterval: 10,
      allowOpposingDirections: false
    });
  });

  it('removes settings when reset button is clicked', async () => {
    const setCoreSettingsSpy: (coreSettings: coreSettings) => void = vi.fn();

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    const {
      useEmulatorContext: originalEmulator,
      useRunningContext: originalRunning
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        setCoreSettings: setCoreSettingsSpy,
        getCurrentSaveName: () => 'current_save.sav'
      } as GBAEmulator
    }));

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      ...originalRunning(),
      isRunning: true
    }));

    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(setCoreSettingsSpy).toHaveBeenCalledWith({
      allowOpposingDirections: true,
      frameSkip: 0,
      rewindBufferCapacity: 600,
      rewindBufferInterval: 1
    });

    expect(removeItemSpy).toHaveBeenCalledWith(emulatorSettingsLocalStorageKey);
  });

  it('displays current save name from emulator when running if no override is present', async () => {
    const {
      useEmulatorContext: originalEmulator,
      useRunningContext: originalRunning
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        getCurrentSaveName: () => 'current_save.sav'
      } as GBAEmulator
    }));

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      ...originalRunning(),
      isRunning: true
    }));

    renderWithContext(<EmulatorSettingsModal />);

    expect(screen.getByDisplayValue('current_save.sav')).toBeVisible();
  });

  it('closes modal using the close button', async () => {
    const setIsModalOpenSpy = vi.fn();
    const { useModalContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      setIsModalOpen: setIsModalOpenSpy
    }));

    renderWithContext(<EmulatorSettingsModal />);

    await userEvent.click(screen.getByText('Close', { selector: 'button' }));

    expect(setIsModalOpenSpy).toHaveBeenCalledWith(false);
  });
});
