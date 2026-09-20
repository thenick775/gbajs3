import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderHookWithContext } from '../../../test/render-hook-with-context.tsx';
import { useModalContext } from '../../hooks/context.tsx';

describe('<ModalProvider />', () => {
  it('starts closed by default', () => {
    const { result } = renderHookWithContext(() => useModalContext());

    expect(result.current.modal).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
  });

  it('opens the legal modal from the modal query parameter', () => {
    window.history.pushState({}, '', '/?modal=legal');

    const { result } = renderHookWithContext(() => useModalContext());

    expect(result.current.modal).toEqual({ type: 'legal' });
    expect(result.current.isModalOpen).toBe(true);
  });

  it('opens, closes, and clears modals', () => {
    const { result } = renderHookWithContext(() => useModalContext());

    act(() => {
      result.current.openModal({ type: 'about' });
    });

    expect(result.current.modal).toEqual({ type: 'about' });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.modal).toEqual({ type: 'about' });
    expect(result.current.isModalOpen).toBe(false);

    act(() => {
      result.current.clearModal();
    });

    expect(result.current.modal).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
  });
});
