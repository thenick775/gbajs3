import { createContext } from 'react';

export type MemoryToken = {
  accessToken: string;
  expiresAt: number;
};

export type CloudSyncContextProps = {
  googleDriveToken: MemoryToken | null;
  setGoogleDriveToken: (token: MemoryToken | null) => void;
  clearGoogleDriveToken: () => void;
  getGoogleDriveAccessToken: (token?: MemoryToken | null) => string | null;
  isGoogleDriveConnected: () => boolean;
};

export const CloudSyncContext = createContext<CloudSyncContextProps | null>(
  null
);

CloudSyncContext.displayName = 'CloudSyncContext';
