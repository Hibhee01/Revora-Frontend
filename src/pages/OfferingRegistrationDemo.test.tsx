import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfferingRegistrationDemo } from './OfferingRegistrationDemo';

function renderDemo() {
  return render(
    <MemoryRouter>
      <OfferingRegistrationDemo />
    </MemoryRouter>,
  );
}

function makeFile(name: string, sizeBytes: number): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('OfferingRegistrationDemo', () => {
  it('renders the offering registration timeline and uploader', () => {
    renderDemo();
    expect(screen.getByRole('heading', { name: /offering registration/i })).toBeInTheDocument();
    expect(screen.getByText('Upload KYC documents')).toBeInTheDocument();
  });

  it('simulates an upload to completion for a valid file', async () => {
    renderDemo();
    const input = screen.getByTestId('doc-uploader-input');
    const file = makeFile('id-card.pdf', 1024);

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('id-card.pdf')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('doc-uploader-tile')).toHaveTextContent(/uploaded/i);
  });

  it('simulates a network failure for an oversized demo file and supports retry', async () => {
    renderDemo();
    const input = screen.getByTestId('doc-uploader-input');
    const bigFile = makeFile('financials.pdf', 9 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [bigFile] } });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't upload/i);

    fireEvent.click(screen.getByRole('button', { name: /retry upload/i }));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('doc-uploader-tile')).toHaveTextContent(/uploaded/i);
  });
});
