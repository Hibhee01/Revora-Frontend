/**
 * Distribution Dashboard with KYC rejection reasons panel (Issue #229).
 *
 * When a startup's KYC application is rejected, distributions stay blocked —
 * but the user must never hit a dead end. This page surfaces each canonical
 * rejection reason with a plain-language explanation and a corrective CTA
 * that jumps to the failing KYC step (or Contact support for unclear cases).
 *
 * See docs/uiux/ux229-kyc-rejection-reasons-panel.md.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import {
  KycRejectionPanel,
  type KycRejectionReason,
  type KycStepId,
  type ResolvedKycRejection,
  KYC_STEP_LABELS,
} from '../components/KycRejectionPanel';
import { SuccessFailureIllustration } from '../components/designSystem/SuccessFailureIllustration';

export type KycApplicationStatus = 'approved' | 'rejected' | 'pending' | 'not-started';

export interface DistributionDashboardProps {
  /** Current KYC application status; defaults to a rejected demo state. */
  kycStatus?: KycApplicationStatus;
  /** Rejection reasons for a rejected application. */
  rejectionReasons?: KycRejectionReason[];
  /** Optional override for corrective-action navigation (tests / hosts). */
  onNavigateToStep?: (stepId: KycStepId, reason: ResolvedKycRejection) => void;
}

/** Demo reasons covering multiple severities + an unclear fallback. */
export const DEMO_REJECTION_REASONS: KycRejectionReason[] = [
  { id: 'r1', code: 'ID_BLURRY' },
  { id: 'r2', code: 'ADDRESS_EXPIRED', detail: 'Document dated January 2025.' },
  { id: 'r3', code: 'UNKNOWN_VENDOR_CODE_99' },
];

export const DistributionDashboard: React.FC<DistributionDashboardProps> = ({
  kycStatus = 'rejected',
  rejectionReasons = DEMO_REJECTION_REASONS,
  onNavigateToStep,
}) => {
  const [activeStep, setActiveStep] = useState<KycStepId | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleNavigateToStep = (stepId: KycStepId, reason: ResolvedKycRejection) => {
    setActiveStep(stepId);
    setStatusMessage(
      `Opened ${KYC_STEP_LABELS[stepId]} to resolve “${reason.chipLabel}”.`
    );
    onNavigateToStep?.(stepId, reason);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Distribution Dashboard</h1>
        <p className="text-muted text-sm mt-1 mb-8">
          Track RevenueShare distributions across your portfolio.
        </p>
        <RedemptionBanner totalCapacity={10000} currentSubscription={12500} />
      </div>

      {kycStatus === 'rejected' && (
        <div className="space-y-4" data-testid="kyc-rejected-section">
          <div className="flex items-start gap-4">
            <SuccessFailureIllustration variant="kycRejected" size={96} ariaHidden={false} />
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                KYC verification rejected
              </h2>
              <p className="text-muted text-sm mt-1">
                Distributions are paused until identity verification is complete.
                Review each reason below and jump straight to the step that needs fixing.
              </p>
            </div>
          </div>

          <KycRejectionPanel
            reasons={rejectionReasons}
            onNavigateToStep={handleNavigateToStep}
            supportHref="/support/kyc"
          />

          {/* Live region mirrors the panel announcement for the page context */}
          <div aria-live="polite" className="sr-only" data-testid="kyc-step-status">
            {statusMessage}
          </div>

          {activeStep && activeStep !== 'support' && (
            <div
              className="glass-card p-4 rounded-lg"
              data-testid="kyc-step-preview"
              role="status"
            >
              <p className="text-sm">
                <strong>{KYC_STEP_LABELS[activeStep]}</strong> is ready for your update.
                Complete this step, then resubmit your KYC application.
              </p>
            </div>
          )}
        </div>
      )}

      {kycStatus !== 'rejected' && (
        <EmptyState
          variant="distribution-dashboard"
          title="No distributions yet"
          description="When revenue is reported and payouts are processed, your distribution history will appear here."
          primaryAction={{
            label: 'Report Revenue',
            href: '/startup/report-revenue',
          }}
          secondaryAction={{
            label: 'Back to Discovery',
            href: '/investor/portal',
          }}
        />
      )}

      <p className="text-muted text-sm">
        <Link to="/" className="link-styled">Back to Home</Link>
      </p>
    </div>
  );
};

