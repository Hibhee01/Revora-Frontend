import React, { useEffect, useRef, useMemo } from 'react';
import './ErrorRecoveryPanel.css';
import { useErrorSnapshots, ErrorSnapshot, SnapshotGroup } from '../../hooks/useErrorSnapshots';

export interface ErrorRecoveryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

const GROUP_ORDER: SnapshotGroup[] = ['Transactions', 'Forms', 'Uploads', 'Other'];

export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({
  isOpen,
  onClose,
  triggerRef
}) => {
  const { snapshots, removeSnapshot, clearAll, markAllRead } = useErrorSnapshots();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Group snapshots
  const groupedSnapshots = useMemo(() => {
    const groups: Record<string, ErrorSnapshot[]> = {};
    snapshots.forEach(snapshot => {
      if (!groups[snapshot.group]) {
        groups[snapshot.group] = [];
      }
      groups[snapshot.group].push(snapshot);
    });
    return groups;
  }, [snapshots]);

  useEffect(() => {
    if (isOpen) {
      markAllRead();
      previousFocusRef.current = (document.activeElement as HTMLElement) || triggerRef?.current || null;
      // Focus close button on open
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen, markAllRead, triggerRef]);

  // Handle ESC key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRetry = (snapshot: ErrorSnapshot) => {
    snapshot.onRetry?.();
    removeSnapshot(snapshot.id);
  };

  const handleDiscard = (snapshot: ErrorSnapshot) => {
    snapshot.onDiscard?.();
    removeSnapshot(snapshot.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="error-panel-overlay" 
        onClick={onClose} 
        aria-hidden="true" 
        data-testid="error-panel-overlay"
      />
      <div
        ref={panelRef}
        className="error-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-panel-title"
        data-testid="error-panel"
      >
        <div className="error-panel-header">
          <div className="error-panel-header-info">
            <h2 id="error-panel-title" className="error-panel-title">
              Recovery Snapshots
            </h2>
            <p className="error-panel-subtitle">
              {snapshots.length} recoverable {snapshots.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="error-panel-header-actions">
            {snapshots.length > 0 && (
              <button
                type="button"
                className="error-btn-text"
                onClick={clearAll}
                aria-label="Clear all snapshots"
              >
                Clear All
              </button>
            )}
            <button
              ref={closeBtnRef}
              type="button"
              className="error-icon-btn"
              onClick={onClose}
              aria-label="Close recovery panel"
              data-testid="error-panel-close-btn"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="error-panel-body">
          {snapshots.length === 0 ? (
            <div className="error-panel-empty" data-testid="error-panel-empty">
              <div className="error-empty-icon" aria-hidden="true">✓</div>
              <h3>You're all caught up!</h3>
              <p className="text-muted">No pending items need recovery.</p>
            </div>
          ) : (
            <div className="error-panel-content">
              {GROUP_ORDER.filter(group => groupedSnapshots[group]).map(group => (
                <div key={group} className="error-group-section">
                  <h3 className="error-group-title">{group}</h3>
                  <div className="error-list">
                    {groupedSnapshots[group].map(snapshot => (
                      <div key={snapshot.id} className="error-item-card" data-testid="error-item">
                        <div className="error-item-main">
                          <h4 className="error-item-title">{snapshot.title}</h4>
                          {snapshot.description && (
                            <p className="error-item-desc">{snapshot.description}</p>
                          )}
                          <p className="error-item-time">
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="error-item-actions">
                          <button
                            type="button"
                            className="error-btn-primary"
                            onClick={() => handleRetry(snapshot)}
                            aria-label={`Retry ${snapshot.title}`}
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            className="error-btn-secondary"
                            onClick={() => handleDiscard(snapshot)}
                            aria-label={`Discard ${snapshot.title}`}
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
