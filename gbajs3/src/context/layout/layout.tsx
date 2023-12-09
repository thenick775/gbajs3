import { createContext, useCallback, useMemo, type ReactNode } from 'react';

import { useLocalStorage } from '../../hooks/use-local-storage.tsx';

type Layout = {
  position: { x: number; y: number };
  size?: { width: string | number; height: string | number };
};

type Layouts = {
  [key: string]: Layout;
};

type LayoutContextProps = {
  layouts: Layouts;
  hasSetLayout: boolean;
  clearLayouts: () => void;
  setLayout: (layoutKey: string, layout: Layout) => void;
};

type LayoutProviderProps = { children: ReactNode };

const layoutLocalStorageKey = 'componentLayouts';

export const LayoutContext = createContext<LayoutContextProps>({
  layouts: {},
  hasSetLayout: false,
  clearLayouts: () => undefined,
  setLayout: () => undefined
});

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [layouts, setLayouts] = useLocalStorage<Layouts>(
    layoutLocalStorageKey,
    {}
  );
  const hasSetLayout = useMemo(() => !!Object.keys(layouts).length, [layouts]);

  const clearLayouts = useCallback(() => setLayouts({}), [setLayouts]);

  const setLayout = useCallback(
    (layoutKey: string, layout: Layout) =>
      setLayouts((prevState) => {
        console.log('vancise prevstate', prevState, layoutKey, layout);
        return {
          ...prevState,
          [layoutKey]: { ...prevState?.[layoutKey], ...layout }
        };
      }),
    [setLayouts]
  );

  return (
    <LayoutContext.Provider
      value={{
        layouts,
        hasSetLayout,
        clearLayouts,
        setLayout
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
