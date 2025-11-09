import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useRefreshAccessToken = () => {
  const apiLocation = import.meta.env.VITE_GBA_SERVER_LOCATION;

  const refresh = useCallback(async () => {
    const url = `${apiLocation}/api/tokens/refresh`;
    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };

    const res = await fetch(url, options);

    if (res.status === 401) return null;

    return res.json();
  }, [apiLocation]);

  return useMutation<string | null, Error, void>({
    mutationKey: ['refreshAccessToken'],
    mutationFn: async () => refresh()
  });
};
