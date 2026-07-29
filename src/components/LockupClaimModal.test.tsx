import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LockupClaimModal } from './LockupClaimModal';

describe('LockupClaimModal', () => {
  it('renders unlocked amount, gas detail, and claim choices in an accessible dialog', () => {
    render(<LockupClaimModal isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: /claim your unlocked balance/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/unlocked amount/i)).toBeInTheDocument();
    expect(screen.getByText(/estimated gas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim later/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /auto-claim on next unlock/i })).toBeInTheDocument();
  });

  it('shows a success state when the investor claims now', async () => {
    const user = userEvent.setup();
    render(<LockupClaimModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /claim now/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/claim request queued/i);
  });

  it('shows a warning state when gas fees are high', async () => {
    const user = userEvent.setup();
    render(<LockupClaimModal isOpen onClose={vi.fn()} gasEstimate={95} />);

    await user.click(screen.getByRole('button', { name: /claim now/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/high gas fees/i);
  });
});
