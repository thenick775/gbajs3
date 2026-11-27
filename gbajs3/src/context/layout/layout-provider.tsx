import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useCallback, type ReactNode } from 'react';

import { LayoutContext } from './layout-context.tsx';

import type { Layout, LayoutType, Layouts } from './layout-context.tsx';

type LayoutProviderProps = {
  children: ReactNode;
};

const layoutLocalStorageKey = 'componentLayoutsV2';

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [layouts, setLayouts] = useLocalStorage<Layouts>(
    layoutLocalStorageKey,
    {}
  );
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const isMobileLandscape = useMediaQuery(theme.isMobileLandscape);

  const clearLayouts = useCallback(() => {
    setLayouts({});
  }, [setLayouts]);

  const layoutType: LayoutType =
    isLargerThanPhone && !isMobileLandscape
      ? 'desktop'
      : isMobileLandscape
        ? 'landscape'
        : 'portrait';

  const setLayout = useCallback(
    (layoutKey: string, layout: Layout) => {
      setLayouts((prevState) => {
        return {
          ...prevState,
          [layoutKey]: {
            ...prevState[layoutKey],
            [layoutType]: {
              ...prevState[layoutKey]?.[layoutType],
              ...layout
            }
          }
        };
      });
    },
    [setLayouts, layoutType]
  );

  const getLayout = useCallback(
    (layoutKey: string) => layouts[layoutKey]?.[layoutType],
    [layouts, layoutType]
  );

  return (
    <LayoutContext.Provider
      value={{
        layouts,
        layoutType,
        getLayout,
        clearLayouts,
        setLayout,
        setLayouts
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
