import { Button, Divider, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { BiError, BiTrash } from 'react-icons/bi';

import {
  createFilesystemBackupBlob,
  deleteFilesystemFiles,
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
  googleDriveLabel,
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

const missingGoogleDriveTokenError = 'Connect Google Drive first';

export const CloudSyncModal = () => {
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const { syncActionIfEnabled } = useAddCallbacks();
  const writeFileToEmulator = useWriteFileToEmulator();
  const connectGoogleDrive = useConnectGoogleDrive();
  const pushGoogleDriveBackup = usePushGoogleDriveBackup();
  const pullGoogleDriveBackup = usePullGoogleDriveBackup();
  const deleteGoogleDriveBackup = useDeleteGoogleDriveBackup();
  const {
    googleDriveToken,
    setGoogleDriveToken,
    getGoogleDriveAccessToken,
    isGoogleDriveConnected
  } = useCloudSyncContext();
  const [localError, setLocalError] = useState<string | null>(null);
  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConnected = isGoogleDriveConnected();
  const accessToken = isConnected ? (googleDriveToken?.accessToken ?? null) : null;
  const googleDriveBackups = useGoogleDriveBackups(accessToken);
  const backups = googleDriveBackups.data ?? [];

  const error =
    localError ??
    connectGoogleDrive.error?.message ??
    googleDriveBackups.error?.message ??
    pushGoogleDriveBackup.error?.message ??
    pullGoogleDriveBackup.error?.message ??
    deleteGoogleDriveBackup.error?.message;

  const resetErrors = () => {
    setLocalError(null);
    connectGoogleDrive.reset();
    pushGoogleDriveBackup.reset();
    pullGoogleDriveBackup.reset();
    deleteGoogleDriveBackup.reset();
  };

  const createBackup = async () => {
    resetErrors();

    try {
      const accessToken = getGoogleDriveAccessToken();
      if (!accessToken) {
        setLocalError(missingGoogleDriveTokenError);
        return;
      }

      const backupBlob = await createFilesystemBackupBlob(emulator);
      await pushGoogleDriveBackup.mutateAsync({
        accessToken,
        backup: backupBlob,
        name: generateCloudBackupName()
      });
      await googleDriveBackups.refetch();
    } catch (error) {
      if (!pushGoogleDriveBackup.error)
        setLocalError(
          error instanceof Error ? error.message : 'Pushing backup failed'
        );
    }
  };

  return (
    <>
      <ModalHeader title="Cloud Sync" />
      <ModalBody>
        <Copy>Provider: {googleDriveLabel}</Copy>
        {!hasGoogleClientId && (
          <ErrorWithIcon
            icon={<BiError />}
            text="Google Drive is not configured. Set VITE_GOOGLE_CLIENT_ID."
          />
        )}
        {error && <ErrorWithIcon icon={<BiError />} text={error} />}
        <Divider flexItem sx={{ margin: '10px 0' }} />
        {isConnected ? (
          <>
            <BackupList aria-label="Cloud Backups">
              {backups.map((backup) => {
                const size = formatBytes(backup.size);

                return (
                  <BackupListItem key={backup.id}>
                    <BackupActions>
                      <BackupButton
                        type="button"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              'Pulling this backup will replace local files. Continue?'
                            )
                          )
                            return;

                          resetErrors();

                          try {
                            const accessToken = getGoogleDriveAccessToken();
                            if (!accessToken) {
                              setLocalError(missingGoogleDriveTokenError);
                              return;
                            }

                            const backupBlob =
                              await pullGoogleDriveBackup.mutateAsync({
                                accessToken,
                                backupId: backup.id
                              });
                            const backupFile = new File(
                              [backupBlob],
                              backup.name,
                              {
                                type: 'application/zip'
                              }
                            );
                            deleteFilesystemFiles(emulator);
                            await importZipToEmulatorFs(
                              backupFile,
                              writeFileToEmulator
                            );
                            await syncActionIfEnabled();
                          } catch (error) {
                            if (!pullGoogleDriveBackup.error)
                              setLocalError(
                                error instanceof Error
                                  ? error.message
                                  : 'Pulling backup failed'
                              );
                          }
                        }}
                      >
                        {formatDate(backup.createdAt)}
                        <BackupMeta>
                          {size ? `${size} | ${backup.name}` : backup.name}
                        </BackupMeta>
                      </BackupButton>
                      <IconButton
                        aria-label={`Delete ${backup.name}`}
                        onClick={async () => {
                          if (!window.confirm(`Delete ${backup.name}?`)) return;

                          resetErrors();

                          try {
                            const accessToken = getGoogleDriveAccessToken();
                            if (!accessToken) {
                              setLocalError(missingGoogleDriveTokenError);
                              return;
                            }

                            await deleteGoogleDriveBackup.mutateAsync({
                              accessToken,
                              backupId: backup.id
                            });
                            await googleDriveBackups.refetch();
                          } catch (error) {
                            if (!deleteGoogleDriveBackup.error)
                              setLocalError(
                                error instanceof Error
                                  ? error.message
                                  : 'Deleting backup failed'
                              );
                          }
                        }}
                      >
                        <StyledBiTrash />
                      </IconButton>
                    </BackupActions>
                  </BackupListItem>
                );
              })}
              {googleDriveBackups.isLoading && (
                <BackupListItem>
                  <EmptyState>Loading cloud backups...</EmptyState>
                </BackupListItem>
              )}
              {!googleDriveBackups.isLoading && !backups.length && (
                <BackupListItem>
                  <EmptyState>No cloud backups yet.</EmptyState>
                </BackupListItem>
              )}
            </BackupList>
            <IconButton
              aria-label="Create new cloud backup"
              disabled={pushGoogleDriveBackup.isPending}
              sx={{ padding: 0, marginTop: '10px' }}
              onClick={createBackup}
            >
              <StyledBiPlus />
            </IconButton>
          </>
        ) : (
          <Copy>Connect Google Drive to push or pull filesystem backups.</Copy>
        )}
      </ModalBody>
      <ModalFooter>
        {!isConnected ? (
          <Button
            variant="contained"
            onClick={async () => {
              resetErrors();

              try {
                const token = await connectGoogleDrive.mutateAsync();
                setGoogleDriveToken(token);
              } catch (error) {
                if (!connectGoogleDrive.error)
                  setLocalError(
                    error instanceof Error
                      ? error.message
                      : 'Google Drive connection failed'
                  );
              }
            }}
            loading={connectGoogleDrive.isPending}
            disabled={!hasGoogleClientId}
          >
            Connect Google Drive
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => {
                resetErrors();
                void googleDriveBackups.refetch();
              }}
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
