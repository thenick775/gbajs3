import { styled } from '@mui/material/styles';
import {
  useRef,
  type ReactNode,
  type KeyboardEvent,
  type PointerEventHandler
} from 'react';
import Draggable from 'react-draggable';

import {
  useDragContext,
  useEmulatorContext,
  useLayoutContext
} from '../../hooks/context.tsx';
import { ButtonBase } from '../shared/custom-button-base.tsx';

type VirtualButtonProps = {
  isRectangular?: boolean;
  width?: number;
  children: ReactNode;
  inputName: string;
  keyId?: string;
  initialPosition?: {
    top: string;
    left: string;
  };
  initialOffset?: {
    x: string | number;
    y: string | number;
  };
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  ariaLabel: string;
};

type CircularButtonProps = {
  $diameter: number;
  $initialPosition?: { top: string; left: string };
  $areItemsDraggable?: boolean;
};

type RectangularButtonProps = {
  $initialPosition?: { top: string; left: string };
  $areItemsDraggable?: boolean;
};

const VirtualButtonBase = styled(ButtonBase)`
  background: ${({ theme }) => theme.virtualControlSurface};
  border-style: solid;
  border-color: ${({ theme }) => theme.virtualControlBorderSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  cursor: pointer;
  box-sizing: content-box;
  border-width: 2px;
  color: ${({ theme }) => theme.surfaceTextPrimary};
  backdrop-filter: blur(6px);
  overflow: hidden;
  isolation: isolate;
  box-shadow: ${({ theme }) => theme.virtualControlShadow};

  & > * {
    position: relative;
    z-index: 1;
  }

  &:not(:disabled):active {
    transform: translateY(1px) scale(0.98);
    border-color: ${({ theme }) => theme.virtualControlAccentBorder};
    box-shadow: ${({ theme }) => theme.virtualControlPressedShadow};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media ${({ theme }) => theme.isMobileLandscape} {
    background-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }
`;

const CircularButton = styled(VirtualButtonBase, {
  shouldForwardProp: (propName) => propName !== '$areItemsDraggable'
})<CircularButtonProps>`
  width: ${({ $diameter }) => $diameter}px;
  height: ${({ $diameter }) => $diameter}px;
  border-radius: 100px;
  border-color: ${({ $areItemsDraggable = false, theme }) =>
    $areItemsDraggable ? theme.gbaThemeBlue : theme.virtualControlBorderSubtle};
  border-style: ${({ $areItemsDraggable = false }) =>
    $areItemsDraggable ? 'dashed' : 'solid'};
  &::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: inherit;
    border: 1px solid ${({ theme }) => theme.virtualControlInnerBorder};
    background: rgba(4, 7, 12, 0.22);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.015);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: inherit;
    background: ${({ $areItemsDraggable = false, theme }) =>
      $areItemsDraggable
        ? theme.virtualControlSurfaceStrong
        : theme.virtualControlButtonSurface};
    box-shadow:
      inset 0 3px 8px rgba(0, 0, 0, 0.42),
      inset 0 -1px 0 rgba(255, 255, 255, 0.03),
      0 1px 0 rgba(255, 255, 255, 0.02);
    pointer-events: none;
  }

  &:not(:disabled):active {
    &::after {
      box-shadow:
        inset 0 4px 10px rgba(0, 0, 0, 0.48),
        inset 0 -1px 0 rgba(255, 255, 255, 0.02),
        0 1px 0 rgba(255, 255, 255, 0.015);
    }
  }
`;

const RectangularButton = styled(VirtualButtonBase, {
  shouldForwardProp: (propName) => propName !== '$areItemsDraggable'
})<RectangularButtonProps>`
  border-radius: 999px;
  width: fit-content;
  height: 34px;
  min-width: 85px;
  padding-inline: 0.65rem;
  border-color: ${({ $areItemsDraggable = false, theme }) =>
    $areItemsDraggable ? theme.gbaThemeBlue : theme.virtualControlBorderSubtle};
  border-style: ${({ $areItemsDraggable = false }) =>
    $areItemsDraggable ? 'dashed' : 'solid'};
  &::before {
    content: '';
    position: absolute;
    inset: 4px 6px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.virtualControlInnerBorder};
    background: rgba(4, 7, 12, 0.18);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.015);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 7px 10px;
    border-radius: 999px;
    background: ${({ $areItemsDraggable = false, theme }) =>
      $areItemsDraggable
        ? theme.virtualControlSurfaceStrong
        : theme.virtualControlButtonSurfacePill};
    box-shadow:
      inset 0 2px 6px rgba(0, 0, 0, 0.3),
      inset 0 -1px 0 rgba(255, 255, 255, 0.03),
      0 1px 0 rgba(255, 255, 255, 0.015);
    pointer-events: none;
  }

  &:not(:disabled):active {
    &::after {
      box-shadow:
        inset 0 3px 7px rgba(0, 0, 0, 0.34),
        inset 0 -1px 0 rgba(255, 255, 255, 0.02),
        0 1px 0 rgba(255, 255, 255, 0.01);
    }
  }
`;

export const VirtualButton = ({
  isRectangular = false,
  width = 60,
  children,
  keyId,
  inputName,
  onPointerDown,
  initialPosition,
  initialOffset,
  disabled = false,
  ariaLabel
}: VirtualButtonProps) => {
  const { emulator } = useEmulatorContext();
  const { areItemsDraggable } = useDragContext();
  const { getLayout, setLayout } = useLayoutContext();
  const dragRef = useRef<HTMLButtonElement | null>(null);

  // used for "virtual controls" that go direct to the emulator and have a keyId
  const emulatorPointerEvents =
    keyId && !areItemsDraggable && !disabled
      ? {
          onPointerDown: () => {
            emulator?.simulateKeyDown(keyId);
          },
          onPointerUp: () => {
            emulator?.simulateKeyUp(keyId);
          },
          onPointerLeave: () => {
            emulator?.simulateKeyUp(keyId);
          },
          onPointerOut: () => {
            emulator?.simulateKeyUp(keyId);
          },
          onPointerCancel: () => {
            emulator?.simulateKeyUp(keyId);
          }
        }
      : undefined;

  // due to using pointer events for the buttons without a click handler,
  // we need to manage key events ourselves for buttons with an emulator keyId
  const keyboardEvents =
    keyId && !disabled
      ? {
          onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.code === 'Space' || e.key === ' ')
              emulator?.simulateKeyDown(keyId);
          },
          onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.code === 'Space' || e.key === ' ')
              emulator?.simulateKeyUp(keyId);
          }
        }
      : undefined;

  const layout = getLayout(inputName);
  const position = layout?.position ?? { x: 0, y: 0 };

  const commonProps = {
    ref: dragRef,
    $initialPosition: initialPosition,
    $areItemsDraggable: areItemsDraggable,
    'aria-label': ariaLabel,
    disabled,
    // used for "virtual controls" that don't interface with the emulator
    onPointerDown: !areItemsDraggable && !disabled ? onPointerDown : undefined,
    style: {
      top: initialPosition?.top ?? '0',
      left: initialPosition?.left ?? '0'
    },
    ...emulatorPointerEvents,
    ...keyboardEvents
  };

  return (
    <Draggable
      nodeRef={dragRef}
      positionOffset={initialOffset}
      position={position}
      disabled={!areItemsDraggable}
      onStop={(_, data) => {
        setLayout(inputName, { position: { x: data.x, y: data.y } });
      }}
    >
      {isRectangular ? (
        <RectangularButton {...commonProps}>{children}</RectangularButton>
      ) : (
        <CircularButton {...commonProps} $diameter={width}>
          {children}
        </CircularButton>
      )}
    </Draggable>
  );
};
