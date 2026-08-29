import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Signup } from './Signup';

const renderSignup = () => {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );
};

describe('Signup', () => {
  it('renders persona selection step initially', () => {
    renderSignup();

    expect(screen.getByText('Choose your account type')).toBeInTheDocument();
    expect(screen.getByText('Startup Founder')).toBeInTheDocument();
    expect(screen.getByText('Investor')).toBeInTheDocument();
  });

  it('proceeds to form step after selecting a persona', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('renders password strength meter in form step', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    expect(screen.getByText('At least 12 characters')).toBeInTheDocument();
  });

  it('updates rule states as user types password', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'Abcdef1!@#$%');

    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows error on submit with weak password', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'weak');

    await user.click(screen.getByText('Create Account'));

    expect(screen.getByText('Password must meet all requirements below.')).toBeInTheDocument();
  });

  it('submits successfully with a strong password', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'Abcdef1!@#$%');

    await user.click(screen.getByText('Create Account'));

    await screen.findByRole('heading', { level: 1, name: 'Check your inbox' }, { timeout: 3000 });
  });

  it('shows error alert when form has errors', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.click(screen.getByText('Create Account'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows error for missing name on submit', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'Abcdef1!@#$%');

    await user.click(screen.getByText('Create Account'));

    expect(screen.getByText('Full name is required')).toBeInTheDocument();
  });

  it('shows error for invalid email on submit', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email Address'), 'invalid');
    await user.type(screen.getByLabelText('Password'), 'Abcdef1!@#$%');

    await user.click(screen.getByText('Create Account'));

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('allows going back to persona selection from form', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.click(screen.getByText('Back'));

    expect(screen.getByText('Choose your account type')).toBeInTheDocument();
  });

  it('provides password visibility toggle', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    const toggleButton = screen.getByLabelText('Show password');
    await user.click(toggleButton);

    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('has accessible aria-describedby on password input', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('aria-describedby', 'password-rules');
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'Abcdef1!@#$%');

    await user.click(screen.getByText('Create Account'));

    const submitBtn = screen.getByRole('button', { name: 'Create Account' });
    expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    expect(submitBtn).toBeDisabled();
  });

  it('disables inputs during submission', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByText('Startup Founder'));

    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'Abcdef1!@#$%');

    await user.click(screen.getByText('Create Account'));

    expect(screen.getByLabelText('Full Name')).toBeDisabled();
    expect(screen.getByLabelText('Email Address')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });
});
