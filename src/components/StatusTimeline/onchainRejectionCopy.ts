/**
 * Plain-language error copy templates for on-chain rejections.
 *
 * Characteristics:
 * - Calm, informative, and non-blaming language.
 * - Explains what happened in plain terms without technical jargon overload.
 * - Reassures the user that no funds were lost.
 * - Provides clear next steps (e.g. retrying with adjusted gas).
 */

export type OnchainRejectionReason =
  | 'insufficient-gas'
  | 'nonce-mismatch'
  | 'slippage-exceeded'
  | 'user-rejected'
  | 'execution-reverted'
  | 'unknown';

export interface RejectionCopyTemplate {
  /** Short, calm title */
  title: string;
  /** Plain-language description of what occurred */
  description: string;
  /** Reassuring note regarding fund safety or resolution */
  assuranceNote: string;
  /** Primary button default text */
  primaryCtaLabel: string;
  /** Secondary button default text */
  secondaryCtaLabel?: string;
}

export const ONCHAIN_REJECTION_COPY: Record<OnchainRejectionReason, RejectionCopyTemplate> = {
  'insufficient-gas': {
    title: 'Gas limit reached during processing',
    description:
      'The gas limit allocated for this transaction was slightly below current network requirements. No funds were lost.',
    assuranceNote:
      'Increasing your gas limit or adjusting parameters will allow the network to process your transaction smoothly.',
    primaryCtaLabel: 'Retry with adjusted gas',
    secondaryCtaLabel: 'Adjust gas settings',
  },
  'nonce-mismatch': {
    title: 'Transaction sequence needs sync',
    description:
      'A prior transaction is still finishing on the network, causing a temporary sequence pause. Your account balance remains unchanged.',
    assuranceNote:
      'Updating your transaction sequence order or retrying with adjusted gas will submit this request in order.',
    primaryCtaLabel: 'Retry with adjusted gas',
    secondaryCtaLabel: 'Adjust gas settings',
  },
  'slippage-exceeded': {
    title: 'Network price shifted in flight',
    description:
      'Network rates shifted slightly while your transaction was being confirmed. The execution paused safely to protect your funds.',
    assuranceNote:
      'You can safely retry with updated gas settings or slightly adjust your slippage tolerance.',
    primaryCtaLabel: 'Retry with adjusted gas',
    secondaryCtaLabel: 'Adjust gas settings',
  },
  'user-rejected': {
    title: 'Transaction request canceled',
    description:
      'The transaction signature was declined in your wallet. No charges or network fees were incurred.',
    assuranceNote:
      'When you are ready, you can initiate the transaction again with your preferred gas settings.',
    primaryCtaLabel: 'Retry with adjusted gas',
    secondaryCtaLabel: 'Adjust gas settings',
  },
  'execution-reverted': {
    title: 'Smart contract condition paused',
    description:
      'The target smart contract condition was not met at execution time. The transaction was safely rolled back with no loss of capital.',
    assuranceNote:
      'Retrying with adjusted gas or updated parameters will allow the contract to re-evaluate the state.',
    primaryCtaLabel: 'Retry with adjusted gas',
    secondaryCtaLabel: 'Adjust gas settings',
  },
  unknown: {
    title: 'Transaction pause — safe retry available',
    description:
      'An unexpected network response occurred while confirming your transaction. Your assets remain secure and untouched.',
    assuranceNote:
      'Retrying with adjusted gas settings will resubmit your transaction cleanly to the network.',
    primaryCtaLabel: 'Retry with adjusted gas',
    secondaryCtaLabel: 'Adjust gas settings',
  },
};

/**
 * Returns copy template for a given rejection reason, falling back to 'unknown' for unrecognized reasons.
 */
export function getOnchainRejectionCopy(reason?: string): RejectionCopyTemplate {
  if (reason && reason in ONCHAIN_REJECTION_COPY) {
    return ONCHAIN_REJECTION_COPY[reason as OnchainRejectionReason];
  }
  return ONCHAIN_REJECTION_COPY.unknown;
}
