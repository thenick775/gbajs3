import { useTheme } from '@emotion/react';
import { Toaster } from 'react-hot-toast';

export const ToasterWithDefaults = () => {
  const theme = useTheme();

  return (
    <Toaster
      toastOptions={{
        success: {
          duration: 1000
        },
        error: {
          duration: 1500
        },
        style: {
          background: theme.darkCharcoal,
          color: theme.pureWhite
        }
      }}
    />
  );
};
