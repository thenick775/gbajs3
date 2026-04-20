import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useId } from 'react';
import { BiError } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useUpLoadRom } from '../../hooks/use-upload-rom.tsx';
import { ErrorWithIcon } from '../shared/error-with-icon.tsx';
import { PacmanIndicator } from '../shared/loading-indicator.tsx';
import { CenteredText } from '../shared/styled.tsx';

type DynamicBodyProps = {
  errorColor: string;
  loadingColor: string;
  respStatus: number | undefined;
  isLoading: boolean;
  hasError: boolean;
};

const BodyContents = ({
  errorColor,
  loadingColor,
  respStatus,
  isLoading,
  hasError
}: DynamicBodyProps) => {
  if (isLoading) {
    return (
      <PacmanIndicator data-testid="upload-rom-spinner" color={loadingColor} />
    );
  }

  if (hasError) {
    return (
      <ErrorWithIcon
        icon={<BiError style={{ color: errorColor }} />}
        text="Rom file upload has failed"
      />
    );
  }

  if (respStatus === 200) {
    return <CenteredText>Rom file upload was successful!</CenteredText>;
  }

  return (
    <CenteredText>
      Are you sure you want to upload your current rom file to the server?
    </CenteredText>
  );
};

export const UploadRomToServerModal = () => {
  const theme = useTheme();
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const uploadRomToServerButtonId = useId();
  const {
    data,
    isPending: isLoading,
    error,
    mutate: executeUploadRom
  } = useUpLoadRom();

  return (
    <>
      <ModalHeader title="Send Rom to Server" />
      <ModalBody>
        <BodyContents
          errorColor={theme.errorRed}
          loadingColor={theme.gbaThemeBlue}
          isLoading={isLoading}
          hasError={!!error}
          respStatus={data?.status}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          id={uploadRomToServerButtonId}
          variant="contained"
          onClick={() => {
            const romFileBytes = emulator?.getCurrentRom();
            const romName = emulator?.getCurrentGameName();

            if (romFileBytes && romName) {
              const romFileBlob = new Blob([romFileBytes.slice()]);
              const romFile = new File([romFileBlob], romName);

              executeUploadRom({ romFile });
            }
          }}
        >
          Upload
        </Button>
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
