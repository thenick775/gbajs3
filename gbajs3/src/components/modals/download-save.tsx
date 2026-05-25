import { Box, Button, Divider, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useId, useState } from 'react';
import { BiError } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { ErrorWithIcon } from '../shared/error-with-icon.tsx';
import { ManagedCheckbox } from '../shared/managed-checkbox.tsx';
import { Copy } from '../shared/styled.tsx';
import { downloadBlob } from './file-utilities/blob.ts';

const saveSize128KiBBytes = 128 * 1024;

export const DownloadSaveModal = () => {
  const theme = useTheme();
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const downloadSaveButtonId = useId();
  const [error, setError] = useState(false);
  const [downloadTruncatedSave, setDownloadTruncatedSave] = useState(false);

  return (
    <>
      <ModalHeader title="Download Save" />
      <ModalBody>
        {error ? (
          <ErrorWithIcon
            icon={<BiError style={{ color: theme.errorRed }} />}
            text="Load a rom to download its save file"
          />
        ) : (
          <Copy>
            Remember to save in game before downloading your save file!
          </Copy>
        )}
        <Divider flexItem sx={{ margin: '10px 0' }} />
        <Copy>Download Options</Copy>
        <ManagedCheckbox
          label={
            <Box sx={{ ml: 1, my: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Truncate save (128 KiB)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Removes metadata at the end of the sav file
              </Typography>
            </Box>
          }
          watcher={downloadTruncatedSave}
          onChange={(_, checked) => {
            setDownloadTruncatedSave(checked);
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          id={downloadSaveButtonId}
          variant="contained"
          onClick={() => {
            const save = downloadTruncatedSave
              ? emulator?.getCurrentSaveTruncated(saveSize128KiBBytes)
              : emulator?.getCurrentSave();
            const saveName = emulator?.getCurrentSaveName();

            if (save && saveName) {
              const saveFile = new Blob([save.slice()], {
                type: 'data:application/octet-stream'
              });

              downloadBlob(saveName, saveFile);
            } else {
              setError(true);
            }
          }}
        >
          Download
        </Button>
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
