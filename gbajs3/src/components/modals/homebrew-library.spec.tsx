import { fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HomebrewLibraryModal } from './homebrew-library.tsx';
import { testRomLocation } from '../../../test/mocks/handlers.ts';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as addCallbackHooks from '../../hooks/emulator/use-add-callbacks.tsx';
import * as runGameHooks from '../../hooks/emulator/use-run-game.tsx';
import * as homebrewCatalogHooks from '../../hooks/use-homebrew-catalog.tsx';
import * as loadExternalRomHooks from '../../hooks/use-load-external-rom.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import type { CoreCallbackOptions } from '../../hooks/emulator/use-add-callbacks.tsx';
import type {
  HomebrewCatalog,
  HomebrewEntry
} from '../../hooks/use-homebrew-catalog.tsx';
import type {
  UseMutateFunction,
  UseMutationResult,
  UseQueryResult
} from '@tanstack/react-query';

const entries: HomebrewEntry[] = Array.from({ length: 11 }, (_, index) => ({
  slug: `game-${index + 1}`,
  title: `Game ${index + 1}`,
  platform: index === 0 ? 'GBC' : 'GBA',
  developer: index === 0 ? 'Example Studio' : undefined,
  description: index === 0 ? 'An example adventure' : undefined,
  tags: index === 0 ? ['adventure'] : undefined,
  license: index === 0 ? 'MIT' : undefined,
  website: index === 0 ? 'https://example.test' : undefined,
  cover: index === 0 ? { url: 'https://example.test/cover.png' } : undefined,
  rom: {
    url:
      index === 0
        ? `${testRomLocation}/good_rom.gba`
        : `https://example.test/game-${index + 1}.gba`
  }
}));

describe('<HomebrewLibraryModal />', () => {
  it('searches the catalog and loads more entries on scroll', async () => {
    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: { entries },
      isPending: false,
      error: null
    } as UseQueryResult<HomebrewCatalog>);

    renderWithContext(<HomebrewLibraryModal />);

    expect(screen.getAllByRole('button', { name: /Game */ })).toHaveLength(10);

    const search = screen.getByLabelText('Name/Platform/Dev/Tags');
    expect(search).toBeVisible();
    expect(screen.getByText('GBC - Example Studio - MIT')).toBeVisible();
    expect(screen.getByRole('button', { name: /Game 10/ })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Load more games' })
    ).toBeVisible();

    const body = screen.getByRole('region', { name: 'Homebrew catalog' });
    fireEvent.scroll(body);

    expect(screen.getByRole('button', { name: /Game 11/ })).toBeVisible();
    expect(screen.getAllByRole('button', { name: /Game */ })).toHaveLength(11);

    // search by tag
    await userEvent.type(search, 'adventure');

    expect(screen.getByRole('button', { name: /Game 1/ })).toBeVisible();
    expect(screen.getAllByRole('button', { name: /Game */ })).toHaveLength(1);
  });

  it('shows details and starts rom download from the external source', async () => {
    const loadExternalRomSpy: UseMutateFunction<File, Error, { url: URL }> =
      vi.fn();

    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: { entries },
      isPending: false,
      error: null
    } as UseQueryResult<HomebrewCatalog>);

    vi.spyOn(loadExternalRomHooks, 'useLoadExternalRom').mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isPaused: false,
      mutate: loadExternalRomSpy
    } as UseMutationResult<File, Error, { url: URL }>);

    renderWithContext(<HomebrewLibraryModal />);

    await userEvent.click(screen.getByRole('button', { name: /^Game 1 GBC/ }));

    expect(screen.getByAltText('Cover art for Game 1')).toBeVisible();
    expect(screen.getByText('Developer(s): Example Studio')).toBeVisible();
    expect(screen.getByText('License: MIT')).toBeVisible();
    expect(screen.getByText('Website:')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'https://example.test' })
    ).toBeVisible();
    expect(screen.getByText('An example adventure')).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', { name: 'Download and Play' })
    );

    expect(loadExternalRomSpy).toHaveBeenCalledExactlyOnceWith({
      url: new URL(`${testRomLocation}/good_rom.gba`)
    });
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Name/Platform/Dev/Tags')).toBeVisible();
  });

  it('runs the external loaded rom in the emulator core', async () => {
    const closeModalSpy = vi.fn();
    const uploadRomSpy: (file: File, cb?: () => void) => void = vi.fn(
      (_file: File, cb?: () => void) => cb?.()
    );
    const runGameSpy = vi.fn().mockReturnValue(true);
    const addCallbacksSpy: (options: CoreCallbackOptions) => void = vi.fn();
    const syncActionIfEnabledSpy = vi.fn();

    const {
      useEmulatorContext: originalEmulator,
      useModalContext: originalModal
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: { entries },
      isPending: false,
      error: null
    } as UseQueryResult<HomebrewCatalog>);

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        uploadRom: uploadRomSpy,
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));
    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));
    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockReturnValue({
      addCallbacks: addCallbacksSpy,
      syncActionIfEnabled: syncActionIfEnabledSpy
    });
    vi.spyOn(runGameHooks, 'useRunGame').mockReturnValue(runGameSpy);

    renderWithContext(<HomebrewLibraryModal />);
    await userEvent.click(screen.getByRole('button', { name: /^Game 1 GBC/ }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Download and Play' })
    );

    await waitFor(() => {
      expect(uploadRomSpy).toHaveBeenCalledOnce();
      expect(syncActionIfEnabledSpy).toHaveBeenCalledOnce();
      expect(runGameSpy).toHaveBeenCalledExactlyOnceWith('good_rom.gba');
      expect(closeModalSpy).toHaveBeenCalledOnce();
    });
  });

  it('shows question marks when games have no covers', async () => {
    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: { entries },
      isPending: false,
      error: null
    } as UseQueryResult<HomebrewCatalog>);

    renderWithContext(<HomebrewLibraryModal />);

    expect(screen.getAllByText('?')).toHaveLength(9);

    await userEvent.click(screen.getByRole('button', { name: /Game 2/ }));

    expect(screen.getAllByText('?')).toHaveLength(1);
    expect(screen.getByText('?')).toBeVisible();
  });

  it('loads more catalog entries with the more button', async () => {
    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: { entries },
      isPending: false,
      error: null
    } as UseQueryResult<HomebrewCatalog>);

    renderWithContext(<HomebrewLibraryModal />);

    expect(
      screen.queryByRole('button', { name: /Game 11/ })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Load more games' })
    );

    expect(screen.getByRole('button', { name: /Game 11/ })).toBeVisible();
  });

  it('renders the empty catalog state', () => {
    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: { entries: [] as HomebrewEntry[] },
      isPending: false,
      error: null
    } as UseQueryResult<HomebrewCatalog>);

    renderWithContext(<HomebrewLibraryModal />);

    expect(
      screen.getByText('No homebrew games match your search.')
    ).toBeVisible();
  });

  it('renders the catalog error', () => {
    vi.spyOn(homebrewCatalogHooks, 'useHomebrewCatalog').mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error('Request failed')
    } as UseQueryResult<HomebrewCatalog>);

    renderWithContext(<HomebrewLibraryModal />);

    expect(
      screen.getByText('The homebrew catalog could not be loaded')
    ).toBeVisible();
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

    renderWithContext(<HomebrewLibraryModal />);

    const closeButton = screen.getByText('Close', { selector: 'button' });
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);

    expect(closeModalSpy).toHaveBeenCalledOnce();
  });
});
