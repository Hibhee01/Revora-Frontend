import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BlacklistBulkRemoveConfirm } from './BlacklistBulkRemoveConfirm';

expect.extend(toHaveNoViolations);

// Mock the useUndoBanners hook
jest.mock('../../hooks/useUndoBanners', () => ({
  useUndoBanners: () => ({
    registerUndo: jest.fn(),
  }),
}));

describe('BlacklistBulkRemoveConfirm', () => {
  const mockEntries = [
    { id: '1', value: '192.168.1.1', type: 'IP' },
    { id: '2', value: '0xabc123...', type: 'Wallet' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn().mockResolvedValue(undefined),
    entries: mockEntries,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should not have basic accessibility violations', async () => {
    const { container } = render(<BlacklistBulkRemoveConfirm {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with a large selection of entries', () => {
    const largeEntries = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      value: `Entry ${i}`,
      type: 'IP',
    }));
    
    render(<BlacklistBulkRemoveConfirm {...defaultProps} entries={largeEntries} />);
    expect(screen.getByText(/50/i)).toBeInTheDocument();
    expect(screen.getByText('Entry 49')).toBeInTheDocument();
  });

  it('calls onClose when ESC key is pressed', () => {
    render(<BlacklistBulkRemoveConfirm {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables the remove button for 750ms on mount', () => {
    render(<BlacklistBulkRemoveConfirm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /Please wait\.\.\./i });
    expect(submitButton).toBeDisabled();

    // Fast-forward 750ms
    act(() => {
      jest.advanceTimersByTime(750);
    });

    // It should still be disabled because the form is invalid (no reason/initials)
    expect(screen.getByRole('button', { name: /Remove Entries/i })).toBeDisabled();
  });

  it('validates minimum length on free-text reason', async () => {
    render(<BlacklistBulkRemoveConfirm {...defaultProps} />);
    
    act(() => {
      jest.advanceTimersByTime(750);
    });

    const user = userEvent.setup({ delay: null });
    
    // Select "Other" preset
    await user.click(screen.getByRole('button', { name: 'Other' }));

    const textarea = screen.getByRole('textbox', { name: /Detailed Reason/i });
    const initialsInput = screen.getByRole('textbox', { name: /Actor Initials/i });
    
    // Type valid initials
    await user.type(initialsInput, 'JD');

    const submitButton = screen.getByRole('button', { name: /Remove Entries/i });

    // Type short reason
    await user.type(textarea, 'Short');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Reason must be at least 10 characters./i)).toBeInTheDocument();

    // Type valid reason
    await user.type(textarea, 'This is a valid reason');
    expect(submitButton).not.toBeDisabled();
    expect(screen.queryByText(/Reason must be at least 10 characters./i)).not.toBeInTheDocument();
  });

  it('handles network failure mid-remove', async () => {
    const onConfirmError = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<BlacklistBulkRemoveConfirm {...defaultProps} onConfirm={onConfirmError} />);

    act(() => {
      jest.advanceTimersByTime(750);
    });

    const user = userEvent.setup({ delay: null });
    
    // Select a valid preset
    await user.click(screen.getByRole('button', { name: 'Added by mistake' }));
    
    // Type valid initials
    await user.type(screen.getByRole('textbox', { name: /Actor Initials/i }), 'AB');

    const submitButton = screen.getByRole('button', { name: /Remove Entries/i });
    expect(submitButton).not.toBeDisabled();

    // Click confirm
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /Removing\.\.\./i })).toBeDisabled();

    // Wait for the promise to reject
    await waitFor(() => {
      expect(onConfirmError).toHaveBeenCalledTimes(1);
    });

    // Should return to normal state on error
    expect(screen.getByRole('button', { name: /Remove Entries/i })).not.toBeDisabled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('successfully removes entries and registers undo banner', async () => {
    const onConfirmSuccess = jest.fn().mockResolvedValue(undefined);
    render(<BlacklistBulkRemoveConfirm {...defaultProps} onConfirm={onConfirmSuccess} />);

    act(() => {
      jest.advanceTimersByTime(750);
    });

    const user = userEvent.setup({ delay: null });
    
    // Select a valid preset
    await user.click(screen.getByRole('button', { name: 'Added by mistake' }));
    
    // Type valid initials
    await user.type(screen.getByRole('textbox', { name: /Actor Initials/i }), 'JD');

    const submitButton = screen.getByRole('button', { name: /Remove Entries/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onConfirmSuccess).toHaveBeenCalledWith('Added by mistake', 'JD');
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
