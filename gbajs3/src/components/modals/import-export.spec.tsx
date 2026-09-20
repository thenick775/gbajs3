import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TextReader, ZipWriter, Uint8ArrayWriter } from '@zip.js/zip.js';
import { describe, expect, it, vi } from 'vitest';

import * as blobUtils from './file-utilities/blob.ts';
import * as zipUtils from './file-utilities/zip.ts';
import { ImportExportModal } from './import-export.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import {
  fileTypes,
  type GBAEmulator,
  type FileNode
} from '../../emulator/mgba/mgba-emulator.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as addCallbackHooks from '../../hooks/emulator/use-add-callbacks.tsx';

import type { filePaths } from '@thenick775/mgba-wasm';

describe('<ImportExportModal />', () => {
  const defaultFSData: FileNode = {
    path: '/data',
    isDir: true,
    children: [
      {
        path: '/data/games',
        isDir: true,
        children: [
          {
            path: '/data/games/rom1.gba',
            isDir: false,
            children: []
          }
        ]
      },
      {
        path: '/data/saves',
        isDir: true,
        children: [
          {
            path: '/data/games/rom1.sav',
            isDir: false,
            children: []
          }
        ]
      }
    ],
    nextNeighbor: {
      path: '/autosave',
      isDir: true,
      children: [{ path: '/autosave/rom1_auto.ss', isDir: false, children: [] }]
    }
  };

  // vendored from emulator
  const isFileExtensionOfType = (
    fileName: string,
    type: keyof typeof fileTypes
  ) => {
    const fileExtension = `.${fileName.split('.').pop()}`;

    return fileTypes[type].some((e) =>
      typeof e === 'string' ? e === fileExtension : !!e.regex.exec(fileName)
    );
  };

  // only uint8 array style (no blobs) will work in jsdom
  const makeZipFile = async (
    items: { name: string; data?: string; directory?: boolean }[]
  ): Promise<File> => {
    const u8w = new Uint8ArrayWriter();
    const zw = new ZipWriter(u8w);

    for (const { name, data, directory } of items) {
      await zw.add(
        name.endsWith('/') ? name : directory ? `${name}/` : name,
        directory ? undefined : new TextReader(data ?? '')
      );
    }

    const bytes = await zw.close();

    return new File([new Blob([bytes])], 'export.zip', {
      type: 'application/zip'
    });
  };

  it('renders form validation error when submitting without a file', async () => {
    renderWithContext(<ImportExportModal />);

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(
      screen.getByText(/At least one export \.zip file is required/i)
    ).toBeVisible();
  });

  it('imports a zip and closes modal', async () => {
    const syncActionIfEnabledSpy = vi.fn();
    const closeModalSpy = vi.fn();

    const { useModalContext: originalModal } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');
    const { useAddCallbacks: originalCallbacks } = await vi.importActual<
      typeof addCallbackHooks
    >('../../hooks/emulator/use-add-callbacks.tsx');

    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockImplementation(() => ({
      ...originalCallbacks(),
      syncActionIfEnabled: syncActionIfEnabledSpy
    }));

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));

    const testZip = await makeZipFile([
      { name: 'rom1.gba', data: 'test-rom1' }
    ]);

    renderWithContext(<ImportExportModal />);

    const hiddenInput = screen.getByTestId('hidden-file-input');
    expect(hiddenInput).toBeInTheDocument();

    await userEvent.upload(hiddenInput, testZip);
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(syncActionIfEnabledSpy).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(closeModalSpy).toHaveBeenCalledOnce();
    });
  });

  it('dispatches imported entries to the correct emulator handlers', async () => {
    const uploadRomSpy = vi.fn((_file: File, cb?: () => void) => cb?.());
    const uploadAutoSaveStateSpy = vi.fn(() => Promise.resolve(undefined));
    const uploadSaveOrSaveStateSpy = vi.fn((_file: File, cb?: () => void) =>
      cb?.()
    );
    const uploadCheatsSpy = vi.fn((_file: File, cb?: () => void) => cb?.());
    const uploadPatchSpy = vi.fn((_file: File, cb?: () => void) => cb?.());
    const uploadScreenshotSpy = vi.fn((_file: File, cb?: () => void) => cb?.());

    const syncActionIfEnabledSpy = vi.fn();
    const closeModalSpy = vi.fn();

    const {
      useEmulatorContext: originalEmulator,
      useModalContext: originalModal
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');
    const { useAddCallbacks: originalCallbacks } = await vi.importActual<
      typeof addCallbackHooks
    >('../../hooks/emulator/use-add-callbacks.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        ...originalEmulator().emulator,
        uploadAutoSaveState: uploadAutoSaveStateSpy,
        uploadRom: uploadRomSpy,
        uploadSaveOrSaveState: uploadSaveOrSaveStateSpy,
        uploadCheats: uploadCheatsSpy,
        uploadPatch: uploadPatchSpy,
        uploadScreenshot: uploadScreenshotSpy,
        filePaths: () => ({ autosave: '/autosave' }) as filePaths,
        getCurrentAutoSaveStatePath: () => null,
        isFileExtensionOfType: isFileExtensionOfType
      } as GBAEmulator
    }));

    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockImplementation(() => ({
      ...originalCallbacks(),
      syncActionIfEnabled: syncActionIfEnabledSpy,
      getCurrentAutoSaveStatePath: () => null
    }));

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));

    const testZip = await makeZipFile([
      { name: 'rom.gba' },
      { name: 'rom.gbc' },
      { name: 'rom.gb' },
      { name: 'rom.zip' },
      { name: 'rom.7z' },
      { name: 'state_auto.ss' },
      { name: 'data.sav' },
      { name: 'save.ss2' },
      { name: 'rules.cheats' },
      { name: 'patch.ips' },
      { name: 'patch.ups' },
      { name: 'patch.bps' },
      { name: 'screenshot.png' },
      { name: 'local-storage.json', data: '{"some-key":"some-value"}' },
      { name: 'invalid.txt' }, // no write path
      { name: 'some/dir/', directory: true } // directory -> skipped
    ]);

    renderWithContext(<ImportExportModal />);

    await userEvent.upload(screen.getByTestId('hidden-file-input'), testZip);
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(uploadRomSpy).toHaveBeenCalledTimes(5);
    });

    expect(uploadAutoSaveStateSpy).toHaveBeenCalledTimes(1);

    expect(uploadSaveOrSaveStateSpy).toHaveBeenCalledTimes(2);

    expect(uploadCheatsSpy).toHaveBeenCalledTimes(1);

    expect(uploadPatchSpy).toHaveBeenCalledTimes(3);

    expect(uploadScreenshotSpy).toHaveBeenCalledTimes(1);

    expect(localStorage.getItem('some-key')).toBe('some-value');
  });

  it('shows an error and keeps the modal open when the zip contains an unsafe path', async () => {
    const syncActionIfEnabledSpy = vi.fn();
    const closeModalSpy = vi.fn();

    const { useModalContext: originalModal } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');
    const { useAddCallbacks: originalCallbacks } = await vi.importActual<
      typeof addCallbackHooks
    >('../../hooks/emulator/use-add-callbacks.tsx');

    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockImplementation(() => ({
      ...originalCallbacks(),
      syncActionIfEnabled: syncActionIfEnabledSpy
    }));

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy
    }));

    const testZip = await makeZipFile([{ name: '../evil.txt' }]);

    renderWithContext(<ImportExportModal />);

    await userEvent.upload(screen.getByTestId('hidden-file-input'), testZip);
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'ZIP contains an unsafe file path and cannot be imported'
        )
      ).toBeVisible();
    });

    expect(syncActionIfEnabledSpy).not.toHaveBeenCalled();
    expect(closeModalSpy).not.toHaveBeenCalled();
  });

  it('exports emulator file system to a zip', async () => {
    vi.setSystemTime(Date.UTC(2025, 0, 1, 8, 0, 0));

    const generateExportZipNameSpy = vi.spyOn(
      zipUtils,
      'generateExportZipName'
    );
    const downloadBlobSpy = vi
      .spyOn(blobUtils, 'downloadBlob')
      .mockImplementation((_, blob) => blob);
    const listAllFilesSpy: () => FileNode = vi.fn(
      (): FileNode => defaultFSData
    );
    const getFileSpy: (p: string) => Uint8Array = vi.fn(() =>
      new TextEncoder().encode('Some sav file contents')
    );

    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        listAllFiles: listAllFilesSpy,
        getFile: getFileSpy,
        getCurrentAutoSaveStatePath: () => null
      } as GBAEmulator
    }));

    renderWithContext(<ImportExportModal />);

    await userEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => {
      expect(downloadBlobSpy).toHaveBeenCalledWith(
        'gbajs-files-2025-01-01-08-00-00.zip',
        expect.any(Blob)
      );
    });

    expect(generateExportZipNameSpy).toHaveBeenCalledOnce();
    expect(getFileSpy).toHaveBeenCalledTimes(3);
    expect(getFileSpy).toHaveBeenCalledWith('/autosave/rom1_auto.ss');
    expect(getFileSpy).toHaveBeenCalledWith('/data/games/rom1.gba');
    expect(getFileSpy).toHaveBeenCalledWith('/data/games/rom1.sav');
  });

  it('closes modal when clicking Close', async () => {
    const closeModalSpy = vi.fn();
    const { useModalContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      closeModal: closeModalSpy
    }));

    renderWithContext(<ImportExportModal />);

    const closeButton = screen.getByText('Close', { selector: 'button' });
    expect(closeButton).toBeInTheDocument();

    await userEvent.click(closeButton);

    expect(closeModalSpy).toHaveBeenCalledOnce();
  });
});
