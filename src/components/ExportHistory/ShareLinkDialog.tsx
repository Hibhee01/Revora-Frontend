import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface ShareLinkDialogProps {
  open: boolean;
  exportId: string | null;
  onClose: () => void;
}

export const ShareLinkDialog: React.FC<ShareLinkDialogProps> = ({ open, exportId, onClose }) => {
  const [expiration, setExpiration] = useState('7d');
  const [shareStatus, setShareStatus] = useState('');
  
  const titleId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setShareStatus('');
      setExpiration('7d');
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
        'button, select, input, textarea, [href], [tabindex]:not([tabindex="-1"])'
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

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/investor/export/${exportId}?exp=${expiration}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('Link copied to clipboard.');
    } catch {
      setShareStatus(url);
    }
  };

  const handleRevoke = () => {
    setShareStatus('Link revoked.');
  };

  if (!open) return null;

  return (
    <div
      className="atf-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="share-link-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="atf-dialog glass-card"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="atf-dialog-title">
          Share Export Link
        </h2>
        
        <div className="input-group">
          <label className="input-label" htmlFor={`expiration-select-${titleId}`}>
            Link Expiration
          </label>
          <select
            id={`expiration-select-${titleId}`}
            className="input-field"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          >
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="never">Never expire</option>
          </select>
        </div>

        <div className="atf-dialog-actions" style={{ marginTop: '1.5rem', justifyContent: 'space-between' }}>
          <button type="button" className="btn btn--secondary btn--sm" style={{ color: 'var(--color-danger, #ef4444)' }} onClick={handleRevoke}>
            Revoke Link
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={handleCopyLink}>
              Copy Link
            </button>
          </div>
        </div>

        <div aria-live="polite" className="atf-share-status" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          {shareStatus}
        </div>
      </div>
    </div>
  );
};
