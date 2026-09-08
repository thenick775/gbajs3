import { useState, type ReactNode } from 'react';

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
  const [googleDriveToken, setGoogleDriveToken] = useState<MemoryToken | null>(
    null
  );
  const googleDriveAccessToken =
    getValidGoogleDriveToken(googleDriveToken)?.accessToken ?? null;

  return (
    <CloudSyncContext.Provider
      value={{
        googleDriveAccessToken,
        setGoogleDriveToken,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
};
