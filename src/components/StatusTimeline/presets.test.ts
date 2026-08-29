import { describe, it, expect, vi } from 'vitest';
import {
  getRevenueReportMilestones,
  getOfferingRegistrationMilestones,
  getKycVerificationMilestones,
  getOnchainRejectionMilestones,
} from './presets';
import type { Milestone } from './StatusTimeline';

const statusOf = (milestones: Milestone[]) => milestones.map((m) => m.status);

describe('getRevenueReportMilestones', () => {
  it('marks every stage pending before the flow starts', () => {
    const stages = getRevenueReportMilestones('draft');
    expect(statusOf(stages)).toEqual([
      'in-progress',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('marks completed, in-progress and pending stages correctly mid-flow', () => {
    const stages = getRevenueReportMilestones('under-review');
    expect(statusOf(stages)).toEqual([
      'completed',
      'completed',
      'in-progress',
      'pending',
      'pending',
    ]);
  });

  it('marks all prior stages completed when at the final stage', () => {
    const stages = getRevenueReportMilestones('distributed');
    expect(statusOf(stages)).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
      'in-progress',
    ]);
  });

  it('attaches sub-steps to the under-review milestone only', () => {
    const stages = getRevenueReportMilestones('under-review');
    const underReview = stages.find((m) => m.id === 'revenue-under-review');
    expect(underReview?.subSteps).toHaveLength(3);
    for (const stage of stages) {
      if (stage.id !== 'revenue-under-review') {
        expect(stage.subSteps).toBeUndefined();
      }
    }
  });

  it('provides timestamps for completed/in-progress stages only', () => {
    const stages = getRevenueReportMilestones('payout-calculated');
    stages.forEach((stage, i) => {
      if (i <= 3) {
        expect(stage.timestamp).toBeDefined();
      } else {
        expect(stage.timestamp).toBeUndefined();
      }
    });
  });

  it('produces unique ids', () => {
    const stages = getRevenueReportMilestones('draft');
    const ids = stages.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getOfferingRegistrationMilestones', () => {
  it('builds the registration flow in order', () => {
    const stages = getOfferingRegistrationMilestones('application');
    expect(stages.map((s) => s.label)).toEqual([
      'Application',
      'KYC Check',
      'Compliance Review',
      'Listed',
      'Funding Open',
    ]);
  });

  it('marks the current stage in-progress', () => {
    expect(statusOf(getOfferingRegistrationMilestones('compliance-review'))).toEqual([
      'completed',
      'completed',
      'in-progress',
      'pending',
      'pending',
    ]);
  });

  it('blocks the KYC stage with an action badge when kycBlocked is set', () => {
    const onAction = vi.fn();
    const stages = getOfferingRegistrationMilestones('kyc-check', {
      kycBlocked: true,
      kycBlockedAction: onAction,
    });
    const kyc = stages.find((m) => m.id === 'offering-kyc-check');
    expect(kyc?.status).toBe('blocked');
    expect(kyc?.blockedAction?.label).toBe('Upload documents');
    kyc?.blockedAction?.onClick();
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not block KYC when the option is omitted', () => {
    const stages = getOfferingRegistrationMilestones('kyc-check');
    const kyc = stages.find((m) => m.id === 'offering-kyc-check');
    expect(kyc?.status).toBe('in-progress');
    expect(kyc?.blockedAction).toBeUndefined();
  });

  it('falls back to a no-op blocked action when no callback is provided', () => {
    const stages = getOfferingRegistrationMilestones('kyc-check', {
      kycBlocked: true,
    });
    const kyc = stages.find((m) => m.id === 'offering-kyc-check');
    expect(kyc?.status).toBe('blocked');
    expect(() => kyc?.blockedAction?.onClick()).not.toThrow();
  });

  it('marks compliance sub-steps completed once past the review stage', () => {
    const stages = getOfferingRegistrationMilestones('funding-open');
    const review = stages.find((m) => m.id === 'offering-compliance-review');
    expect(review?.subSteps?.map((s) => s.status)).toEqual([
      'completed',
      'completed',
    ]);
  });

  it('attaches sub-steps to the compliance review milestone', () => {
    const stages = getOfferingRegistrationMilestones('compliance-review');
    const review = stages.find((m) => m.id === 'offering-compliance-review');
    expect(review?.subSteps).toHaveLength(2);
  });
});

describe('getKycVerificationMilestones', () => {
  it('marks the current stage in-progress', () => {
    expect(statusOf(getKycVerificationMilestones('address-proof'))).toEqual([
      'completed',
      'completed',
      'in-progress',
      'pending',
      'pending',
    ]);
  });

  it('skips the liveness stage when livenessSkipped is set', () => {
    const stages = getKycVerificationMilestones('address-proof', {
      livenessSkipped: true,
    });
    const liveness = stages.find((m) => m.id === 'kyc-liveness-check');
    expect(liveness?.status).toBe('skipped');
    expect(liveness?.timestamp).toBeUndefined();
  });

  it('blocks the address-proof stage with a re-upload action', () => {
    const onAction = vi.fn();
    const stages = getKycVerificationMilestones('address-proof', {
      addressBlocked: true,
      addressBlockedAction: onAction,
    });
    const address = stages.find((m) => m.id === 'kyc-address-proof');
    expect(address?.status).toBe('blocked');
    expect(address?.blockedAction?.label).toBe('Re-upload document');
    address?.blockedAction?.onClick();
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('falls back to a no-op blocked action for address proof when no callback is provided', () => {
    const stages = getKycVerificationMilestones('address-proof', {
      addressBlocked: true,
    });
    const address = stages.find((m) => m.id === 'kyc-address-proof');
    expect(address?.status).toBe('blocked');
    expect(() => address?.blockedAction?.onClick()).not.toThrow();
  });

  it('marks all prior stages completed when approved', () => {
    expect(statusOf(getKycVerificationMilestones('approved'))).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
      'in-progress',
    ]);
  });
});

describe('getOnchainRejectionMilestones', () => {
  it('builds a blocked on-chain execution milestone with a rejection card', () => {
    const stages = getOnchainRejectionMilestones();
    expect(statusOf(stages)).toEqual(['completed', 'blocked', 'pending']);
    const execution = stages.find((m) => m.id === 'tx-execution');
    expect(execution?.onchainRejection?.reason).toBe('insufficient-gas');
    expect(execution?.onchainRejection?.onRetry).toBeUndefined();
  });

  it('forwards custom reason and callbacks', () => {
    const onRetry = vi.fn();
    const onAdjustGas = vi.fn();
    const onCancel = vi.fn();
    const stages = getOnchainRejectionMilestones('user-rejected', {
      onRetry,
      onAdjustGas,
      onCancel,
    });
    const execution = stages.find((m) => m.id === 'tx-execution');
    expect(execution?.onchainRejection?.reason).toBe('user-rejected');
    expect(execution?.onchainRejection?.onRetry).toBe(onRetry);
    expect(execution?.onchainRejection?.onAdjustGas).toBe(onAdjustGas);
    expect(execution?.onchainRejection?.onCancel).toBe(onCancel);
  });
});
