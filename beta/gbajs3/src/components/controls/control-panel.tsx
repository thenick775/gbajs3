import { Slider, useMediaQuery } from '@mui/material';
import { Dispatch, useContext, useEffect, useRef, useState } from 'react';
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
import { styled, useTheme } from 'styled-components';

import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { GripperHandle } from '../shared/gripper-handle.tsx';

type PanelControlProps = {
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

const PanelControl = styled.li.attrs({
  className: 'noDrag'
})<PanelControlProps>`
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

  flex-grow: ${({ $shouldGrow = false }) => ($shouldGrow ? 1 : 0)};

  &:focus {
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
`;

type ControlPanelProps = {
  setExternalBounds: Dispatch<DOMRect | undefined>;
};

export const ControlPanel = ({ setExternalBounds }: ControlPanelProps) => {
  const {
    canvas,
    emulator,
    isEmulatorPaused,
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
  };

  const toggleFastForward = () => {
    const delay = isFastForwardOn ? 16 : 0;
    emulator?.setFastForward(0, delay);
    setIsFastForwardOn((prevState) => !prevState);
  };

  const quitGame = () => {
    emulator?.quitGame();
  };

  const setVolume = (event: Event) => {
    const volumePercent = Number((event.target as HTMLInputElement)?.value);
    emulator?.setVolume(volumePercent);
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
          <PanelControl $shouldGrow onClick={togglePlay}>
            {isEmulatorPaused || !isEmulatorRunning ? <BiPlay /> : <BiPause />}
          </PanelControl>
          <PanelControl $shouldGrow onClick={toggleFastForward}>
            {isFastForwardOn ? <AiOutlineForward /> : <AiOutlineFastForward />}
          </PanelControl>
          <PanelControl $shouldGrow onClick={quitGame}>
            <BiUndo />
          </PanelControl>
          <PanelControl
            $shouldGrow
            onClick={() => {
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
            $shouldGrow
            onClick={() => {
              setAreItemsResizable((prevState) => !prevState);
            }}
          >
            {areItemsResizable ? (
              <TbResize color={theme.gbaThemeBlue} />
            ) : (
              <TbResize />
            )}
          </PanelControl>
          <PanelControl>
            <BiVolumeMute />
            <Slider
              aria-label="Volume"
              defaultValue={0}
              step={0.1}
              marks
              min={0}
              max={1}
              style={{
                width: '100px',
                margin: '0 5px 0 15px',
                maxHeight: '40px'
              }}
              onChange={setVolume}
            />
            <BiVolumeFull />
          </PanelControl>
        </IconContext.Provider>
      </Panel>
    </DragWrapper>
  );
};
