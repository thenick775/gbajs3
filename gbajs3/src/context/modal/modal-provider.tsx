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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback((nextModal: ModalInput) => {
    setModal(nextModal);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const clearModal = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <ModalContext.Provider
      value={{ modal, openModal, closeModal, clearModal, isModalOpen }}
    >
      {children}
    </ModalContext.Provider>
  );
};
