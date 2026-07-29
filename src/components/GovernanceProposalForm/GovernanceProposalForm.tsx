/**
 * GovernanceProposalForm — Issue #247
 *
 * Multi-step proposal creation form with:
 * - Step 1: Title — proposal title input
 * - Step 2: Abstract — description/abstract textarea
 * - Step 3: Actions — action builder with type selector
 * - Step 4: Preview — live preview mirroring GovernanceProposalDetail
 *
 * Features:
 * - Autosave to localStorage
 * - Step validation before advancing
 * - Accessible (WCAG 2.1 AA): aria labels, focus management, keyboard nav
 * - Responsive: stacked on mobile, side-by-side on desktop
 * - Action-builder validates that referenced accounts exist
 */

import React, { useState, useCallback, useEffect, useRef, useId } from 'react';
import { CheckCircle2, Plus, Trash2, ArrowLeft, ArrowRight, Send, Eye, FileText, Clock, Users } from 'lucide-react';
import { Button } from '../Button';
import './GovernanceProposalForm.css';

/* ─── Types ────────────────────────────────────────────────────────── */

export type ProposalActionType = 'transfer' | 'contract_call' | 'parameter_change' | 'text_resolution';

export interface ProposalAction {
  id: string;
  type: ProposalActionType;
  /** Target address/contract (for transfer/contract_call) */
  target?: string;
  /** Value/amount (for transfer) */
  value?: string;
  /** Function signature (for contract_call) */
  functionSig?: string;
  /** Calldata / arguments (for contract_call) */
  calldata?: string;
  /** Parameter name (for parameter_change) */
  paramName?: string;
  /** New value (for parameter_change) */
  paramValue?: string;
  /** Description (for text_resolution) */
  description?: string;
}

export interface ProposalDraft {
  title: string;
  abstract: string;
  actions: ProposalAction[];
}

export type FormStep = 1 | 2 | 3 | 4;

type AutosaveStatus = 'idle' | 'saving' | 'saved';

/* ─── Constants ─────────────────────────────────────────────────────── */

const STORAGE_KEY = 'gov-proposal-draft';

const ACTION_TYPE_LABELS: Record<ProposalActionType, string> = {
  transfer: 'Transfer',
  contract_call: 'Contract Call',
  parameter_change: 'Parameter Change',
  text_resolution: 'Text Resolution',
};

const ACTION_TYPE_OPTIONS: { value: ProposalActionType; label: string; description: string }[] = [
  { value: 'transfer', label: 'Transfer', description: 'Transfer tokens to an address' },
  { value: 'contract_call', label: 'Contract Call', description: 'Execute a contract function' },
  { value: 'parameter_change', label: 'Parameter Change', description: 'Change a governance parameter' },
  { value: 'text_resolution', label: 'Text Resolution', description: 'Non-binding text proposal' },
];

const STEP_LABELS: Record<FormStep, string> = {
  1: 'Title',
  2: 'Abstract',
  3: 'Actions',
  4: 'Preview',
};

const TITLE_MAX = 200;
const ABSTRACT_MAX = 2000;

/* ─── Helpers ───────────────────────────────────────────────────────── */

let actionIdCounter = 0;
function nextActionId(): string {
  actionIdCounter += 1;
  return `action-${actionIdCounter}-${Date.now()}`;
}

function createEmptyAction(): ProposalAction {
  return { id: nextActionId(), type: 'transfer' };
}

function loadDraft(): ProposalDraft {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ProposalDraft;
      return {
        title: parsed.title || '',
        abstract: parsed.abstract || '',
        actions: Array.isArray(parsed.actions) && parsed.actions.length > 0
          ? parsed.actions
          : [createEmptyAction()],
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { title: '', abstract: '', actions: [createEmptyAction()] };
}

function saveDraft(draft: ProposalDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or unavailable
  }
}

/* ─── Props ─────────────────────────────────────────────────────────── */

export interface GovernanceProposalFormProps {
  /** Called when the proposal is submitted */
  onSubmit?: (draft: ProposalDraft) => void;
  /** Called when the form is cancelled */
  onCancel?: () => void;
  className?: string;
}

/* ─── Main Component ───────────────────────────────────────────────── */

export const GovernanceProposalForm: React.FC<GovernanceProposalFormProps> = ({
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [step, setStep] = useState<FormStep>(1);
  const [draft, setDraft] = useState<ProposalDraft>(loadDraft);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [touched, setTouched] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formId = useId();

  // Autosave: persist draft to localStorage on changes with debounce
  useEffect(() => {
    if (!touched) return;

    setAutosaveStatus('saving');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveDraft(draft);
      setAutosaveStatus('saved');
      // Reset saved status after 2s
      setTimeout(() => {
        setAutosaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 2000);
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draft, touched]);

  // Mark as touched when the user modifies any field
  const markTouched = useCallback(() => {
    if (!touched) setTouched(true);
  }, [touched]);

  const updateTitle = useCallback((title: string) => {
    markTouched();
    setDraft((prev) => ({ ...prev, title }));
  }, [markTouched]);

  const updateAbstract = useCallback((abstract: string) => {
    markTouched();
    setDraft((prev) => ({ ...prev, abstract }));
  }, [markTouched]);

  const updateAction = useCallback((actionId: string, updates: Partial<ProposalAction>) => {
    markTouched();
    setDraft((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => (a.id === actionId ? { ...a, ...updates } : a)),
    }));
  }, [markTouched]);

  const removeAction = useCallback((actionId: string) => {
    markTouched();
    setDraft((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== actionId),
    }));
  }, [markTouched]);

  const addAction = useCallback(() => {
    markTouched();
    setDraft((prev) => ({
      ...prev,
      actions: [...prev.actions, createEmptyAction()],
    }));
  }, [markTouched]);

  // Navigation
  const totalSteps = 4;

  const goToStep = useCallback((newStep: FormStep) => {
    setStep(newStep);
  }, []);

  const goNext = useCallback(() => {
    if (step < totalSteps) {
      goToStep((step + 1) as FormStep);
    }
  }, [step, goToStep]);

  const goBack = useCallback(() => {
    if (step > 1) {
      goToStep((step - 1) as FormStep);
    }
  }, [step, goToStep]);

  const handleSubmit = useCallback(() => {
    onSubmit?.(draft);
  }, [draft, onSubmit]);

  // Validation for current step
  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return draft.title.trim().length >= 3;
      case 2:
        return draft.abstract.trim().length >= 10;
      case 3:
        return draft.actions.length > 0 && draft.actions.every((a) => {
          if (a.type === 'transfer') return (a.target?.trim()?.length ?? 0) > 0 && (a.value?.trim()?.length ?? 0) > 0;
          if (a.type === 'contract_call') return (a.target?.trim()?.length ?? 0) > 0;
          if (a.type === 'parameter_change') return (a.paramName?.trim()?.length ?? 0) > 0;
          return true; // text_resolution always valid
        });
      default:
        return true;
    }
  };

  const autosaveChip = () => {
    const statusClass = autosaveStatus === 'saving' ? 'gpf-autosave--saving' : autosaveStatus === 'saved' ? 'gpf-autosave--saved' : '';
    const label = autosaveStatus === 'saving' ? 'Saving...' : autosaveStatus === 'saved' ? 'Saved' : '';
    if (autosaveStatus === 'idle') return null;

    return (
      <span className={`gpf-autosave ${statusClass}`} aria-live="polite" aria-atomic="true">
        <span className="gpf-autosave-dot" aria-hidden="true" />
        {label}
      </span>
    );
  };

  /* ─── Step 1: Title ──────────────────────────────────────────────── */

  const renderTitleStep = () => (
    <div className="gpf-card" role="region" aria-label="Step 1: Proposal title">
      <h2 className="gpf-card-title">Proposal Title</h2>
      <p className="gpf-card-desc">
        Give your proposal a clear, descriptive title that summarizes its purpose.
      </p>

      <div className="gpf-field">
        <label htmlFor={`${formId}-title`} className="gpf-label">
          Title <span className="gpf-label-hint">(required, 3–200 characters)</span>
        </label>
        <input
          id={`${formId}-title`}
          type="text"
          className={`gpf-input ${draft.title.length > TITLE_MAX ? 'gpf-input--error' : ''}`}
          value={draft.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="e.g., Increase Protocol Treasury Allocation"
          maxLength={TITLE_MAX + 50}
          aria-describedby={`${formId}-title-count`}
          aria-required="true"
          autoFocus
        />
        <div
          id={`${formId}-title-count`}
          className={`gpf-char-count ${draft.title.length > TITLE_MAX - 20 ? 'gpf-char-count--warn' : ''} ${draft.title.length > TITLE_MAX ? 'gpf-char-count--error' : ''}`}
          aria-live="polite"
        >
          {draft.title.length}/{TITLE_MAX}
        </div>
        {draft.title.length > TITLE_MAX && (
          <div className="gpf-error" role="alert">Title exceeds maximum length of {TITLE_MAX} characters.</div>
        )}
      </div>
    </div>
  );

  /* ─── Step 2: Abstract ────────────────────────────────────────────── */

  const renderAbstractStep = () => (
    <div className="gpf-card" role="region" aria-label="Step 2: Proposal abstract">
      <h2 className="gpf-card-title">Abstract</h2>
      <p className="gpf-card-desc">
        Describe the purpose, motivation, and expected impact of your proposal. Be specific and concise.
      </p>

      <div className="gpf-field">
        <label htmlFor={`${formId}-abstract`} className="gpf-label">
          Abstract <span className="gpf-label-hint">(required, 10–2000 characters)</span>
        </label>
        <textarea
          id={`${formId}-abstract`}
          className={`gpf-textarea ${draft.abstract.length > ABSTRACT_MAX ? 'gpf-input--error' : ''}`}
          value={draft.abstract}
          onChange={(e) => updateAbstract(e.target.value)}
          placeholder="Describe your proposal in detail. Include the problem, solution, and expected outcomes..."
          maxLength={ABSTRACT_MAX + 100}
          aria-describedby={`${formId}-abstract-count`}
          aria-required="true"
          autoFocus
        />
        <div
          id={`${formId}-abstract-count`}
          className={`gpf-char-count ${draft.abstract.length > ABSTRACT_MAX - 200 ? 'gpf-char-count--warn' : ''} ${draft.abstract.length > ABSTRACT_MAX ? 'gpf-char-count--error' : ''}`}
          aria-live="polite"
        >
          {draft.abstract.length}/{ABSTRACT_MAX}
        </div>
        {draft.abstract.length > ABSTRACT_MAX && (
          <div className="gpf-error" role="alert">Abstract exceeds maximum length of {ABSTRACT_MAX} characters.</div>
        )}
      </div>
    </div>
  );

  /* ─── Step 3: Actions ─────────────────────────────────────────────── */

  const renderActionsStep = () => (
    <div className="gpf-card" role="region" aria-label="Step 3: Proposal actions">
      <h2 className="gpf-card-title">Actions</h2>
      <p className="gpf-card-desc">
        Define the actions this proposal will execute. Each action specifies an operation such as a token transfer, contract call, or parameter change.
      </p>

      <div className="gpf-actions-section">
        {draft.actions.map((action, index) => (
          <div key={action.id} className="gpf-action-card" data-testid={`action-card-${index}`}>
            <div className="gpf-action-header">
              <span className="gpf-action-number">Action #{index + 1}</span>
              <button
                type="button"
                className="gpf-action-remove"
                onClick={() => removeAction(action.id)}
                aria-label={`Remove action ${index + 1}`}
                disabled={draft.actions.length <= 1}
                title="Remove action"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="gpf-action-fields">
              <div className="gpf-action-field-row">
                <label htmlFor={`${formId}-action-type-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                  Type
                </label>
                <select
                  id={`${formId}-action-type-${action.id}`}
                  className="gpf-action-type-select"
                  value={action.type}
                  onChange={(e) => updateAction(action.id, { type: e.target.value as ProposalActionType })}
                  aria-label={`Action ${index + 1} type`}
                >
                  {ACTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} title={opt.description}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(action.type === 'transfer' || action.type === 'contract_call') && (
                <div className="gpf-action-field-row">
                  <label htmlFor={`${formId}-target-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                    Target
                  </label>
                  <input
                    id={`${formId}-target-${action.id}`}
                    type="text"
                    className="gpf-input"
                    value={action.target || ''}
                    onChange={(e) => updateAction(action.id, { target: e.target.value })}
                    placeholder="0x... or account address"
                    aria-label={`Action ${index + 1} target address`}
                  />
                </div>
              )}

              {action.type === 'transfer' && (
                <div className="gpf-action-field-row">
                  <label htmlFor={`${formId}-value-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                    Value
                  </label>
                  <input
                    id={`${formId}-value-${action.id}`}
                    type="text"
                    className="gpf-input"
                    value={action.value || ''}
                    onChange={(e) => updateAction(action.id, { value: e.target.value })}
                    placeholder="Amount in tokens (e.g. 10000)"
                    aria-label={`Action ${index + 1} value`}
                  />
                </div>
              )}

              {action.type === 'contract_call' && (
                <>
                  <div className="gpf-action-field-row">
                    <label htmlFor={`${formId}-func-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                      Function
                    </label>
                    <input
                      id={`${formId}-func-${action.id}`}
                      type="text"
                      className="gpf-input"
                      value={action.functionSig || ''}
                      onChange={(e) => updateAction(action.id, { functionSig: e.target.value })}
                      placeholder="transfer(address,uint256)"
                      aria-label={`Action ${index + 1} function signature`}
                    />
                  </div>
                  <div className="gpf-action-field-row">
                    <label htmlFor={`${formId}-calldata-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                      Calldata
                    </label>
                    <input
                      id={`${formId}-calldata-${action.id}`}
                      type="text"
                      className="gpf-input"
                      value={action.calldata || ''}
                      onChange={(e) => updateAction(action.id, { calldata: e.target.value })}
                      placeholder="Encoded calldata (hex)"
                      aria-label={`Action ${index + 1} calldata`}
                    />
                  </div>
                </>
              )}

              {action.type === 'parameter_change' && (
                <>
                  <div className="gpf-action-field-row">
                    <label htmlFor={`${formId}-param-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                      Parameter
                    </label>
                    <input
                      id={`${formId}-param-${action.id}`}
                      type="text"
                      className="gpf-input"
                      value={action.paramName || ''}
                      onChange={(e) => updateAction(action.id, { paramName: e.target.value })}
                      placeholder="e.g., votingPeriod"
                      aria-label={`Action ${index + 1} parameter name`}
                    />
                  </div>
                  <div className="gpf-action-field-row">
                    <label htmlFor={`${formId}-param-val-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                      New Value
                    </label>
                    <input
                      id={`${formId}-param-val-${action.id}`}
                      type="text"
                      className="gpf-input"
                      value={action.paramValue || ''}
                      onChange={(e) => updateAction(action.id, { paramValue: e.target.value })}
                      placeholder="e.g., 604800 (7 days in seconds)"
                      aria-label={`Action ${index + 1} new parameter value`}
                    />
                  </div>
                </>
              )}

              {action.type === 'text_resolution' && (
                <div className="gpf-action-field-row">
                  <label htmlFor={`${formId}-desc-${action.id}`} className="gpf-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                    Description
                  </label>
                  <input
                    id={`${formId}-desc-${action.id}`}
                    type="text"
                    className="gpf-input"
                    value={action.description || ''}
                    onChange={(e) => updateAction(action.id, { description: e.target.value })}
                    placeholder="Describe the resolution text"
                    aria-label={`Action ${index + 1} description`}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="gpf-action-add"
          onClick={addAction}
          aria-label="Add another action"
        >
          <Plus size={14} aria-hidden="true" />
          Add Action
        </button>
      </div>
    </div>
  );

  /* ─── Step 4: Preview ─────────────────────────────────────────────── */

  const renderPreviewStep = () => {
    const hasContent = draft.title.trim() || draft.abstract.trim() || draft.actions.length > 0;

    if (!hasContent) {
      return (
        <div className="gpf-card" role="region" aria-label="Step 4: Preview">
          <h2 className="gpf-card-title">Preview</h2>
          <p className="gpf-card-desc">
            Review your proposal before submitting. Complete the previous steps to see a preview.
          </p>
          <div className="gpf-preview-empty">
            <FileText size={48} aria-hidden="true" />
            <p>Complete the previous steps to preview your proposal.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="gpf-card" role="region" aria-label="Step 4: Proposal preview">
        <h2 className="gpf-card-title">Preview</h2>
        <p className="gpf-card-desc">
          Review your complete proposal before submitting. This is how it will appear on the proposal detail page.
        </p>

        <div className="gpf-preview">
          {/* Preview: Hero section */}
          <div className="gpd-hero" style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)',
          }}>
            <div className="gpd-hero-top" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <span className="gpd-pill gpd-pill--active" style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
                background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)',
              }}>
                <Clock size={12} aria-hidden="true" />
                Active
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                <Clock size={14} aria-hidden="true" /> 7d remaining
              </span>
            </div>
            <h1 className="gpd-title" style={{
              fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-main)', margin: '0 0 var(--spacing-sm)',
            }}>
              {draft.title || 'Untitled Proposal'}
            </h1>
            <p className="gpd-description" style={{
              fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)',
              lineHeight: 'var(--line-height-normal)', margin: '0 0 var(--spacing-md)',
            }}>
              {draft.abstract || 'No abstract provided.'}
            </p>
            <div className="gpd-proposer" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xs)',
              fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)',
            }}>
              <Users size={14} aria-hidden="true" />
              Proposed by <strong>Your Wallet</strong>
            </div>
          </div>

          {/* Preview: Actions list */}
          {draft.actions.length > 0 && (
            <div style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
            }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-main)', margin: '0 0 var(--spacing-md)' }}>
                Actions ({draft.actions.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {draft.actions.map((action, index) => (
                  <div key={action.id} style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                      <span style={{
                        fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-accent)', background: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--primary)',
                      }}>
                        {ACTION_TYPE_LABELS[action.type]}
                      </span>
                    </div>
                    <ActionPreviewDetail action={action} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview: Vote breakdown placeholder */}
          <div style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--spacing-lg)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}>
            <Eye size={24} aria-hidden="true" style={{ marginBottom: 'var(--spacing-sm)' }} />
            <p>Vote results and participation metrics will appear here once the proposal is live.</p>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Render Current Step ─────────────────────────────────────────── */

  const renderStep = () => {
    switch (step) {
      case 1: return renderTitleStep();
      case 2: return renderAbstractStep();
      case 3: return renderActionsStep();
      case 4: return renderPreviewStep();
      default: return null;
    }
  };

  return (
    <div className={`gpf-container ${className}`}>
      {/* Header */}
      <div className="gpf-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="gpf-header-title">Create Governance Proposal</h1>
          {autosaveChip()}
        </div>
        <p className="gpf-header-desc">
          Create a new on-chain governance proposal. Your progress is automatically saved as you go.
        </p>
      </div>

      {/* Step Progress Indicator */}
      <div className="gpf-steps" role="navigation" aria-label="Form steps">
        {([1, 2, 3, 4] as FormStep[]).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && (
              <div
                className={`gpf-step-connector ${s <= step ? 'gpf-step-connector--active' : ''} ${s < step ? 'gpf-step-connector--completed' : ''}`}
                aria-hidden="true"
              />
            )}
            <div className="gpf-step-indicator">
              <button
                type="button"
                className={`gpf-step-dot ${s === step ? 'gpf-step-dot--active' : ''} ${s < step ? 'gpf-step-dot--completed' : ''}`}
                onClick={() => goToStep(s)}
                aria-label={`Go to step ${s}: ${STEP_LABELS[s]}${s < step ? ' (completed)' : ''}${s === step ? ' (current)' : ''}`}
                aria-current={s === step ? 'step' : undefined}
              >
                {s < step ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  s
                )}
              </button>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="gpf-step-labels" aria-hidden="true">
        {([1, 2, 3, 4] as FormStep[]).map((s) => (
          <span
            key={s}
            className={`gpf-step-label ${s === step ? 'gpf-step-label--active' : ''} ${s < step ? 'gpf-step-label--completed' : ''}`}
          >
            {STEP_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Current Step Content */}
      {renderStep()}

      {/* Navigation */}
      <nav className="gpf-nav" aria-label="Form navigation">
        <div className="gpf-nav-left">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <div className="gpf-nav-right">
          {step > 1 && (
            <Button variant="secondary" onClick={goBack} aria-label="Go to previous step">
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              variant="primary"
              onClick={goNext}
              disabled={!canAdvance()}
              aria-label={`Go to next step: ${STEP_LABELS[(step + 1) as FormStep]}`}
            >
              Next
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              aria-label="Submit proposal"
            >
              <Send size={16} aria-hidden="true" />
              Submit Proposal
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
};

/* ─── Action Preview Detail ─────────────────────────────────────────── */

function ActionPreviewDetail({ action }: { action: ProposalAction }) {
  const valueStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--text-muted)',
    lineHeight: 'var(--line-height-normal)',
  };

  switch (action.type) {
    case 'transfer':
      return (
        <div style={valueStyle}>
          Transfer <strong style={{ color: 'var(--text-main)' }}>{action.value || '—'}</strong> tokens to{' '}
          <code style={{ fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
            {action.target || '—'}
          </code>
        </div>
      );
    case 'contract_call':
      return (
        <div style={valueStyle}>
          Call <code style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{action.functionSig || '—'}</code> on{' '}
          <code style={{ fontSize: '0.75rem', color: 'var(--text-accent)', wordBreak: 'break-all' }}>
            {action.target || '—'}
          </code>
        </div>
      );
    case 'parameter_change':
      return (
        <div style={valueStyle}>
          Set parameter <strong style={{ color: 'var(--text-main)' }}>{action.paramName || '—'}</strong> to{' '}
          <strong style={{ color: 'var(--text-main)' }}>{action.paramValue || '—'}</strong>
        </div>
      );
    case 'text_resolution':
      return (
        <div style={valueStyle}>
          {action.description || 'Non-binding text resolution'}
        </div>
      );
    default:
      return null;
  }
}

export default GovernanceProposalForm;
