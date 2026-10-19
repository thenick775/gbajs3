import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useStartLocalLinkSession } from './use-start-local-link-session.tsx';
import { renderHookWithContext } from '../../../test/render-hook-with-context.tsx';
import {
  emulatorFFMultiplierLocalStorageKey,
  emulatorKeyBindingsLocalStorageKey,
  emulatorSettingsLocalStorageKey,
  emulatorVolumeLocalStorageKey
} from '../../context/emulator/consts.ts';
import * as contextHooks from '../context.tsx';
import * as addCallbacksHooks from './use-add-callbacks.tsx';

import type { CoreCallbackOptions } from './use-add-callbacks.tsx';
import type {
  GBAEmulator,
  KeyBinding
} from '../../emulator/mgba/mgba-emulator.tsx';
import type {
  LinkLocalStartSessionConfig,
  coreSettings
} from '@thenick775/mgba-wasm';

describe('useStartLocalLinkSession hook', () => {
  it('starts a local-link session', () => {
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const remapKeyBindingsSpy: (keyBindings: KeyBinding[]) => void = vi.fn();
    const setCoreSettingsSpy: (settings: coreSettings) => void = vi.fn();
    const setFastForwardMultiplierSpy: (multiplier: number) => void = vi.fn();
    const setIsRunningSpy = vi.fn();
    const setVolumeSpy: (volume: number) => void = vi.fn();
    const startLocalLinkSessionSpy: (
      config: LinkLocalStartSessionConfig
    ) => boolean = vi.fn(() => true);

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      setCanvas: vi.fn(),
      canvas: null,
      emulator: {
        filePaths: () => ({ gamePath: '/games', savePath: '/saves' }),
        remapKeyBindings: remapKeyBindingsSpy,
        setCoreSettings: setCoreSettingsSpy,
        setFastForwardMultiplier: setFastForwardMultiplierSpy,
        setVolume: setVolumeSpy,
        startLocalLinkSession: startLocalLinkSessionSpy
      } as GBAEmulator
    }));
    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: false,
      setIsRunning: setIsRunningSpy
    }));
    vi.spyOn(addCallbacksHooks, 'useAddCallbacks').mockImplementation(() => ({
      addCallbacks: addCallbacksSpy,
      syncActionIfEnabled: vi.fn()
    }));

    const { result } = renderHookWithContext(() => useStartLocalLinkSession());

    act(() => {
      expect(
        result.current({
          player1: { rom: 'rom1.gba', save: 'file1.sav' },
          player2: { rom: 'rom2.gba', save: 'file2.sav' }
        })
      ).toBe(true);
    });

    expect(setVolumeSpy).toHaveBeenCalledWith(1);
    expect(setFastForwardMultiplierSpy).toHaveBeenCalledWith(1);
    expect(setCoreSettingsSpy).toHaveBeenNthCalledWith(1, {
      audioBufferSize: 1024,
      audioSampleRate: 48000,
      baseFpsTarget: undefined,
      rewindBufferCapacity: undefined,
      rewindBufferInterval: undefined,
      showFpsCounter: false
    });
    expect(startLocalLinkSessionSpy).toHaveBeenCalledWith({
      player1: { romPath: '/games/rom1.gba', savePath: '/saves/file1.sav' },
      player2: { romPath: '/games/rom2.gba', savePath: '/saves/file2.sav' }
    });
    expect(setIsRunningSpy).toHaveBeenCalledWith(true);
    expect(remapKeyBindingsSpy).not.toHaveBeenCalled();
    expect(addCallbacksSpy).toHaveBeenCalledWith({
      autoSaveStateCaptureNotificationEnabled: true,
      autoSaveStateLoadNotificationEnabled: true,
      fileSystemNotificationsEnabled: true,
      saveFileSystemOnInGameSave: true
    });
    expect(setCoreSettingsSpy).toHaveBeenNthCalledWith(2, {
      allowOpposingDirections: true,
      frameSkip: undefined
    });
  });

  it('starts a local-link session with stored settings', () => {
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const remapKeyBindingsSpy: (keyBindings: KeyBinding[]) => void = vi.fn();
    const setCoreSettingsSpy: (settings: coreSettings) => void = vi.fn();
    const setFastForwardMultiplierSpy: (multiplier: number) => void = vi.fn();
    const setIsRunningSpy = vi.fn();
    const setVolumeSpy: (volume: number) => void = vi.fn();
    const startLocalLinkSessionSpy: (
      config: LinkLocalStartSessionConfig
    ) => boolean = vi.fn(() => true);

    localStorage.setItem(emulatorVolumeLocalStorageKey, '0.75');
    localStorage.setItem(emulatorFFMultiplierLocalStorageKey, '3');
    localStorage.setItem(
      emulatorKeyBindingsLocalStorageKey,
      '[{"gbaInput":"A","key":"X","location":0}]'
    );
    localStorage.setItem(
      emulatorSettingsLocalStorageKey,
      '{"allowOpposingDirections":false,"fileSystemNotificationsEnabled":false,"frameSkip":2,"baseFpsTarget":45,"muteOnFastForward":true,"muteOnSlowdown":true,"muteOnRewind":true,"rewindBufferCapacity":1200,"rewindBufferInterval":5,"saveFileSystemOnCreateUpdateDelete":true,"saveFileSystemOnInGameSave":false,"audioSampleRate":44100,"audioBufferSize":2048,"timestepSync":false,"videoSync":true,"audioSync":true,"threadedVideo":true,"rewindEnable":false,"showFpsCounter":true,"autoSaveStateTimerIntervalSeconds":60,"autoSaveStateEnable":false,"restoreAutoSaveStateOnLoad":false,"autoSaveStateLoadNotificationEnabled":false,"autoSaveStateCaptureNotificationEnabled":false,"slowdownEnabled":true}'
    );

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      setCanvas: vi.fn(),
      canvas: null,
      emulator: {
        filePaths: () => ({ gamePath: '/games', savePath: '/saves' }),
        remapKeyBindings: remapKeyBindingsSpy,
        setCoreSettings: setCoreSettingsSpy,
        setFastForwardMultiplier: setFastForwardMultiplierSpy,
        setVolume: setVolumeSpy,
        startLocalLinkSession: startLocalLinkSessionSpy
      } as GBAEmulator
    }));
    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: false,
      setIsRunning: setIsRunningSpy
    }));
    vi.spyOn(addCallbacksHooks, 'useAddCallbacks').mockImplementation(() => ({
      addCallbacks: addCallbacksSpy,
      syncActionIfEnabled: vi.fn()
    }));

    const { result } = renderHookWithContext(() => useStartLocalLinkSession());

    act(() => {
      expect(
        result.current({
          player1: { rom: 'rom1.gba', save: 'file1.sav' },
          player2: { rom: 'rom2.gba', save: 'file2.sav' }
        })
      ).toBe(true);
    });

    expect(setVolumeSpy).toHaveBeenCalledWith(0.75);
    expect(setFastForwardMultiplierSpy).toHaveBeenCalledWith(3);
    expect(setCoreSettingsSpy).toHaveBeenNthCalledWith(1, {
      audioBufferSize: 2048,
      audioSampleRate: 44100,
      baseFpsTarget: 45,
      rewindBufferCapacity: 1200,
      rewindBufferInterval: 5,
      showFpsCounter: true
    });
    expect(startLocalLinkSessionSpy).toHaveBeenCalledWith({
      player1: { romPath: '/games/rom1.gba', savePath: '/saves/file1.sav' },
      player2: { romPath: '/games/rom2.gba', savePath: '/saves/file2.sav' }
    });
    expect(setIsRunningSpy).toHaveBeenCalledWith(true);
    expect(remapKeyBindingsSpy).toHaveBeenCalledWith([
      { gbaInput: 'A', key: 'X', location: 0 }
    ]);
    expect(addCallbacksSpy).toHaveBeenCalledWith({
      autoSaveStateCaptureNotificationEnabled: false,
      autoSaveStateLoadNotificationEnabled: false,
      fileSystemNotificationsEnabled: false,
      saveFileSystemOnInGameSave: false
    });
    expect(setCoreSettingsSpy).toHaveBeenNthCalledWith(2, {
      allowOpposingDirections: false,
      frameSkip: 2
    });
  });

  it('does not apply configuration after emulator start when local link fails', () => {
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const remapKeyBindingsSpy: (keyBindings: KeyBinding[]) => void = vi.fn();
    const setCoreSettingsSpy: (settings: coreSettings) => void = vi.fn();
    const setIsRunningSpy = vi.fn();
    const startLocalLinkSessionSpy: (
      config: LinkLocalStartSessionConfig
    ) => boolean = vi.fn(() => false);

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      setCanvas: vi.fn(),
      canvas: null,
      emulator: {
        filePaths: () => ({ gamePath: '/games', savePath: '/saves' }),
        remapKeyBindings: remapKeyBindingsSpy,
        setCoreSettings: setCoreSettingsSpy,
        setFastForwardMultiplier: vi.fn() as (multiplier: number) => void,
        setVolume: vi.fn() as (v: number) => void,
        startLocalLinkSession: startLocalLinkSessionSpy
      } as GBAEmulator
    }));
    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: false,
      setIsRunning: setIsRunningSpy
    }));
    vi.spyOn(addCallbacksHooks, 'useAddCallbacks').mockImplementation(() => ({
      addCallbacks: addCallbacksSpy,
      syncActionIfEnabled: vi.fn()
    }));

    const { result } = renderHookWithContext(() => useStartLocalLinkSession());

    act(() => {
      expect(
        result.current({
          player1: { rom: 'rom1.gba' },
          player2: { rom: 'rom2.gba' }
        })
      ).toBe(false);
    });

    expect(setIsRunningSpy).toHaveBeenCalledWith(false);
    expect(setCoreSettingsSpy).toHaveBeenCalledOnce();
    expect(remapKeyBindingsSpy).not.toHaveBeenCalled();
    expect(addCallbacksSpy).not.toHaveBeenCalled();
  });
});
