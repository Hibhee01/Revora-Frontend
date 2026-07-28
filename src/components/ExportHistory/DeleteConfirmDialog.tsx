import React, { useCallback, useEffect, useId, useRef } from 'react';

export interface DeleteConfirmDialogProps {
  open: boolean;
  exportId: string | null;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ open, exportId, onConfirm, onClose }) => {
  const titleId = useId();
  const descId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

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
        'button, [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }, []);

  if (!open || !exportId) return null;

  return (
    <div
      className="atf-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="delete-confirm-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="atf-dialog glass-card"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="atf-dialog-title" style={{ color: 'var(--color-danger, #ef4444)' }}>
          Delete Export
        </h2>
        
        <p id={descId} className="text-muted" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          Are you sure you want to delete this export? This action cannot be undone and any shared links will immediately stop working.
        </p>

        <div className="atf-dialog-actions" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn--primary btn--sm" 
            style={{ backgroundColor: 'var(--color-danger, #ef4444)', borderColor: 'var(--color-danger, #ef4444)' }}
            onClick={() => onConfirm(exportId)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
