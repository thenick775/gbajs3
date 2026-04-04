import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoadLocalRomModal } from './load-local-rom.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as runGameHooks from '../../hooks/emulator/use-run-game.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';

describe('<LoadLocalRomModal />', () => {
  it('renders help text if there are no local roms', () => {
    renderWithContext(<LoadLocalRomModal />);

    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.queryAllByRole('listitem')).toHaveLength(1);
    expect(
      screen.getByText('No local roms, load a game and save your file system')
    ).toBeVisible();
  });

  it('renders local roms', async () => {
    const { useEmulatorContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...original(),
      emulator: {
        listRoms: () => ['rom1.gba', 'rom2.gba'],
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));

    renderWithContext(<LoadLocalRomModal />);

    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.queryAllByRole('listitem')).toHaveLength(2);

    expect(screen.getByText('rom1.gba')).toBeVisible();
    expect(screen.getByText('rom2.gba')).toBeVisible();
  });

  it('loads a local rom and closes modal', async () => {
    const closeModalSpy = vi.fn();
    const runGameSpy = vi.fn();
    const {
      useEmulatorContext: originalEmulator,
      useModalContext: originalModal
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        listRoms: () => ['rom1.gba'],
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));

    vi.spyOn(runGameHooks, 'useRunGame').mockReturnValue(runGameSpy);

    renderWithContext(<LoadLocalRomModal />);

    const localRom = screen.getByText('rom1.gba');

    await userEvent.click(localRom);

    expect(runGameSpy).toHaveBeenCalledOnce();
    expect(runGameSpy).toHaveBeenCalledWith('rom1.gba');
    expect(closeModalSpy).toHaveBeenCalledOnce();
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

    renderWithContext(<LoadLocalRomModal />);

    // click the close button
    const closeButton = screen.getByText('Close', { selector: 'button' });
    await userEvent.click(closeButton);

    expect(closeModalSpy).toHaveBeenCalledOnce();
  });
});
