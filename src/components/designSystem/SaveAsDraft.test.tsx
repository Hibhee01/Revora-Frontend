import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveAsDraft } from './SaveAsDraft';

describe('SaveAsDraft Component', () => {
  it('renders initial state correctly', () => {
    render(<SaveAsDraft onSave={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Save progress as draft/i })).toBeInTheDocument();
    expect(screen.queryByText(/Last saved at/i)).not.toBeInTheDocument();
  });

  it('shows saving state and then success message on successful save', async () => {
    jest.useFakeTimers();
    const onSave = jest.fn().mockResolvedValueOnce(undefined);
    render(<SaveAsDraft onSave={onSave} />);
    
    const saveButton = screen.getByRole('button', { name: /Save progress as draft/i });
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    
    // Wait for the promise to resolve and state to update
    await waitFor(() => {
      expect(screen.getByText(/Draft saved/i)).toBeInTheDocument();
    });
    
    expect(screen.queryByText(/Saving.../i)).not.toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
    
    // Fast-forward to clear success message
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.queryByText(/Draft saved/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Last saved at/i)).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('shows error state and retry button on failed save', async () => {
    const onSave = jest.fn().mockRejectedValueOnce(new Error('Network error'));
    render(<SaveAsDraft onSave={onSave} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Save progress as draft/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
    
    const retryButton = screen.getByRole('button', { name: /Retry saving draft/i });
    expect(retryButton).toBeInTheDocument();
    
    // Click retry
    onSave.mockResolvedValueOnce(undefined);
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Draft saved/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
  });

  it('manages focus on error for accessibility', async () => {
    const onSave = jest.fn().mockRejectedValueOnce(new Error('Focus test'));
    render(<SaveAsDraft onSave={onSave} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Save progress as draft/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Focus test/i)).toBeInTheDocument();
    });
    
    // The error container should be focused
    const errorContainer = screen.getByText(/Focus test/i).closest('.status-message.error');
    expect(errorContainer).toHaveFocus();
  });
});
