import React, { useEffect, useId, useRef, useState, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../Button';
import './BlacklistBulkRemoveConfirm.css';
import { useUndoBanners } from '../../hooks/useUndoBanners';

export interface BlacklistEntry {
  id: string;
  value: string; // e.g., '192.168.1.1' or '0x123...'
  type: string;  // e.g., 'IP', 'Wallet', 'Email'
}

export interface BlacklistBulkRemoveConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, initials: string) => Promise<void>;
  entries: BlacklistEntry[];
}

const PRESETS = [
  'Duplicate entry',
  'Compliance cleared',
  'Added by mistake',
  'Other',
];

export const BlacklistBulkRemoveConfirm: React.FC<BlacklistBulkRemoveConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entries,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [initials, setInitials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [delayActive, setDelayActive] = useState(true);
  const { registerUndo } = useUndoBanners();

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setSelectedPreset('');
      setInitials('');
      setIsSubmitting(false);
      setDelayActive(true);
      return;
    }

    // Delay the enable of the destructive button by 750ms
    const timer = setTimeout(() => {
      setDelayActive(false);
    }, 750);

    const activeElement = document.activeElement as HTMLElement | null;
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    if (activeElement && activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'Other') {
      setReason(preset);
    } else {
      setReason('');
    }
  };

  const isReasonValid = selectedPreset !== 'Other' ? reason.length > 0 : reason.trim().length >= 10;
  const isFormValid = isReasonValid && initials.trim().length >= 2;

  const handleConfirm = async () => {
    if (!isFormValid || delayActive) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason, initials);
      
      // Wire up undo banner
      registerUndo({
        message: `Removed ${entries.length} entries from blacklist`,
        actionLabel: 'Undo',
        onUndo: () => {
          // In a real implementation, this would call an API to restore the entries
          console.log('Undo removing entries');
        },
      });

      onClose();
    } catch (error) {
      console.error('Failed to remove entries', error);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="blacklist-bulk-remove-modal"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="blacklist-bulk-remove-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="blacklist-bulk-remove-header">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
              <AlertTriangle size={20} aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-wider">High Impact Action</span>
            </div>
            <h2 id={titleId} className="blacklist-bulk-remove-title">
              Remove Blacklist Entries
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="blacklist-bulk-remove-close"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p id={descriptionId} className="blacklist-bulk-remove-description">
          You are about to remove <strong>{entries.length}</strong> entries from the blacklist. This action is audit-relevant and requires justification.
        </p>

        <div className="blacklist-bulk-remove-entries" tabIndex={0}>
          {entries.map((entry) => (
            <div key={entry.id} className="blacklist-bulk-remove-entry">
              <span className="font-medium">{entry.value}</span>
              <span className="text-slate-500 text-xs uppercase">{entry.type}</span>
            </div>
          ))}
        </div>

        <div className="blacklist-bulk-remove-form">
          <div>
            <label className="blacklist-bulk-remove-label">Reason for removal</label>
            <div className="blacklist-bulk-remove-presets" role="group" aria-label="Reason presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="blacklist-bulk-remove-preset-btn"
                  data-selected={selectedPreset === preset}
                  onClick={() => handlePresetClick(preset)}
                  aria-pressed={selectedPreset === preset}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {selectedPreset === 'Other' && (
            <div>
              <label htmlFor="reason-textarea" className="blacklist-bulk-remove-label">
                Detailed Reason (min 10 characters)
              </label>
              <textarea
                id="reason-textarea"
                className="blacklist-bulk-remove-textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why these entries are being removed..."
                aria-invalid={reason.length > 0 && reason.trim().length < 10}
                aria-describedby="reason-error"
              />
              {reason.length > 0 && reason.trim().length < 10 && (
                <p id="reason-error" className="blacklist-bulk-remove-error">Reason must be at least 10 characters.</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="initials-input" className="blacklist-bulk-remove-label">
              Actor Initials
            </label>
            <input
              id="initials-input"
              type="text"
              className="blacklist-bulk-remove-input"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              placeholder="e.g., JD"
              maxLength={3}
              aria-invalid={initials.length > 0 && initials.trim().length < 2}
              aria-describedby="initials-error"
            />
             {initials.length > 0 && initials.trim().length < 2 && (
                <p id="initials-error" className="blacklist-bulk-remove-error">Initials must be at least 2 characters.</p>
             )}
          </div>
        </div>

        <div className="blacklist-bulk-remove-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <button
            type="button"
            className="blacklist-bulk-remove-btn-danger"
            onClick={handleConfirm}
            disabled={!isFormValid || delayActive || isSubmitting}
          >
            {isSubmitting ? 'Removing...' : delayActive ? 'Please wait...' : 'Remove Entries'}
          </button>
        </div>
      </div>
    </div>
  );
};
