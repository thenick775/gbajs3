import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCallback, useState } from 'react';

import { EmulatorFileSystem } from './file-system/emulator-file-system.tsx';
import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useFileStat } from '../../hooks/emulator/use-file-stat.tsx';
import { CircleCheckButton } from '../shared/circle-check-button.tsx';
import { downloadBlob } from './file-utilities/blob.ts';

const FlexModalBody = styled(ModalBody)`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

export const FileSystemModal = () => {
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const { syncActionIfEnabled } = useAddCallbacks();
  const [fileSystemChangeTime, setFileSystemChangeTime] = useState<
    number | null
  >(null);

  const autoSaveStatePath = emulator?.getCurrentAutoSaveStatePath();
  const { modifiedTime } = useFileStat(autoSaveStatePath);
  const fileSystemChangeKey = modifiedTime ?? fileSystemChangeTime;

  const deleteFile = useCallback(
    async (path: string) => {
      emulator?.deleteFile(path);
      setFileSystemChangeTime(Date.now());
      await syncActionIfEnabled();
    },
    [emulator, syncActionIfEnabled]
  );

  const downloadFile = (path: string) => {
    const fileName = path.split('/').pop();
    const file = emulator?.getFile(path);

    if (file && fileName) {
      const fileDownload = new Blob([file.slice()], {
        type: 'data:application/octet-stream'
      });

      downloadBlob(fileName, fileDownload);
    }
  };

  const renderedFiles = emulator?.listAllFiles();

  return (
    <>
      <ModalHeader title="File System" />
      <FlexModalBody>
        <EmulatorFileSystem
          key={fileSystemChangeKey}
          allFiles={renderedFiles}
          deleteFile={deleteFile}
          downloadFile={downloadFile}
        />
      </FlexModalBody>
      <ModalFooter>
        <CircleCheckButton copy="Save File System" onClick={emulator?.fsSync} />
        <Button variant="outlined" onClick={closeModal}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
