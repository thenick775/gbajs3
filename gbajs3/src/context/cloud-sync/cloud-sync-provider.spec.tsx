import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHookWithContext } from '../../../test/render-hook-with-context.tsx';
import { useCloudSyncContext } from '../../hooks/context.tsx';

describe('<CloudSyncProvider />', () => {
  it('exposes an unexpired google drive access token', () => {
    vi.setSystemTime(Date.UTC(2025, 0, 1, 0, 0, 0));

    const { result } = renderHookWithContext(() => useCloudSyncContext());

    act(() => {
      result.current.setGoogleDriveToken({
        accessToken: 'test-token',
        expiresAt: Date.now() + 30_000
      });
    });

    expect(result.current.googleDriveAccessToken).toBe('test-token');
  });

  it('does not expose an expired google drive access token', () => {
    vi.setSystemTime(Date.UTC(2025, 0, 1, 0, 0, 0));

    const { result } = renderHookWithContext(() => useCloudSyncContext());

    act(() => {
      result.current.setGoogleDriveToken({
        accessToken: 'test-token',
        expiresAt: Date.now()
      });
    });

    expect(result.current.googleDriveAccessToken).toBeNull();
  });
});
