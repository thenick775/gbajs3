import { useLocalStorage } from '@uidotdev/usehooks';
import { createContext, useCallback, useMemo, type ReactNode } from 'react';

type Layout = {
  position?: { x: number; y: number };
  size?: { width: string | number; height: string | number };
  uncontrolledBounds?: DOMRect;
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
  const hasSetLayout = useMemo(
    () =>
      !!Object.keys(layouts).some(
        (key) => !!layouts[key]?.position || !!layouts[key]?.size
      ),
    [layouts]
  );

  const clearLayouts = useCallback(() => setLayouts({}), [setLayouts]);

  const setLayout = useCallback(
    (layoutKey: string, layout: Layout) =>
      setLayouts((prevState) => {
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
