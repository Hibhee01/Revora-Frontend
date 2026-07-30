import React, { useId, useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import './FinancialTermsForm.css';
import {
  FIELD_CONSTRAINTS,
  type FinancialTermsField,
  type FieldValidationResult,
} from '../../utils/financialTermsValidation';
import {
  useFinancialTermsForm,
  type UseFinancialTermsFormReturn,
} from '../../hooks/useFinancialTermsForm';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface FinancialTermsFormProps {
  /** Called with validated numeric values when the form submits successfully. */
  onSubmit?: (values: Record<FinancialTermsField, number>) => void;
  /** Optional controlled hook instance — useful for testing. */
  formHook?: UseFinancialTermsFormReturn;
  className?: string;
}

/* ─── Field render order ─────────────────────────────────────────────────── */

const FIELD_ORDER: FinancialTermsField[] = [
  'revenueShareRate',
  'revenueCap',
  'paymentFrequency',
  'minInvestment',
  'maxInvestment',
  'offeringDuration',
];

/* ─── Feedback icon ─────────────────────────────────────────────────────── */

function FeedbackIcon({ severity }: { severity: 'error' | 'warning' | 'ok' }) {
  if (severity === 'error')
    return <AlertCircle size={13} className="ftf__feedback-icon" aria-hidden="true" />;
  if (severity === 'warning')
    return <AlertTriangle size={13} className="ftf__feedback-icon" aria-hidden="true" />;
  return <CheckCircle2 size={13} className="ftf__feedback-icon" aria-hidden="true" />;
}

/* ─── FieldRow ──────────────────────────────────────────────────────────── */

interface FieldRowProps {
  field: FinancialTermsField;
  value: string;
  validation: FieldValidationResult | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputId: string;
  helpId: string;
  feedbackId: string;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field,
  value,
  validation,
  onChange,
  onBlur,
  inputId,
  helpId,
  feedbackId,
}) => {
  const c = FIELD_CONSTRAINTS[field];
  const constraintId = `${inputId}-constraint`;
  const hasValidation = validation !== null;
  const isError   = hasValidation && validation.severity === 'error';
  const isWarning = hasValidation && validation.severity === 'warning';
  const isOk      = hasValidation && validation.severity === 'ok';

  const inputClass = [
    'ftf__input',
    isError   ? 'ftf__input--error'   : '',
    isWarning ? 'ftf__input--warning' : '',
    isOk      ? 'ftf__input--ok'      : '',
  ]
    .filter(Boolean)
    .join(' ');

  // aria-describedby includes constraint, help text, and validation feedback.
  const describedBy = `${constraintId} ${helpId}${hasValidation ? ` ${feedbackId}` : ''}`;

  return (
    <div className="ftf__field" data-testid={`ftf-field-${field}`}>
      {/* Label row with constraint hint */}
      <div className="ftf__label-row">
        <label htmlFor={inputId} className="ftf__label">
          {c.label}
        </label>
        <span id={constraintId} className="ftf__constraint-hint" aria-hidden="true">
          {formatConstraintRange(c.min, c.max, c.unit)}
        </span>
      </div>

      {/* Help text above input — always visible, referenced by aria-describedby */}
      <p id={helpId} className="ftf__help">
        {c.helpText}
      </p>

      {/* Input with unit badge */}
      <div className="ftf__input-wrap">
        <input
          id={inputId}
          name={field}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={isError ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required="true"
          data-testid={`ftf-input-${field}`}
        />
        <span className="ftf__unit" aria-hidden="true">
          {c.unit}
        </span>
      </div>

      {/* Inline feedback below input — error or warning */}
      {hasValidation && validation.severity !== 'ok' && (
        <div
          id={feedbackId}
          className={`ftf__feedback ftf__feedback--${validation.severity}`}
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          aria-atomic="true"
          data-testid={`ftf-feedback-${field}`}
        >
          <FeedbackIcon severity={validation.severity} />
          <span>{validation.message}</span>
        </div>
      )}

      {/* Success confirmation — visible and screen-reader-announced */}
      {isOk && (
        <div
          id={feedbackId}
          className="ftf__feedback ftf__feedback--ok"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid={`ftf-feedback-${field}`}
        >
          <FeedbackIcon severity="ok" />
          <span>{c.label} looks good.</span>
        </div>
      )}
    </div>
  );
};

/* ─── FinancialTermsForm ────────────────────────────────────────────────── */

export const FinancialTermsForm: React.FC<FinancialTermsFormProps> = ({
  onSubmit,
  formHook,
  className = '',
}) => {
  const internalHook = useFinancialTermsForm();
  const {
    values,
    submitAttempted,
    getFieldValidation,
    formSummary,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = formHook ?? internalHook;

  const baseId = useId();
  const errorSummaryId = `${baseId}-error-summary`;
  const [submitted, setSubmitted] = React.useState(false);

  const getIds = useCallback(
    (field: FinancialTermsField) => ({
      inputId:    `${baseId}-${field}`,
      helpId:     `${baseId}-${field}-help`,
      feedbackId: `${baseId}-${field}-feedback`,
    }),
    [baseId],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const summary = handleSubmit();
      if (!summary.isValid) return;

      const numericValues = (Object.keys(summary.fields) as FinancialTermsField[]).reduce(
        (acc, field) => {
          acc[field] = summary.fields[field].numericValue as number;
          return acc;
        },
        {} as Record<FinancialTermsField, number>,
      );

      setSubmitted(true);
      onSubmit?.(numericValues);
    },
    [handleSubmit, onSubmit],
  );

  const handleReset = useCallback(() => {
    reset();
    setSubmitted(false);
  }, [reset]);

  // Count visible errors for the summary banner (field errors + cross-field)
  const errorCount =
    (Object.keys(formSummary.fields) as FinancialTermsField[]).filter(
      (f) => formSummary.fields[f].severity === 'error',
    ).length + (formSummary.crossFieldError ? 1 : 0);

  /* ── Success state ─────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className={`ftf ${className}`} data-testid="ftf-success">
        {/* Live region for screen readers — announces success */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Financial terms saved successfully. Your offering's financial terms have been recorded
          and will be reviewed before publishing.
        </div>
        <div className="ftf__success">
          <CheckCircle2 size={40} color="var(--success)" aria-hidden="true" />
          <p className="ftf__success-title">Financial terms saved</p>
          <p className="ftf__success-body">
            Your offering's financial terms have been recorded and will be reviewed before
            publishing.
          </p>
          <button
            type="button"
            className="ftf__reset-btn"
            onClick={handleReset}
            data-testid="ftf-edit-btn"
          >
            Edit terms
          </button>
        </div>
      </div>
    );
  }

  /* ── Form state ────────────────────────────────────────────────────── */
  return (
    <div className={`ftf ${className}`} data-testid="ftf-container">
      {/* Header */}
      <div className="ftf__header">
        <h2 className="ftf__title">Financial terms</h2>
        <p className="ftf__subtitle">
          Set the economic parameters for your{' '}
          <abbr title="RevenueShare offering">RevenueShare offering</abbr>.
          All fields are required. Constraints are shown beside each label.
        </p>
      </div>

      <form
        onSubmit={handleFormSubmit}
        noValidate
        aria-label="Offering financial terms"
        data-testid="ftf-form"
      >
        {/* Error summary — shown after submit attempt when errors exist */}
        {submitAttempted && errorCount > 0 && (
          <div
            id={errorSummaryId}
            className="ftf__error-summary"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-testid="ftf-error-summary"
          >
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              {errorCount} field{errorCount !== 1 ? 's' : ''} need
              {errorCount === 1 ? 's' : ''} attention before you can continue.
            </span>
          </div>
        )}

        {/* Field grid */}
        <div className="ftf__grid">
          {FIELD_ORDER.map((field) => {
            const { inputId, helpId, feedbackId } = getIds(field);
            return (
              <FieldRow
                key={field}
                field={field}
                value={values[field]}
                validation={getFieldValidation(field)}
                onChange={(v) => handleChange(field, v)}
                onBlur={() => handleBlur(field)}
                inputId={inputId}
                helpId={helpId}
                feedbackId={feedbackId}
              />
            );
          })}
        </div>

        {/* Cross-field error */}
        {formSummary.crossFieldError && (
          <div
            className="ftf__cross-error"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-testid="ftf-cross-error"
          >
            <AlertCircle size={16} aria-hidden="true" />
            <span>{formSummary.crossFieldError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="ftf__actions">
          <button
            type="button"
            className="ftf__reset-btn"
            onClick={handleReset}
            data-testid="ftf-reset-btn"
          >
            Reset
          </button>
          <button
            type="submit"
            className="ftf__submit-btn"
            data-testid="ftf-submit-btn"
          >
            <Info size={14} aria-hidden="true" />
            Save financial terms
          </button>
        </div>
      </form>
    </div>
  );
};

FinancialTermsForm.displayName = 'FinancialTermsForm';

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatConstraintRange(min: number, max: number, unit: string): string {
  if (unit === '%')   return `${min}–${max}%`;
  if (unit === 'USD') return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
  return `${min}–${max} ${unit}`;
}
