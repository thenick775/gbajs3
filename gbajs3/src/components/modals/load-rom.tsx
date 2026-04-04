import { Button } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { useState, useId } from 'react';
import { BiError } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useRunGame } from '../../hooks/emulator/use-run-game.tsx';
import { useListRoms } from '../../hooks/use-list-roms.tsx';
import { useLoadRom } from '../../hooks/use-load-rom.tsx';
import { ErrorWithIcon } from '../shared/error-with-icon.tsx';
import {
  LoadingIndicator,
  PacmanIndicator
} from '../shared/loading-indicator.tsx';
import { CenteredText } from '../shared/styled.tsx';

type RomErrorProps = {
  $withMarginTop?: boolean;
  $isCentered?: boolean;
};

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

const StyledLi = styled('li')`
  margin: 0;
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

const RomError = styled(ErrorWithIcon)<RomErrorProps>`
  ${({ $withMarginTop = false }) =>
    $withMarginTop &&
    `
    margin-top: 15px;
    `}

  ${({ $isCentered = false }) =>
    $isCentered &&
    `
      justify-content: center;
      `}
`;

export const LoadRomModal = () => {
  const theme = useTheme();
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const romListId = useId();
  const runGame = useRunGame();
  const [currentRomLoading, setCurrentRomLoading] = useState<string | null>(
    null
  );
  const { syncActionIfEnabled } = useAddCallbacks();
  const {
    data: romList,
    isPending: romListLoading,
    error: romListError,
    isPaused: romListPaused
  } = useListRoms();
  const {
    isPending: romLoading,
    error: romLoadError,
    mutate: executeLoadRom
  } = useLoadRom({
    onSuccess: (file) => {
      const runCallback = async () => {
        await syncActionIfEnabled();
        runGame(file.name);
      };

      emulator?.uploadRom(file, runCallback);
      setCurrentRomLoading(null);
    }
  });

  return (
    <>
      <ModalHeader title="Load Rom" />
      <ModalBody>
        {romListLoading ? (
          <PacmanIndicator />
        ) : (
          <LoadingIndicator
            currentName={currentRomLoading}
            indicator={<PacmanIndicator />}
            isLoading={romLoading}
            loadingCopy="Loading rom:"
          >
            <RomList id={romListId}>
              {romList?.map((rom: string, idx: number) => (
                <StyledLi key={`${rom}_${idx}`}>
                  <LoadRomButton
                    onClick={() => {
                      setCurrentRomLoading(rom);
                      executeLoadRom({ romName: rom });
                    }}
                  >
                    {rom}
                  </LoadRomButton>
                </StyledLi>
              ))}
              {!romList?.length && !romListError && (
                <StyledLi>
                  <EmptyState>
                    No roms on the server, load a game and send your rom to the
                    server
                  </EmptyState>
                </StyledLi>
              )}
            </RomList>
          </LoadingIndicator>
        )}
        {romListPaused && (
          <RomError
            $isCentered
            icon={<BiError style={{ color: theme.errorRed }} />}
            text="Requests will resume once online"
          />
        )}
        {!!romListError && (
          <RomError
            icon={<BiError style={{ color: theme.errorRed }} />}
            text="Listing roms has failed"
          />
        )}
        {!!romLoadError && (
          <RomError
            icon={<BiError style={{ color: theme.errorRed }} />}
            text={`Loading rom has failed`}
            $withMarginTop
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
