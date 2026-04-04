import { useCallback, useState, type ReactNode } from 'react';

import {
  ModalContext,
  type ModalInput,
  type ModalState
} from './modal-context.tsx';

type ModalProviderProps = {
  children: ReactNode;
};

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modal, setModal] = useState<ModalState>(null);

  const openModal = useCallback((nextModal: ModalInput) => {
    setModal(nextModal);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <ModalContext.Provider
      value={{ modal, openModal, closeModal, isModalOpen: modal !== null }}
    >
      {children}
    </ModalContext.Provider>
  );
};
