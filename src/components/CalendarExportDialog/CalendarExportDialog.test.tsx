import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import '@testing-library/jest-dom';
import { CalendarExportDialog } from './CalendarExportDialog';

describe('CalendarExportDialog', () => {
  beforeAll(() => {
    // Mock dialog methods since jsdom doesn't support them fully
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  const setup = (isOpen = true) => {
    const onClose = vi.fn();
    const utils = render(<CalendarExportDialog isOpen={isOpen} onClose={onClose} />);
    return { ...utils, onClose };
  };

  it('renders without crashing', () => {
    setup();
    expect(screen.getByText('Subscribe to Calendar')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = setup();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('changes scope when tabs are clicked', () => {
    setup();
    const singleTab = screen.getByRole('tab', { name: /single payout/i });
    fireEvent.click(singleTab);
    expect(singleTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByDisplayValue(/single/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { onClose } = setup();
    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('copies URL to clipboard', async () => {
    setup();
    const originalClipboard = navigator.clipboard;
    let clipboardText = '';
    
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation((text) => {
          clipboardText = text;
          return Promise.resolve();
        })
      }
    });

    const copyBtn = screen.getByRole('button', { name: /copy url/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(clipboardText).toContain('https://api.revora.co/v1/calendar/payouts/');

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });

    // restore clipboard
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it('regenerates URL', () => {
    setup();
    const input = screen.getByLabelText(/subscription url/i) as HTMLInputElement;
    const initialUrl = input.value;
    
    const regenBtn = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenBtn);
    
    expect(input.value).not.toBe(initialUrl);
  });

  it('revokes URL', () => {
    setup();
    const revokeBtn = screen.getByRole('button', { name: /revoke/i });
    fireEvent.click(revokeBtn);
    
    const input = screen.getByLabelText(/subscription url/i) as HTMLInputElement;
    expect(input.value).toBe('URL Revoked');
    
    // Revoke should disable copy and revoke buttons
    const copyBtn = screen.getByRole('button', { name: /copy url/i });
    expect(copyBtn).toBeDisabled();
    expect(revokeBtn).toBeDisabled();
  });
});
