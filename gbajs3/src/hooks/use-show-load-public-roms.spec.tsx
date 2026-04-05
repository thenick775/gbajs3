import { PromptLocalStorageKey } from 'react-ios-pwa-prompt-ts';
import { describe, expect, it, vi } from 'vitest';

import * as contextHooks from './context.tsx';
import { useShowLoadPublicRoms } from './use-show-load-public-roms.tsx';
import { testRomLocation } from '../../test/mocks/handlers.ts';
import { renderHookWithContext } from '../../test/render-hook-with-context.tsx';

import type { GBAEmulator } from '../emulator/mgba/mgba-emulator.tsx';

const valid_url = `${testRomLocation}/good_rom.gba`;
const invalid_url = `bad url`;

describe('useShowLoadPublicRoms', () => {
  it('should open modal if all conditions are met', async () => {
    const openModalSpy = vi.fn();
    const isModalOpenSpy = vi.fn(() => true).mockReturnValueOnce(false);
    const { useModalContext: original, useEmulatorContext: originalEmulator } =
      await vi.importActual<typeof contextHooks>('./context.tsx');

    // pwa prompt must also have appeared if iOS and been dismissed if so
    localStorage.setItem(PromptLocalStorageKey, '{"isiOS":"true","visits":2}');

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      search: `?romURL=${valid_url}`
    } as Location);

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      openModal: openModalSpy,
      isModalOpen: isModalOpenSpy()
    }));

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {} as GBAEmulator
    }));

    renderHookWithContext(() => {
      useShowLoadPublicRoms();
    });

    expect(openModalSpy).toHaveBeenCalledOnce();
    expect(openModalSpy).toHaveBeenCalledWith({
      type: 'uploadPublicExternalRoms',
      props: {
        url: new URL(valid_url),
        onLoadOrDismiss: expect.any(Function)
      }
    });
  });

  it('marks url as error if invalid', async () => {
    const openModalSpy = vi.fn();
    const { useModalContext: original, useEmulatorContext: originalEmulator } =
      await vi.importActual<typeof contextHooks>('./context.tsx');

    // pwa prompt must also have appeared if iOS and been dismissed if so
    localStorage.setItem(PromptLocalStorageKey, '{"isiOS":"true","visits":2}');

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      search: `?romURL=${invalid_url}`
    } as Location);

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      openModal: openModalSpy
    }));

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {} as GBAEmulator
    }));

    renderHookWithContext(() => {
      useShowLoadPublicRoms();
    });

    expect(openModalSpy).not.toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalledWith(
      'hasLoadedPublicExternalRoms',
      '{"bad url":"error"}'
    );
  });

  it('should not reopen modal if URL was already attempted this session', async () => {
    const openModalSpy = vi.fn();
    const isModalOpenSpy = vi.fn(() => false);
    const { useModalContext: original, useEmulatorContext: originalEmulator } =
      await vi.importActual<typeof contextHooks>('./context.tsx');

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      search: `?romURL=${valid_url}`
    } as Location);

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      openModal: openModalSpy,
      isModalOpen: isModalOpenSpy()
    }));

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {} as GBAEmulator
    }));

    const { rerender } = renderHookWithContext(() => {
      useShowLoadPublicRoms();
    });

    expect(openModalSpy).toHaveBeenCalledOnce();

    openModalSpy.mockClear();

    // simulate re-render after overlay dismiss
    rerender();

    // modal should not reopen since url was already attempted
    expect(openModalSpy).not.toHaveBeenCalled();
  });

  it('waits for emulator readiness before opening the public rom modal', async () => {
    const openModalSpy = vi.fn();
    const { useModalContext: original, useEmulatorContext: originalEmulator } =
      await vi.importActual<typeof contextHooks>('./context.tsx');

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      search: `?romURL=${valid_url}`
    } as Location);

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      openModal: openModalSpy,
      isModalOpen: false
    }));

    vi.spyOn(contextHooks, 'useEmulatorContext')
      .mockImplementationOnce(() => ({
        ...originalEmulator(),
        emulator: null
      }))
      .mockImplementationOnce(() => ({
        ...originalEmulator(),
        emulator: null
      }))
      .mockImplementation(() => ({
        ...originalEmulator(),
        emulator: {} as GBAEmulator
      }));

    const { rerender } = renderHookWithContext(() => {
      useShowLoadPublicRoms();
    });

    expect(openModalSpy).not.toHaveBeenCalled();

    rerender();

    expect(openModalSpy).toHaveBeenCalledOnce();
  });
});
