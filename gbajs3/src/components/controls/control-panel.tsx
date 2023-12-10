import { Slider, useMediaQuery } from '@mui/material';
import {
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode
} from 'react';
import { IconContext } from 'react-icons';
import { AiOutlineFastForward, AiOutlineForward } from 'react-icons/ai';
import {
  BiPlay,
  BiUndo,
  BiVolumeFull,
  BiMove,
  BiVolumeMute,
  BiPause
} from 'react-icons/bi';
import { TbResize } from 'react-icons/tb';
import { Rnd } from 'react-rnd';
import { css, styled, useTheme } from 'styled-components';

import { emulatorVolumeLocalStorageKey } from '../../context/emulator/consts.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { LayoutContext } from '../../context/layout/layout.tsx';
import { useLocalStorage } from '../../hooks/use-local-storage.tsx';
import {
  EmbeddedProductTour,
  type TourSteps
} from '../product-tour/embedded-product-tour.tsx';
import { ButtonBase } from '../shared/custom-button-base.tsx';
import { GripperHandle } from '../shared/gripper-handle.tsx';

type PanelControlProps = {
  $onClick?: () => void;
  $shouldGrow?: boolean;
  ariaLabel: string;
  children: ReactNode;
  id: string;
};

type PanelControlButtonProps = {
  $shouldGrow?: boolean;
};

const Panel = styled.ul`
  background-color: ${({ theme }) => theme.panelBlueGray};
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-evenly;
  gap: 10px;
  padding: 10px;
  margin: 0;
  max-width: 100%;
`;

const PanelControlWrapper = styled.li`
  display: contents;
`;

const InteractivePanelControlStyle = css`
  cursor: pointer;
  background-color: ${({ theme }) => theme.panelControlGray};
  border-radius: 0.25rem;
  min-width: 40px;
  min-height: 40px;
  width: fit-content;
  height: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.pureBlack};

  &:focus {
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  &:active {
    color: ${({ theme }) => theme.gbaThemeBlue};
  }
`;

const PanelControlButton = styled(ButtonBase).attrs({
  className: 'noDrag'
})<PanelControlButtonProps>`
  ${InteractivePanelControlStyle}

  border: none;
  flex-grow: ${({ $shouldGrow = false }) => ($shouldGrow ? 1 : 0)};
  margin: 0;
  padding: 0;
`;

const VolumeSliderControl = styled.li`
  ${InteractivePanelControlStyle}
`;

const PanelControl = ({
  $onClick,
  $shouldGrow,
  ariaLabel,
  children,
  id
}: PanelControlProps) => {
  return (
    <PanelControlWrapper>
      <PanelControlButton
        aria-label={ariaLabel}
        id={id}
        onClick={$onClick}
        $shouldGrow={$shouldGrow}
      >
        {children}
      </PanelControlButton>
    </PanelControlWrapper>
  );
};

const MutedMarkSlider = styled(Slider)`
  > .MuiSlider-markActive {
    opacity: 1;
    background-color: currentColor;
  }
`;

export const ControlPanel = () => {
  const {
    emulator,
    isEmulatorRunning,
    areItemsDraggable,
    setAreItemsDraggable,
    areItemsResizable,
    setAreItemsResizable
  } = useContext(EmulatorContext);
  const { layouts, setLayout } = useContext(LayoutContext);
  const [isFastForwardOn, setIsFastForwardOn] = useState(false);
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const [isEmulatorPaused, setIsEmulatorPaused] = useState(false);
  const controlPanelId = useId();
  const playPanelControlId = useId();
  const fastForwardPanelControlId = useId();
  const quitGamePanelControlId = useId();
  const dragPanelControlId = useId();
  const resizePanelControlId = useId();
  const volumeSliderControlId = useId();
  const [currentEmulatorVolume, setCurrentEmulatorVolume] = useLocalStorage(
    emulatorVolumeLocalStorageKey,
    1
  );

  const refSetLayout = useCallback(
    (node: Rnd | null) => {
      if (!layouts?.controlPanel?.uncontrolledBounds && node)
        setLayout('controlPanel', {
          uncontrolledBounds:
            node?.resizableElement.current?.getBoundingClientRect()
        });
    },
    [setLayout, layouts]
  );

  const canvasBounds = layouts?.screen?.uncontrolledBounds;

  if (!canvasBounds) return null;

  const dragWrapperPadding = isLargerThanPhone ? 5 : 0;

  const togglePlay = () => {
    isEmulatorPaused ? emulator?.resume() : emulator?.pause();
    setIsEmulatorPaused((prevState) => !prevState);
  };

  const toggleFastForward = () => {
    const delay = isFastForwardOn ? 16 : 0;
    emulator?.setFastForward(0, delay);
    setIsFastForwardOn((prevState) => !prevState);
  };

  const quitGame = () => {
    emulator?.quitGame();
    setIsEmulatorPaused(false);
  };

  const setVolume = (volumePercent: number) => {
    emulator?.setVolume(volumePercent);
    setCurrentEmulatorVolume(volumePercent);
  };

  const setVolumeFromEvent = (event: Event) => {
    const volumePercent = Number((event.target as HTMLInputElement)?.value);
    setVolume(volumePercent);
  };

  const tourSteps: TourSteps = [
    {
      content: (
        <>
          <p>
            Use the control panel to quickly perform in game actions and
            reposition controls.
          </p>
          <p>Click next to take a tour of the controls!</p>
        </>
      ),
      placementBeacon: 'bottom',
      target: `#${CSS.escape(controlPanelId)}`
    },
    {
      content: (
        <p>
          Use the this button to pause and resume your game if it is running.
        </p>
      ),
      placementBeacon: 'bottom',
      target: `#${CSS.escape(playPanelControlId)}`
    },
    {
      content: <p>Use this button to turn fast forward on and off.</p>,
      placementBeacon: 'bottom',
      target: `#${CSS.escape(fastForwardPanelControlId)}`
    },
    {
      content: <p>Use this button to quit your current game.</p>,
      placementBeacon: 'bottom',
      target: `#${CSS.escape(quitGamePanelControlId)}`
    },
    {
      content: (
        <p>
          Use this button to enable dragging and repositioning of the screen,
          controls, and control panel.
        </p>
      ),
      placement: 'right',
      placementBeacon: 'bottom',
      target: `#${CSS.escape(dragPanelControlId)}`
    },
    {
      content: <p>Use this button to resize the screen and control panel.</p>,
      placement: 'right',
      placementBeacon: 'bottom',
      target: `#${CSS.escape(resizePanelControlId)}`
    },
    {
      content: (
        <>
          <p>Use this slider to increase and decrease the emulator volume.</p>
          <p>Your volume setting will be saved between refreshes!</p>
        </>
      ),
      placementBeacon: 'bottom',
      target: `#${CSS.escape(volumeSliderControlId)}`
    }
  ];

  const defaultPosition = {
    x: Math.floor(canvasBounds.left),
    y: Math.floor(canvasBounds.bottom + dragWrapperPadding)
  };
  const defaultSize = {
    width: isLargerThanPhone ? 'auto' : '100dvw',
    height: 'auto'
  };

  const position = layouts?.controlPanel?.position ?? defaultPosition;
  const size = layouts?.controlPanel?.size ?? defaultSize;

  return (
    <>
      <Rnd
        id={controlPanelId}
        disableDragging={!areItemsDraggable}
        enableResizing={areItemsResizable}
        resizeHandleComponent={{
          bottomRight: <GripperHandle variation="bottomRight" />,
          bottomLeft: <GripperHandle variation="bottomLeft" />
        }}
        resizeHandleStyles={{
          bottomRight: { marginBottom: '15px', marginRight: '15px' },
          bottomLeft: { marginBottom: '15px', marginLeft: '15px' }
        }}
        ref={refSetLayout}
        cancel=".noDrag"
        position={position}
        size={size}
        onDragStop={(_, data) => {
          setLayout('controlPanel', { position: { x: data.x, y: data.y } });
        }}
        onResizeStop={(_1, _2, ref, _3, position) => {
          setLayout('controlPanel', {
            size: { width: ref.style.width, height: ref.style.height },
            position: { ...position }
          });
        }}
        default={{
          ...defaultPosition,
          ...defaultSize
        }}
      >
        <Panel>
          <IconContext.Provider value={{ size: '2em' }}>
            <PanelControl
              id={playPanelControlId}
              ariaLabel={isEmulatorPaused ? 'Play' : 'Pause'}
              $shouldGrow
              $onClick={togglePlay}
            >
              {isEmulatorPaused || !isEmulatorRunning ? (
                <BiPlay />
              ) : (
                <BiPause />
              )}
            </PanelControl>
            <PanelControl
              id={fastForwardPanelControlId}
              ariaLabel={isFastForwardOn ? 'Fast Forward' : 'Regular Speed'}
              $shouldGrow
              $onClick={toggleFastForward}
            >
              {isFastForwardOn ? (
                <AiOutlineForward />
              ) : (
                <AiOutlineFastForward />
              )}
            </PanelControl>
            <PanelControl
              id={quitGamePanelControlId}
              ariaLabel="Quit Game"
              $shouldGrow
              $onClick={quitGame}
            >
              <BiUndo />
            </PanelControl>
            <PanelControl
              id={dragPanelControlId}
              ariaLabel={areItemsDraggable ? 'Anchor Items' : 'Drag Items'}
              $shouldGrow
              $onClick={() => {
                setAreItemsDraggable((prevState) => !prevState);
              }}
            >
              {areItemsDraggable ? (
                <BiMove color={theme.gbaThemeBlue} />
              ) : (
                <BiMove />
              )}
            </PanelControl>
            <PanelControl
              id={resizePanelControlId}
              ariaLabel={
                areItemsResizable ? 'Stop Resizing Items' : 'Resize Items'
              }
              $shouldGrow
              $onClick={() => {
                setAreItemsResizable((prevState) => !prevState);
              }}
            >
              {areItemsResizable ? (
                <TbResize color={theme.gbaThemeBlue} />
              ) : (
                <TbResize />
              )}
            </PanelControl>
            <VolumeSliderControl id={volumeSliderControlId}>
              <BiVolumeMute onClick={() => setVolume(0)} />
              <MutedMarkSlider
                aria-label="Volume"
                value={currentEmulatorVolume}
                step={0.1}
                marks
                min={0}
                max={1}
                style={{
                  width: '100px',
                  margin: '0 10px',
                  maxHeight: '40px'
                }}
                onChange={setVolumeFromEvent}
                onFocus={emulator?.disableKeyboardInput}
                onBlur={emulator?.enableKeyboardInput}
                onClick={() => {
                  // click is triggered on keyup, if using mouse this
                  // is the desired behavior after focus is gained
                  emulator?.enableKeyboardInput();
                }}
              />
              <BiVolumeFull onClick={() => setVolume(1)} />
            </VolumeSliderControl>
          </IconContext.Provider>
        </Panel>
      </Rnd>
      <EmbeddedProductTour
        steps={tourSteps}
        completedProductTourStepName="hasCompletedControlPanelTour"
        zIndex={0}
        renderWithoutDelay
        isNotInModal
      />
    </>
  );
};
