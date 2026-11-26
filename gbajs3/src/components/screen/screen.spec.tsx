import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Screen } from './screen.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import { GbaDarkTheme } from '../../context/theme/theme.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import { NavigationMenuWidth } from '../navigation-menu/consts.tsx';

vi.mock('../../hooks/use-emulator.tsx', () => ({
  useEmulator: () => null
}));

describe('<Screen />', () => {
  const initialPos = {
    clientX: 0,
    clientY: 0
  };
  const movements = [
    { clientX: 200, clientY: 220 },
    { clientX: 150, clientY: 120 }
  ];

  it('sets context canvas when rendered', async () => {
    const setCanvasSpy = vi.fn();
    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      setCanvas: setCanvasSpy
    }));

    renderWithContext(<Screen />);

    const canvas = screen.getByTestId('screen-wrapper:render-canvas');

    expect(setCanvasSpy).toHaveBeenCalledExactlyOnceWith(canvas);
  });

  it('renders a loading indicator while canvas exists and emulator is unavailable', async () => {
    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: null,
      canvas: {} as HTMLCanvasElement
    }));

    renderWithContext(<Screen />);

    expect(screen.getByLabelText('Emulator loading')).toBeInTheDocument();
  });

  it('sets initial bounds when rendered', async () => {
    const setInitialBoundSpy = vi.fn();

    const { useInitialBoundsContext: originalBounds } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useInitialBoundsContext').mockImplementation(
      () => ({
        ...originalBounds(),
        setInitialBound: setInitialBoundSpy
      })
    );

    renderWithContext(<Screen />);

    expect(setInitialBoundSpy).toHaveBeenCalledExactlyOnceWith('screen', {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0
    });
  });

  it('renders with default mobile position and size', () => {
    renderWithContext(<Screen />);

    const screenWrapper = screen.getByTestId('screen-wrapper');

    expect(screenWrapper).toHaveStyle({
      width: '739px',
      height: '652.8px',
      transform: `translate(0px,0px)`
    });
    expect(screenWrapper).toMatchSnapshot();
  });

  it('renders with default desktop position and size', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === GbaDarkTheme.isLargerThanPhone,
      media: '',
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- required by the MediaQueryList test double type
      addListener: () => {
        /* empty */
      },
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- required by the MediaQueryList test double type
      removeListener: () => {
        /* empty */
      },
      onchange: () => {
        /* empty */
      },
      addEventListener: () => {
        /* empty */
      },
      removeEventListener: () => {
        /* empty */
      },
      dispatchEvent: () => true
    }));

    renderWithContext(<Screen />);

    const screenWrapper = screen.getByTestId('screen-wrapper');

    expect(screenWrapper).toHaveStyle({
      height: '652.8px',
      // See: https://github.com/bokuweb/react-rnd/issues/846, in jsdom react-rnd is rendering with
      // 2x transform values after the first render in test only, actual browser render is correct
      transform: `translate(${(NavigationMenuWidth + 10) * 2}px,${15 * 2}px)`
    });

    expect(screenWrapper).toMatchSnapshot();
  });

  it('renders mobile landscape with a centered top-left position', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === GbaDarkTheme.isMobileLandscape,
      media: '',
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- required by the MediaQueryList test double type
      addListener: () => {
        /* empty */
      },
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- required by the MediaQueryList test double type
      removeListener: () => {
        /* empty */
      },
      onchange: () => {
        /* empty */
      },
      addEventListener: () => {
        /* empty */
      },
      removeEventListener: () => {
        /* empty */
      },
      dispatchEvent: () => true
    }));
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
      844
    );
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(
      390
    );

    renderWithContext(<Screen />);

    expect(screen.getByTestId('screen-wrapper')).toHaveStyle({
      // See the desktop-position test: jsdom renders react-rnd transforms at 2x.
      transform: 'translate(258px,0px)'
    });
  });

  it('sets layout on drag', async () => {
    const setLayoutSpy = vi.fn();
    const { useLayoutContext: originalLayout, useDragContext: originalDrag } =
      await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useDragContext').mockImplementation(() => ({
      ...originalDrag(),
      areItemsDraggable: true
    }));

    vi.spyOn(contextHooks, 'useLayoutContext').mockImplementation(() => ({
      ...originalLayout(),
      setLayout: setLayoutSpy
    }));

    renderWithContext(<Screen />);

    // simulate mouse events on wrapper
    fireEvent.mouseDown(screen.getByTestId('screen-wrapper'), initialPos);
    fireEvent.mouseMove(document, movements[0]);

    expect(setLayoutSpy).toHaveBeenCalledExactlyOnceWith('screen', {
      originalBounds: {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0
      }
    });

    fireEvent.mouseUp(document, movements[1]);

    expect(setLayoutSpy).toHaveBeenCalledTimes(2);
    expect(setLayoutSpy).toHaveBeenCalledWith('screen', {
      position: {
        x: movements[1].clientX,
        y: movements[1].clientY
      }
    });
  });

  it('sets layout on resize', async () => {
    const setLayoutSpy = vi.fn();
    const {
      useLayoutContext: originalLayout,
      useResizeContext: originalResize
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useResizeContext').mockImplementation(() => ({
      ...originalResize(),
      areItemsResizable: true
    }));

    vi.spyOn(contextHooks, 'useLayoutContext').mockImplementation(() => ({
      ...originalLayout(),
      setLayout: setLayoutSpy
    }));

    renderWithContext(<Screen />);

    expect(screen.getAllByTestId('gripper-handle')).toHaveLength(4);

    // simulate mouse events on a resize handle
    fireEvent.mouseDown(screen.getAllByTestId('gripper-handle')[0], initialPos);
    fireEvent.mouseMove(document, movements[0]);

    expect(setLayoutSpy).toHaveBeenCalledExactlyOnceWith('screen', {
      originalBounds: {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0
      }
    });

    fireEvent.mouseUp(document, movements[1]);

    expect(setLayoutSpy).toHaveBeenCalledTimes(2);
    expect(setLayoutSpy).toHaveBeenCalledWith('screen', {
      position: {
        x: expect.anything(),
        y: expect.anything()
      },
      size: {
        height: expect.anything(),
        width: expect.anything()
      }
    });
  });
});
