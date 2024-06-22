import { fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DragAndDropInput } from './drag-and-drop-input.tsx';
import { renderWithContext } from '../../../test/render-with-context.tsx';

describe('<DragAndDropInput />', () => {
  it('renders with provided id and copy', () => {
    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={vi.fn()}
        validFileExtensions={[]}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    expect(screen.getByLabelText('Upload File')).toHaveAttribute(
      'id',
      'testId'
    );
    expect(screen.getByText('Upload file here')).toBeVisible();
  });

  it('clicks file input when drop area is clicked', async () => {
    const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={vi.fn()}
        validFileExtensions={[]}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    await userEvent.click(screen.getByLabelText('Upload File'));

    expect(inputClickSpy).toHaveBeenCalledOnce();
  });

  it('calls onDrop with accepted file from picker', async () => {
    const testFile = new File(['Some test file contents'], 'test_file.test');
    const onDropSpy = vi.fn();

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    await userEvent.upload(screen.getByTestId('hidden-file-input'), testFile);

    expect(onDropSpy).toHaveBeenCalledOnce();
    expect(onDropSpy).toHaveBeenCalledWith([testFile]);

    expect(screen.getByText('File to upload:')).toBeVisible();
    expect(screen.getByText('test_file.test')).toBeVisible();
  });

  it('calls onDrop with multiple accepted files from picker', async () => {
    const testFiles = [
      new File(['Some test file contents 1'], 'test_file1.test'),
      new File(['Some test file contents 2'], 'test_file2.test')
    ];
    const onDropSpy = vi.fn();

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
        multiple
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    await userEvent.upload(screen.getByTestId('hidden-file-input'), testFiles);

    expect(onDropSpy).toHaveBeenCalledOnce();
    expect(onDropSpy).toHaveBeenCalledWith(testFiles);

    expect(screen.getByText('Files to upload:')).toBeVisible();
    expect(screen.getByText('test_file1.test')).toBeVisible();
    expect(screen.getByText('test_file2.test')).toBeVisible();
  });

  it('calls onDrop with accepted file from drag and drop', async () => {
    const testFiles = [new File(['Some test file contents'], 'test_file.test')];
    const onDropSpy = vi.fn();

    const data = {
      dataTransfer: {
        testFiles,
        items: testFiles.map((file) => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        })),
        types: ['Files']
      }
    };

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    const dropArea = screen.getByLabelText('Upload File');

    fireEvent.dragEnter(dropArea, data);
    fireEvent.drop(dropArea, data);

    await waitFor(() => expect(onDropSpy).toHaveBeenCalledOnce());

    expect(onDropSpy).toHaveBeenCalledWith(testFiles);

    expect(screen.getByText('File to upload:')).toBeVisible();
    expect(screen.getByText('test_file.test')).toBeVisible();
  });

  it('calls onDrop with multiple accepted files from drag and drop', async () => {
    const testFiles = [
      new File(['Some test file contents 1'], 'test_file1.test'),
      new File(['Some test file contents 2'], 'test_file2.test')
    ];
    const onDropSpy = vi.fn();

    const data = {
      dataTransfer: {
        testFiles,
        items: testFiles.map((file) => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        })),
        types: ['Files']
      }
    };

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
        multiple
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    const dropArea = screen.getByLabelText('Upload File');

    fireEvent.dragEnter(dropArea, data);
    fireEvent.drop(dropArea, data);

    await waitFor(() => expect(onDropSpy).toHaveBeenCalledOnce());

    expect(onDropSpy).toHaveBeenCalledWith(testFiles);

    expect(screen.getByText('Files to upload:')).toBeVisible();
    expect(screen.getByText('test_file1.test')).toBeVisible();
    expect(screen.getByText('test_file2.test')).toBeVisible();
  });

  it('calls onDrop with empty array if file dialog is canceled', async () => {
    const onDropSpy = vi.fn();

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
        multiple
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    await userEvent.click(screen.getByLabelText('Upload File'));

    // we can only test this indirectly, dropzone is listening for body focus
    fireEvent.focus(document.body, { bubbles: true });

    await waitFor(() => expect(onDropSpy).toHaveBeenCalledOnce());
    expect(onDropSpy).toHaveBeenCalledWith([]);
  });

  it('renders error if too many files are specified', async () => {
    const testFiles = [
      new File(['Some test file contents 1'], 'test_file1.test'),
      new File(['Some test file contents 2'], 'test_file2.test')
    ];
    const onDropSpy = vi.fn();

    const data = {
      dataTransfer: {
        testFiles,
        items: testFiles.map((file) => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        })),
        types: ['Files']
      }
    };

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    const dropArea = screen.getByLabelText('Upload File');

    fireEvent.dragEnter(dropArea, data);
    fireEvent.drop(dropArea, data);

    expect(await screen.findByText('Too many files')).toBeVisible();

    expect(onDropSpy).toHaveBeenCalledOnce();
    expect(onDropSpy).toHaveBeenCalledWith([]);
  });

  it('renders error if file extension is incorrect', async () => {
    const testFiles = [
      new File(['Some test file contents'], 'test_file.unknown')
    ];
    const onDropSpy = vi.fn();

    const data = {
      dataTransfer: {
        testFiles,
        items: testFiles.map((file) => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        })),
        types: ['Files']
      }
    };

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test']}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    const dropArea = screen.getByLabelText('Upload File');

    fireEvent.dragEnter(dropArea, data);
    fireEvent.drop(dropArea, data);

    expect(
      await screen.findByText('At least one .test file is required')
    ).toBeVisible();

    expect(onDropSpy).toHaveBeenCalledOnce();
    expect(onDropSpy).toHaveBeenCalledWith([]);
  });

  it('renders error if regex extension is incorrect', async () => {
    const testFiles = [
      new File(['Some test file contents 1'], 'test_file.unknown')
    ];
    const onDropSpy = vi.fn();

    const data = {
      dataTransfer: {
        testFiles,
        items: testFiles.map((file) => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        })),
        types: ['Files']
      }
    };

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={[{ regex: /.test[0-9+]/, displayText: '.test' }]}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    const dropArea = screen.getByLabelText('Upload File');

    fireEvent.dragEnter(dropArea, data);
    fireEvent.drop(dropArea, data);

    expect(
      await screen.findByText('At least one .test file is required')
    ).toBeVisible();

    expect(onDropSpy).toHaveBeenCalledOnce();
    expect(onDropSpy).toHaveBeenCalledWith([]);
  });

  it('renders input with accept if all file extensions are strings', () => {
    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={vi.fn()}
        validFileExtensions={['.test1', '.test2']}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    expect(screen.getByTestId('hidden-file-input')).toHaveAttribute(
      'accept',
      '.test1,.test2'
    );
  });

  it('does not call onDrop if files are rejected by accept', async () => {
    const testFile = new File(['Some test file contents'], 'test_file.test');
    const onDropSpy = vi.fn();

    renderWithContext(
      <DragAndDropInput
        id="testId"
        ariaLabel="Upload File"
        name="testFile"
        onDrop={onDropSpy}
        validFileExtensions={['.test1', '.test2']}
      >
        <p>Upload file here</p>
      </DragAndDropInput>
    );

    await userEvent.upload(screen.getByTestId('hidden-file-input'), testFile);

    expect(onDropSpy).not.toHaveBeenCalledOnce();
    expect(screen.queryByText('File to upload:')).not.toBeInTheDocument();
    expect(screen.queryByText('test_file.test')).not.toBeInTheDocument();
  });
});
