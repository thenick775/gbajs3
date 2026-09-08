import { useCallback, useState, type ReactNode } from 'react';

import { CloudSyncContext } from './cloud-sync-context.tsx';

import type { MemoryToken } from './cloud-sync-context.tsx';

type CloudSyncProviderProps = {
  children: ReactNode;
};

const tokenExpirySkewMs = 60_000;

const getValidGoogleDriveToken = (token: MemoryToken | null) => {
  if (!token) return null;
  if (Date.now() >= token.expiresAt - tokenExpirySkewMs) return null;

  return token;
};

export const CloudSyncProvider = ({ children }: CloudSyncProviderProps) => {
  const [googleDriveToken, setGoogleDriveToken] =
    useState<MemoryToken | null>(null);

  const clearGoogleDriveToken = useCallback(() => {
    setGoogleDriveToken(null);
  }, []);

  const getGoogleDriveAccessToken = useCallback(
    (token = googleDriveToken) => {
      const validToken = getValidGoogleDriveToken(token);
      if (!validToken) {
        setGoogleDriveToken(null);
        return null;
      }

      return validToken.accessToken;
    },
    [googleDriveToken]
  );

  const isGoogleDriveConnected = useCallback(
    () => !!getValidGoogleDriveToken(googleDriveToken),
    [googleDriveToken]
  );

  return (
    <CloudSyncContext.Provider
      value={{
        googleDriveToken,
        setGoogleDriveToken,
        clearGoogleDriveToken,
        getGoogleDriveAccessToken,
        isGoogleDriveConnected
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
};
