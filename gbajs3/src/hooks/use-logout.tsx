import { useMutation } from '@tanstack/react-query';

import { useAuthContext } from './context.tsx';

export const useLogout = () => {
  const apiLocation = import.meta.env.VITE_GBA_SERVER_LOCATION;
  const { accessToken, setAccessToken } = useAuthContext();

  return useMutation({
    mutationKey: ['logout', accessToken],
    mutationFn: async () => {
      const url = `${apiLocation}/api/account/logout`;
      const options: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include'
      };

      await fetch(url, options).then(() => setAccessToken(null));
    }
  });
};
