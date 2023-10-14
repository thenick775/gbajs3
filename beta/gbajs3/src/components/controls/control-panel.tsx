import { Slider, useMediaQuery } from '@mui/material';
import {
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
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
import { useLocalStorage } from 'usehooks-ts';

import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ButtonBase } from '../shared/custom-button-base.tsx';
import { GripperHandle } from '../shared/gripper-handle.tsx';

type ControlPanelProps = {
  setExternalBounds: Dispatch<DOMRect | undefined>;
};

type PanelControlProps = {
  children: ReactNode;
  $shouldGrow?: boolean;
  $onClick?: () => void;
  ariaLabel: string;
};

type PanelControlButtonProps = {
  $shouldGrow?: boolean;
};

const DragWrapper = styled(Rnd)`
  width: 100dvw;

  @media ${({ theme }) => theme.isLargerThanPhone} {
    width: fit-content;
  }
`;

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
  children,
  $shouldGrow,
  $onClick,
  ariaLabel
}: PanelControlProps) => {
  return (
    <PanelControlWrapper>
      <PanelControlButton
        $shouldGrow={$shouldGrow}
        onClick={$onClick}
        aria-label={ariaLabel}
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

export const ControlPanel = ({ setExternalBounds }: ControlPanelProps) => {
  const {
    canvas,
    emulator,
    isEmulatorRunning,
    areItemsDraggable,
    setAreItemsDraggable,
    areItemsResizable,
    setAreItemsResizable
  } = useContext(EmulatorContext);
  const [isFastForwardOn, setIsFastForwardOn] = useState(false);
  const theme = useTheme();
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const dragRef = useRef<Rnd>(null);
  const [isEmulatorPaused, setIsEmulatorPaused] = useState(false);
  const [currentEmulatorVolume, setCurrentEmulatorVolume] = useLocalStorage(
    'currentEmulatorVolume',
    1
  );

  useEffect(() => {
    if (canvas && dragRef?.current?.resizableElement?.current)
      setExternalBounds(
        dragRef.current.resizableElement.current.getBoundingClientRect()
      );
  }, [setExternalBounds, canvas]);

  if (!canvas?.parentElement) return null;

  const dragWrapperPadding = isLargerThanPhone ? 5 : 0;
  const canvasBounds = canvas.parentElement.getBoundingClientRect();

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

  const setVolume = (event: Event) => {
    const volumePercent = Number((event.target as HTMLInputElement)?.value);
    emulator?.setVolume(volumePercent);
    setCurrentEmulatorVolume(volumePercent);
  };

  return (
    <DragWrapper
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
      ref={dragRef}
      cancel=".noDrag"
      size={{ width: '', height: 'auto' }}
      default={{
        x: Math.floor(canvasBounds.left),
        y: Math.floor(canvasBounds.bottom + dragWrapperPadding),
        width: 'auto',
        height: 'auto'
      }}
    >
      <Panel>
        <IconContext.Provider value={{ size: '2em' }}>
          <PanelControl
            ariaLabel={isEmulatorPaused ? 'Play' : 'Pause'}
            $shouldGrow
            $onClick={togglePlay}
          >
            {isEmulatorPaused || !isEmulatorRunning ? <BiPlay /> : <BiPause />}
          </PanelControl>
          <PanelControl
            ariaLabel={isFastForwardOn ? 'Fast Forward' : 'Regular Speed'}
            $shouldGrow
            $onClick={toggleFastForward}
          >
            {isFastForwardOn ? <AiOutlineForward /> : <AiOutlineFastForward />}
          </PanelControl>
          <PanelControl ariaLabel="Quit Game" $shouldGrow $onClick={quitGame}>
            <BiUndo />
          </PanelControl>
          <PanelControl
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
          <VolumeSliderControl>
            <BiVolumeMute />
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
              onChange={setVolume}
              onFocus={emulator?.disableKeyboardInput}
              onBlur={emulator?.enableKeyboardInput}
              onClick={() => {
                // click is triggered on keyup, if using mouse this
                // is the desired behavior after focus is gained
                emulator?.enableKeyboardInput();
              }}
            />
            <BiVolumeFull />
          </VolumeSliderControl>
        </IconContext.Provider>
      </Panel>
    </DragWrapper>
  );
};
