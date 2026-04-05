import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LazyModalContent } from './lazy-modal-content.tsx';
import { renderWithContext } from '../../../../test/render-with-context.tsx';

import type { ModalState } from '../../../context/modal/modal-context.tsx';

describe('<ModalRenderer />', () => {
  it('renders nothing when modal is null', () => {
    const { container } = renderWithContext(<LazyModalContent modal={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each<[Exclude<ModalState, null>, string]>([
    [{ type: 'about' }, 'About'],
    [{ type: 'controls' }, 'Controls'],
    [{ type: 'fileSystem' }, 'File System'],
    [{ type: 'importExport' }, 'Import/Export'],
    [{ type: 'legal' }, 'Legal'],
    [{ type: 'login' }, 'Login'],
    [{ type: 'downloadSave' }, 'Download Save'],
    [{ type: 'saveStates' }, 'Manage Save States'],
    [{ type: 'cheats' }, 'Manage Cheats'],
    [{ type: 'loadLocalRom' }, 'Load Local Rom'],
    [{ type: 'loadSave' }, 'Load Save'],
    [{ type: 'loadRom' }, 'Load Rom'],
    [{ type: 'uploadSaveToServer' }, 'Send Save to Server'],
    [{ type: 'uploadRomToServer' }, 'Send Rom to Server'],
    [{ type: 'uploadFiles' }, 'Upload Files'],
    [{ type: 'emulatorSettings' }, 'Emulator Settings']
  ])('renders prop-less modal %s', async (modal, heading) => {
    renderWithContext(<LazyModalContent modal={modal} />);

    expect(
      await screen.findByRole('heading', { name: heading })
    ).toBeInTheDocument();
  });

  it('renders a prop-ful modal with its props', async () => {
    const onLoadOrDismiss = () => undefined;

    renderWithContext(
      <LazyModalContent
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
    expect(
      screen.getByText('https://example.com/test.gba')
    ).toBeInTheDocument();
  });

  it('throws for an invalid modal type at runtime', () => {
    expect(() => {
      renderWithContext(
        <LazyModalContent modal={JSON.parse('{"type":"not-real"}')} />
      );
    }).toThrow('Unhandled modal type');
  });
});
