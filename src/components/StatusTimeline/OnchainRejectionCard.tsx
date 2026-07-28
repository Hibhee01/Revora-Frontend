import React, { useState } from 'react';
import { OnchainRejectionIllustration } from '../designSystem/OnchainRejectionIllustration';
import { getOnchainRejectionCopy, OnchainRejectionReason } from './onchainRejectionCopy';
import { LoadingSpinner } from '../LoadingSpinner';
import { RefreshCw, Sliders, XCircle, CheckCircle2 } from 'lucide-react';
import './StatusTimeline.css';

export interface OnchainRejectionCardProps {
  /** Rejection reason code (defaults to 'unknown' if omitted or unknown string) */
  reason?: OnchainRejectionReason | string;
  /** Optional custom title override */
  title?: string;
  /** Optional custom description override */
  description?: string;
  /** Callback when "Retry with adjusted gas" primary CTA is clicked */
  onRetry?: () => void | Promise<void>;
  /** Callback when "Adjust gas settings" secondary CTA is clicked */
  onAdjustGas?: () => void;
  /** Callback when "Cancel transaction" tertiary CTA is clicked */
  onCancel?: () => void;
  /** Primary CTA button text override */
  retryLabel?: string;
  /** Secondary CTA button text override */
  adjustGasLabel?: string;
  /** Tertiary CTA button text override */
  cancelLabel?: string;
  /** Controlled retrying state (shows loading spinner) */
  isRetrying?: boolean;
  /** Controlled retry success state (shows success banner) */
  isSucceeded?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * OnchainRejectionCard — Calm, accessible, non-blaming error state component for on-chain rejections.
 *
 * Integrated into StatusTimeline for blocked blockchain milestones and stand-alone error displays.
 */
export const OnchainRejectionCard: React.FC<OnchainRejectionCardProps> = ({
  reason = 'unknown',
  title,
  description,
  onRetry,
  onAdjustGas,
  onCancel,
  retryLabel,
  adjustGasLabel = 'Adjust gas settings',
  cancelLabel = 'Cancel transaction',
  isRetrying: externalRetrying,
  isSucceeded: externalSucceeded,
  className = '',
}) => {
  const copy = getOnchainRejectionCopy(reason);
  const displayTitle = title || copy.title;
  const displayDescription = description || copy.description;
  const displayRetryLabel = retryLabel || copy.primaryCtaLabel;

  const [internalRetrying, setInternalRetrying] = useState(false);
  const [internalSucceeded, setInternalSucceeded] = useState(false);

  const isRetrying = externalRetrying ?? internalRetrying;
  const isSucceeded = externalSucceeded ?? internalSucceeded;

  const handleRetryClick = async () => {
    if (isRetrying || isSucceeded || !onRetry) return;
    setInternalRetrying(true);
    try {
      await onRetry();
      setInternalSucceeded(true);
    } catch {
      // Retain rejection card state on error
    } finally {
      setInternalRetrying(false);
    }
  };

  if (isSucceeded) {
    return (
      <div
        className={`st-onchain-rejection-card st-onchain-rejection-card--succeeded ${className}`.trim()}
        role="status"
        aria-live="polite"
        data-testid="onchain-rejection-success"
      >
        <div className="st-rejection-success-header">
          <CheckCircle2 size={24} className="st-success-icon" aria-hidden="true" />
          <div>
            <h4 className="st-rejection-title">Transaction succeeded</h4>
            <p className="st-rejection-description">
              Your transaction was re-submitted with adjusted gas settings and successfully confirmed on-chain.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`st-onchain-rejection-card ${className}`.trim()}
      role="alert"
      aria-live="polite"
      data-testid="onchain-rejection-card"
    >
      <div className="st-rejection-header">
        <div className="st-rejection-illustration-wrap">
          <OnchainRejectionIllustration size={80} ariaHidden={true} />
        </div>

        <div className="st-rejection-copy">
          <h4 className="st-rejection-title">{displayTitle}</h4>
          <p className="st-rejection-description">{displayDescription}</p>
          <p className="st-rejection-assurance">{copy.assuranceNote}</p>
        </div>
      </div>

      <div className="st-rejection-actions">
        {onRetry && (
          <button
            type="button"
            className="st-rejection-btn st-rejection-btn--primary"
            onClick={handleRetryClick}
            disabled={isRetrying}
            aria-label={isRetrying ? 'Retrying transaction with adjusted gas...' : displayRetryLabel}
          >
            {isRetrying ? (
              <>
                <LoadingSpinner size={14} aria-hidden="true" />
                <span>Retrying with gas...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} aria-hidden="true" />
                <span>{displayRetryLabel}</span>
              </>
            )}
          </button>
        )}

        {onAdjustGas && (
          <button
            type="button"
            className="st-rejection-btn st-rejection-btn--secondary"
            onClick={onAdjustGas}
            disabled={isRetrying}
            aria-label={adjustGasLabel}
          >
            <Sliders size={14} aria-hidden="true" />
            <span>{adjustGasLabel}</span>
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            className="st-rejection-btn st-rejection-btn--tertiary"
            onClick={onCancel}
            disabled={isRetrying}
            aria-label={cancelLabel}
          >
            <XCircle size={14} aria-hidden="true" />
            <span>{cancelLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OnchainRejectionCard;
