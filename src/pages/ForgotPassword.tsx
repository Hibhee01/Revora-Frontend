import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthSubmitButton, SubmitButtonState } from '../components/AuthSubmitButton';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import ConfirmationNextSteps from '../components/ConfirmationNextSteps';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setIsSuccess(true);

    await new Promise(resolve => setTimeout(resolve, 600));

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Reset link sent"
        helperText="If you still cannot sign in, contact your workspace administrator."
      >
        <ConfirmationNextSteps
          title="Reset link sent"
          email={email}
          message={
            <>
              If an account exists for <span className="text-main font-medium">{email}</span>, you'll receive an
              email with instructions to reset your password shortly. For security reasons we won't confirm account
              existence.
            </>
          }
          onResend={async (e) => {
            console.log('Resend reset link for:', e);
            return new Promise<void>((res) => setTimeout(res, 600));
          }}
          onChangeEmail={() => setSubmitted(false)}
          primaryLabel="Back to Sign In"
          primaryTo="/login"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot Password?" 
      subtitle="Enter your email address and we'll send you a link to reset your password."
      helperText="For security, we never confirm whether an email is registered."
    >
      <form onSubmit={handleSubmit} className={`space-y-6 ${error ? 'animate-shake' : ''}`} noValidate>
        <div className="input-group">
          <label className="input-label" htmlFor="email">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-muted" size={18} />
            <input 
              id="email"
              type="email" 
              className={`input-field pl-10 ${error ? 'input-error' : ''}`} 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-label="Email Address"
              disabled={isSubmitting}
            />
          </div>
          {error && (
            <div id="email-error" className="mt-2 flex items-center text-error text-sm">
              <AlertCircle size={14} className="mr-1" />
              {error}
            </div>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} success={isSuccess}>
          {isSuccess ? 'Sent!' : 'Send Reset Link'}
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center text-sm text-muted hover:text-main transition-colors focus-ring"
          style={{ padding: '0.25rem', borderRadius: '0.25rem' }}
          aria-label="Back to sign in page"
        >
          <ArrowLeft size={16} className="mr-2 icon-rtl" />
          Back to Sign In
        </Link>
      </form>
    </AuthLayout>
  );
};
