import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { useState, useEffect, type ReactNode } from 'react';

import {
  AuthContext,
  type AuthContextProps,
  type AccessTokenSource
} from './auth-context.tsx';
import {
  refreshAccessTokenQueryKey,
  useRefreshAccessToken
} from '../../hooks/use-refresh.tsx';

type AuthProviderProps = { children: ReactNode };

const fourMinutesInMS = 240 * 1000;

const isAuthenticated = (accessToken?: string) => {
  if (accessToken) {
    const { exp } = jwtDecode<JwtPayload>(accessToken);

    if (exp && Date.now() <= exp * 1000) {
      return true;
    }
  }

  return false;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [accessToken, setAccessToken] =
    useState<AuthContextProps['accessToken']>();
  const [accessTokenSource, setAccessTokenSource] =
    useState<AccessTokenSource>(null);
  const queryClient = useQueryClient();
  const { data: accessTokenResp, status: refreshStatus } =
    useRefreshAccessToken({
      refetchInterval: (query) => {
        const lastToken = query.state.data;
        const hasError = !!query.state.error;
        const shouldRefresh = isAuthenticated(lastToken) && !hasError;

        return shouldRefresh ? fourMinutesInMS : false;
      },
      retry: 0
    });

  // consider loading if the query status isn't success or error
  const refreshLoading =
    refreshStatus !== 'success' && refreshStatus !== 'error';
  const shouldSetAccessToken = !refreshLoading && !!accessTokenResp;

  // assign token to context
  useEffect(() => {
    if (shouldSetAccessToken) {
      setAccessToken(accessTokenResp);
      setAccessTokenSource('refresh');
    }
  }, [shouldSetAccessToken, accessTokenResp]);

  const shouldClearRefreshTokenError =
    isAuthenticated(accessToken) &&
    !accessTokenResp &&
    accessTokenSource !== 'refresh';

  useEffect(() => {
    // if access token has changed from login, clear refresh errors.
    // resume attempts to periodically refresh the token
    if (shouldClearRefreshTokenError)
      queryClient.resetQueries({
        queryKey: [refreshAccessTokenQueryKey]
      });
  }, [shouldClearRefreshTokenError, queryClient]);

  const isCurrentlyAuthenticated = isAuthenticated(accessToken);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        setAccessTokenSource,
        isAuthenticated: isCurrentlyAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
