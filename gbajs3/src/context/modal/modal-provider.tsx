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
  // Allows the legal modal to be used as a public google oauth policy url.
  const [modal, setModal] = useState<ModalState>(() =>
    new URLSearchParams(window.location.search).get('modal') === 'legal'
      ? { type: 'legal' }
      : null
  );
  const [isModalOpen, setIsModalOpen] = useState(!!modal);

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
