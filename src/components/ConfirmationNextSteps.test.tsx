import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ConfirmationNextSteps from './ConfirmationNextSteps';

const renderConfirmation = (props: React.ComponentProps<typeof ConfirmationNextSteps> = {}) => {
  return render(
    <MemoryRouter>
      <ConfirmationNextSteps {...props} />
    </MemoryRouter>
  );
};

describe('ConfirmationNextSteps', () => {
  it('renders default title and message', () => {
    renderConfirmation({ email: 'user@example.com' });

    expect(screen.getByText('Check your inbox')).toBeInTheDocument();
    expect(screen.getByText(/verification link/i)).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    renderConfirmation({ title: 'Reset link sent', message: 'Custom message body' });

    expect(screen.getByText('Reset link sent')).toBeInTheDocument();
    expect(screen.getByText('Custom message body')).toBeInTheDocument();
  });

  it('renders the generic icon badge by default', () => {
    const { container } = renderConfirmation();

    // Legacy behavior: no illustration variant is rendered, the icon badge is used.
    expect(screen.queryByTestId('confirmation-illustration')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the design-system illustration when a variant is provided', () => {
    const { container } = renderConfirmation({ variant: 'transactionSuccess' });

    expect(screen.getByTestId('confirmation-illustration')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('width')).toBe('96');
  });

  it('uses the failure illustration for failure variants', () => {
    const failure = renderConfirmation({ variant: 'transactionFailure' });
    const failureSvg = failure.container.querySelector('svg');
    expect(failureSvg).not.toBeNull();

    const success = renderConfirmation({ variant: 'transactionSuccess' });
    const successSvg = success.container.querySelector('svg');

    // Distinct glyphs: failure has two cross strokes, success has one check stroke.
    expect(successSvg?.innerHTML).not.toEqual(failureSvg?.innerHTML);
  });

  it('renders primary action as a link when primaryTo is set', () => {
    renderConfirmation({ primaryTo: '/login', primaryLabel: 'Back to Sign In' });

    expect(screen.getByRole('link', { name: 'Back to Sign In' })).toHaveAttribute('href', '/login');
  });

  it('calls onPrimary when primary action is a button (no primaryTo)', async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    // An empty (falsy) primaryTo forces the button branch instead of the link branch.
    renderConfirmation({ primaryTo: '', primaryLabel: 'Done', onPrimary });

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('shows resend success message and starts a cooldown', async () => {
    const user = userEvent.setup();
    const onResend = vi.fn().mockResolvedValue(undefined);
    renderConfirmation({ email: 'user@example.com', onResend });

    const resend = screen.getByRole('button', { name: 'Resend verification email' });
    await user.click(resend);

    expect(onResend).toHaveBeenCalledWith('user@example.com');
    expect(screen.getByText('Verification email resent. Check your inbox.')).toBeInTheDocument();
    // The cooldown label renders in the button's text (the accessible name stays the aria-label).
    const resendBtn = screen.getByRole('button', { name: 'Resend verification email' });
    expect(resendBtn).toHaveTextContent(/Resend again in \d+s/);
    expect(resendBtn).toBeDisabled();
  });

  it('handles resend failure gracefully', async () => {
    const user = userEvent.setup();
    const onResend = vi.fn().mockRejectedValue(new Error('network'));
    renderConfirmation({ onResend });

    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));

    expect(screen.getByText('Unable to resend. Please try again later.')).toBeInTheDocument();
  });

  it('calls onChangeEmail when provided', async () => {
    const user = userEvent.setup();
    const onChangeEmail = vi.fn();
    renderConfirmation({ onChangeEmail });

    await user.click(screen.getByRole('button', { name: 'Change email address' }));
    expect(onChangeEmail).toHaveBeenCalledTimes(1);
  });

  it('announces resend outcomes in a polite live region', async () => {
    const user = userEvent.setup();
    renderConfirmation({
      onResend: vi.fn().mockResolvedValue(undefined),
    });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('');

    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));
    expect(liveRegion).toHaveTextContent('Verification email resent. Check your inbox.');
  });
});