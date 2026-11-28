import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ContextType, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { InitialBoundsProvider } from './initial-bounds-provider.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import { LayoutContext } from '../layout/layout-context.tsx';

import type { LayoutType } from '../layout/layout-context.tsx';

type LayoutContextValue = NonNullable<ContextType<typeof LayoutContext>>;

const LayoutTypeProvider = ({ children }: { children: ReactNode }) => {
  const [layoutType, setLayoutType] = useState<LayoutType>('portrait');
  const value: LayoutContextValue = {
    layouts: {},
    layoutType,
    getLayout: () => undefined,
    clearLayouts: () => {
      /* empty */
    },
    setLayout: () => {
      /* empty */
    },
    setLayouts: () => {
      /* empty */
    }
  };

  return (
    <LayoutContext.Provider value={value}>
      <button
        onClick={() => {
          setLayoutType('portrait');
        }}
      >
        Portrait
      </button>
      <button
        onClick={() => {
          setLayoutType('landscape');
        }}
      >
        Landscape
      </button>
      {children}
    </LayoutContext.Provider>
  );
};

describe('<InitialBoundsProvider />', () => {
  const BoundsConsumer = () => {
    const { initialBounds, setInitialBound } =
      contextHooks.useInitialBoundsContext();

    return (
      <>
        <button
          onClick={() => {
            setInitialBound('screen', new DOMRect(10, 20, 30, 40));
          }}
        >
          Capture portrait bounds
        </button>
        <button
          onClick={() => {
            setInitialBound('screen', new DOMRect(50, 60, 70, 80));
          }}
        >
          Capture landscape bounds
        </button>
        <output>{initialBounds?.screen?.x ?? 'unavailable'}</output>
      </>
    );
  };

  it('keeps bounds isolated by layout mode', () => {
    render(
      <LayoutTypeProvider>
        <InitialBoundsProvider>
          <BoundsConsumer />
        </InitialBoundsProvider>
      </LayoutTypeProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Capture portrait bounds' })
    );
    expect(screen.getByRole('status')).toHaveTextContent('10');

    fireEvent.click(screen.getByRole('button', { name: 'Landscape' }));
    expect(screen.getByRole('status')).toHaveTextContent('unavailable');

    fireEvent.click(
      screen.getByRole('button', { name: 'Capture landscape bounds' })
    );
    expect(screen.getByRole('status')).toHaveTextContent('50');

    fireEvent.click(screen.getByRole('button', { name: 'Portrait' }));
    expect(screen.getByRole('status')).toHaveTextContent('10');
  });
});
