import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ModalSuspenseFallback,
  ModalContentFadeIn
} from './modal-suspense-fallback.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';

describe('<ModalSuspenseFallback />', () => {
  it('renders the loading modal chrome', () => {
    renderWithContext(<ModalSuspenseFallback />);

    expect(screen.getByRole('heading', { name: 'Loading' })).toBeVisible();
  });

  it('does not show the loader immediately', () => {
    vi.useFakeTimers();

    renderWithContext(<ModalSuspenseFallback />);

    expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows the loader after the delay', () => {
    vi.useFakeTimers();

    renderWithContext(<ModalSuspenseFallback delayMs={300} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('heading', { name: 'Loading' })).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"] span').length).toBe(4);

    vi.useRealTimers();
  });
});

describe('<ModalContentFadeIn />', () => {
  it('renders children', () => {
    renderWithContext(
      <ModalContentFadeIn>
        <p>Child content</p>
      </ModalContentFadeIn>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
