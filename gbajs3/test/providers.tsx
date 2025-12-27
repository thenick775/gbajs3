import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme
} from '@mui/material/styles';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { AuthProvider } from '../src/context/auth/auth-provider.tsx';
import { EmulatorContextProvider } from '../src/context/emulator/emulator-context-provider.tsx';
import { InitialBoundsProvider } from '../src/context/initial-bounds/initial-bounds-provider.tsx';
import { LayoutProvider } from '../src/context/layout/layout-provider.tsx';
import { ModalProvider } from '../src/context/modal/modal-provider.tsx';
import { GbaDarkTheme } from '../src/context/theme/theme.tsx';

import type { ReactNode } from 'react';

const queryClient = new QueryClient();

const muiTheme = createTheme({
  palette: { mode: 'dark', primary: { main: GbaDarkTheme.gbaThemeBlue } }
});

export const AllTheProviders = ({ children }: { children: ReactNode }) => (
  <MuiThemeProvider theme={muiTheme}>
    <EmotionThemeProvider theme={GbaDarkTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EmulatorContextProvider>
            <InitialBoundsProvider>
              <LayoutProvider>
                <ModalProvider>{children}</ModalProvider>
              </LayoutProvider>
            </InitialBoundsProvider>
          </EmulatorContextProvider>
        </AuthProvider>
      </QueryClientProvider>
    </EmotionThemeProvider>
  </MuiThemeProvider>
);
