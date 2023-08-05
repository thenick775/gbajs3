import { Button } from '@mui/material';
import { useContext } from 'react';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';

export const AboutModal = () => {
  const { setIsModalOpen } = useContext(ModalContext);

  return (
    <>
      <ModalHeader title="About" />
      <ModalBody>
        <p>Gbajs3 is a full featured GBA emulator in the browser.</p>
        <p>
          We support the mGBA wasm core, and the gbajs pure javascript core.
        </p>
        <p>Getting Started:</p>
        <ul>
          <li>
            Using the pre-game actions menu, upload a sav file if you have one
            available
          </li>
          <li>Then, load a rom of your choice</li>
          <li>Enjoy, your game will boot!</li>
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
