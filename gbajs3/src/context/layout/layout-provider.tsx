import {
  useLocalStorage,
  useMediaQuery,
  useOrientation
} from '@uidotdev/usehooks';
import { useCallback, type ReactNode } from 'react';
import { useTheme } from 'styled-components';

import { LayoutContext } from './layout-context.tsx';

import type { Layout, Layouts } from './layout-context.tsx';

type LayoutProviderProps = { children: ReactNode };

const layoutLocalStorageKey = 'componentLayouts';

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [layouts, setLayouts] = useLocalStorage<Layouts>(
    layoutLocalStorageKey,
    {}
  );
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const orientation = useOrientation();

  const clearLayouts = useCallback(() => setLayouts({}), [setLayouts]);

  const setLayout = useCallback(
    (layoutKey: string, layout: Layout) =>
      setLayouts((prevState) => {
        const existingLayouts =
          prevState[layoutKey]?.filter(
            (l) =>
              !(
                l.orientation === orientation.type &&
                l.isLargerThanPhone === isLargerThanPhone
              )
          ) ?? [];

        const matchingLayout = prevState[layoutKey]?.find(
          (l) =>
            l.orientation === orientation.type &&
            l.isLargerThanPhone === isLargerThanPhone
        );

        return {
          ...prevState,
          [layoutKey]: [
            ...existingLayouts,
            {
              ...matchingLayout,
              ...layout,
              orientation: orientation.type,
              isLargerThanPhone: isLargerThanPhone
            }
          ]
        };
      }),
    [setLayouts, orientation.type, isLargerThanPhone]
  );

  const getLayout = useCallback(
    (layoutKey: string) =>
      layouts?.[layoutKey]?.find(
        (layout) =>
          layout.orientation === orientation.type &&
          layout.isLargerThanPhone === isLargerThanPhone
      ),
    [layouts, isLargerThanPhone, orientation.type]
  );

  return (
    <LayoutContext.Provider
      value={{
        layouts,
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
