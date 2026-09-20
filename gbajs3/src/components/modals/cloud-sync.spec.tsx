import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CloudSyncModal } from './cloud-sync.tsx';
import * as filesystemBackup from './file-utilities/filesystem-backup.ts';
import { testGoogleDriveBackup } from '../../../test/mocks/handlers.ts';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as addCallbackHooks from '../../hooks/emulator/use-add-callbacks.tsx';
import * as writeFileHooks from '../../hooks/emulator/use-write-file-to-emulator.tsx';
import * as googleDriveHooks from '../../hooks/use-google-drive.tsx';

import type { MemoryToken } from '../../context/cloud-sync/cloud-sync-context.tsx';
import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';
import type {
  UseMutateFunction,
  UseMutationResult
} from '@tanstack/react-query';

describe('<CloudSyncModal />', () => {
  const mockCloudSyncContext = async (
    googleDriveAccessToken: string | null
  ) => {
    const { useCloudSyncContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useCloudSyncContext').mockImplementation(() => ({
      ...original(),
      googleDriveAccessToken,
      setGoogleDriveToken: vi.fn()
    }));
  };

  it('connects google drive when no access token is available', async () => {
    const connectGoogleDriveSpy = vi.fn();
    vi.spyOn(googleDriveHooks, 'useConnectGoogleDrive').mockReturnValue({
      error: null,
      isPending: false,
      mutate: connectGoogleDriveSpy as UseMutateFunction<MemoryToken>
    } as UseMutationResult<MemoryToken, Error, void>);
    await mockCloudSyncContext(null);

    renderWithContext(<CloudSyncModal />);

    expect(
      screen.getByText(
        'Connect Google Drive to push or pull filesystem backups.'
      )
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', { name: 'Connect Google Drive' })
    );

    expect(connectGoogleDriveSpy).toHaveBeenCalledOnce();
  });

  it('restores a backup after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const pullGoogleDriveBackupSpy = vi.fn();
    vi.spyOn(googleDriveHooks, 'usePullGoogleDriveBackup').mockReturnValue({
      error: null,
      isPending: false,
      mutate: pullGoogleDriveBackupSpy as UseMutateFunction<
        Blob,
        Error,
        { backupId: string; name: string }
      >
    } as UseMutationResult<Blob, Error, { backupId: string; name: string }>);
    await mockCloudSyncContext('token');

    renderWithContext(<CloudSyncModal />);

    expect(await screen.findByText('2.0 KiB')).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', {
        name: `Restore ${testGoogleDriveBackup.name}`
      })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      'Pulling this backup will replace local files. Continue?'
    );
    expect(pullGoogleDriveBackupSpy).toHaveBeenCalledWith({
      backupId: testGoogleDriveBackup.id,
      name: testGoogleDriveBackup.name
    });
  });

  it('creates a filesystem backup and uploads it to google drive', async () => {
    const emulator = {} as GBAEmulator;
    const createFilesystemBackupBlobSpy = vi
      .spyOn(filesystemBackup, 'createFilesystemBackupBlob')
      .mockResolvedValue(new Blob(['zip-bytes'], { type: 'application/zip' }));

    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator
    }));
    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockReturnValue({
      addCallbacks: vi.fn(),
      syncActionIfEnabled: vi.fn()
    });
    await mockCloudSyncContext('token');

    renderWithContext(<CloudSyncModal />);

    expect(await screen.findByText('2.0 KiB')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Create new cloud backup' })
    );

    await waitFor(() => {
      expect(createFilesystemBackupBlobSpy).toHaveBeenCalledWith(emulator);
    });
  });

  it('disables create and footer actions while restoring', async () => {
    vi.spyOn(googleDriveHooks, 'usePullGoogleDriveBackup').mockReturnValue({
      error: null,
      isPending: true,
      mutate: vi.fn() as UseMutateFunction<
        Blob,
        Error,
        { backupId: string; name: string }
      >
    } as UseMutationResult<Blob, Error, { backupId: string; name: string }>);
    await mockCloudSyncContext('token');

    renderWithContext(<CloudSyncModal />);

    expect(await screen.findByText('2.0 KiB')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Create new cloud backup' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });

  it('deletes a backup after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteGoogleDriveBackupSpy = vi.fn();
    vi.spyOn(googleDriveHooks, 'useDeleteGoogleDriveBackup').mockReturnValue({
      error: null,
      isPending: false,
      mutate: deleteGoogleDriveBackupSpy as UseMutateFunction<
        Response,
        Error,
        { backupId: string }
      >
    } as UseMutationResult<Response, Error, { backupId: string }>);
    await mockCloudSyncContext('token');

    renderWithContext(<CloudSyncModal />);

    expect(await screen.findByText('2.0 KiB')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: `Delete ${testGoogleDriveBackup.name}`
      })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete ${testGoogleDriveBackup.name}?`
    );
    expect(deleteGoogleDriveBackupSpy).toHaveBeenCalledWith({
      backupId: testGoogleDriveBackup.id
    });
  });

  it('restores a pulled backup into the emulator filesystem', async () => {
    const clearFilesystemSpy: () => void = vi.fn();
    const writeFileToEmulatorSpy = vi.fn();
    const syncActionIfEnabledSpy = vi.fn();
    const importZipToEmulatorFsSpy = vi
      .spyOn(filesystemBackup, 'importZipToEmulatorFs')
      .mockResolvedValue(undefined);

    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');
    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: { clearFilesystem: clearFilesystemSpy } as GBAEmulator
    }));
    vi.spyOn(addCallbackHooks, 'useAddCallbacks').mockReturnValue({
      addCallbacks: vi.fn(),
      syncActionIfEnabled: syncActionIfEnabledSpy
    });
    vi.spyOn(writeFileHooks, 'useWriteFileToEmulator').mockReturnValue(
      writeFileToEmulatorSpy
    );
    await mockCloudSyncContext('token');

    renderWithContext(<CloudSyncModal />);

    expect(await screen.findByText('2.0 KiB')).toBeInTheDocument();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await userEvent.click(
      screen.getByRole('button', {
        name: `Restore ${testGoogleDriveBackup.name}`
      })
    );

    expect(clearFilesystemSpy).toHaveBeenCalledOnce();
    expect(importZipToEmulatorFsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: testGoogleDriveBackup.name }),
      writeFileToEmulatorSpy
    );
    expect(syncActionIfEnabledSpy).toHaveBeenCalledOnce();
  });
});
