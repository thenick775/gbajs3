import { Button } from '@mui/material';
import { ReactNode, useContext, useEffect, useState } from 'react';
import { BiError } from 'react-icons/bi';
import { PacmanLoader } from 'react-spinners';
import styled, { useTheme } from 'styled-components';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import { useListSaves } from '../../hooks/use-list-saves.tsx';
import { useLoadSave } from '../../hooks/use-load-save.tsx';

type SaveLoadingIndicatorProps = {
  isLoading: boolean;
  currentLoadingSave: string | null;
  children: JSX.Element;
  indicator: ReactNode;
};

type SaveErrorProps = {
  text: string;
  icon?: JSX.Element;
  $withMarginTop?: boolean;
};

type ErrorWrapperProps = {
  $withMarginTop?: boolean;
};

const LoadSaveButton = styled.button`
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

const SaveList = styled.ul`
  list-style-type: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;

  & > ${StyledLi}:first-child > ${LoadSaveButton} {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  & > ${StyledLi}:last-child > ${LoadSaveButton} {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  & > ${StyledLi}:not(:first-child) > ${LoadSaveButton} {
    border-top-width: 0;
  }
`;

const SaveLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  align-items: center;
  margin-bottom: 15px;
`;

const ErrorWrapper = styled.div<ErrorWrapperProps>`
  display: flex;
  align-items: center;
  gap: 5px;

  ${({ $withMarginTop = false }) =>
    $withMarginTop &&
    `
    margin-top: 15px;
    `}
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.errorRed};
`;

const SaveError = ({ icon, text, $withMarginTop = false }: SaveErrorProps) => {
  return (
    <ErrorWrapper $withMarginTop={$withMarginTop}>
      {icon}
      <ErrorText>{text}</ErrorText>
    </ErrorWrapper>
  );
};

const SaveLoadingIndicator = ({
  isLoading,
  currentLoadingSave,
  children,
  indicator,
}: SaveLoadingIndicatorProps) => {
  return isLoading ? (
    <SaveLoadingContainer>
      <p>
        Loading save:
        <br />
        {currentLoadingSave}
      </p>
      {indicator}
    </SaveLoadingContainer>
  ) : (
    children
  );
};

export const LoadSaveModal = () => {
  const theme = useTheme();
  const { setIsModalOpen } = useContext(ModalContext);
  const { emulator } = useContext(EmulatorContext);
  const {
    data: saveList,
    isLoading: saveListloading,
    error: saveListError,
  } = useListSaves({ loadOnMount: true });
  const {
    data: saveFile,
    isLoading: saveLoading,
    error: saveLoadError,
    execute: executeLoadSave,
  } = useLoadSave();
  const [currentSaveLoading, setCurrentSaveLoading] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!saveLoading && saveFile) {
      emulator?.uploadSaveOrSaveState(saveFile);
      setCurrentSaveLoading(null);
    }
  }, [emulator, saveLoading, saveFile]);

  const LoadingIndicator = () => (
    <PacmanLoader
      color={theme.gbaThemeBlue}
      cssOverride={{ margin: '0 auto' }}
    />
  );

  return (
    <>
      <ModalHeader title="Load Save" />
      <ModalBody>
        {saveListloading ? (
          <LoadingIndicator />
        ) : (
          <SaveLoadingIndicator
            isLoading={saveLoading}
            currentLoadingSave={currentSaveLoading}
            indicator={<LoadingIndicator />}
          >
            <SaveList>
              {saveList?.map?.((save: string, idx: number) => (
                <StyledLi key={`${save}_${idx}`}>
                  <LoadSaveButton
                    onClick={() => {
                      executeLoadSave({ saveName: save });
                      setCurrentSaveLoading(save);
                    }}
                  >
                    {save}
                  </LoadSaveButton>
                </StyledLi>
              ))}
            </SaveList>
          </SaveLoadingIndicator>
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
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
