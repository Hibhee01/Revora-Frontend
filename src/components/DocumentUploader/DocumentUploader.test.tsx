import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DocumentUploader } from './DocumentUploader';
import type { UploadableFile } from './DocumentUploader';

expect.extend(toHaveNoViolations);

function makeFile(name: string, sizeBytes: number, type = 'application/pdf'): File {
  const file = new File(['x'.repeat(Math.min(sizeBytes, 10))], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function makeUploadable(overrides: Partial<UploadableFile> = {}): UploadableFile {
  return {
    id: 'f1',
    name: 'articles-of-incorporation.pdf',
    size: 204800,
    status: 'uploading',
    progress: 40,
    ...overrides,
  };
}

describe('DocumentUploader', () => {
  it('renders an empty dropzone with an accessible label and helper text', () => {
    render(
      <DocumentUploader
        files={[]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        label="Upload compliance documents"
        description="Attach signed agreements for this offering."
        accept=".pdf"
        maxSizeBytes={5 * 1024 * 1024}
      />,
    );

    expect(screen.getByText('Upload compliance documents')).toBeInTheDocument();
    expect(screen.getByText(/attach signed agreements/i)).toBeInTheDocument();
    expect(screen.getByText(/accepted formats: \.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/max 5\.0 mb per file/i)).toBeInTheDocument();
  });

  it('accepts a valid file selected via the native file input', () => {
    const onFilesAdded = vi.fn();
    render(<DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} />);

    const input = screen.getByTestId('doc-uploader-input');
    const file = makeFile('cap-table.pdf', 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(onFilesAdded.mock.calls[0][0]).toEqual([file]);
  });

  it('rejects a file over the size limit and announces the rejection instead of adding it', () => {
    const onFilesAdded = vi.fn();
    render(
      <DocumentUploader
        files={[]}
        onFilesAdded={onFilesAdded}
        onRemove={vi.fn()}
        maxSizeBytes={1024}
      />,
    );

    const input = screen.getByTestId('doc-uploader-input');
    const tooBig = makeFile('financials.pdf', 5000);
    fireEvent.change(input, { target: { files: [tooBig] } });

    expect(onFilesAdded).not.toHaveBeenCalled();
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent(/exceeds the 1\.0 kb size limit/i);
  });

  it('rejects a file whose type does not match the accept list', () => {
    const onFilesAdded = vi.fn();
    render(
      <DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} accept=".pdf" />,
    );

    const input = screen.getByTestId('doc-uploader-input');
    const wrongType = makeFile('logo.png', 1024, 'image/png');
    fireEvent.change(input, { target: { files: [wrongType] } });

    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/isn't a supported file type/i);
  });

  it('accepts a file matching an exact mime-type accept pattern', () => {
    const onFilesAdded = vi.fn();
    render(
      <DocumentUploader
        files={[]}
        onFilesAdded={onFilesAdded}
        onRemove={vi.fn()}
        accept="application/pdf"
      />,
    );

    const input = screen.getByTestId('doc-uploader-input');
    const file = makeFile('cap-table.pdf', 1024, 'application/pdf');
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it('accepts a file matching a wildcard mime-type accept pattern', () => {
    const onFilesAdded = vi.fn();
    render(
      <DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} accept="image/*" />,
    );

    const input = screen.getByTestId('doc-uploader-input');
    const file = makeFile('id-photo.png', 1024, 'image/png');
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it('does not throw when dragging over the dropzone', () => {
    const { container } = render(
      <DocumentUploader files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );
    const dropzone = container.querySelector('.doc-uploader-dropzone') as HTMLElement;
    expect(() => fireEvent.dragOver(dropzone, { dataTransfer: { files: [] } })).not.toThrow();
  });

  it('accepts files dropped onto the dropzone', () => {
    const onFilesAdded = vi.fn();
    const { container } = render(
      <DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} />,
    );

    const dropzone = container.querySelector('.doc-uploader-dropzone') as HTMLElement;
    const file = makeFile('bank-statement.pdf', 2048);

    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [file] } });
    expect(dropzone.className).toContain('doc-uploader-dropzone--dragging');

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(dropzone.className).not.toContain('doc-uploader-dropzone--dragging');
  });

  it('does nothing when the file input change event carries no files', () => {
    const onFilesAdded = vi.fn();
    render(<DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} />);

    const input = screen.getByTestId('doc-uploader-input');
    fireEvent.change(input, { target: { files: [] } });

    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it('does nothing when a drop event carries no files', () => {
    const onFilesAdded = vi.fn();
    const { container } = render(
      <DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} />,
    );
    const dropzone = container.querySelector('.doc-uploader-dropzone') as HTMLElement;

    expect(() => fireEvent.drop(dropzone, { dataTransfer: {} })).not.toThrow();
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it('stays dragging until every drag-enter is matched by a drag-leave', () => {
    const { container } = render(
      <DocumentUploader files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );
    const dropzone = container.querySelector('.doc-uploader-dropzone') as HTMLElement;

    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone.className).toContain('doc-uploader-dropzone--dragging');

    fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone.className).not.toContain('doc-uploader-dropzone--dragging');
  });

  it('clears the dragging state on drag leave', () => {
    const { container } = render(
      <DocumentUploader files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );
    const dropzone = container.querySelector('.doc-uploader-dropzone') as HTMLElement;

    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone.className).toContain('doc-uploader-dropzone--dragging');

    fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone.className).not.toContain('doc-uploader-dropzone--dragging');
  });

  it('renders a progress bar for a file that is uploading', () => {
    render(
      <DocumentUploader
        files={[makeUploadable({ progress: 55 })]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const tile = screen.getByTestId('doc-uploader-tile');
    const progress = within(tile).getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '55');
  });

  it('announces successful completion via the live region', () => {
    const { rerender } = render(
      <DocumentUploader files={[makeUploadable()]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );

    rerender(
      <DocumentUploader
        files={[makeUploadable({ status: 'completed', progress: undefined })]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/uploaded successfully/i);
    expect(screen.getByTestId('doc-uploader-tile')).toHaveTextContent(/uploaded/i);
  });

  it('shows an error tile with a retry control and announces the failure', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <DocumentUploader
        files={[makeUploadable()]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        onRetry={onRetry}
      />,
    );

    rerender(
      <DocumentUploader
        files={[
          makeUploadable({
            status: 'error',
            progress: undefined,
            errorMessage: 'Network error. Check your connection and try again.',
          }),
        ]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
    expect(screen.getByRole('status')).toHaveTextContent(/failed to upload/i);

    fireEvent.click(screen.getByRole('button', { name: /retry upload/i }));
    expect(onRetry).toHaveBeenCalledWith('f1');
  });

  it('calls onRemove with the file id when the remove control is pressed', () => {
    const onRemove = vi.fn();
    render(
      <DocumentUploader
        files={[makeUploadable({ status: 'completed', progress: undefined })]}
        onFilesAdded={vi.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove articles-of-incorporation\.pdf/i }));
    expect(onRemove).toHaveBeenCalledWith('f1');
  });

  it('labels the remove control as a cancel action while a file is still uploading', () => {
    render(
      <DocumentUploader files={[makeUploadable()]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /cancel upload of/i })).toBeInTheDocument();
  });

  it('only accepts the first file when multiple is false', () => {
    const onFilesAdded = vi.fn();
    render(
      <DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} multiple={false} />,
    );

    const input = screen.getByTestId('doc-uploader-input');
    const first = makeFile('a.pdf', 100);
    const second = makeFile('b.pdf', 100);
    fireEvent.change(input, { target: { files: [first, second] } });

    expect(onFilesAdded).toHaveBeenCalledWith([first]);
  });

  it('ignores drag-and-drop when disabled', () => {
    const onFilesAdded = vi.fn();
    const { container } = render(
      <DocumentUploader files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} disabled />,
    );
    const dropzone = container.querySelector('.doc-uploader-dropzone') as HTMLElement;
    const file = makeFile('a.pdf', 100);

    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [file] } });
    expect(dropzone.className).not.toContain('doc-uploader-dropzone--dragging');
    expect(dropzone.className).toContain('doc-uploader-dropzone--disabled');

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when an error file has no errorMessage', () => {
    const { rerender } = render(
      <DocumentUploader files={[makeUploadable()]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );

    rerender(
      <DocumentUploader
        files={[makeUploadable({ status: 'error', progress: undefined, errorMessage: undefined })]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/upload failed\. please try again\./i);
    expect(screen.getByRole('status')).toHaveTextContent(/failed to upload\./i);
  });

  it('has no axe-detectable accessibility violations in an empty and populated state', async () => {
    const { container, rerender } = render(
      <DocumentUploader files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <DocumentUploader
        files={[
          makeUploadable(),
          makeUploadable({ id: 'f2', status: 'completed', progress: undefined }),
          makeUploadable({
            id: 'f3',
            status: 'error',
            progress: undefined,
            errorMessage: 'Upload failed.',
          }),
        ]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
