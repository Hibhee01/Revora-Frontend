/**
 * SaveFilterDialog — modal for naming and saving the current Audit Trail
 * filter combination (Issue #235).
 *
 * Accessibility (WCAG 2.1 AA):
 *  - role="dialog" + aria-modal, labelled by the dialog title
 *  - focus moves to the name field on open and returns to the trigger on close
 *  - focus is trapped with a Tab/Shift+Tab cycle; Escape closes
 *  - validation errors are announced via aria-describedby + aria-invalid and
 *    a polite live region
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  type AuditFilterState,
  type SavedFilter,
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  describeFilters,
  validateSavedFilterInput,
  validationMessage,
} from './savedFilters';

export interface SaveFilterDialogProps {
  open: boolean;
  /** Filter combination that will be saved. */
  filters: AuditFilterState;
  /** Existing saved filters, used for duplicate-name validation. */
  existing: SavedFilter[];
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}

export const SaveFilterDialog: React.FC<SaveFilterDialogProps> = ({
  open,
  filters,
  existing,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const titleId = useId();
  const nameId = useId();
  const nameErrorId = useId();
  const descriptionId = useId();
  const summaryId = useId();

  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Reset form state and manage focus when the dialog opens/closes.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setName('');
      setDescription('');
      setError(null);
      // Focus after paint so the element exists and is visible.
      requestAnimationFrame(() => nameInputRef.current?.focus());
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

  // Escape closes the dialog regardless of which element holds focus.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Minimal focus trap: cycle Tab / Shift+Tab within the dialog. The dialog
  // always contains focusable controls (name field, Cancel, Save).
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusables = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateSavedFilterInput(name, description, existing);
    if (validation) {
      setError(validationMessage(validation));
      nameInputRef.current?.focus();
      return;
    }
    onSave(name.trim(), description.trim());
  };

  if (!open) return null;

  return (
    <div
      className="atf-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="save-filter-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        className="atf-dialog glass-card"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="atf-dialog-title">
          Save filter
        </h2>
        <p id={summaryId} className="atf-dialog-summary">
          Saving: <span className="atf-filter-summary">{describeFilters(filters)}</span>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor={nameId}>
              Name <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              ref={nameInputRef}
              id={nameId}
              className={`input-field ${error ? 'input-error' : ''}`}
              type="text"
              value={name}
              maxLength={NAME_MAX_LENGTH + 20}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? nameErrorId : undefined}
              placeholder="e.g. Failed payouts this quarter"
            />
            {/* Polite live region so screen readers hear validation feedback */}
            <div aria-live="polite">
              {error && (
                <p id={nameErrorId} className="atf-field-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor={descriptionId}>
              Description <span className="atf-optional">(optional)</span>
            </label>
            <textarea
              id={descriptionId}
              className="input-field atf-dialog-description"
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH + 50}
              rows={2}
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
              placeholder="What is this filter for?"
            />
          </div>

          <div className="atf-dialog-actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--sm">
              Save and pin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveFilterDialog;
