import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPassword } from './ForgotPassword';

const renderForgotPassword = () => {
  return render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );
};

describe('ForgotPassword', () => {
  it('renders the forgot password form', () => {
    renderForgotPassword();

    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('shows error for empty email on submit', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  it('shows error for invalid email on submit', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email Address'), 'invalid');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    const button = screen.getByRole('button', { name: 'Send Reset Link' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('shows success state after loading then transitions to submitted view', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await screen.findByRole('heading', { level: 1, name: 'Reset link sent' }, { timeout: 3000 });

    expect(screen.getByText(/you'll receive an email/)).toBeInTheDocument();
  });

  it('clears error on successful submission', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email Address'), 'invalid');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Email Address'));
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await screen.findByRole('heading', { level: 1, name: 'Reset link sent' }, { timeout: 3000 });
    expect(screen.queryByText('Please enter a valid email address.')).not.toBeInTheDocument();
  });

  it('disables input during submission', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByLabelText('Email Address')).toBeDisabled();
  });

  it('has accessible email input', () => {
    renderForgotPassword();

    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('aria-required', 'true');
  });

  it('renders back to sign in link', () => {
    renderForgotPassword();

    expect(screen.getByText('Back to Sign In')).toBeInTheDocument();
  });
});
