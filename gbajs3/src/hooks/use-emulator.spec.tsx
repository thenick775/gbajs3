import { renderHook, waitFor } from '@testing-library/react';
import mGBA, { type mGBAEmulator } from '@thenick775/mgba-wasm';
import { describe, expect, it, vi } from 'vitest';

import { useEmulator } from './use-emulator.tsx';
import * as mgbaEmulatorModule from '../emulator/mgba/mgba-emulator.tsx';

vi.mock('@thenick775/mgba-wasm', () => ({
  default: vi.fn()
}));

describe('useEmulator', () => {
  it('returns null when canvas is null', () => {
    const { result } = renderHook(() => useEmulator(null));

    expect(result.current).toBeNull();
  });

  it('initializes mGBA and returns the wrapped emulator when canvas exists', async () => {
    const canvas = {} as HTMLCanvasElement;
    const fsInitSpy: () => Promise<void> = vi.fn().mockResolvedValue(undefined);
    const module = {
      version: {
        projectName: 'mGBA',
        projectVersion: '1.0.0'
      },
      FSInit: fsInitSpy
    } as mGBAEmulator;
    const emulator = {};

    vi.mocked(mGBA).mockResolvedValue(module);
    vi.spyOn(mgbaEmulatorModule, 'mGBAEmulator').mockReturnValue(
      emulator as mgbaEmulatorModule.GBAEmulator
    );
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      /* empty */
    });

    const { result } = renderHook(() => useEmulator(canvas));

    await waitFor(() => {
      expect(result.current).toBe(emulator);
    });

    expect(mGBA).toHaveBeenCalledWith({ canvas });
    expect(fsInitSpy).toHaveBeenCalledOnce();
    expect(mgbaEmulatorModule.mGBAEmulator).toHaveBeenCalledWith(module);
    expect(consoleLogSpy).toHaveBeenCalledWith('mGBA 1.0.0');
  });
});
