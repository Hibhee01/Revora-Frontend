import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordStrength } from '../components/PasswordStrength';
import { evaluatePasswordStrength } from '../utils/passwordStrength';
import { Mail, Lock, User, Briefcase, TrendingUp, Eye, EyeOff, AlertCircle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmationNextSteps from '../components/ConfirmationNextSteps';
import { Button } from '../components/Button';

type Step = 'persona' | 'form' | 'success';

export const Signup: React.FC = () => {
  const [step, setStep] = useState<Step>('persona');
  const [persona, setPersona] = useState<'startup' | 'investor' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePersonaSelect = (type: 'startup' | 'investor') => {
    setPersona(type);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address';
    const pwStrength = evaluatePasswordStrength(password);
    if (pwStrength.score < 5) newErrors.password = 'Password must meet all requirements below.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setIsSuccess(true);

    await new Promise(resolve => setTimeout(resolve, 600));

    setStep('success');
  };

  if (step === 'success') {
    return (
      <AuthLayout title="Check your inbox">
        <ConfirmationNextSteps
          email={email}
          title="Check your inbox"
          variant="transactionSuccess"
          onResend={async (e) => {
            // mock resend -- wire to API
            console.log('Resend verification for:', e);
            return new Promise<void>((res) => setTimeout(res, 600));
          }}
          onChangeEmail={() => setStep('form')}
          primaryLabel="Back to persona selection"
          onPrimary={() => setStep('persona')}
          primaryTo={undefined}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title={step === 'persona' ? "Choose your account type" : "Create your account"}
      subtitle={step === 'persona' ? "Select how you'll be using Revora to tailor your experience." : `Setting up your ${persona} profile.`}
      helperText={step === 'form' ? "Already have credentials? Return to Sign in to recover or access your account." : undefined}
    >
      {step === 'persona' ? (
        <div className="grid gap-4">
          <button 
            type="button"
            onClick={() => handlePersonaSelect('startup')}
            className="flex items-center gap-4 p-5 glass-card text-left hover:border-primary transition-colors group"
          >
            <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.1)] text-primary">
              <Briefcase size={24} />
            </div>
            <div>
              <div className="font-semibold text-main">Startup Founder</div>
              <div className="text-xs text-muted">Create offerings and manage RevenueShare distributions.</div>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => handlePersonaSelect('investor')}
            className="flex items-center gap-4 p-5 glass-card text-left hover:border-primary transition-colors group"
          >
            <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.1)] text-primary">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="font-semibold text-main">Investor</div>
              <div className="text-xs text-muted">Discover and invest in tokenized offerings.</div>
            </div>
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account? <Link to="/login" className="link-styled">Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`space-y-4 ${Object.keys(errors).length > 0 ? 'animate-shake' : ''}`} noValidate>
          <button type="button" className="btn-primary w-full" disabled={isSubmitting}>
            <Wallet size={18} />
            Connect Stellar Wallet
          </button>

          <div className="relative my-6 py-2 flex items-center">
            <div className="flex-grow border-t border-[rgba(148,163,184,0.1)]"></div>
            <span className="flex-shrink mx-4 text-muted text-xs uppercase tracking-wider font-medium">
              Or sign up with email
            </span>
            <div className="flex-grow border-t border-[rgba(148,163,184,0.1)]"></div>
          </div>
          {Object.keys(errors).length > 0 && (
            <div 
              className="p-3 mb-4 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-error text-sm flex items-start"
              role="alert"
            >
              <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
              <span>Please fix the errors below to continue.</span>
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-muted" size={18} />
              <input 
                id="name"
                className={`input-field pl-10 ${errors.name ? 'input-error' : ''}`} 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
                aria-label="Full Name"
                disabled={isSubmitting}
              />
            </div>
            {errors.name && <p id="name-error" className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-muted" size={18} />
              <input 
                id="email"
                type="email" 
                className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`} 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                aria-label="Email Address"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && <p id="email-error" className="mt-1 text-xs text-error">{errors.email}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-muted" size={18} />
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} 
                placeholder="••••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                aria-label="Password"
                aria-describedby="password-rules"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-muted hover:text-main transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrength password={password} inputId="password" />
            {errors.password && <p id="password-error" className="mt-1 text-xs text-error">{errors.password}</p>}
          </div>

          <Button type="submit" loading={isSubmitting} success={isSuccess} variant="secondary" className="mt-4 w-full">
            Create Account
          </Button>
          
          <button 
            type="button" 
            onClick={() => setStep('persona')}
            className="btn-secondary w-full"
            disabled={isSubmitting}
          >
            Back
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account? <Link to="/login" className="link-styled">Sign in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};
