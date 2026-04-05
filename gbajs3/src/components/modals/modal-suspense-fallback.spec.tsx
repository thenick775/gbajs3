import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ModalSuspenseFallback } from './modal-suspense-fallback.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';

describe('<ModalSuspenseFallback />', () => {
  it('renders the loading modal chrome', () => {
    renderWithContext(<ModalSuspenseFallback />);

    expect(screen.getByRole('heading', { name: 'Loading' })).toBeVisible();
  });

  it('renders the delayed loader shell', () => {
    renderWithContext(<ModalSuspenseFallback />);

    expect(screen.getByRole('heading', { name: 'Loading' })).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"] span').length).toBe(4);
  });
});
