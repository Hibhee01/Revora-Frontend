import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { TwoFactorRecoveryFlow } from '../components/TwoFactorRecoveryFlow';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TwoFactorRecoveryPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/login');
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <AuthLayout
      title="Two-factor recovery"
      subtitle="Lost your authenticator device? Use your recovery email to regain access."
    >
      <TwoFactorRecoveryFlow
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
      <Link
        to="/login"
        className="flex items-center justify-center text-sm text-muted hover:text-main transition-colors focus-ring mt-6"
        style={{ padding: '0.25rem', borderRadius: '0.25rem' }}
        aria-label="Back to sign in page"
      >
        <ArrowLeft size={16} className="mr-2 icon-rtl" />
        Back to Sign In
      </Link>
    </AuthLayout>
  );
};
