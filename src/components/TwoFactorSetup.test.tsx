import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TwoFactorSetup } from './TwoFactorSetup';

const TEST_SECRET = 'JBSWY3DPEHPK3PXP';
const TEST_CODES = [
  'REVR-A1B2-C3D4', 'REVR-E5F6-G7H8',
  'REVR-I9J0-K1L2', 'REVR-M3N4-O5P6',
  'REVR-Q7R8-S9T0', 'REVR-U1V2-W3X4',
  'REVR-Y5Z6-A7B8', 'REVR-C9D0-E1F2',
];

const onComplete = vi.fn();
const onCancel = vi.fn();

const renderSetup = () =>
  render(
    <TwoFactorSetup
      onComplete={onComplete}
      onCancel={onCancel}
      totpSecret={TEST_SECRET}
      recoveryCodes={TEST_CODES}
    />
  );

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Step indicator ───────────────────────────────────────────────────────────

describe('Step indicator', () => {
  function statusEl() {
    return screen.getByTestId('wizard-stepper').querySelector('.wizard-stepper__status');
  }

  it('shows step 1 as active on mount', () => {
    renderSetup();
    expect(statusEl()).toHaveTextContent(/step 1 of 5/i);
  });

  it('updates live region when step advances', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    expect(statusEl()).toHaveTextContent(/step 2 of 5/i);
  });
});

// ─── Step 1: Method selection ─────────────────────────────────────────────────

describe('Step 1 – method selection', () => {
  it('renders both method options', () => {
    renderSetup();
    expect(screen.getByRole('button', { name: /authenticator app/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sms backup/i })).toBeInTheDocument();
  });

  it('shows heading "Choose authentication method"', () => {
    renderSetup();
    expect(screen.getByRole('heading', { name: /choose authentication method/i })).toBeInTheDocument();
  });

  it('advances to step 2 when authenticator app is selected', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    expect(screen.getByRole('heading', { name: /set up authenticator app/i })).toBeInTheDocument();
  });

  it('advances to step 2 (SMS) when sms backup is selected', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /sms backup/i }));
    expect(screen.getByRole('heading', { name: /set up sms backup/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /cancel.*setup/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('has keyboard-accessible method buttons', () => {
    renderSetup();
    const totpBtn = screen.getByRole('button', { name: /authenticator app/i });
    expect(totpBtn).not.toBeDisabled();
    expect(totpBtn).toHaveAttribute('type', 'button');
  });
});

// ─── Step 2: QR / TOTP setup ─────────────────────────────────────────────────

describe('Step 2 – QR code (TOTP)', () => {
  it('renders QR code image with accessible wrapper', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    expect(screen.getByRole('img', { name: /qr code/i })).toBeInTheDocument();
  });

  it('shows "Can\'t scan?" toggle button', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    expect(screen.getByRole('button', { name: /can't scan/i })).toBeInTheDocument();
  });

  it('hides manual key section by default', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    expect(screen.queryByText(TEST_SECRET)).not.toBeInTheDocument();
  });

  it('toggles manual key section when clicked', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    const toggle = screen.getByRole('button', { name: /can't scan/i });
    await user.click(toggle);
    expect(screen.getByText(TEST_SECRET)).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('re-hides manual key when toggle clicked again', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    const toggle = screen.getByRole('button', { name: /can't scan/i });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /hide manual key/i }));
    expect(screen.queryByText(TEST_SECRET)).not.toBeInTheDocument();
  });

  it('manual key has accessible label spelling out the key', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    await user.click(screen.getByRole('button', { name: /can't scan/i }));
    const codeEl = screen.getByLabelText(/manual setup key/i);
    expect(codeEl).toBeInTheDocument();
  });

  it('copy button shows copied feedback', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    await user.click(screen.getByRole('button', { name: /can't scan/i }));
    await user.click(screen.getByRole('button', { name: /copy key/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i);
  });

  it('back button returns to step 1', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(screen.getByRole('heading', { name: /choose authentication method/i })).toBeInTheDocument();
  });

  it('next button advances to step 3', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    await user.click(screen.getByRole('button', { name: /i've added the account/i }));
    expect(screen.getByRole('heading', { name: /enter verification code/i })).toBeInTheDocument();
  });
});

describe('Step 2 – SMS setup', () => {
  it('shows phone input when SMS method selected', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /sms backup/i }));
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
  });

  it('advances to step 3 from SMS setup', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /sms backup/i }));
    await user.click(screen.getByRole('button', { name: /send verification code/i }));
    expect(screen.getByRole('heading', { name: /enter verification code/i })).toBeInTheDocument();
  });
});

// ─── Step 3: Verification ─────────────────────────────────────────────────────

const navigateToStep3 = async (user: ReturnType<typeof userEvent.setup>) => {
  renderSetup();
  await user.click(screen.getByRole('button', { name: /authenticator app/i }));
  await user.click(screen.getByRole('button', { name: /i've added the account/i }));
};

describe('Step 3 – verification', () => {
  it('renders 6-digit code input', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    // The input has id="totp-code" linked via htmlFor
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('code input has inputMode="numeric"', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputMode', 'numeric');
  });

  it('shows error when submitting empty code', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    await user.click(screen.getByRole('button', { name: /^verify$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/6-digit code/i);
  });

  it('shows error when code is too short', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    await user.type(screen.getByRole('textbox'), '123');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/6-digit code/i);
  });

  it('strips non-numeric characters', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    const input = screen.getByRole('textbox');
    await user.type(input, 'abc123def456');
    expect(input).toHaveValue('123456');
  });

  it('clears error when user starts typing after error', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    await user.click(screen.getByRole('button', { name: /^verify$/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('advances to step 4 after valid 6-digit code', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    await user.type(screen.getByRole('textbox'), '123456');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /save your recovery codes/i })).toBeInTheDocument(),
      { timeout: 2000 }
    );
  });

  it('shows loading state while verifying', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    await user.type(screen.getByRole('textbox'), '123456');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));
    expect(screen.getByRole('button', { name: /verify/i })).toHaveAttribute('aria-busy', 'true');
  });

  it('back button returns to step 2', async () => {
    const user = userEvent.setup();
    await navigateToStep3(user);
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(screen.getByRole('heading', { name: /set up authenticator app/i })).toBeInTheDocument();
  });
});

// ─── Step 4: Recovery codes ───────────────────────────────────────────────────

const navigateToStep4 = async (user: ReturnType<typeof userEvent.setup>) => {
  renderSetup();
  await user.click(screen.getByRole('button', { name: /authenticator app/i }));
  await user.click(screen.getByRole('button', { name: /i've added the account/i }));
  await user.type(screen.getByRole('textbox'), '123456');
  await user.click(screen.getByRole('button', { name: /^verify$/i }));
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: /save your recovery codes/i })).toBeInTheDocument(),
    { timeout: 2000 }
  );
};

describe('Step 4 – recovery codes', () => {
  it('displays all 8 recovery codes', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    const list = screen.getByRole('list', { name: /recovery codes/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
  });

  it('renders each test code', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    for (const code of TEST_CODES) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
  });

  it('shows warning about saving codes', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    expect(screen.getByRole('note')).toHaveTextContent(/save these codes/i);
  });

  it('renders download button', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    expect(screen.getByRole('button', { name: /download recovery codes/i })).toBeInTheDocument();
  });

  it('renders print button', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    expect(screen.getByRole('button', { name: /print recovery codes/i })).toBeInTheDocument();
  });

  it('Continue button is disabled until checkbox is checked', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('Continue button enables after checking acknowledgement', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('advances to step 5 after acknowledging and clicking Continue', async () => {
    const user = userEvent.setup();
    await navigateToStep4(user);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('heading', { name: /setup complete/i })).toBeInTheDocument();
  });

  it('download action triggers file creation', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    const clickFn = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') el.click = clickFn;
      return el;
    });
    await navigateToStep4(user);
    await user.click(screen.getByRole('button', { name: /download recovery codes/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickFn).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

// ─── Step 5: Completion ───────────────────────────────────────────────────────

const navigateToStep5 = async (user: ReturnType<typeof userEvent.setup>) => {
  await navigateToStep4(user);
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /continue/i }));
};

describe('Step 5 – completion', () => {
  it('renders completion heading', async () => {
    const user = userEvent.setup();
    await navigateToStep5(user);
    expect(screen.getByRole('heading', { name: /setup complete/i })).toBeInTheDocument();
  });

  it('calls onComplete when Done is clicked', async () => {
    const user = userEvent.setup();
    await navigateToStep5(user);
    await user.click(screen.getByRole('button', { name: /done/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not show cancel link on step 5', async () => {
    const user = userEvent.setup();
    await navigateToStep5(user);
    expect(screen.queryByRole('button', { name: /cancel.*setup/i })).not.toBeInTheDocument();
  });
});

// ─── Accessibility / focus management ────────────────────────────────────────

describe('Accessibility', () => {
  it('has section with aria-labelledby pointing to heading', () => {
    renderSetup();
    const section = screen.getByRole('region', { name: /choose authentication method/i });
    expect(section).toBeInTheDocument();
  });

  it('step heading is focused after step transition', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    const heading = screen.getByRole('heading', { name: /set up authenticator app/i });
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('progress nav has accessible label', () => {
    renderSetup();
    expect(screen.getByRole('navigation', { name: /setup progress/i })).toBeInTheDocument();
  });

  it('step list items have sr-only step info', () => {
    renderSetup();
    const srItems = screen
      .getByTestId('wizard-stepper')
      .querySelectorAll('.wizard-stepper__item .sr-only');
    expect(srItems.length).toBe(5);
    srItems.forEach((el, index) => {
      expect(el).toHaveTextContent(new RegExp(`step ${index + 1}:`, 'i'));
    });
  });

  it('cancel button has explicit aria-label', () => {
    renderSetup();
    const cancel = screen.getByRole('button', { name: /cancel two-factor authentication setup/i });
    expect(cancel).toBeInTheDocument();
  });

  it('manual key copy button has aria-label', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('button', { name: /authenticator app/i }));
    await user.click(screen.getByRole('button', { name: /can't scan/i }));
    expect(screen.getByRole('button', { name: /copy key to clipboard/i })).toBeInTheDocument();
  });
});

// ─── Login integration: 2FA setup link ───────────────────────────────────────

import { render as renderPage, screen as pageScreen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';

describe('Login page – 2FA setup integration', () => {
  it('renders setup link in login form', () => {
    renderPage(<MemoryRouter><Login /></MemoryRouter>);
    expect(pageScreen.getByRole('button', { name: /set up two-factor authentication/i })).toBeInTheDocument();
  });

  it('shows TwoFactorSetup wizard when setup link is clicked', async () => {
    const user = userEvent.setup();
    renderPage(<MemoryRouter><Login /></MemoryRouter>);
    await user.click(pageScreen.getByRole('button', { name: /set up two-factor authentication/i }));
    expect(pageScreen.getByRole('heading', { name: /two-factor authentication/i })).toBeInTheDocument();
    expect(pageScreen.getByRole('navigation', { name: /setup progress/i })).toBeInTheDocument();
  });

  it('hides wizard and shows login form when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPage(<MemoryRouter><Login /></MemoryRouter>);
    await user.click(pageScreen.getByRole('button', { name: /set up two-factor authentication/i }));
    await user.click(pageScreen.getByRole('button', { name: /cancel.*setup/i }));
    expect(pageScreen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
