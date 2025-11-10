import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export const refreshAccessTokenQueryKey = ['refreshAccessToken'];

export const useRefreshAccessToken = (
  options?: Omit<UseQueryOptions<string, Error>, 'queryKey'>
) => {
  const apiLocation = import.meta.env.VITE_GBA_SERVER_LOCATION;

  return useQuery<string, Error>({
    queryKey: [refreshAccessTokenQueryKey, apiLocation],
    queryFn: async () => {
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
    refetchOnWindowFocus: false,
    ...options
  });
};
