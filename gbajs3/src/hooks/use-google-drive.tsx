import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions
} from '@tanstack/react-query';

import { useCloudSyncContext } from './context.tsx';

import type { MemoryToken } from '../context/cloud-sync/cloud-sync-context.tsx';

type DriveFile = {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
};

type DriveFilesResponse = {
  files?: DriveFile[];
};

type AuthMessage = {
  type?: 'success' | 'error';
  state?: string;
  accessToken?: string;
  expiresIn?: number;
  scope?: string;
  error?: string;
};

type GoogleApiErrorResponse = {
  error?: {
    message?: string;
    errors?: {
      reason?: string;
      message?: string;
    }[];
  };
};

type CloudBackup = {
  id: string;
  name: string;
  createdAt: string;
  modifiedTime?: string;
  size?: number;
};

type PushGoogleDriveBackupProps = {
  backup: Blob;
  name: string;
};

type PullGoogleDriveBackupProps = {
  backupId: string;
  name: string;
};

type DeleteGoogleDriveBackupProps = {
  backupId: string;
};

const driveAppDataScope = 'https://www.googleapis.com/auth/drive.appdata';
const driveApiBaseUrl = 'https://www.googleapis.com/drive/v3/files';
const driveUploadBaseUrl = 'https://www.googleapis.com/upload/drive/v3/files';
const cloudBackupFilePrefix = 'gbajs3-backup';
const cloudBackupFileExtension = '.zip';
const cloudBackupNameRegex = new RegExp(
  `^${cloudBackupFilePrefix}-(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z)\\${cloudBackupFileExtension}$`
);

const googleDriveBackupsQueryKey = (accessToken?: string | null) => [
  'googleDriveBackups',
  accessToken
];

export const generateCloudBackupName = (date = new Date()) =>
  `${cloudBackupFilePrefix}-${date
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, '-')}Z${cloudBackupFileExtension}`;

const sortCloudBackupsNewestFirst = <T extends { createdAt: string }>(
  backups: T[]
) =>
  backups.toSorted(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const parseCloudBackupCreatedAt = (name: string): string | null => {
  const match = cloudBackupNameRegex.exec(name);
  if (!match) return null;

  return match[1].replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z');
};

const isCloudBackupName = (name: string) =>
  parseCloudBackupCreatedAt(name) !== null;

const getGoogleApiErrorDetail = async (res: Response) => {
  try {
    const data = (await res.clone().json()) as GoogleApiErrorResponse;
    const reason = data.error?.errors?.[0]?.reason;
    const message = data.error?.message ?? data.error?.errors?.[0]?.message;

    return [reason, message].filter(Boolean).join(': ');
  } catch {
    return res.clone().text();
  }
};

const assertOk = async (res: Response, action: string) => {
  if (res.ok) return;

  const detail = await getGoogleApiErrorDetail(res);

  throw new Error(
    `${action} failed with status ${res.status}${detail ? `: ${detail}` : ''}`
  );
};

const hasDriveAppDataScope = (scope?: string) =>
  !!scope?.split(' ').includes(driveAppDataScope);

const createMultipartBody = (metadata: object, backup: Blob) => {
  const boundary = `gbajs3-${crypto.randomUUID()}`;
  const body = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      'Content-Type: application/zip\r\n\r\n',
      backup,
      `\r\n--${boundary}--`
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  return { body, boundary };
};

const toCloudBackup = (file: DriveFile): CloudBackup | null => {
  const createdAt = parseCloudBackupCreatedAt(file.name) ?? file.createdTime;
  if (!createdAt || !isCloudBackupName(file.name)) return null;

  return {
    id: file.id,
    name: file.name,
    createdAt,
    modifiedTime: file.modifiedTime,
    size: file.size ? Number(file.size) : undefined
  };
};

export const useConnectGoogleDrive = (
  options?: UseMutationOptions<MemoryToken>
) =>
  useMutation<MemoryToken>({
    mutationKey: ['googleDriveConnect'],
    mutationFn: () =>
      new Promise<MemoryToken>((resolve, reject) => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          reject(new Error('Google Drive is not configured'));
          return;
        }

        if (!('BroadcastChannel' in window)) {
          reject(new Error('This browser does not support Cloud Sync auth'));
          return;
        }

        const state = crypto.randomUUID();
        const channel = new BroadcastChannel('gbajs3-cloud-sync-auth');
        const helperUrl = new URL(
          `${import.meta.env.BASE_URL}cloud-sync-auth.html`,
          window.location.href
        );
        helperUrl.searchParams.set('state', state);

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          channel.close();
        };

        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error('Google Drive authorization timed out'));
        }, 120_000);

        channel.onmessage = (event: MessageEvent<AuthMessage>) => {
          const message = event.data;
          if (message.state !== state) return;

          cleanup();

          if (message.type === 'success' && message.accessToken) {
            if (!hasDriveAppDataScope(message.scope)) {
              reject(
                new Error(
                  'Google Drive authorization did not grant app data access'
                )
              );
              return;
            }

            resolve({
              accessToken: message.accessToken,
              expiresAt: Date.now() + Math.max(message.expiresIn ?? 0, 0) * 1000
            });
            return;
          }

          reject(
            new Error(message.error ?? 'Google Drive authorization failed')
          );
        };

        const authWindow = window.open(
          helperUrl.toString(),
          'gbajs3-cloud-sync-auth',
          'popup,width=480,height=640'
        );

        if (!authWindow) {
          cleanup();
          reject(new Error('Google Drive authorization popup was blocked'));
        }
      }),
    ...options
  });

export const useGoogleDriveBackups = (
  options?: UseQueryOptions<CloudBackup[]>
) => {
  const { googleDriveAccessToken } = useCloudSyncContext();
  const { enabled = true, ...queryOptions } = options ?? {};

  return useQuery<CloudBackup[]>({
    queryKey: googleDriveBackupsQueryKey(googleDriveAccessToken),
    queryFn: async () => {
      if (!googleDriveAccessToken) throw new Error('Connect Google Drive first');

      const url = new URL(driveApiBaseUrl);
      url.searchParams.set('spaces', 'appDataFolder');
      url.searchParams.set(
        'fields',
        'files(id,name,size,createdTime,modifiedTime)'
      );
      url.searchParams.set('pageSize', '100');

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${googleDriveAccessToken}` }
      });
      await assertOk(res, 'Listing Google Drive backups');

      const data = (await res.json()) as DriveFilesResponse;
      const backups = (data.files ?? [])
        .map(toCloudBackup)
        .filter((backup): backup is CloudBackup => !!backup);

      return sortCloudBackupsNewestFirst(backups);
    },
    enabled: !!googleDriveAccessToken && enabled,
    ...queryOptions
  });
};

export const usePushGoogleDriveBackup = (
  options?: UseMutationOptions<CloudBackup, Error, PushGoogleDriveBackupProps>
) => {
  const { googleDriveAccessToken } = useCloudSyncContext();

  return useMutation<CloudBackup, Error, PushGoogleDriveBackupProps>({
    mutationKey: ['googleDrivePushBackup'],
    mutationFn: async ({ backup, name }) => {
      const metadata = {
        name,
        parents: ['appDataFolder'],
        mimeType: 'application/zip'
      };
      const url = new URL(driveUploadBaseUrl);
      url.searchParams.set('uploadType', 'multipart');
      url.searchParams.set('fields', 'id,name,size,createdTime,modifiedTime');
      const { body, boundary } = createMultipartBody(metadata, backup);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleDriveAccessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      });
      await assertOk(res, 'Uploading Google Drive backup');

      const file = (await res.json()) as DriveFile;
      const cloudBackup = toCloudBackup(file);
      if (!cloudBackup)
        throw new Error('Google Drive returned an invalid backup');

      return cloudBackup;
    },
    ...options
  });
};

export const usePullGoogleDriveBackup = (
  options?: UseMutationOptions<Blob, Error, PullGoogleDriveBackupProps>
) => {
  const { googleDriveAccessToken } = useCloudSyncContext();

  return useMutation<Blob, Error, PullGoogleDriveBackupProps>({
    mutationKey: ['googleDrivePullBackup'],
    mutationFn: async ({ backupId }) => {
      const url = new URL(`${driveApiBaseUrl}/${backupId}`);
      url.searchParams.set('alt', 'media');

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${googleDriveAccessToken}` }
      });
      await assertOk(res, 'Downloading Google Drive backup');

      return res.blob();
    },
    ...options
  });
};

export const useDeleteGoogleDriveBackup = (
  options?: UseMutationOptions<Response, Error, DeleteGoogleDriveBackupProps>
) => {
  const { googleDriveAccessToken } = useCloudSyncContext();

  return useMutation<Response, Error, DeleteGoogleDriveBackupProps>({
    mutationKey: ['googleDriveDeleteBackup'],
    mutationFn: async ({ backupId }) => {
      const res = await fetch(`${driveApiBaseUrl}/${backupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${googleDriveAccessToken}` }
      });

      await assertOk(res, 'Deleting Google Drive backup');

      return res;
    },
    ...options
  });
};
