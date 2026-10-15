import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { describe, expect, it, vi } from 'vitest';

import { LocalLinkModal } from './local-link.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as startLocalLinkSessionHooks from '../../hooks/emulator/use-start-local-link-session.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import type { LocalLinkSessionOptions } from '../../hooks/emulator/use-start-local-link-session.tsx';

describe('<LocalLinkModal />', () => {
  it('renders available roms and saves', async () => {
    const { useEmulatorContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...original(),
      emulator: {
        listRoms: () => ['rom1.gba', 'rom2.gba'],
        listSaves: () => ['rom1.sav', 'rom2.sav'],
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));

    renderWithContext(<LocalLinkModal />);

    expect(screen.getByLabelText('Local Link Form')).toBeInTheDocument();
    expect(screen.getByText('Choose Player 1 ROM')).toBeVisible();
    expect(screen.getByText('Choose Player 2 ROM')).toBeVisible();
    expect(screen.getAllByText('Auto-load / new save')).toHaveLength(2);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 1 ROM' })
    );

    expect(screen.getByRole('option', { name: 'rom1.gba' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'rom2.gba' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 1 Save' })
    );

    expect(screen.getByRole('option', { name: 'rom1.sav' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'rom2.sav' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 2 ROM' })
    );

    expect(screen.getByRole('option', { name: 'rom1.gba' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'rom2.gba' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 2 Save' })
    );

    expect(screen.getByRole('option', { name: 'rom1.sav' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'rom2.sav' })).toBeVisible();
  });

  it('validates both player roms are present', async () => {
    const startLocalLinkSessionSpy: (
      options: LocalLinkSessionOptions
    ) => boolean = vi.fn();
    const { useEmulatorContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...original(),
      emulator: {
        listRoms: () => ['rom1.gba'],
        listSaves: () => ['file1.sav'],
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));
    vi.spyOn(
      startLocalLinkSessionHooks,
      'useStartLocalLinkSession'
    ).mockReturnValue(startLocalLinkSessionSpy);

    renderWithContext(<LocalLinkModal />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Start Local Link' })
    );

    expect(await screen.findByText('Player 1 ROM is required')).toBeVisible();
    expect(screen.getByText('Player 2 ROM is required')).toBeVisible();
    expect(startLocalLinkSessionSpy).not.toHaveBeenCalled();
  });

  it('submits selected players and closes modal', async () => {
    const startLocalLinkSessionSpy: (
      options: LocalLinkSessionOptions
    ) => boolean = vi.fn(() => true);
    const closeModalSpy = vi.fn();
    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');
    const { useModalContext: originalModal } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        listRoms: () => ['rom1.gba', 'rom2.gba'],
        listSaves: () => ['file1.sav', 'file2.sav'],
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));
    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));
    vi.spyOn(
      startLocalLinkSessionHooks,
      'useStartLocalLinkSession'
    ).mockReturnValue(startLocalLinkSessionSpy);
    const toastSuccessSpy = vi.spyOn(toast, 'success');

    renderWithContext(<LocalLinkModal />);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 1 ROM' })
    );
    await userEvent.click(screen.getByRole('option', { name: 'rom1.gba' }));
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 1 Save' })
    );
    await userEvent.click(screen.getByRole('option', { name: 'file1.sav' }));
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 2 ROM' })
    );
    await userEvent.click(screen.getByRole('option', { name: 'rom2.gba' }));
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 2 Save' })
    );
    await userEvent.click(screen.getByRole('option', { name: 'file2.sav' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Start Local Link' })
    );

    expect(startLocalLinkSessionSpy).toHaveBeenCalledExactlyOnceWith({
      player1: { rom: 'rom1.gba', save: 'file1.sav' },
      player2: { rom: 'rom2.gba', save: 'file2.sav' }
    });
    expect(toastSuccessSpy).toHaveBeenCalledExactlyOnceWith(
      'Local link started. Active player: P1'
    );
    expect(closeModalSpy).toHaveBeenCalledOnce();
  });

  it('reports a failed local-link start without closing the modal', async () => {
    const startLocalLinkSessionSpy: (
      options: LocalLinkSessionOptions
    ) => boolean = vi.fn(() => false);
    const closeModalSpy = vi.fn();
    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');
    const { useModalContext: originalModal } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        listRoms: () => ['rom1.gba', 'rom2.gba'],
        listSaves: () => [] as string[],
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));
    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));
    vi.spyOn(
      startLocalLinkSessionHooks,
      'useStartLocalLinkSession'
    ).mockReturnValue(startLocalLinkSessionSpy);
    const toastErrorSpy = vi.spyOn(toast, 'error');

    renderWithContext(<LocalLinkModal />);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 1 ROM' })
    );
    await userEvent.click(screen.getByRole('option', { name: 'rom1.gba' }));
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Player 2 ROM' })
    );
    await userEvent.click(screen.getByRole('option', { name: 'rom2.gba' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Start Local Link' })
    );

    expect(startLocalLinkSessionSpy).toHaveBeenCalledExactlyOnceWith({
      player1: { rom: 'rom1.gba', save: undefined },
      player2: { rom: 'rom2.gba', save: undefined }
    });
    expect(toastErrorSpy).toHaveBeenCalledExactlyOnceWith(
      'Local link failed to start'
    );
    expect(closeModalSpy).not.toHaveBeenCalled();
  });
});
