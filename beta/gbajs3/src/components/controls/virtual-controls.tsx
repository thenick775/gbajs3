import { useContext } from 'react';
import { IconContext } from 'react-icons';
import {
  BiRefresh,
  BiSolidCloudUpload,
  BiSave,
  BiSolidBookmark,
} from 'react-icons/bi';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage, useMediaQuery } from 'usehooks-ts';

import { OPad } from './o-pad.tsx';
import { VirtualButton } from './virtual-button.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import { AreVirtualControlsEnabledProps } from '../modals/controls.tsx';
import { UploadSaveToServer } from '../modals/upload-save-to-server.tsx';

type VirtualControlProps = {
  controlPanelBounds: DOMRect | undefined;
};

const VirtualButtonTextLarge = styled.p`
  text-align: center;
  vertical-align: middle;
  line-height: 54px;
  color: ${({ theme }) => theme.pureWhite};
  margin: 0;
  font-size: 1.5em;
`;

const VirtualButtonTextSmall = styled.p`
  color: ${({ theme }) => theme.pureWhite};
  font-size: 1em;
  margin: 4px 5px;
`;

export const VirtualControls = ({
  controlPanelBounds,
}: VirtualControlProps) => {
  const theme = useTheme();
  // TODO: vancise desktop positioning
  const isLargerThanPhone = useMediaQuery(theme.isLargerThanPhone);
  const isMobileWithUrlBar = useMediaQuery(theme.isMobileWithUrlBar);
  const { emulator } = useContext(EmulatorContext);
  const { setModalContent, setIsModalOpen } = useContext(ModalContext);
  const [currentSaveStateSlot] = useLocalStorage('currentSaveStateSlot', 0);
  const [areVirtualControlsEnabled] =
    useLocalStorage<AreVirtualControlsEnabledProps>(
      'areVirtualControlsEnabled',
      {}
    );

  if (!controlPanelBounds) return null;

  const shouldShowVirtualButtonsAndDpad =
    (areVirtualControlsEnabled?.DPadAndButtons === undefined &&
      !isLargerThanPhone) ||
    areVirtualControlsEnabled?.DPadAndButtons;

  // align with initial control panel positioning
  const verticalStartPos = controlPanelBounds?.bottom ?? 0;

  const virtualButtons = [
    {
      keyId: 'A',
      children: <VirtualButtonTextLarge>A</VirtualButtonTextLarge>,
      initialPosition: {
        top: isMobileWithUrlBar
          ? `calc(${verticalStartPos}px + 10%)`
          : `calc(${verticalStartPos}px + 12%)`,
        left: 'calc(100dvw - 25px)',
      },
      initialOffset: {
        x: '-100%',
        y: '0px',
      },
      key: 'a-button',
      enabled: shouldShowVirtualButtonsAndDpad,
    },
    {
      keyId: 'B',
      children: <VirtualButtonTextLarge>B</VirtualButtonTextLarge>,
      initialPosition: {
        top: isMobileWithUrlBar
          ? `calc(${verticalStartPos}px + 13%)`
          : `calc(${verticalStartPos}px + 15%)`,
        left: 'calc(100dvw - 100px)',
      },
      initialOffset: {
        x: '-100%',
        y: '0px',
      },
      key: 'b-button',
      enabled: shouldShowVirtualButtonsAndDpad,
    },
    {
      keyId: 'START',
      isRectangular: true,
      children: <VirtualButtonTextSmall>Start</VirtualButtonTextSmall>,
      initialPosition: {
        left: isMobileWithUrlBar ? '50dvw' : '25dvw',
        top: isMobileWithUrlBar ? '92dvh' : '88dvh',
      },
      key: 'start-button',
      enabled: shouldShowVirtualButtonsAndDpad,
    },
    {
      keyId: 'SELECT',
      isRectangular: true,
      children: <VirtualButtonTextSmall>Select</VirtualButtonTextSmall>,
      initialPosition: {
        left: isMobileWithUrlBar ? '75dvw' : '55dvw',
        top: isMobileWithUrlBar ? '92dvh' : '88dvh',
      },
      key: 'select-button',
      enabled: shouldShowVirtualButtonsAndDpad,
    },
    {
      keyId: 'L',
      isRectangular: true,
      children: <VirtualButtonTextSmall>L</VirtualButtonTextSmall>,
      initialPosition: {
        top: `${verticalStartPos + 15}px`,
        left: '15px',
      },
      key: 'l-button',
      enabled: shouldShowVirtualButtonsAndDpad,
    },
    {
      keyId: 'R',
      isRectangular: true,
      children: <VirtualButtonTextSmall>R</VirtualButtonTextSmall>,
      initialPosition: {
        top: `${verticalStartPos + 15}px`,
        left: 'calc(100dvw - 15px)',
      },
      initialOffset: {
        x: '-100%',
        y: '0px',
      },
      key: 'r-button',
      enabled: shouldShowVirtualButtonsAndDpad,
    },
    {
      children: <BiRefresh />,
      onClick: () => {
        emulator?.quickReload();
      },
      width: 40,
      initialPosition: {
        top: `${verticalStartPos + 10}px`,
        left: '135px',
      },
      key: 'restart-button',
      enabled: areVirtualControlsEnabled?.QuickReload,
    },
    {
      children: <BiSolidCloudUpload />,
      onClick: () => {
        setModalContent(<UploadSaveToServer />);
        setIsModalOpen(true);
      },
      width: 40,
      initialPosition: {
        top: `${verticalStartPos + 10}px`,
        left: 'calc(100dvw - 135px)',
      },
      initialOffset: {
        x: '-100%',
        y: '0px',
      },
      key: 'uploadsave-button',
      enabled: areVirtualControlsEnabled?.SendSaveToServer,
    },
    {
      children: <BiSolidBookmark />,
      onClick: () => {
        emulator?.loadSaveState(currentSaveStateSlot);
      },
      width: 40,
      initialPosition: {
        top: isMobileWithUrlBar
          ? `calc(${verticalStartPos}px + 23%)`
          : `calc(${verticalStartPos}px + 25%)`,
        left: 'calc(100dvw - 40px)',
      },
      initialOffset: {
        x: '-100%',
        y: '0px',
      },
      key: 'loadstate-button',
      enabled: areVirtualControlsEnabled?.LoadState,
    },
    {
      children: <BiSave />,
      onClick: () => {
        emulator?.createSaveState(currentSaveStateSlot);
      },
      width: 40,
      initialPosition: {
        top: isMobileWithUrlBar
          ? `calc(${verticalStartPos}px + 25%)`
          : `calc(${verticalStartPos}px + 27%)`,
        left: 'calc(100dvw - 100px)',
      },
      initialOffset: {
        x: '-100%',
        y: '0px',
      },
      key: 'savestate-button',
      enabled: areVirtualControlsEnabled?.SaveState,
    },
  ];

  return (
    <IconContext.Provider value={{ color: theme.pureWhite, size: '2em' }}>
      {shouldShowVirtualButtonsAndDpad && (
        <OPad
          initialPosition={{
            top: `calc(${verticalStartPos}px + 11%)`,
            left: '10px',
          }}
        />
      )}
      {virtualButtons.map((virtualButtonProps) => (
        <VirtualButton {...virtualButtonProps} />
      ))}
    </IconContext.Provider>
  );
};
