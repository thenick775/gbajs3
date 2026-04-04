import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ModalRenderer } from './modal-renderer.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';

describe('<ModalRenderer />', () => {
  it('renders nothing when modal is null', () => {
    const { container } = renderWithContext(<ModalRenderer modal={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a prop-less modal by type', async () => {
    renderWithContext(<ModalRenderer modal={{ type: 'about' }} />);

    expect(
      await screen.findByRole('heading', { name: 'About' })
    ).toBeInTheDocument();
  });

  it('renders a propful modal with its props', async () => {
    const onLoadOrDismiss = () => undefined;

    renderWithContext(
      <ModalRenderer
        modal={{
          type: 'uploadPublicExternalRoms',
          props: {
            url: new URL('https://example.com/test.gba'),
            onLoadOrDismiss
          }
        }}
      />
    );

    expect(
      await screen.findByRole('heading', { name: 'Upload Public Rom' })
    ).toBeInTheDocument();
    expect(screen.getByText('https://example.com/test.gba')).toBeInTheDocument();
  });
});
