import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { AuthProvider } from '../src/context/auth/auth.tsx';
import { EmulatorProvider } from '../src/context/emulator/emulator.tsx';
import { ModalProvider } from '../src/context/modal/modal.tsx';
import { GbaDarkTheme } from '../src/context/theme/theme.tsx';

import type { ReactNode } from 'react';

export const renderWithContext = (testNode: ReactNode) => {
  return render(
    <ThemeProvider theme={GbaDarkTheme}>
      <AuthProvider>
        <EmulatorProvider>
          <ModalProvider>{testNode}</ModalProvider>
        </EmulatorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
