/**
 * Canonical payout status taxonomy (Issue #221).
 *
 * Status pills must not rely on colour alone. Each status carries a label,
 * icon, token pair, and screen-reader-first tooltip copy so meaning survives
 * high-contrast modes, print, and assistive tech.
 */

export type PayoutStatus =
  | 'scheduled'
  | 'preparing'
  | 'sending'
  | 'confirmed'
  | 'retrying'
  | 'failed'
  | 'canceled';

export type PayoutStatusTone =
  | 'neutral'
  | 'info'
  | 'progress'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted';

export interface PayoutStatusDefinition {
  status: PayoutStatus;
  /** Short visible label on the pill. */
  label: string;
  /** Longer tooltip / SR description. */
  description: string;
  /** Semantic tone used for token lookup (colour is never the only cue). */
  tone: PayoutStatusTone;
  /** Lucide icon name key — resolved in the component. */
  icon: PayoutStatusIconName;
}

export type PayoutStatusIconName =
  | 'calendar'
  | 'package'
  | 'send'
  | 'check'
  | 'refresh'
  | 'x'
  | 'ban';

export const PAYOUT_STATUS_ORDER: PayoutStatus[] = [
  'scheduled',
  'preparing',
  'sending',
  'confirmed',
  'retrying',
  'failed',
  'canceled',
];

export const PAYOUT_STATUS_TAXONOMY: Record<PayoutStatus, PayoutStatusDefinition> = {
  scheduled: {
    status: 'scheduled',
    label: 'Scheduled',
    description:
      'This payout is scheduled for a future distribution date. No funds have moved yet.',
    tone: 'neutral',
    icon: 'calendar',
  },
  preparing: {
    status: 'preparing',
    label: 'Preparing',
    description:
      'We are assembling the payout batch and verifying recipient details before sending.',
    tone: 'info',
    icon: 'package',
  },
  sending: {
    status: 'sending',
    label: 'Sending',
    description:
      'The payout transaction has been submitted to the Stellar network and is awaiting confirmation.',
    tone: 'progress',
    icon: 'send',
  },
  confirmed: {
    status: 'confirmed',
    label: 'Confirmed',
    description:
      'The payout is confirmed on-chain. Funds have been delivered to the recipient wallet.',
    tone: 'success',
    icon: 'check',
  },
  retrying: {
    status: 'retrying',
    label: 'Retrying',
    description:
      'A previous send attempt failed. We are automatically retrying the payout.',
    tone: 'warning',
    icon: 'refresh',
  },
  failed: {
    status: 'failed',
    label: 'Failed',
    description:
      'The payout failed after retries. Review the error details and retry or contact support.',
    tone: 'danger',
    icon: 'x',
  },
  canceled: {
    status: 'canceled',
    label: 'Canceled',
    description:
      'This payout was canceled and will not be sent. No further action is required.',
    tone: 'muted',
    icon: 'ban',
  },
};

export function isPayoutStatus(value: string): value is PayoutStatus {
  return Object.prototype.hasOwnProperty.call(PAYOUT_STATUS_TAXONOMY, value);
}

export function getPayoutStatusDefinition(status: PayoutStatus): PayoutStatusDefinition {
  return PAYOUT_STATUS_TAXONOMY[status];
}

/**
 * Normalize a raw status string onto the canonical set.
 * Unknown values fall back to `scheduled` rather than inventing a free-form pill.
 */
export function normalizePayoutStatus(raw: string | null | undefined): PayoutStatus {
  if (!raw || !raw.trim()) return 'scheduled';
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
  // Accept American/British spelling of canceled.
  if (key === 'cancelled') return 'canceled';
  return isPayoutStatus(key) ? key : 'scheduled';
}
