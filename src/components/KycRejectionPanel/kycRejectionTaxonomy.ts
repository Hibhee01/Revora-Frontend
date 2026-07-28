/**
 * Canonical KYC rejection reason taxonomy (Issue #229).
 *
 * Every rejection reason chip maps to one of these codes. Copy templates,
 * severity, and the corrective-action target step live here so the panel
 * never invents free-form labels that diverge from compliance policy.
 *
 * Unknown / empty codes fall back to `UNCLEAR`, which surfaces the
 * documented "Contact support" affordance instead of a dead end.
 */

/** KYC pipeline steps a corrective action can deep-link into. */
export type KycStepId =
  | 'id-upload'
  | 'liveness-check'
  | 'address-proof'
  | 'aml-screening'
  | 'support';

export type KycRejectionSeverity = 'blocking' | 'warning' | 'info';

/** Canonical rejection reason codes. Prefer these over free-text labels. */
export type KycRejectionCode =
  | 'ID_BLURRY'
  | 'ID_EXPIRED'
  | 'ID_TYPE_UNSUPPORTED'
  | 'ID_NAME_MISMATCH'
  | 'LIVENESS_FAILED'
  | 'LIVENESS_SPOOF_SUSPECTED'
  | 'ADDRESS_MISSING'
  | 'ADDRESS_MISMATCH'
  | 'ADDRESS_EXPIRED'
  | 'SELFIE_ID_MISMATCH'
  | 'AML_HIT_REQUIRES_REVIEW'
  | 'AML_INCOMPLETE'
  | 'UNCLEAR';

export interface KycRejectionTemplate {
  code: KycRejectionCode;
  /** Short chip label (plain language). */
  chipLabel: string;
  /** Plain-language explanation shown in the panel. */
  explanation: string;
  severity: KycRejectionSeverity;
  /** KYC step the corrective CTA jumps to. */
  stepId: KycStepId;
  /** CTA label for the corrective action button. */
  actionLabel: string;
  /**
   * When true the CTA opens the contact-support fallback instead of a
   * KYC wizard step (used for AML hits and unclear reasons).
   */
  contactSupport?: boolean;
}

export interface KycRejectionReason {
  /** Unique instance id (one application may have multiple of the same code). */
  id: string;
  /**
   * Rejection code from the decision engine. Prefer a canonical
   * {@link KycRejectionCode}; unknown / empty values map to `UNCLEAR`.
   */
  code: KycRejectionCode | string;
  /** Optional reviewer note appended to the template explanation. */
  detail?: string;
}

export interface ResolvedKycRejection extends KycRejectionTemplate {
  id: string;
  detail?: string;
  /** Full explanation including optional reviewer detail. */
  displayExplanation: string;
}

export const KYC_STEP_LABELS: Record<KycStepId, string> = {
  'id-upload': 'ID Upload',
  'liveness-check': 'Liveness Check',
  'address-proof': 'Address Proof',
  'aml-screening': 'AML Screening',
  support: 'Support',
};

/**
 * Canonical copy templates. Keep wording plain-language and actionable —
 * rejected KYC applications must never end in a dead end.
 */
export const KYC_REJECTION_TAXONOMY: Record<KycRejectionCode, KycRejectionTemplate> = {
  ID_BLURRY: {
    code: 'ID_BLURRY',
    chipLabel: 'ID photo unclear',
    explanation:
      'We could not read the text on your government ID. Please re-upload a sharp, well-lit photo of the full document with all corners visible.',
    severity: 'blocking',
    stepId: 'id-upload',
    actionLabel: 'Re-upload ID',
  },
  ID_EXPIRED: {
    code: 'ID_EXPIRED',
    chipLabel: 'ID expired',
    explanation:
      'The government ID you uploaded has expired. Upload a currently valid passport, national ID, or driver’s licence.',
    severity: 'blocking',
    stepId: 'id-upload',
    actionLabel: 'Upload valid ID',
  },
  ID_TYPE_UNSUPPORTED: {
    code: 'ID_TYPE_UNSUPPORTED',
    chipLabel: 'ID type not accepted',
    explanation:
      'That document type is not accepted for verification. Use a passport, national ID card, or driver’s licence issued by a supported country.',
    severity: 'blocking',
    stepId: 'id-upload',
    actionLabel: 'Choose accepted ID',
  },
  ID_NAME_MISMATCH: {
    code: 'ID_NAME_MISMATCH',
    chipLabel: 'Name does not match',
    explanation:
      'The name on your ID does not match the name on your Revora account. Update your legal name or upload an ID that matches your account.',
    severity: 'blocking',
    stepId: 'id-upload',
    actionLabel: 'Fix name mismatch',
  },
  LIVENESS_FAILED: {
    code: 'LIVENESS_FAILED',
    chipLabel: 'Liveness check failed',
    explanation:
      'We could not confirm a live selfie. Retake the video selfie in a well-lit space, facing the camera, without sunglasses or masks.',
    severity: 'blocking',
    stepId: 'liveness-check',
    actionLabel: 'Retake liveness check',
  },
  LIVENESS_SPOOF_SUSPECTED: {
    code: 'LIVENESS_SPOOF_SUSPECTED',
    chipLabel: 'Selfie could not be verified',
    explanation:
      'The selfie did not pass our anti-spoofing checks. Complete a new live video selfie — photos of photos or screens cannot be accepted.',
    severity: 'blocking',
    stepId: 'liveness-check',
    actionLabel: 'Retry selfie',
  },
  ADDRESS_MISSING: {
    code: 'ADDRESS_MISSING',
    chipLabel: 'Address proof missing',
    explanation:
      'We need a recent proof of address. Upload a utility bill, bank statement, or government letter dated within the last 90 days.',
    severity: 'blocking',
    stepId: 'address-proof',
    actionLabel: 'Upload address proof',
  },
  ADDRESS_MISMATCH: {
    code: 'ADDRESS_MISMATCH',
    chipLabel: 'Address does not match',
    explanation:
      'The address on your document does not match the address on your application. Update your address or upload a document that shows your current address.',
    severity: 'blocking',
    stepId: 'address-proof',
    actionLabel: 'Fix address',
  },
  ADDRESS_EXPIRED: {
    code: 'ADDRESS_EXPIRED',
    chipLabel: 'Address proof too old',
    explanation:
      'Your proof of address is older than 90 days. Upload a more recent utility bill, bank statement, or government letter.',
    severity: 'warning',
    stepId: 'address-proof',
    actionLabel: 'Upload recent proof',
  },
  SELFIE_ID_MISMATCH: {
    code: 'SELFIE_ID_MISMATCH',
    chipLabel: 'Selfie does not match ID',
    explanation:
      'The person in the selfie does not appear to match the photo on your ID. Retake the selfie, or re-upload the correct ID if you used the wrong document.',
    severity: 'blocking',
    stepId: 'liveness-check',
    actionLabel: 'Retake selfie',
  },
  AML_HIT_REQUIRES_REVIEW: {
    code: 'AML_HIT_REQUIRES_REVIEW',
    chipLabel: 'Manual compliance review',
    explanation:
      'Your application needs a manual anti-money-laundering review. Our compliance team will follow up — contact support if you have additional documents to share.',
    severity: 'info',
    stepId: 'support',
    actionLabel: 'Contact support',
    contactSupport: true,
  },
  AML_INCOMPLETE: {
    code: 'AML_INCOMPLETE',
    chipLabel: 'AML screening incomplete',
    explanation:
      'We could not finish the anti-money-laundering check. Confirm your personal details and resubmit the screening step.',
    severity: 'warning',
    stepId: 'aml-screening',
    actionLabel: 'Continue AML check',
  },
  UNCLEAR: {
    code: 'UNCLEAR',
    chipLabel: 'Needs clarification',
    explanation:
      'We could not map this rejection to a specific fix. Contact support and we will walk you through the next steps.',
    severity: 'info',
    stepId: 'support',
    actionLabel: 'Contact support',
    contactSupport: true,
  },
};

const CANONICAL_CODES = new Set<string>(Object.keys(KYC_REJECTION_TAXONOMY));

/** True when `code` is a known taxonomy entry. */
export function isCanonicalRejectionCode(code: string): code is KycRejectionCode {
  return CANONICAL_CODES.has(code);
}

/**
 * Map a raw (possibly unknown / empty) code onto the taxonomy.
 * Unknown codes become `UNCLEAR` so the UI always has a CTA.
 */
export function normalizeRejectionCode(code: string | null | undefined): KycRejectionCode {
  if (!code || !code.trim()) return 'UNCLEAR';
  const normalized = code.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return isCanonicalRejectionCode(normalized) ? normalized : 'UNCLEAR';
}

/** Resolve a rejection instance into display-ready copy + CTA metadata. */
export function resolveRejectionReason(reason: KycRejectionReason): ResolvedKycRejection {
  const code = normalizeRejectionCode(reason.code);
  const template = KYC_REJECTION_TAXONOMY[code];
  const detail = reason.detail?.trim();
  return {
    ...template,
    id: reason.id,
    detail: detail || undefined,
    displayExplanation: detail
      ? `${template.explanation} Reviewer note: ${detail}`
      : template.explanation,
  };
}

export function resolveRejectionReasons(
  reasons: KycRejectionReason[]
): ResolvedKycRejection[] {
  return reasons.map(resolveRejectionReason);
}

/** Count of blocking reasons — used for the panel summary. */
export function countBlockingReasons(resolved: ResolvedKycRejection[]): number {
  return resolved.filter((r) => r.severity === 'blocking').length;
}

export const DEFAULT_SUPPORT_HREF = '/support/kyc';
