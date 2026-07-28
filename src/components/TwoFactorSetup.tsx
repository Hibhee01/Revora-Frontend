import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Smartphone,
  MessageSquare,
  Key,
  Copy,
  Check,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Button } from './Button';
import { FormError } from './FormError';
import { WizardStepper, type WizardStep } from './WizardStepper';

// ─── Types ────────────────────────────────────────────────────────────────────

type Method = 'totp' | 'sms';
type Step = 1 | 2 | 3 | 4 | 5;

interface TwoFactorSetupProps {
  /** Called when the wizard completes successfully */
  onComplete: () => void;
  /** Called when the user cancels / closes the wizard */
  onCancel: () => void;
  /** Pre-generated TOTP secret (base32); callers should generate server-side */
  totpSecret?: string;
  /** Pre-generated recovery codes (8 codes recommended) */
  recoveryCodes?: string[];
}

// ─── Demo/stub data ───────────────────────────────────────────────────────────

const DEFAULT_SECRET = 'JBSWY3DPEHPK3PXP';
const DEFAULT_RECOVERY_CODES = [
  'REVR-A1B2-C3D4',
  'REVR-E5F6-G7H8',
  'REVR-I9J0-K1L2',
  'REVR-M3N4-O5P6',
  'REVR-Q7R8-S9T0',
  'REVR-U1V2-W3X4',
  'REVR-Y5Z6-A7B8',
  'REVR-C9D0-E1F2',
];

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  1: 'Choose method',
  2: 'Set up authenticator',
  3: 'Verify code',
  4: 'Save recovery codes',
  5: 'Done',
};
const TOTAL_STEPS = 5;

const WIZARD_STEPS: WizardStep[] = (
  Object.keys(STEP_LABELS) as unknown as Step[]
).map((s) => {
  const step = Number(s) as Step;
  return { id: `tfa-step-${step}`, label: STEP_LABELS[step], number: step };
});

interface StepIndicatorProps {
  current: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ current }) => (
  <WizardStepper
    steps={WIZARD_STEPS}
    currentIndex={current - 1}
    ariaLabel="Setup progress"
    showProgressTrack
  />
);

// ─── Step 1: Choose method ────────────────────────────────────────────────────

interface Step1Props {
  onSelect: (method: Method) => void;
}

const Step1: React.FC<Step1Props> = ({ onSelect }) => (
  <div className="space-y-4 animate-fade-in">
    <p className="text-muted text-sm">
      Choose how you'd like to verify your identity each time you sign in.
    </p>
    <div className="grid gap-3">
      <button
        type="button"
        className="tfa-method-card"
        onClick={() => onSelect('totp')}
        aria-describedby="totp-desc"
      >
        <div className="tfa-method-card__icon" aria-hidden="true">
          <Smartphone size={22} />
        </div>
        <div className="tfa-method-card__body">
          <span className="tfa-method-card__title">Authenticator App</span>
          <span id="totp-desc" className="tfa-method-card__desc">
            Use Google Authenticator, Authy, or any TOTP-compatible app.
          </span>
        </div>
        <ChevronRight size={18} className="text-muted flex-shrink-0 icon-rtl" aria-hidden="true" />
      </button>

      <button
        type="button"
        className="tfa-method-card"
        onClick={() => onSelect('sms')}
        aria-describedby="sms-desc"
      >
        <div className="tfa-method-card__icon" aria-hidden="true">
          <MessageSquare size={22} />
        </div>
        <div className="tfa-method-card__body">
          <span className="tfa-method-card__title">SMS Backup</span>
          <span id="sms-desc" className="tfa-method-card__desc">
            Receive a one-time code via text message. Requires a mobile number.
          </span>
        </div>
        <ChevronRight size={18} className="text-muted flex-shrink-0 icon-rtl" aria-hidden="true" />
      </button>
    </div>
  </div>
);

// ─── Step 2: QR / manual key ──────────────────────────────────────────────────

interface Step2Props {
  method: Method;
  secret: string;
  onNext: () => void;
  onBack: () => void;
}

const Step2: React.FC<Step2Props> = ({ method, secret, onNext, onBack }) => {
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const secretId = useId();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text for manual copy
      const el = document.getElementById(secretId);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  if (method === 'sms') {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-muted text-sm">
          We'll send a 6-digit code to your registered mobile number each time you sign in.
        </p>
        <div className="input-group">
          <label className="input-label" htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            type="tel"
            className="input-field"
            placeholder="+1 555 000 0000"
            autoComplete="tel"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
          <Button type="button" onClick={onNext}>Send verification code</Button>
        </div>
      </div>
    );
  }

  // TOTP QR flow
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `otpauth://totp/Revora?secret=${secret}&issuer=Revora`
  )}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-muted text-sm">
        Open your authenticator app and scan the QR code below to add your Revora account.
      </p>

      {/* QR code */}
      <div className="tfa-qr-wrapper" role="img" aria-label="QR code for authenticator app setup. Use the manual key below if you cannot scan.">
        <img
          src={qrUrl}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          className="tfa-qr-img"
        />
      </div>

      {/* Manual key toggle */}
      <button
        type="button"
        className="tfa-toggle-link"
        onClick={() => setShowManual((v) => !v)}
        aria-expanded={showManual}
        aria-controls="manual-key-section"
      >
        <Key size={14} aria-hidden="true" />
        {showManual ? 'Hide manual key' : "Can't scan? Enter key manually"}
      </button>

      {showManual && (
        <div id="manual-key-section" className="tfa-manual-key">
          <p className="text-muted text-xs mb-2">
            Type this key into your authenticator app instead of scanning the QR code.
          </p>
          <div className="tfa-manual-key__row">
            <code
              id={secretId}
              className="tfa-manual-key__code"
              aria-label={`Manual setup key: ${secret.split('').join(' ')}`}
            >
              {secret}
            </code>
            <button
              type="button"
              className="tfa-icon-btn"
              onClick={handleCopy}
              aria-label={copied ? 'Key copied to clipboard' : 'Copy key to clipboard'}
            >
              {copied ? (
                <Check size={16} className="text-success" aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              <span className="sr-only">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          {copied && (
            <p className="text-success text-xs mt-1" role="status" aria-live="polite">
              Key copied to clipboard.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <Button type="button" onClick={onNext}>I've added the account</Button>
      </div>
    </div>
  );
};

// ─── Step 3: Verify code ──────────────────────────────────────────────────────

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
}

const Step3: React.FC<Step3Props> = ({ onNext, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsVerifying(true);
    // Stub: treat any 6-digit code as valid
    await new Promise((r) => setTimeout(r, 600));
    setIsVerifying(false);
    onNext();
  };

  return (
    <form onSubmit={handleVerify} className={`space-y-4 animate-fade-in ${error ? 'animate-shake' : ''}`} noValidate>
      <p className="text-muted text-sm">
        Enter the 6-digit code currently displayed in your authenticator app.
      </p>
      <FormError message={error} id="verify-error" />
      <div className="input-group">
        <label className="input-label" htmlFor="totp-code">
          Verification code
        </label>
        <input
          ref={inputRef}
          id="totp-code"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          className={`input-field tfa-code-input ${error ? 'input-error' : ''}`}
          value={code}
          onChange={handleChange}
          placeholder="000000"
          autoComplete="one-time-code"
          aria-required="true"
          aria-describedby={error ? 'verify-error' : undefined}
          disabled={isVerifying}
        />
        <p className="text-muted text-xs mt-1">Code refreshes every 30 seconds.</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onBack} disabled={isVerifying}>Back</button>
        <Button type="submit" loading={isVerifying}>Verify</Button>
      </div>
    </form>
  );
};

// ─── Step 4: Recovery codes ───────────────────────────────────────────────────

interface Step4Props {
  codes: string[];
  onNext: () => void;
  onBack: () => void;
}

const Step4: React.FC<Step4Props> = ({ codes, onNext, onBack }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleDownload = () => {
    const content = `Revora Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${codes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revora-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<html><head><title>Revora Recovery Codes</title></head><body>
      <h2>Revora Recovery Codes</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <ul>${codes.map((c) => `<li><code>${c}</code></li>`).join('')}</ul>
      <p><strong>Keep these codes safe. Each code can only be used once.</strong></p>
      </body></html>`
    );
    w.print();
    w.close();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="tfa-warning" role="note">
        <AlertTriangle size={16} aria-hidden="true" className="flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Save these codes now.</strong> They are the only way to recover your account if you lose access to your authenticator. Each code can be used once.
        </p>
      </div>

      <ul
        className="tfa-recovery-list"
        aria-label="Recovery codes"
      >
        {codes.map((code, i) => (
          <li key={code} className="tfa-recovery-list__item">
            <span className="sr-only">Code {i + 1}: </span>
            <code>{code}</code>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" className="btn-secondary tfa-action-btn" onClick={handleDownload} aria-label="Download recovery codes as text file">
          <Download size={16} aria-hidden="true" /> Download
        </button>
        <button type="button" className="btn-secondary tfa-action-btn" onClick={handlePrint} aria-label="Print recovery codes">
          <Printer size={16} aria-hidden="true" /> Print
        </button>
      </div>

      <label className="tfa-acknowledge">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          aria-required="true"
        />
        <span>I've saved my recovery codes in a safe place.</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <Button type="button" disabled={!acknowledged} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

// ─── Step 5: Success ──────────────────────────────────────────────────────────

interface Step5Props {
  onComplete: () => void;
}

const Step5: React.FC<Step5Props> = ({ onComplete }) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div className="text-center space-y-5 animate-fade-in">
      <div className="tfa-success-icon" aria-hidden="true">
        <ShieldCheck size={36} />
      </div>
      <div>
        <h3 className="font-semibold text-main text-lg">Two-factor authentication enabled</h3>
        <p className="text-muted text-sm mt-1">
          Your account is now protected. You'll be asked for a code at each sign-in.
        </p>
      </div>
      <Button ref={btnRef} type="button" onClick={onComplete}>
        Done
      </Button>
    </div>
  );
};

// ─── Main wizard ──────────────────────────────────────────────────────────────

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel,
  totpSecret = DEFAULT_SECRET,
  recoveryCodes = DEFAULT_RECOVERY_CODES,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>('totp');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the section heading whenever the step changes
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleMethodSelect = (m: Method) => {
    setMethod(m);
    next();
  };

  const stepTitles: Record<Step, string> = {
    1: 'Choose authentication method',
    2: method === 'totp' ? 'Set up authenticator app' : 'Set up SMS backup',
    3: 'Enter verification code',
    4: 'Save your recovery codes',
    5: 'Setup complete',
  };

  return (
    <section aria-labelledby="tfa-heading" className="tfa-wizard">
      <StepIndicator current={step} />

      <h2
        id="tfa-heading"
        ref={headingRef}
        className="tfa-wizard__title"
        tabIndex={-1}
      >
        {stepTitles[step]}
      </h2>

      {step === 1 && <Step1 onSelect={handleMethodSelect} />}
      {step === 2 && (
        <Step2 method={method} secret={totpSecret} onNext={next} onBack={back} />
      )}
      {step === 3 && <Step3 onNext={next} onBack={back} />}
      {step === 4 && <Step4 codes={recoveryCodes} onNext={next} onBack={back} />}
      {step === 5 && <Step5 onComplete={onComplete} />}

      {step < 5 && (
        <button
          type="button"
          className="tfa-cancel"
          onClick={onCancel}
          aria-label="Cancel two-factor authentication setup"
        >
          Cancel setup
        </button>
      )}
    </section>
  );
};
