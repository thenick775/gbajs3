import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LegalModal } from './legal.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';

describe('<LegalModal>', () => {
  it('closes modal using the close button', async () => {
    const closeModalSpy = vi.fn();
    const { useModalContext: original } = await vi.importActual<
      typeof contextHooks
    >('../../hooks/context.tsx');

    vi.spyOn(contextHooks, 'useModalContext').mockImplementation(() => ({
      ...original(),
      closeModal: closeModalSpy
    }));

    renderWithContext(<LegalModal />);

    // click the close button
    const closeButton = screen.getByText('Close', { selector: 'button' });
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);

    expect(closeModalSpy).toHaveBeenCalledOnce();
  });

  it('renders with current year in copywright', () => {
    vi.setSystemTime(new Date(2023, 0));

    renderWithContext(<LegalModal />);

    expect(screen.getByText(/© 2023,/)).toBeInTheDocument();
  });
});
