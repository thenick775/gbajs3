import { Button, FormControlLabel, Checkbox } from '@mui/material';
import { useContext } from 'react';
import { styled } from 'styled-components';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

export const ChooseCoreModal = () => {
  const { setIsModalOpen } = useContext(ModalContext);

  return (
    <>
      <ModalHeader title="Choose Core" />
      <ModalBody>
        <StyledForm id="chooseCoreForm">
          <FormControlLabel
            control={<Checkbox checked />}
            label="mGBA (default wasm core)"
          />
          <FormControlLabel
            control={<Checkbox disabled />}
            label="gbaJS (pure javascript core)"
          />
        </StyledForm>
      </ModalBody>
      <ModalFooter>
        <Button form="chooseCoreForm" type="submit" variant="contained">
          Save Changes
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
