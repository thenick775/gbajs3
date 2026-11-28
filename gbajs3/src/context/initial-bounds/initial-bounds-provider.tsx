import { useCallback, useState, type ReactNode } from 'react';

import { InitialBoundsContext } from './initial-bounds-context.tsx';
import { useLayoutContext } from '../../hooks/context.tsx';

import type { InitialBounds } from './initial-bounds-context.tsx';
import type { LayoutType } from '../layout/layout-context.tsx';

type InitialBoundsProviderProps = {
  children: ReactNode;
};

export const InitialBoundsProvider = ({
  children
}: InitialBoundsProviderProps) => {
  const [initialBoundsByMode, setInitialBoundsByMode] = useState<
    Partial<Record<LayoutType, InitialBounds>>
  >({});
  const { layoutType } = useLayoutContext();

  const setInitialBound = useCallback(
    (key: string, bounds?: DOMRect) => {
      setInitialBoundsByMode((prevState) => ({
        ...prevState,
        [layoutType]: { ...prevState[layoutType], [key]: bounds }
      }));
    },
    [layoutType]
  );

  const clearInitialBounds = useCallback(() => {
    setInitialBoundsByMode({});
  }, []);

  return (
    <InitialBoundsContext.Provider
      value={{
        initialBounds: initialBoundsByMode[layoutType],
        setInitialBound,
        clearInitialBounds
      }}
    >
      {children}
    </InitialBoundsContext.Provider>
  );
};
