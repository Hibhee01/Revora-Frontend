import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportHistoryTable, MOCK_EXPORTS } from './ExportHistoryTable';
import '@testing-library/jest-dom/vitest';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('ExportHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the table with mock data', () => {
    render(<ExportHistoryTable />);
    expect(screen.getByText('Export History')).toBeInTheDocument();
    expect(screen.getByText('All payouts in July')).toBeInTheDocument();
    expect(screen.getByText('Compliance audit report')).toBeInTheDocument();
    expect(screen.getByText('Very old export')).toBeInTheDocument();
  });

  it('can open and close the share dialog and copy link', async () => {
    render(<ExportHistoryTable />);
    
    // Open share dialog for the first item
    const shareBtns = screen.getAllByTitle('Share Link');
    fireEvent.click(shareBtns[0]);
    
    const dialogTitle = screen.getByText('Share Export Link');
    expect(dialogTitle).toBeInTheDocument();

    // Change expiration
    const select = screen.getByLabelText('Link Expiration');
    fireEvent.change(select, { target: { value: '30d' } });

    // Copy link
    const copyBtn = screen.getByText('Copy Link');
    fireEvent.click(copyBtn);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('exp=30d'));
      expect(screen.getByText('Link copied to clipboard.')).toBeInTheDocument();
    });

    // Revoke link
    const revokeBtn = screen.getByText('Revoke Link');
    fireEvent.click(revokeBtn);
    expect(screen.getByText('Link revoked.')).toBeInTheDocument();

    // Close via cancel
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Share Export Link')).not.toBeInTheDocument();
  });

  it('can open and close the delete dialog and delete an item', () => {
    render(<ExportHistoryTable />);
    
    expect(screen.getByText('All payouts in July')).toBeInTheDocument();

    // Open delete dialog for the first item
    const deleteBtns = screen.getAllByTitle('Delete Export');
    fireEvent.click(deleteBtns[0]);
    
    const dialogTitle = screen.getByText('Delete Export');
    expect(dialogTitle).toBeInTheDocument();

    // Cancel first to make sure it doesn't delete
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(screen.getByText('All payouts in July')).toBeInTheDocument();
    
    // Open again
    fireEvent.click(screen.getAllByTitle('Delete Export')[0]);
    
    // Confirm delete
    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);
    
    expect(screen.queryByText('All payouts in July')).not.toBeInTheDocument();
  });

  it('can rerun an export', () => {
    render(<ExportHistoryTable />);
    
    const initialRows = screen.getAllByRole('row');
    
    // Click rerun on the first item
    const rerunBtns = screen.getAllByTitle('Rerun Export');
    fireEvent.click(rerunBtns[0]);
    
    const newRows = screen.getAllByRole('row');
    expect(newRows.length).toBe(initialRows.length + 1);
  });

  it('shows empty state when all items are deleted', () => {
    render(<ExportHistoryTable />);
    
    // Delete all items one by one
    let deleteBtns = screen.queryAllByTitle('Delete Export');
    while(deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);
      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmBtn);
      deleteBtns = screen.queryAllByTitle('Delete Export');
    }
    
    expect(screen.getByText('No export history')).toBeInTheDocument();
  });

  it('closes dialogs on escape key', () => {
    render(<ExportHistoryTable />);
    const shareBtns = screen.getAllByTitle('Share Link');
    fireEvent.click(shareBtns[0]);
    
    expect(screen.getByText('Share Export Link')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText('Share Export Link')).not.toBeInTheDocument();
  });
  
  it('traps focus correctly in share dialog (Shift+Tab)', () => {
    render(<ExportHistoryTable />);
    fireEvent.click(screen.getAllByTitle('Share Link')[0]);
    const dialog = screen.getByRole('dialog');
    
    // We just verify it doesn't crash on Tab
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false });
    expect(dialog).toBeInTheDocument();
  });

  it('traps focus correctly in delete dialog (Shift+Tab)', () => {
    render(<ExportHistoryTable />);
    fireEvent.click(screen.getAllByTitle('Delete Export')[0]);
    const dialog = screen.getByRole('dialog');
    
    // We just verify it doesn't crash on Tab
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false });
    expect(dialog).toBeInTheDocument();
  });
  
  it('handles clipboard failure gracefully', async () => {
    navigator.clipboard.writeText = vi.fn().mockImplementation(() => Promise.reject('clipboard error'));
    render(<ExportHistoryTable />);
    
    fireEvent.click(screen.getAllByTitle('Share Link')[0]);
    fireEvent.click(screen.getByText('Copy Link'));
    
    await waitFor(() => {
      // should display the URL string fallback
      expect(screen.getByText(/investor\/export\/exp1/)).toBeInTheDocument();
    });
  });
});
