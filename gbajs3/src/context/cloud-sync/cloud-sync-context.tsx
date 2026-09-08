import { createContext } from 'react';

export type MemoryToken = {
  accessToken: string;
  expiresAt: number;
};

export type CloudSyncContextProps = {
  googleDriveAccessToken: string | null;
  setGoogleDriveToken: (token: MemoryToken) => void;
};

export const CloudSyncContext = createContext<CloudSyncContextProps | null>(
  null
);

CloudSyncContext.displayName = 'CloudSyncContext';
