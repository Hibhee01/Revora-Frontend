import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PayoutRescheduleModal } from './PayoutRescheduleModal';

describe('PayoutRescheduleModal', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const conflicts = [
    { id: '1', type: 'soft' as const, message: 'Soft conflict' },
    { id: '2', type: 'hard' as const, message: 'Hard conflict' }
  ];

  it('renders correctly', () => {
    render(<PayoutRescheduleModal isOpen={true} onClose={onClose} onConfirm={onConfirm} initialDate="2026-07-28" conflicts={[]} />);
    expect(screen.getByText('Reschedule Payout')).toBeInTheDocument();
  });

  it('shows conflicts', () => {
    render(<PayoutRescheduleModal isOpen={true} onClose={onClose} onConfirm={onConfirm} initialDate="2026-07-28" conflicts={conflicts} />);
    expect(screen.getByText('Soft conflict')).toBeInTheDocument();
    expect(screen.getByText('Hard conflict')).toBeInTheDocument();
  });

  it('blocks confirm button when hard conflict exists', () => {
    render(<PayoutRescheduleModal isOpen={true} onClose={onClose} onConfirm={onConfirm} initialDate="2026-07-28" conflicts={conflicts} />);
    const confirmButton = screen.getByText('Confirm Reschedule');
    expect(confirmButton).toBeDisabled();
  });

  it('calls onConfirm when clicked', () => {
    render(<PayoutRescheduleModal isOpen={true} onClose={onClose} onConfirm={onConfirm} initialDate="2026-07-28" conflicts={[]} />);
    const confirmButton = screen.getByText('Confirm Reschedule');
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });
});
