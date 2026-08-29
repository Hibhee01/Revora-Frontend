/**
 * KycVerificationProgress — KYC verification progress indicator (Issue #624).
 *
 * A dedicated progress component for the KYC verification pipeline that
 * wraps the canonical StatusTimeline with KYC-specific step states,
 * a visual progress bar, and step-level detail cards.
 *
 * Features:
 *  - Overall progress bar with percentage and step count
 *  - Individual step cards with status icons, descriptions, timestamps
 *  - Blocked / failed step action badges
 *  - Skipped step visual treatment (dashed border, strikethrough label)
 *  - Vertical timeline layout with connector lines
 *  - WCAG 2.1 AA accessible (landmark, ARIA, keyboard, reduced motion)
 *  - RTL-safe logical properties
 *  - Responsive reflow on mobile
 */

import React, { useId } from 'react';
import {
  Check,
  Circle,
  AlertTriangle,
  Clock,
  X,
  FileImage,
  ScanFace,
  MapPin,
  Shield,
  PartyPopper,
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import './KycVerificationProgress.css';

/* ─── Types ─────────────────────────────────────────────────── */

export type KycStepState =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'skipped';

export interface KycStep {
  /** Unique identifier for this KYC step. */
  id: string;
  /** Short display label (e.g. "ID Upload"). */
  label: string;
  /** Longer description of what this step entails. */
  description?: string;
  /** Current state of this step. */
  state: KycStepState;
  /** Optional icon override (defaults to a state-specific icon). */
  icon?: React.ReactNode;
  /** ISO timestamp for when this step was completed or last updated. */
  timestamp?: string;
  /** Sub-label shown in a badge (e.g. "1 of 2 documents uploaded"). */
  badge?: string;
  /** Action to take when the step is blocked or failed. */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface KycVerificationProgressProps {
  /** Array of KYC steps to render in order. */
  steps: KycStep[];
  /** Overall verification status string (displayed in header). */
  status?: string;
  /** Title shown at the top of the progress indicator. */
  title?: string;
  /** Accessible label for the progress region. */
  ariaLabel?: string;
  /** Optional callback when the user clicks "Learn more" about a step. */
  onStepDetail?: (stepId: string) => void;
  /** Optional className to apply to the root element. */
  className?: string;
}

/* ─── Helpers ───────────────────────────────────────────────── */

function getStepIcon(step: KycStep): React.ReactNode {
  if (step.icon) return step.icon;

  // Step-specific default icons based on id patterns
  const idLower = step.id.toLowerCase();
  if (idLower.includes('id-upload') || idLower.includes('document')) {
    return <FileImage size={16} aria-hidden="true" />;
  }
  if (idLower.includes('liveness') || idLower.includes('selfie')) {
    return <ScanFace size={16} aria-hidden="true" />;
  }
  if (idLower.includes('address')) {
    return <MapPin size={16} aria-hidden="true" />;
  }
  if (idLower.includes('aml') || idLower.includes('screening')) {
    return <Shield size={16} aria-hidden="true" />;
  }
  if (idLower.includes('approved') || idLower.includes('complete')) {
    return <PartyPopper size={16} aria-hidden="true" />;
  }

  // Fallback: state-specific icons
  switch (step.state) {
    case 'completed':
      return <Check size={16} aria-hidden="true" />;
    case 'in-progress':
      return <LoadingSpinner size={16} aria-hidden="true" />;
    case 'blocked':
    case 'failed':
      return <AlertTriangle size={14} aria-hidden="true" />;
    case 'skipped':
      return <X size={14} aria-hidden="true" />;
    case 'pending':
    default:
      return <Circle size={12} aria-hidden="true" />;
  }
}

function getProgressPercent(steps: KycStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.state === 'completed').length;
  return Math.round((completed / steps.length) * 100);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getConnectorState(
  current: KycStepState,
  next: KycStepState,
): string {
  if (current === 'completed' && next === 'completed') {
    return 'kyc-progress__connector--completed';
  }
  if (current === 'completed' && next === 'in-progress') {
    return 'kyc-progress__connector--in-progress';
  }
  if (current === 'blocked' || current === 'failed' || next === 'blocked' || next === 'failed') {
    return 'kyc-progress__connector--blocked';
  }
  return 'kyc-progress__connector--pending';
}

function getStatusLabel(state: KycStepState): string {
  switch (state) {
    case 'completed': return 'Completed';
    case 'in-progress': return 'In progress';
    case 'blocked': return 'Action required';
    case 'failed': return 'Failed';
    case 'skipped': return 'Skipped';
    case 'pending':
    default: return 'Pending';
  }
}

/* ─── Main Component ────────────────────────────────────────── */

export const KycVerificationProgress: React.FC<KycVerificationProgressProps> = ({
  steps,
  status,
  title = 'KYC Verification Progress',
  ariaLabel = 'KYC verification progress',
  onStepDetail,
  className = '',
}) => {
  const baseId = useId();
  const percent = getProgressPercent(steps);
  const completedCount = steps.filter((s) => s.state === 'completed').length;
  const hasBlocked = steps.some(
    (s) => s.state === 'blocked' || s.state === 'failed',
  );

  return (
    <section
      className={`kyc-progress glass-card ${className}`.trim()}
      role="region"
      aria-label={ariaLabel}
      aria-labelledby={`${baseId}-heading`}
      data-testid="kyc-verification-progress"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <header className="kyc-progress__header">
        <div className="kyc-progress__header-text">
          <h2 id={`${baseId}-heading`} className="kyc-progress__title">
            {title}
          </h2>
          {status && (
            <span
              className={`kyc-progress__status ${hasBlocked ? 'kyc-progress__status--blocked' : ''}`}
              data-testid="kyc-progress-status"
            >
              {status}
            </span>
          )}
        </div>
      </header>

      {/* ── Progress Bar ──────────────────────────────────── */}
      <div className="kyc-progress__bar-wrap">
        <div className="kyc-progress__bar-track" role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent}% complete, ${completedCount} of ${steps.length} steps`}
        >
          <div
            className={`kyc-progress__bar-fill ${hasBlocked ? 'kyc-progress__bar-fill--warning' : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="kyc-progress__bar-label" aria-hidden="true">
          {completedCount}/{steps.length} steps
        </span>
      </div>

      {/* ── Step Timeline ─────────────────────────────────── */}
      <ol className="kyc-progress__steps" aria-label="Verification steps">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const tooltipId = `${baseId}-tip-${step.id}`;
          const stateClass =
            step.state === 'blocked'
              ? 'kyc-progress__step--blocked'
              : step.state === 'failed'
                ? 'kyc-progress__step--failed'
                : step.state === 'skipped'
                  ? 'kyc-progress__step--skipped'
                  : '';

          return (
            <li
              key={step.id}
              className={`kyc-progress__step ${stateClass}`}
              data-testid={`kyc-step-${step.id}`}
              aria-current={step.state === 'in-progress' ? 'step' : undefined}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`kyc-progress__connector ${getConnectorState(
                    step.state,
                    steps[index + 1].state,
                  )}`}
                  aria-hidden="true"
                />
              )}

              {/* Step marker */}
              <div
                className={`kyc-progress__marker kyc-progress__marker--${step.state}`}
                aria-label={`${step.label}: ${getStatusLabel(step.state)}`}
                role="img"
              >
                {getStepIcon(step)}
              </div>

              {/* Step content */}
              <div className="kyc-progress__step-content">
                <div className="kyc-progress__step-header">
                  <span
                    className={`kyc-progress__step-label ${
                      step.state === 'pending'
                        ? 'kyc-progress__step-label--pending'
                        : step.state === 'skipped'
                          ? 'kyc-progress__step-label--skipped'
                          : ''
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.badge && (
                    <span className="kyc-progress__badge" data-testid={`kyc-badge-${step.id}`}>
                      {step.badge}
                    </span>
                  )}
                </div>

                {step.description && (
                  <span className="kyc-progress__step-desc">
                    {step.description}
                  </span>
                )}

                {step.timestamp && (
                  <time
                    className="kyc-progress__step-time"
                    dateTime={new Date(step.timestamp).toISOString()}
                  >
                    {formatTimestamp(step.timestamp)}
                  </time>
                )}

                {/* Blocked / failed action badge */}
                {(step.state === 'blocked' || step.state === 'failed') && step.action && (
                  <button
                    type="button"
                    className="kyc-progress__action-btn"
                    onClick={step.action.onClick}
                    aria-label={`Action required: ${step.action.label}`}
                    data-testid={`kyc-action-${step.id}`}
                  >
                    <AlertTriangle size={12} aria-hidden="true" />
                    {step.action.label}
                  </button>
                )}

                {/* Learn-more link for steps with detail callback */}
                {onStepDetail && step.state !== 'pending' && step.state !== 'skipped' && (
                  <button
                    type="button"
                    className="kyc-progress__detail-link"
                    onClick={() => onStepDetail(step.id)}
                    aria-label={`View details for ${step.label}`}
                    data-testid={`kyc-detail-${step.id}`}
                  >
                    View details
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default KycVerificationProgress;
