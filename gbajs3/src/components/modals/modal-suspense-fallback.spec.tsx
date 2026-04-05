import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ModalSuspenseFallback } from './modal-suspense-fallback.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';

describe('<ModalSuspenseFallback />', () => {
  it('renders the loading modal chrome', () => {
    vi.useFakeTimers();

    renderWithContext(<ModalSuspenseFallback />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('heading', { name: 'Loading' })).toBeVisible();

    vi.useRealTimers();
  });

  it('renders nothing before the delay elapses', () => {
    vi.useFakeTimers();

    const { container } = renderWithContext(<ModalSuspenseFallback />);

    expect(container).toBeEmptyDOMElement();

    vi.useRealTimers();
  });

  it('renders the suspense fallback after the delay elapses', () => {
    vi.useFakeTimers();

    renderWithContext(<ModalSuspenseFallback />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(
      screen.getByRole('heading', { name: 'Loading' })
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"] span').length).toBe(4);

    vi.useRealTimers();
  });
});
