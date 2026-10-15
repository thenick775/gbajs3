import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useStopLocalLinkSession } from './use-stop-local-link-session.tsx';
import * as contextHooks from '../context.tsx';
import * as fadeCanvasHooks from '../use-fade-canvas.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';

describe('useStopLocalLinkSession', () => {
  it('stops the link session if the emulator exists', () => {
    const startFadeSpy = vi.fn();
    const cancelFadeSpy = vi.fn();
    const stopLocalLinkSessionSpy: () => void = vi.fn();
    const screenshotSpy: (fileName?: string) => boolean = vi.fn(() => true);
    const getFileSpy: (p: string) => Uint8Array = vi.fn(
      () => new Uint8Array([1, 2, 3])
    );
    const deleteFileSpy: (filePath: string) => void = vi.fn();
    const setIsRunningSpy = vi.fn();
    const testCanvas = {} as HTMLCanvasElement;

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      setCanvas: vi.fn(),
      canvas: testCanvas,
      emulator: {
        filePaths: () => ({
          screenshotsPath: '/screenshots'
        }),
        getLocalLinkStatus: () => ({ running: true }),
        screenshot: screenshotSpy,
        getFile: getFileSpy,
        deleteFile: deleteFileSpy,
        stopLocalLinkSession: stopLocalLinkSessionSpy
      } as GBAEmulator
    }));

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: true,
      setIsRunning: setIsRunningSpy
    }));

    vi.spyOn(fadeCanvasHooks, 'useFadeCanvas').mockImplementation(() => ({
      startFade: startFadeSpy,
      cancelFade: cancelFadeSpy
    }));

    const { result } = renderHook(() => useStopLocalLinkSession());

    expect(cancelFadeSpy).toHaveBeenCalledOnce();

    act(() => {
      result.current();
    });

    expect(screenshotSpy).toHaveBeenCalledWith('fade-copy.png');
    expect(getFileSpy).toHaveBeenCalledWith('/screenshots/fade-copy.png');
    expect(deleteFileSpy).toHaveBeenCalledWith('/screenshots/fade-copy.png');
    expect(startFadeSpy).toHaveBeenCalledWith(testCanvas, expect.any(Blob));
    expect(stopLocalLinkSessionSpy).toHaveBeenCalledOnce();
    expect(setIsRunningSpy).toHaveBeenCalledWith(false);
  });

  it('sets running to false if emulator is not running', () => {
    const startFadeSpy = vi.fn();
    const stopLocalLinkSessionSpy: () => void = vi.fn();
    const setIsRunningSpy = vi.fn();
    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(
      () =>
        ({
          emulator: {
            stopLocalLinkSession: stopLocalLinkSessionSpy,
            getLocalLinkStatus: () => ({ running: false })
          } as GBAEmulator
        }) as ReturnType<typeof contextHooks.useEmulatorContext>
    );
    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: false,
      setIsRunning: setIsRunningSpy
    }));
    vi.spyOn(fadeCanvasHooks, 'useFadeCanvas').mockImplementation(() => ({
      startFade: startFadeSpy,
      cancelFade: vi.fn()
    }));

    const { result } = renderHook(() => useStopLocalLinkSession());

    act(() => {
      result.current();
    });

    expect(startFadeSpy).not.toHaveBeenCalled();
    expect(stopLocalLinkSessionSpy).not.toHaveBeenCalled();

    expect(setIsRunningSpy).toHaveBeenCalledOnce();
    expect(setIsRunningSpy).toHaveBeenCalledWith(false);
  });
});
