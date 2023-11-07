import { Button } from '@mui/material';
import { useContext, useId } from 'react';
import { styled } from 'styled-components';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import {
  EmbeddedProductTour,
  type TourSteps
} from '../product-tour/embedded-product-tour.tsx';
import { CenteredText } from '../shared/styled.tsx';

const LoadRomButton = styled.button`
  padding: 0.5rem 1rem;
  width: 100%;
  color: ${({ theme }) => theme.blueCharcoal};
  text-decoration: none;
  background-color: ${({ theme }) => theme.pureWhite};
  border: 1px solid rgba(0, 0, 0, 0.125);
  text-align: left;

  &:hover {
    color: ${({ theme }) => theme.darkGrayBlue};
    background-color: ${({ theme }) => theme.aliceBlue1};
  }
`;

const StyledLi = styled.li`
  cursor: pointer;
`;

const RomList = styled.ul`
  list-style-type: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;

  & > ${StyledLi}:first-child > ${LoadRomButton} {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  & > ${StyledLi}:last-child > ${LoadRomButton} {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  & > ${StyledLi}:not(:first-child) > ${LoadRomButton} {
    border-top-width: 0;
  }
`;

export const LoadLocalRomModal = () => {
  const { setIsModalOpen } = useContext(ModalContext);
  const { emulator } = useContext(EmulatorContext);
  const romListId = useId();
  const ignorePaths = ['.', '..'];
  const localRoms = emulator
    ?.listRoms?.()
    ?.filter((romName) => !ignorePaths.includes(romName));

  const tourSteps: TourSteps = [
    {
      content: (
        <>
          <p>
            Use this area to drag and drop your save files, or click to select
            save files.
          </p>
          <p>You may drop or select multiple save files!</p>
        </>
      ),
      locale: { skip: <strong aria-label="Skip">Skip</strong> },
      placement: 'auto',
      placementBeacon: 'right-end',
      spotlightPadding: 10,
      target: `#${CSS.escape(romListId)}`
    }
  ];

  return (
    <>
      <ModalHeader title="Load Local Rom" />
      <ModalBody>
        <RomList id={romListId}>
          {localRoms?.map?.((romName: string, idx: number) => (
            <StyledLi key={`${romName}_${idx}`}>
              <LoadRomButton
                onClick={() => {
                  emulator?.run(emulator.filePaths().gamePath + '/' + romName);
                  setIsModalOpen(false);
                }}
              >
                {romName}
              </LoadRomButton>
            </StyledLi>
          ))}
        </RomList>
        {!localRoms?.length && (
          <CenteredText>
            No local roms, load a game and save your file system
          </CenteredText>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
      <EmbeddedProductTour
        steps={tourSteps}
        completedProductTourStepName="hasCompletedLoadLocalRomTour"
      />
    </>
  );
};
