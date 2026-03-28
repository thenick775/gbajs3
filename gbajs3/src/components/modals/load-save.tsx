import { Button } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { useState, useId } from 'react';
import { BiError } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useListSaves } from '../../hooks/use-list-saves.tsx';
import { useLoadSave } from '../../hooks/use-load-save.tsx';
import { ErrorWithIcon } from '../shared/error-with-icon.tsx';
import {
  LoadingIndicator,
  PacmanIndicator
} from '../shared/loading-indicator.tsx';
import { CenteredText } from '../shared/styled.tsx';

type SaveErrorProps = {
  $withMarginTop?: boolean;
};

const LoadSaveButton = styled('button')`
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

const SaveList = styled('ul')`
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

const SaveError = styled(ErrorWithIcon)<SaveErrorProps>`
  ${({ $withMarginTop = false }) =>
    $withMarginTop &&
    `
    margin-top: 15px;
    `}
  justify-content: center;
`;

export const LoadSaveModal = () => {
  const theme = useTheme();
  const { setIsModalOpen } = useModalContext();
  const { emulator } = useEmulatorContext();
  const saveListId = useId();
  const { syncActionIfEnabled } = useAddCallbacks();
  const {
    data: saveList,
    isPending: saveListLoading,
    error: saveListError,
    isPaused: saveListPaused
  } = useListSaves();
  const {
    isPending: saveLoading,
    error: saveLoadError,
    mutate: executeLoadSave
  } = useLoadSave({
    onSuccess: (file) => {
      emulator?.uploadSaveOrSaveState(file, syncActionIfEnabled);
      setCurrentSaveLoading(null);
    }
  });
  const [currentSaveLoading, setCurrentSaveLoading] = useState<string | null>(
    null
  );

  return (
    <>
      <ModalHeader title="Load Save" />
      <ModalBody>
        {saveListLoading ? (
          <PacmanIndicator />
        ) : (
          <LoadingIndicator
            isLoading={saveLoading}
            currentName={currentSaveLoading}
            indicator={<PacmanIndicator />}
            loadingCopy="Loading save:"
          >
            <SaveList id={saveListId}>
              {saveList?.map((save: string, idx: number) => (
                <StyledLi key={`${save}_${idx}`}>
                  <LoadSaveButton
                    onClick={() => {
                      setCurrentSaveLoading(save);

                      executeLoadSave({ saveName: save });
                    }}
                  >
                    {save}
                  </LoadSaveButton>
                </StyledLi>
              ))}
              {!saveList?.length && !saveListError && (
                <StyledLi>
                  <EmptyState>
                    No saves on the server, load a game and send your save to
                    the server
                  </EmptyState>
                </StyledLi>
              )}
            </SaveList>
          </LoadingIndicator>
        )}
        {saveListPaused && (
          <SaveError
            icon={<BiError style={{ color: theme.errorRed }} />}
            text="Requests will resume once online"
          />
        )}
        {!!saveListError && (
          <SaveError
            icon={<BiError style={{ color: theme.errorRed }} />}
            text="Listing saves has failed"
          />
        )}
        {!!saveLoadError && (
          <SaveError
            icon={<BiError style={{ color: theme.errorRed }} />}
            text={`Loading save has failed`}
            $withMarginTop
          />
        )}
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
