import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import ReactModal from 'react-modal';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ModalContainer } from './modal-container.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';

const DismissModalButton = () => {
  const { closeModal, isModalOpen, openModal } = contextHooks.useModalContext();
  return (
    <button
      data-testid="dismiss-modal-button"
      onClick={() => {
        if (isModalOpen) {
          closeModal();
        } else {
          openModal({ type: 'about' });
        }
      }}
    />
  );
};

describe('<ModalContainer />', () => {
  beforeAll(() => {
    ReactModal.setAppElement(document.createElement('div'));
  });

  it('renders children if modal is open', async () => {
    const { useModalContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      isModalOpen: true,
      modal: { type: 'about' }
    }));

    renderWithContext(<ModalContainer />);

    expect(
      await screen.findByRole('heading', { name: 'About' })
    ).toBeInTheDocument();
  });

  it('does not render children if nodal is not open', async () => {
    const closeModalSpy = vi.fn();
    const { useModalContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      isModalOpen: false,
      closeModal: closeModalSpy,
      modal: null
    }));

    renderWithContext(<ModalContainer />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes modal', async () => {
    const closeModalSpy = vi.fn();
    const { useModalContext: originalModal } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      closeModal: closeModalSpy,
      isModalOpen: true,
      modal: { type: 'about' }
    }));

    renderWithContext(<ModalContainer />);

    await userEvent.keyboard('{Escape}');

    expect(closeModalSpy).toHaveBeenCalledOnce();
  });

  it('disables keyboard input after open', async () => {
    const disableKeyboardInputSpy: () => void = vi.fn();
    const enableKeyboardInputSpy: () => void = vi.fn();
    const {
      useModalContext: originalModal,
      useEmulatorContext: originalEmulator
    } = await vi.importActual<typeof contextHooks>('../../hooks/context.tsx');

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...originalModal(),
      isModalOpen: true,
      modal: { type: 'about' }
    }));

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        disableKeyboardInput: disableKeyboardInputSpy,
        enableKeyboardInput: enableKeyboardInputSpy
      } as GBAEmulator
    }));

    renderWithContext(<ModalContainer />);

    expect(disableKeyboardInputSpy).toHaveBeenCalledOnce();
    expect(enableKeyboardInputSpy).not.toHaveBeenCalled();
  });

  it('enables keyboard input after close', async () => {
    const enableKeyboardInputSpy: () => void = vi.fn();
    const { useEmulatorContext: originalEmulator } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      ...originalEmulator(),
      emulator: {
        enableKeyboardInput: enableKeyboardInputSpy
      } as GBAEmulator
    }));

    renderWithContext(
      <>
        <ModalContainer />
        <DismissModalButton />
      </>
    );
    // open and close the modal using isOpen prop
    await userEvent.click(screen.getByTestId('dismiss-modal-button'));
    await userEvent.click(screen.getByTestId('dismiss-modal-button'));

    await waitFor(() => {
      expect(enableKeyboardInputSpy).toHaveBeenCalledOnce();
    });
  });
});
