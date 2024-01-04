import { useCallback } from 'react';

import { useAuthContext } from './context.tsx';
import { useAsyncData } from './use-async-data.tsx';

type LoadRomProps = {
  romName: string;
};

export const useLoadRom = () => {
  const apiLocation: string = import.meta.env.VITE_GBA_SERVER_LOCATION;
  const { accessToken } = useAuthContext();

  const executeLoadRom = useCallback(
    async (fetchProps?: LoadRomProps) => {
      const url = `${apiLocation}/api/rom/download?rom=${
        fetchProps?.romName ?? ''
      }`;
      const options: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      };

      const res = await fetch(url, options);
      const blob = await res.blob();
      const file = new File([blob], fetchProps?.romName ?? '');

      return file;
    },
    [apiLocation, accessToken]
  );

  const { data, isLoading, error, execute } = useAsyncData({
    fetchFn: executeLoadRom,
    clearDataOnLoad: true
  });

  return { data, isLoading, error, execute };
};
