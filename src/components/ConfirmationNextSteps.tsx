import React, { useEffect, useState } from 'react';
import { Mail, Repeat, ArrowLeft, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  title?: string;
  email?: string;
  message?: React.ReactNode;
  primaryLabel?: string;
  primaryTo?: string;
  onPrimary?: () => void;
  onResend?: (email?: string) => Promise<void> | void;
  onChangeEmail?: () => void;
  icon?: React.ReactNode;
};

export const ConfirmationNextSteps: React.FC<Props> = ({
  title = 'Check your inbox',
  email,
  message,
  primaryLabel = 'Back to Sign In',
  primaryTo = '/login',
  onPrimary,
  onResend,
  onChangeEmail,
  icon,
}) => {
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // 30s cooldown after resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    try {
      await onResend?.(email);
      setSentMessage('Verification email resent. Check your inbox.');
      setCooldown(30);
    } catch (err) {
      setSentMessage('Unable to resend. Please try again later.');
    } finally {
      setSending(false);
      // Announce for assistive tech
      setTimeout(() => setSentMessage(null), 8000);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.08)] flex items-center justify-center text-success border border-[rgba(16,185,129,0.12)]">
          {icon ?? <Mail size={32} />}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-main">{title}</h2>

      <p className="text-muted max-w-prose mx-auto" aria-live="polite">
        {message ?? (
          <>
            We've sent a verification link to{' '}
            {email ? <span className="text-main font-medium">{email}</span> : 'the email address provided'}. Please
            check your inbox and follow the link to verify your account. The link may take a few minutes to arrive —
            check your spam folder if you don't see it.
          </>
        )}
      </p>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="btn-secondary w-full inline-flex items-center justify-center focus-ring"
          aria-disabled={sending || cooldown > 0}
          aria-label={sending ? 'Resending verification email' : 'Resend verification email'}
        >
          <Repeat size={16} className="mr-2" />
          {sending ? 'Resending…' : cooldown > 0 ? `Resend again in ${cooldown}s` : 'Resend verification email'}
        </button>

        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            className="btn-ghost w-full inline-flex items-center justify-center focus-ring"
            aria-label="Change email address"
          >
            <Edit2 size={16} className="mr-2" />
            Change email address
          </button>
        )}

        {primaryTo ? (
          <Link to={primaryTo} className="btn-primary w-full inline-flex items-center justify-center focus-ring" aria-label={primaryLabel} onClick={onPrimary}>
            <ArrowLeft size={16} className="mr-2" />
            {primaryLabel}
          </Link>
        ) : (
          <button type="button" onClick={onPrimary} className="btn-primary w-full inline-flex items-center justify-center focus-ring" aria-label={primaryLabel}>
            <ArrowLeft size={16} className="mr-2" />
            {primaryLabel}
          </button>
        )}
      </div>

      {/* live region for assistive tech */}
      <div role="status" aria-live="polite" className="sr-only">
        {sentMessage}
      </div>
    </div>
  );
};

export default ConfirmationNextSteps;
