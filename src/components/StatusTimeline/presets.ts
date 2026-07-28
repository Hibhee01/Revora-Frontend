/**
 * StatusTimeline — Concrete context presets (Issue #153)
 *
 * Three reusable milestone configurations demonstrating the canonical
 * status-timeline pattern across the application:
 *
 * 1. Revenue Report lifecycle
 * 2. Offering Registration flow
 * 3. KYC Verification pipeline
 *
 * Each preset returns a Milestone[] array that can be fed directly
 * into <StatusTimeline milestones={...} />.
 */

import type { Milestone } from './StatusTimeline';

/* ─── 1. Revenue Report Lifecycle ───────────────────────────── */

/**
 * Milestone preset for the revenue report lifecycle:
 * Draft → Submitted → Under Review → Payout Calculated → Distributed
 */
export function getRevenueReportMilestones(
  stage:
    | 'draft'
    | 'submitted'
    | 'under-review'
    | 'payout-calculated'
    | 'distributed',
): Milestone[] {
  const stages = [
    'draft',
    'submitted',
    'under-review',
    'payout-calculated',
    'distributed',
  ] as const;
  const currentIndex = stages.indexOf(stage);

  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    'under-review': 'Under Review',
    'payout-calculated': 'Payout Calculated',
    distributed: 'Distributed',
  };

  const descriptions: Record<string, string> = {
    draft: 'Prepare your revenue figures',
    submitted: 'Report sent for verification',
    'under-review': 'Accounting team reviewing',
    'payout-calculated': 'RevenueShare amounts finalised',
    distributed: 'Payouts sent via smart contract',
  };

  return stages.map((s, i) => ({
    id: `revenue-${s}`,
    label: labels[s],
    description: descriptions[s],
    status:
      i < currentIndex
        ? 'completed'
        : i === currentIndex
          ? 'in-progress'
          : 'pending',
    timestamp:
      i <= currentIndex
        ? new Date(
            Date.now() - (currentIndex - i) * 86400000,
          ).toISOString()
        : undefined,
    subSteps:
      s === 'under-review'
        ? [
            {
              id: 'verify-figures',
              label: 'Verify reported figures',
              status: i <= currentIndex ? 'completed' : 'pending',
            },
            {
              id: 'cross-check',
              label: 'Cross-check with financial records',
              status: i < currentIndex ? 'completed' : 'pending',
            },
            {
              id: 'approval',
              label: 'Manager approval',
              status: i < currentIndex ? 'completed' : 'pending',
            },
          ]
        : undefined,
  }));
}

/* ─── 2. Offering Registration Flow ─────────────────────────── */

/**
 * Milestone preset for the offering registration flow:
 * Application → KYC Check → Compliance Review → Listed → Funding Open
 */
export function getOfferingRegistrationMilestones(
  stage:
    | 'application'
    | 'kyc-check'
    | 'compliance-review'
    | 'listed'
    | 'funding-open',
  options?: {
    kycBlocked?: boolean;
    kycBlockedAction?: () => void;
  },
): Milestone[] {
  const stages = [
    'application',
    'kyc-check',
    'compliance-review',
    'listed',
    'funding-open',
  ] as const;
  const currentIndex = stages.indexOf(stage);

  const labels: Record<string, string> = {
    application: 'Application',
    'kyc-check': 'KYC Check',
    'compliance-review': 'Compliance Review',
    listed: 'Listed',
    'funding-open': 'Funding Open',
  };

  const descriptions: Record<string, string> = {
    application: 'Submit offering details',
    'kyc-check': 'Identity & business verification',
    'compliance-review': 'Regulatory compliance review',
    listed: 'Offering published to portal',
    'funding-open': 'Accepting investor capital',
  };

  return stages.map((s, i) => {
    const isKycBlocked =
      s === 'kyc-check' && options?.kycBlocked && i === currentIndex;

    return {
      id: `offering-${s}`,
      label: labels[s],
      description: descriptions[s],
      status: isKycBlocked
        ? 'blocked'
        : i < currentIndex
          ? 'completed'
          : i === currentIndex
            ? 'in-progress'
            : 'pending',
      timestamp:
        i <= currentIndex
          ? new Date(
              Date.now() - (currentIndex - i) * 172800000,
            ).toISOString()
          : undefined,
      blockedAction: isKycBlocked
        ? {
            label: 'Upload documents',
            onClick: options?.kycBlockedAction ?? (() => {}),
          }
        : undefined,
      subSteps:
        s === 'compliance-review'
          ? [
              {
                id: 'legal-review',
                label: 'Legal team review',
                status: i < currentIndex ? 'completed' : 'pending',
              },
              {
                id: 'token-audit',
                label: 'Token contract audit',
                status: i < currentIndex ? 'completed' : 'pending',
              },
            ]
          : undefined,
    };
  });
}

/* ─── 3. KYC Verification Pipeline ──────────────────────────── */

/**
 * Milestone preset for the KYC verification pipeline:
 * ID Upload → Liveness Check → Address Proof → AML Screening → Approved
 */
export function getKycVerificationMilestones(
  stage:
    | 'id-upload'
    | 'liveness-check'
    | 'address-proof'
    | 'aml-screening'
    | 'approved',
  options?: {
    addressBlocked?: boolean;
    addressBlockedAction?: () => void;
    livenessSkipped?: boolean;
  },
): Milestone[] {
  const stages = [
    'id-upload',
    'liveness-check',
    'address-proof',
    'aml-screening',
    'approved',
  ] as const;
  const currentIndex = stages.indexOf(stage);

  const labels: Record<string, string> = {
    'id-upload': 'ID Upload',
    'liveness-check': 'Liveness Check',
    'address-proof': 'Address Proof',
    'aml-screening': 'AML Screening',
    approved: 'Approved',
  };

  const descriptions: Record<string, string> = {
    'id-upload': 'Government-issued ID document',
    'liveness-check': 'Video selfie verification',
    'address-proof': 'Utility bill or bank statement',
    'aml-screening': 'Anti-money laundering check',
    approved: 'KYC verification complete',
  };

  return stages.map((s, i) => {
    const isAddressBlocked =
      s === 'address-proof' &&
      options?.addressBlocked &&
      i === currentIndex;
    const isLivenessSkipped =
      s === 'liveness-check' && options?.livenessSkipped;

    return {
      id: `kyc-${s}`,
      label: labels[s],
      description: descriptions[s],
      status: isLivenessSkipped
        ? 'skipped'
        : isAddressBlocked
          ? 'blocked'
          : i < currentIndex
            ? 'completed'
            : i === currentIndex
              ? 'in-progress'
              : 'pending',
      timestamp:
        i <= currentIndex && !isLivenessSkipped
          ? new Date(
              Date.now() - (currentIndex - i) * 43200000,
            ).toISOString()
          : undefined,
      blockedAction: isAddressBlocked
        ? {
            label: 'Re-upload document',
            onClick: options?.addressBlockedAction ?? (() => {}),
          }
        : undefined,
    };
  });
}

/* ─── 4. On-Chain Transaction Timeline Preset ────────────────────────── */

/**
 * Milestone preset for smart contract payout/distribution timeline with an on-chain rejection step:
 * Payout Prepared → On-Chain Execution (Blocked with OnchainRejectionCard) → Settlement Confirmed
 */
export function getOnchainRejectionMilestones(
  reason: string = 'insufficient-gas',
  options?: {
    onRetry?: () => void | Promise<void>;
    onAdjustGas?: () => void;
    onCancel?: () => void;
  },
): Milestone[] {
  return [
    {
      id: 'tx-prep',
      label: 'Payout Prepared',
      description: 'Transaction parameters & recipient balances compiled',
      status: 'completed',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'tx-execution',
      label: 'On-Chain Execution',
      description: 'Transaction submitted to blockchain network',
      status: 'blocked',
      onchainRejection: {
        reason,
        onRetry: options?.onRetry,
        onAdjustGas: options?.onAdjustGas,
        onCancel: options?.onCancel,
      },
    },
    {
      id: 'tx-settlement',
      label: 'Settlement Confirmed',
      description: 'Block confirmation and token transfer finalized',
      status: 'pending',
    },
  ];
}
