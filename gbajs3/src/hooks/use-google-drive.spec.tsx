import { act, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import * as contextHooks from './context.tsx';
import {
  authChannelName,
  generateCloudBackupName,
  useConnectGoogleDrive,
  useDeleteGoogleDriveBackup,
  useGoogleDriveBackups,
  usePullGoogleDriveBackup,
  usePushGoogleDriveBackup
} from './use-google-drive.tsx';
import {
  googleDriveApiLocation,
  googleDriveErrorAccessToken,
  invalidGoogleDriveBackupName,
  testGoogleDriveBackup
} from '../../test/mocks/handlers.ts';
import { server } from '../../test/mocks/server.ts';
import { renderHookWithContext } from '../../test/render-hook-with-context.tsx';

describe('Google Drive hooks', () => {
  const accessToken = 'test-google-token';

  const createBroadcastChannel = () => {
    const channel: {
      name: string;
      onmessage: ((event: MessageEvent) => void) | null;
      close: ReturnType<typeof vi.fn>;
    } = {
      name: '',
      onmessage: null,
      close: vi.fn()
    };

    vi.spyOn(window, 'BroadcastChannel').mockImplementation(function (name) {
      channel.name = name;

      return channel;
    });

    return channel;
  };

  const mockCloudSyncContext = async (accessToken = 'test-google-token') => {
    const { useCloudSyncContext: original } =
      await vi.importActual<typeof contextHooks>('./context.tsx');

    vi.spyOn(contextHooks, 'useCloudSyncContext').mockImplementation(() => ({
      ...original(),
      googleDriveAccessToken: accessToken
    }));
  };

  it('generates backup name in readable format', () => {
    vi.setSystemTime(Date.UTC(2026, 0, 1, 0, 0, 0));

    expect(generateCloudBackupName()).toBe('2026-01-01T00-00-00Z.zip');
  });

  it('lists valid Drive app data backups newest first', async () => {
    await mockCloudSyncContext();

    server.use(
      http.get(googleDriveApiLocation, ({ request }) => {
        const url = new URL(request.url);

        expect(request.headers.get('authorization')).toBe(
          `Bearer ${accessToken}`
        );
        expect(url.searchParams.get('spaces')).toBe('appDataFolder');
        expect(url.searchParams.get('fields')).toBe('files(id,name,size)');
        expect(url.searchParams.get('pageSize')).toBe('100');

        return HttpResponse.json({
          files: [
            {
              id: 'older',
              name: '2025-01-01T00-00-00Z.zip',
              size: '1024'
            },
            { id: 'invalid-name', name: 'notes.txt', size: '500' },
            { id: 'missing-size', name: '2025-01-03T00-00-00Z.zip' },
            {
              id: 'newer',
              name: '2025-01-02T00-00-00Z.zip',
              size: '2048'
            }
          ]
        });
      })
    );

    const { result } = renderHookWithContext(() => useGoogleDriveBackups());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      {
        id: 'newer',
        name: '2025-01-02T00-00-00Z.zip',
        createdAt: '2025-01-02T00:00:00Z',
        size: 2048
      },
      {
        id: 'older',
        name: '2025-01-01T00-00-00Z.zip',
        createdAt: '2025-01-01T00:00:00Z',
        size: 1024
      }
    ]);
  });

  it('uploads backups to Drive app data folder', async () => {
    await mockCloudSyncContext();

    const { result } = renderHookWithContext(() => usePushGoogleDriveBackup());

    const uploadedBackup = await act(() =>
      result.current.mutateAsync({
        backup: new Blob(['backup-bytes'], { type: 'application/zip' }),
        name: '2025-01-02T03-04-05Z.zip'
      })
    );

    expect(uploadedBackup).toEqual({
      id: testGoogleDriveBackup.id,
      name: testGoogleDriveBackup.name,
      createdAt: '2025-01-02T03:04:05Z',
      size: Number(testGoogleDriveBackup.size)
    });
  });

  it('rejects invalid Drive backup uploads', async () => {
    await mockCloudSyncContext();

    const { result } = renderHookWithContext(() => usePushGoogleDriveBackup());

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          backup: new Blob(['backup-bytes'], { type: 'application/zip' }),
          name: invalidGoogleDriveBackupName
        })
      ).rejects.toThrow('Google Drive returned an invalid backup');
    });
  });

  it('downloads a backup blob', async () => {
    await mockCloudSyncContext();

    const { result } = renderHookWithContext(() => usePullGoogleDriveBackup());

    const backupBlob = await act(() =>
      result.current.mutateAsync({
        backupId: testGoogleDriveBackup.id,
        name: testGoogleDriveBackup.name
      })
    );

    expect(await backupBlob.text()).toBe('zip-bytes');
  });

  it('deletes a backup', async () => {
    await mockCloudSyncContext();

    const { result } = renderHookWithContext(() =>
      useDeleteGoogleDriveBackup()
    );

    const deleteResponse = await act(() =>
      result.current.mutateAsync({
        backupId: testGoogleDriveBackup.id
      })
    );

    expect(deleteResponse.status).toBe(204);
  });

  it('surfaces google api error details', async () => {
    await mockCloudSyncContext(googleDriveErrorAccessToken);

    const { result } = renderHookWithContext(() =>
      useGoogleDriveBackups({ retry: false })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Listing Google Drive backups failed with status 401: authError: Invalid Credentials'
    );
  });

  it('rejects google drive connect when it is not configured', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');

    const { result } = renderHookWithContext(() => useConnectGoogleDrive());

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        'Google Drive is not configured'
      );
    });
  });

  it('rejects google drive connect when BroadcastChannel is unsupported', async () => {
    vi.stubGlobal('BroadcastChannel', undefined);

    const { result } = renderHookWithContext(() => useConnectGoogleDrive());

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        'This browser does not support Cloud Sync auth'
      );
    });
  });

  it('rejects google drive connect when the popup is blocked', async () => {
    const channel = createBroadcastChannel();
    vi.spyOn(window, 'open').mockReturnValue(null);

    const { result } = renderHookWithContext(() => useConnectGoogleDrive());

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        'Google Drive authorization popup was blocked'
      );
    });
    expect(channel.close).toHaveBeenCalledOnce();
  });

  it('resolves google drive connect from a successful auth message', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000'
    );
    const channel = createBroadcastChannel();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    const onSuccess = vi.fn();
    const { result } = renderHookWithContext(() =>
      useConnectGoogleDrive({ onSuccess })
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(channel.onmessage).toEqual(expect.any(Function));
    });

    act(() => {
      channel.onmessage?.({
        data: {
          type: 'success',
          state: '00000000-0000-4000-8000-000000000000',
          accessToken: 'access-token',
          expiresIn: 1,
          scope: 'https://www.googleapis.com/auth/drive.appdata'
        }
      } as MessageEvent);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        {
          accessToken: 'access-token',
          expiresAt: expect.any(Number)
        },
        undefined,
        undefined,
        expect.any(Object)
      );
    });
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'cloud-sync-auth.html?state=00000000-0000-4000-8000-000000000000'
      ),
      authChannelName,
      'popup,width=480,height=640'
    );
  });

  it('ignores google drive connect messages with a different state', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000'
    );
    const channel = createBroadcastChannel();
    vi.spyOn(window, 'open').mockReturnValue({} as Window);

    const onSuccess = vi.fn();
    const { result } = renderHookWithContext(() =>
      useConnectGoogleDrive({ onSuccess })
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(channel.onmessage).toEqual(expect.any(Function));
    });

    act(() => {
      channel.onmessage?.({
        data: {
          type: 'success',
          state: 'wrong-state',
          accessToken: 'ignored-token',
          expiresIn: 1,
          scope: 'https://www.googleapis.com/auth/drive.appdata'
        }
      } as MessageEvent);
    });

    expect(channel.close).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      channel.onmessage?.({
        data: {
          type: 'success',
          state: '00000000-0000-4000-8000-000000000000',
          accessToken: 'access-token',
          expiresIn: 1,
          scope: 'https://www.googleapis.com/auth/drive.appdata'
        }
      } as MessageEvent);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        {
          accessToken: 'access-token',
          expiresAt: expect.any(Number)
        },
        undefined,
        undefined,
        expect.any(Object)
      );
    });
  });

  it('rejects google drive connect from an auth error message', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000'
    );
    const channel = createBroadcastChannel();
    vi.spyOn(window, 'open').mockReturnValue({} as Window);

    const onError = vi.fn();
    const { result } = renderHookWithContext(() =>
      useConnectGoogleDrive({ onError })
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(channel.onmessage).toEqual(expect.any(Function));
    });

    act(() => {
      channel.onmessage?.({
        data: {
          type: 'error',
          state: '00000000-0000-4000-8000-000000000000',
          error: 'access_denied'
        }
      } as MessageEvent);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        new Error('access_denied'),
        undefined,
        undefined,
        expect.any(Object)
      );
    });
    expect(channel.close).toHaveBeenCalledOnce();
  });

  it('rejects google drive connect when authorization times out', async () => {
    vi.useFakeTimers();

    const channel = createBroadcastChannel();
    vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const onError = vi.fn();

    const { result } = renderHookWithContext(() =>
      useConnectGoogleDrive({ onError })
    );

    await act(async () => {
      result.current.mutate();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(channel.onmessage).toEqual(expect.any(Function));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(onError).toHaveBeenCalledWith(
      new Error('Google Drive authorization timed out'),
      undefined,
      undefined,
      expect.any(Object)
    );
    expect(channel.close).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('rejects google drive connect when Drive app data scope is missing', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000'
    );
    const channel = createBroadcastChannel();
    vi.spyOn(window, 'open').mockReturnValue({} as Window);

    const onError = vi.fn();
    const { result } = renderHookWithContext(() =>
      useConnectGoogleDrive({ onError })
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(channel.onmessage).toEqual(expect.any(Function));
    });

    act(() => {
      channel.onmessage?.({
        data: {
          type: 'success',
          state: '00000000-0000-4000-8000-000000000000',
          accessToken: 'access-token',
          expiresIn: 1,
          scope: 'profile'
        }
      } as MessageEvent);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        new Error('Google Drive authorization did not grant app data access'),
        undefined,
        undefined,
        expect.any(Object)
      );
    });
  });
});
