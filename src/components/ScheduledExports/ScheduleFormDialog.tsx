import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { RecurrenceRule, ExportFormat, ScheduleFormData } from './types';
import { EXPORT_FORMATS, FORMAT_LABELS } from './types';
import { validateScheduleForm, defaultRecurrenceRule } from './recurrence';
import { RecurrenceEditor } from './RecurrenceEditor';

export interface ScheduleFormDialogProps {
  open: boolean;
  initial?: Partial<ScheduleFormData>;
  onSave: (data: ScheduleFormData) => void;
  onClose: () => void;
}

export const ScheduleFormDialog: React.FC<ScheduleFormDialogProps> = ({
  open,
  initial,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [schedule, setSchedule] = useState<RecurrenceRule>(defaultRecurrenceRule());
  const [errors, setErrors] = useState<string[]>([]);

  const titleId = useId();
  const nameId = useId();
  const descId = useId();
  const formatId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      if (initial) {
        setName(initial.name ?? '');
        setDescription(initial.description ?? '');
        setFormat(initial.format ?? 'csv');
        setSchedule(initial.schedule ?? defaultRecurrenceRule());
      } else {
        setName('');
        setDescription('');
        setFormat('csv');
        setSchedule(defaultRecurrenceRule());
      }
      setErrors([]);
      requestAnimationFrame(() => nameInputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
      previouslyFocused.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])'
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
    const data: ScheduleFormData = { name, description, format, schedule };
    const validation = validateScheduleForm(data);
    if (validation) {
      setErrors([validation]);
      nameInputRef.current?.focus();
      return;
    }
    onSave(data);
  };

  if (!open) return null;

  return (
    <div
      className="sep-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="schedule-form-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="sep-dialog glass-card"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="sep-dialog-title">
          {initial ? 'Edit schedule' : 'New schedule'}
        </h2>
        <p className="sep-dialog-desc">
          {initial
            ? 'Update the schedule for this recurring export.'
            : 'Configure a new recurring export schedule.'}
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
              className={`input-field ${errors.length > 0 ? 'input-error' : ''}`}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors([]); }}
              aria-required="true"
              aria-invalid={errors.length > 0 ? true : undefined}
              placeholder="e.g. Daily Payout Summary"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor={descId}>
              Description <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id={descId}
              className="input-field"
              value={description}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this export for?"
              style={{ resize: 'vertical', minBlockSize: '3rem' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor={formatId}>
              Format
            </label>
            <select
              id={formatId}
              className="input-field"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Schedule</label>
            <RecurrenceEditor
              value={schedule}
              onChange={setSchedule}
              errors={errors}
            />
          </div>

          <div className="sep-dialog-actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--sm">
              <Save size={14} aria-hidden="true" />
              {initial ? 'Save changes' : 'Create schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleFormDialog;