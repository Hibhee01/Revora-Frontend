import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import { ExitConfirmationModal } from '../components/designSystem/ExitConfirmationModal';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Button } from '../components/Button';

export const DistributionDashboard: React.FC = () => {
  const [isDirty, setIsDirty] = useState(false);
  const blocker = useUnsavedChanges(isDirty);
  const navigate = useNavigate();

  const handleStay = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleDiscard = () => {
    setIsDirty(false);
    if (blocker.state === 'blocked' && blocker.location) {
      blocker.proceed();
    }
  };

  const handleSaveAndExit = () => {
    // Simulate save
    setIsDirty(false);
    if (blocker.state === 'blocked' && blocker.location) {
      blocker.proceed();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distribution Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Track RevenueShare distributions across your portfolio.
          </p>
        </div>
        <div>
          <Button 
            variant={isDirty ? 'primary' : 'secondary'}
            onClick={() => setIsDirty(!isDirty)}
          >
            {isDirty ? 'Form has unsaved changes' : 'Simulate unsaved changes'}
          </Button>
        </div>
      </div>

      <EmptyState
        variant="distribution-dashboard"
        title="No other distributions yet"
        description="When more revenue is reported and payouts are processed, your distribution history will appear here."
        primaryAction={{
          label: 'Report Revenue',
          href: '/startup/report-revenue',
        }}
        secondaryAction={{
          label: 'Back to Discovery',
          href: '/investor/portal',
        }}
      />

      <ExitConfirmationModal
        isOpen={blocker.state === 'blocked'}
        onStay={handleStay}
        onDiscard={handleDiscard}
        onSaveAndExit={handleSaveAndExit}
      />
    </div>
  );
};

