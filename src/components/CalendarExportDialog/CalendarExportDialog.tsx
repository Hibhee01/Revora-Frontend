import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, RefreshCw, Trash2, Check } from 'lucide-react';
import { Button } from '../Button';
import './CalendarExportDialog.css';

interface CalendarExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Scope = 'single' | 'issuer' | 'all';

export const CalendarExportDialog: React.FC<CalendarExportDialogProps> = ({ isOpen, onClose }) => {
  const [scope, setScope] = useState<Scope>('all');
  const [token, setToken] = useState('a1b2c3d4e5f6g7h8');
  const [copied, setCopied] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const url = `https://api.revora.co/v1/calendar/payouts/${scope}/${token}.ics`;

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for older browsers
      if (inputRef.current) {
        inputRef.current.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy text', err);
        }
      }
    }
  };

  const handleRegenerate = () => {
    setToken(Math.random().toString(36).substring(2, 18));
    setLastUsed(null);
  };

  const handleRevoke = () => {
    setToken('');
    setLastUsed(null);
  };

  const preventAutoClose = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="calendar-dialog-overlay"
      onCancel={onClose}
      onClick={onClose}
    >
      <div 
        className="calendar-dialog-content" 
        onClick={preventAutoClose}
        role="document"
      >
        <div className="calendar-dialog-header">
          <div>
            <h2 className="calendar-dialog-title" id="calendar-dialog-title">Subscribe to Calendar</h2>
            <p className="calendar-dialog-desc">Sync upcoming payout dates to your calendar application.</p>
          </div>
          <button
            className="calendar-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="calendar-tabs" role="tablist" aria-label="Subscription scope">
          <button
            role="tab"
            aria-selected={scope === 'single'}
            className={`calendar-tab ${scope === 'single' ? 'calendar-tab-active' : ''}`}
            onClick={() => setScope('single')}
          >
            Single Payout
          </button>
          <button
            role="tab"
            aria-selected={scope === 'issuer'}
            className={`calendar-tab ${scope === 'issuer' ? 'calendar-tab-active' : ''}`}
            onClick={() => setScope('issuer')}
          >
            Per Issuer
          </button>
          <button
            role="tab"
            aria-selected={scope === 'all'}
            className={`calendar-tab ${scope === 'all' ? 'calendar-tab-active' : ''}`}
            onClick={() => setScope('all')}
          >
            All Payouts
          </button>
        </div>

        <div className="calendar-url-group">
          <label htmlFor="calendar-url" className="calendar-url-label">Subscription URL</label>
          <div className="calendar-url-wrapper">
            <input
              ref={inputRef}
              id="calendar-url"
              type="text"
              readOnly
              value={token ? url : 'URL Revoked'}
              className="calendar-url-input"
              dir="ltr"
            />
            <Button
              type="button"
              onClick={handleCopy}
              disabled={!token}
              variant="primary"
              style={{ width: 'auto' }}
              aria-label="Copy URL"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {lastUsed && (
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>
              Last used: {lastUsed}
            </p>
          )}
        </div>

        <div className="calendar-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRegenerate}
            style={{ flex: 1 }}
          >
            <RefreshCw size={18} />
            Regenerate
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRevoke}
            disabled={!token}
            className="text-error"
            style={{ flex: 1 }}
          >
            <Trash2 size={18} />
            Revoke
          </Button>
        </div>

        <div className="calendar-instructions">
          <h3 className="calendar-instructions-title">Instructions</h3>
          {/* Default to Google for now as an example, but list them all or simple instructions */}
          <ul className="calendar-instructions-list">
            <li><strong>Google Calendar:</strong> Settings &gt; Add calendar &gt; From URL</li>
            <li><strong>Outlook:</strong> Add calendar &gt; Subscribe from web</li>
            <li><strong>Apple Calendar:</strong> File &gt; New Calendar Subscription</li>
          </ul>
        </div>
      </div>
    </dialog>
  );
};
