import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions
} from '@tanstack/react-query';
import { z } from 'zod';

import { useCloudSyncContext } from './context.tsx';

import type { MemoryToken } from '../context/cloud-sync/cloud-sync-context.tsx';

export type AuthMessagePayload =
  | {
      type: 'success';
      accessToken: string;
      expiresIn: number;
      scope: string;
    }
  | {
      type: 'error';
      error: string;
    };

export type AuthMessage = AuthMessagePayload & {
  state: string;
};

const DriveFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.string().optional()
});

const DriveFilesResponseSchema = z.object({
  files: z.array(DriveFileSchema).optional()
});

const GoogleApiErrorResponseSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
      errors: z
        .array(
          z.object({
            reason: z.string().optional(),
            message: z.string().optional()
          })
        )
        .optional()
    })
    .optional()
});

type DriveFile = z.infer<typeof DriveFileSchema>;

type CloudBackup = {
  id: string;
  name: string;
  createdAt: string;
  size: number;
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

export const authChannelName = 'gbajs3-cloud-sync-auth';
const driveAppDataScope = 'https://www.googleapis.com/auth/drive.appdata';
const driveApiBaseUrl = 'https://www.googleapis.com/drive/v3/files';
const driveUploadBaseUrl = 'https://www.googleapis.com/upload/drive/v3/files';
const cloudBackupFileExtension = '.zip';
const cloudBackupNameRegex = new RegExp(
  `^.*(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z)\\${cloudBackupFileExtension}$`
);

export const generateCloudBackupName = () =>
  `${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, '-')}Z${cloudBackupFileExtension}`;

const parseCloudBackupCreatedAt = (name: string): string | null => {
  const match = cloudBackupNameRegex.exec(name);
  if (!match) return null;

  return match[1].replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z');
};

const getGoogleApiErrorDetail = async (res: Response) => {
  const data = GoogleApiErrorResponseSchema.parse(await res.json());
  const reason = data.error?.errors?.[0]?.reason;
  const message = data.error?.message ?? data.error?.errors?.[0]?.message;

  return [reason, message].filter(Boolean).join(': ');
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
  const createdAt = parseCloudBackupCreatedAt(file.name);
  if (!createdAt || !file.size) return null;

  return {
    id: file.id,
    name: file.name,
    createdAt,
    size: Number(file.size)
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

        if (typeof window.BroadcastChannel !== 'function') {
          reject(new Error('This browser does not support Cloud Sync auth'));
          return;
        }

        const state = crypto.randomUUID();
        const channel = new BroadcastChannel(authChannelName);
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

          if (message.type === 'success') {
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
              expiresAt: Date.now() + Math.max(message.expiresIn, 0) * 1000
            });
            return;
          }

          reject(new Error(message.error));
        };

        const authWindow = window.open(
          helperUrl.toString(),
          authChannelName,
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
  options?: Omit<UseQueryOptions<CloudBackup[]>, 'queryKey' | 'queryFn'>
) => {
  const { googleDriveAccessToken } = useCloudSyncContext();
  const { enabled = true, ...queryOptions } = options ?? {};

  return useQuery<CloudBackup[]>({
    queryKey: ['googleDriveBackups', googleDriveAccessToken],
    queryFn: async () => {
      if (!googleDriveAccessToken)
        throw new Error('Connect Google Drive first');

      const url = new URL(driveApiBaseUrl);
      url.searchParams.set('spaces', 'appDataFolder');
      url.searchParams.set('fields', 'files(id,name,size)');
      url.searchParams.set('pageSize', '100');

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${googleDriveAccessToken}` }
      });
      await assertOk(res, 'Listing Google Drive backups');

      const data = DriveFilesResponseSchema.parse(await res.json());
      const backups = data.files
        ?.map(toCloudBackup)
        .filter((backup): backup is CloudBackup => !!backup)
        .toSorted(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return backups ?? [];
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
      url.searchParams.set('fields', 'id,name,size');
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

      const file = DriveFileSchema.parse(await res.json());
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
