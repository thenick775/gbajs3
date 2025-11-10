import { createContext } from 'react';

import type { Dispatch, SetStateAction } from 'react';

export type AccessTokenSource = 'refresh' | 'login' | null;

export type AuthContextProps = {
  accessToken?: string;
  setAccessToken: Dispatch<SetStateAction<string | undefined>>;
  setAccessTokenSource: Dispatch<SetStateAction<AccessTokenSource | null>>;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextProps | null>(null);

AuthContext.displayName = 'AuthContext';
