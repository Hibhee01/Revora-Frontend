import React from 'react';
import { CheckCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export type SubmitButtonState = 'idle' | 'loading' | 'success';

interface AuthSubmitButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  state?: SubmitButtonState;
  idleLabel: string;
  loadingLabel: string;
  successLabel: string;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  state = 'idle',
  idleLabel,
  loadingLabel,
  successLabel,
  className = '',
  disabled,
  ...buttonProps
}) => {
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const label = isLoading ? loadingLabel : isSuccess ? successLabel : idleLabel;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? 'submit'}
      className={`btn-primary auth-submit-button auth-submit-button--${state} ${className}`.trim()}
      disabled={disabled || isLoading || isSuccess}
      aria-busy={isLoading}
      data-state={state}
    >
      {isLoading && (
        <LoadingSpinner 
          className="auth-submit-button__icon auth-submit-button__spinner" 
          size={18} 
          aria-hidden="true" 
        />
      )}
      {isSuccess && <CheckCircle className="auth-submit-button__icon" size={18} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
};

