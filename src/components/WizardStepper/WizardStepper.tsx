/**
 * WizardStepper — design-system progress indicator for multi-step wizards.
 *
 * Issue #271: RTL mirror pass
 * - Visual flow mirrors under `dir="rtl"` (connectors, progress fill from inline-start)
 * - Numeric step labels stay LTR-formatted (Unicode bidi isolate)
 * - Document order of steps is never reversed — CSS logical properties mirror layout
 */

import React from 'react';
import { Check } from 'lucide-react';
import './WizardStepper.css';

export interface WizardStep {
  /** Stable id for React keys */
  id: string;
  /** Visible / SR label (may be RTL or mixed-direction text) */
  label: string;
  /**
   * Numeric badge. Defaults to 1-based index.
   * Always rendered with `dir="ltr"` + `unicode-bidi: isolate`.
   */
  number?: number;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  /** 0-based index of the active step */
  currentIndex: number;
  ariaLabel?: string;
  /** Continuous track beneath the step row (fills from inline-start) */
  showProgressTrack?: boolean;
  className?: string;
}

export type WizardStepState = 'completed' | 'active' | 'pending';

export function getStepState(index: number, currentIndex: number): WizardStepState {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'active';
  return 'pending';
}

/** Progress percent for the continuous track (0–100). */
export function getWizardProgressPercent(currentIndex: number, total: number): number {
  if (total <= 1) return currentIndex >= 0 ? 100 : 0;
  const clamped = Math.max(0, Math.min(currentIndex, total - 1));
  return Math.round((clamped / (total - 1)) * 100);
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentIndex,
  ariaLabel = 'Wizard progress',
  showProgressTrack = true,
  className = '',
}) => {
  const total = steps.length;
  const safeIndex = Math.max(0, Math.min(currentIndex, Math.max(total - 1, 0)));
  const progress = getWizardProgressPercent(safeIndex, total);
  const current = steps[safeIndex];

  return (
    <nav
      className={`wizard-stepper ${className}`.trim()}
      aria-label={ariaLabel}
      data-testid="wizard-stepper"
    >
      {showProgressTrack && total > 0 && (
        <div
          className="wizard-stepper__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`${progress}% complete`}
        >
          <div
            className="wizard-stepper__fill"
            style={{ ['--ws-progress' as string]: `${progress}%` }}
            data-testid="wizard-stepper-fill"
          />
        </div>
      )}

      <ol className="wizard-stepper__list">
        {steps.map((step, index) => {
          const state = getStepState(index, safeIndex);
          const num = step.number ?? index + 1;
          const isLast = index === total - 1;

          return (
            <li
              key={step.id}
              className={`wizard-stepper__item wizard-stepper__item--${state}`}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <span className="wizard-stepper__marker" aria-hidden="true">
                {state === 'completed' ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span className="wizard-stepper__num" dir="ltr">
                    {num}
                  </span>
                )}
              </span>

              {!isLast && (
                <span
                  className={`wizard-stepper__connector wizard-stepper__connector--${
                    state === 'completed'
                      ? 'completed'
                      : state === 'active'
                        ? 'active'
                        : 'pending'
                  }`}
                  aria-hidden="true"
                />
              )}

              <span className="wizard-stepper__label" title={step.label}>
                {step.label}
              </span>

              <span className="sr-only">
                Step{' '}
                <span dir="ltr">{num}</span>
                {': '}
                {step.label}
                {state === 'completed' ? ' (completed)' : state === 'active' ? ' (current)' : ''}
              </span>
            </li>
          );
        })}
      </ol>

      {current && (
        <p className="wizard-stepper__status" aria-live="polite">
          Step{' '}
          <span className="wizard-stepper__num" dir="ltr">
            {current.number ?? safeIndex + 1}
          </span>
          {' of '}
          <span className="wizard-stepper__num" dir="ltr">
            {total}
          </span>
          {': '}
          {current.label}
        </p>
      )}
    </nav>
  );
};

WizardStepper.displayName = 'WizardStepper';
