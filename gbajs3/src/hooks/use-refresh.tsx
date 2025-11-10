import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export const useRefreshAccessToken = (
  options?: UseMutationOptions<string, Error, void>
) => {
  const apiLocation = import.meta.env.VITE_GBA_SERVER_LOCATION;

  return useMutation<string, Error, void>({
    mutationKey: ['refreshAccessToken'],
    mutationFn: async () => {
      const url = `${apiLocation}/api/tokens/refresh`;
      const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      };

      const res = await fetch(url, options);

      if (!res.ok) {
        throw new Error(`Received unexpected status code: ${res.status}`);
      }

      return res.json();
    },
    ...options
  });
};
