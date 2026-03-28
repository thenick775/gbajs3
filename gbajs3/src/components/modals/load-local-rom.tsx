import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useId } from 'react';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useRunGame } from '../../hooks/emulator/use-run-game.tsx';
import { CenteredText } from '../shared/styled.tsx';

const StyledLi = styled('li')`
  margin: 0;
`;

const LoadRomButton = styled('button')`
  width: 100%;
  display: block;
  padding: 0.875rem 1rem;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme.modalTextPrimary};
  background-color: transparent;
  border: 0;
  font: inherit;
  line-height: 1.35;
  overflow: hidden;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
  }

  &:focus-visible {
    outline: none;
    position: relative;
    z-index: 1;
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.gbaThemeBlue};
  }

  &:active {
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
  }
`;

const RomList = styled('ul')`
  list-style: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;

  background: ${({ theme }) => theme.modalSurfaceElevated};
  border: 1px solid ${({ theme }) => theme.modalListBorder};
  border-radius: 10px;
  overflow: hidden;

  & > ${StyledLi} + ${StyledLi} {
    border-top: 1px solid ${({ theme }) => theme.modalListBorder};
  }
`;

const EmptyState = styled(CenteredText)`
  padding: 1rem;
  color: ${({ theme }) => theme.modalTextSecondary};
`;

export const LoadLocalRomModal = () => {
  const { setIsModalOpen } = useModalContext();
  const { emulator } = useEmulatorContext();
  const romListId = useId();
  const runGame = useRunGame();
  const localRoms = emulator?.listRoms();

  return (
    <>
      <ModalHeader title="Load Local Rom" />
      <ModalBody>
        <RomList id={romListId}>
          {localRoms?.map((romName: string, idx: number) => (
            <StyledLi key={`${romName}_${idx}`}>
              <LoadRomButton
                onClick={() => {
                  runGame(romName);
                  setIsModalOpen(false);
                }}
              >
                {romName}
              </LoadRomButton>
            </StyledLi>
          ))}
          {!localRoms?.length && (
            <StyledLi>
              <EmptyState>
                No local roms, load a game and save your file system
              </EmptyState>
            </StyledLi>
          )}
        </RomList>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outlined"
          onClick={() => {
            setIsModalOpen(false);
          }}
        >
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
