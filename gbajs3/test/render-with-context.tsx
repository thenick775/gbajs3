import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { GbaDarkTheme } from '../src/context/theme/theme.js';
import { ReactNode } from 'react';

export const renderWithContext = (testNode: ReactNode) => {
  return render(<ThemeProvider theme={GbaDarkTheme}>{testNode}</ThemeProvider>);
};
