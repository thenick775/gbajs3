import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ModalBody } from './modal-body.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';

describe('<ModalBody />', () => {
  it('renders children', () => {
    renderWithContext(<ModalBody>Test Footer Content</ModalBody>);

    expect(screen.getByText('Test Footer Content')).toBeInTheDocument();
  });

  it('container matches snapshot', () => {
    renderWithContext(<ModalBody>Test Footer Content</ModalBody>);

    expect(screen.getByText('Test Footer Content')).toMatchSnapshot();
  });
});
