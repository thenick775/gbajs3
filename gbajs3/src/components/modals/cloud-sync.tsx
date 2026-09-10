import { Button, Divider, IconButton } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { BiError, BiTrash } from 'react-icons/bi';
import { BeatLoader } from 'react-spinners';

import {
  createFilesystemBackupBlob,
  importZipToEmulatorFs
} from './file-utilities/filesystem-backup.ts';
import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import {
  useCloudSyncContext,
  useEmulatorContext,
  useModalContext
} from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useWriteFileToEmulator } from '../../hooks/emulator/use-write-file-to-emulator.tsx';
import {
  generateCloudBackupName,
  useConnectGoogleDrive,
  useDeleteGoogleDriveBackup,
  useGoogleDriveBackups,
  usePullGoogleDriveBackup,
  usePushGoogleDriveBackup
} from '../../hooks/use-google-drive.tsx';
import { ErrorWithIcon } from '../shared/error-with-icon.tsx';
import { Copy, StyledBiPlus } from '../shared/styled.tsx';

const BackupList = styled('ul')`
  list-style: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  background: ${({ theme }) => theme.modalSurfaceElevated};
  border: 1px solid ${({ theme }) => theme.modalListBorder};
  border-radius: 10px;
  overflow: hidden;
`;

const BackupListWrapper = styled('div')`
  position: relative;
`;

const BackupListOverlay = styled('div')`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => `${theme.modalContainerSurface}99`};
  border-radius: 10px;
  z-index: 1;
`;

const BackupListItem = styled('li')`
  margin: 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.modalListBorder};
  }
`;

const BackupActions = styled('div')`
  display: grid;
  grid-template-columns: 1fr 36px;
  align-items: center;
`;

const BackupButton = styled('button')`
  width: 100%;
  padding: 0.875rem 1rem;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme.modalTextPrimary};
  background-color: transparent;
  border: 0;
  font: inherit;
  line-height: 1.35;

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
  }
`;

const BackupMeta = styled('span')`
  display: block;
  margin-top: 0.25rem;
  color: ${({ theme }) => theme.modalTextSecondary};
  font-size: 0.875rem;
`;

const StyledBiTrash = styled(BiTrash)`
  width: 18px;
  height: 18px;
`;

const EmptyState = styled(Copy)`
  padding: 1rem;
  margin: 0;
  color: ${({ theme }) => theme.modalTextSecondary};
`;

const formatBytes = (bytes?: number) => {
  if (!bytes) return null;

  const units = ['B', 'KiB', 'MiB', 'GiB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));

export const CloudSyncModal = () => {
  const theme = useTheme();
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const { syncActionIfEnabled } = useAddCallbacks();
  const writeFileToEmulator = useWriteFileToEmulator();
  const { googleDriveAccessToken, setGoogleDriveToken } = useCloudSyncContext();
  const googleDriveBackups = useGoogleDriveBackups();
  const connectGoogleDrive = useConnectGoogleDrive({
    onSuccess: setGoogleDriveToken
  });
  const pushGoogleDriveBackup = usePushGoogleDriveBackup();
  const pullGoogleDriveBackup = usePullGoogleDriveBackup({
    onSuccess: async (backupBlob, { name }) => {
      const backupFile = new File([backupBlob], name, {
        type: 'application/zip'
      });
      emulator?.clearFilesystem();
      await importZipToEmulatorFs(backupFile, writeFileToEmulator);
      await syncActionIfEnabled();
    }
  });
  const deleteGoogleDriveBackup = useDeleteGoogleDriveBackup({
    onSuccess: () => void googleDriveBackups.refetch()
  });
  const [isCreatingFilesystemBackup, setIsCreatingFilesystemBackup] =
    useState(false);
  const backups = googleDriveBackups.data ?? [];
  const isCreatingBackup =
    isCreatingFilesystemBackup || pushGoogleDriveBackup.isPending;
  const isBackupListBusy = isCreatingBackup || pullGoogleDriveBackup.isPending;

  const error =
    connectGoogleDrive.error?.message ??
    googleDriveBackups.error?.message ??
    pushGoogleDriveBackup.error?.message ??
    pullGoogleDriveBackup.error?.message ??
    deleteGoogleDriveBackup.error?.message;

  const createBackup = async () => {
    setIsCreatingFilesystemBackup(true);

    try {
      const backupBlob = await createFilesystemBackupBlob(emulator);
      setIsCreatingFilesystemBackup(false);
      await pushGoogleDriveBackup.mutateAsync({
        backup: backupBlob,
        name: generateCloudBackupName()
      });
      await googleDriveBackups.refetch();
    } finally {
      setIsCreatingFilesystemBackup(false);
    }
  };

  return (
    <>
      <ModalHeader title="Cloud Sync" />
      <ModalBody>
        <Copy>Google Drive</Copy>
        {error && <ErrorWithIcon icon={<BiError />} text={error} />}
        <Divider flexItem sx={{ margin: '10px 0' }} />
        {googleDriveAccessToken ? (
          <>
            <BackupListWrapper>
              <BackupList aria-label="Cloud Backups">
                {backups.map((backup) => {
                  const size = formatBytes(backup.size);

                  return (
                    <BackupListItem key={backup.id}>
                      <BackupActions>
                        <BackupButton
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                'Pulling this backup will replace local files. Continue?'
                              )
                            )
                              return;

                            pullGoogleDriveBackup.mutate({
                              backupId: backup.id,
                              name: backup.name
                            });
                          }}
                        >
                          {formatDate(backup.createdAt)}
                          <BackupMeta>
                            {backup.name} <br /> {size}
                          </BackupMeta>
                        </BackupButton>
                        <IconButton
                          aria-label={`Delete ${backup.name}`}
                          onClick={() => {
                            if (!window.confirm(`Delete ${backup.name}?`))
                              return;

                            deleteGoogleDriveBackup.mutate({
                              backupId: backup.id
                            });
                          }}
                        >
                          <StyledBiTrash />
                        </IconButton>
                      </BackupActions>
                    </BackupListItem>
                  );
                })}
                {!googleDriveBackups.isLoading && !backups.length && (
                  <BackupListItem>
                    <EmptyState>No cloud backups yet.</EmptyState>
                  </BackupListItem>
                )}
              </BackupList>
              {isBackupListBusy && (
                <BackupListOverlay>
                  <BeatLoader color={theme.gbaThemeBlue} margin={3} size={7} />
                </BackupListOverlay>
              )}
            </BackupListWrapper>
            <IconButton
              aria-label="Create new cloud backup"
              disabled={isBackupListBusy}
              sx={{ padding: 0, marginTop: '10px' }}
              onClick={() => {
                void createBackup();
              }}
            >
              <StyledBiPlus />
            </IconButton>
          </>
        ) : (
          <Copy>Connect Google Drive to push or pull filesystem backups.</Copy>
        )}
      </ModalBody>
      <ModalFooter>
        {!googleDriveAccessToken ? (
          <Button
            variant="contained"
            onClick={() => {
              connectGoogleDrive.mutate();
            }}
            loading={connectGoogleDrive.isPending}
          >
            Connect Google Drive
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => {
                void googleDriveBackups.refetch();
              }}
              disabled={isBackupListBusy}
              loading={googleDriveBackups.isFetching}
            >
              Refresh
            </Button>
          </>
        )}
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
