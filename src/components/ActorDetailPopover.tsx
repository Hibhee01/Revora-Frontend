import React, { useEffect, useRef, useCallback } from 'react';
import { AuditAction, Actor } from '../pages/AuditTrail';

export interface ActorDetailPopoverProps {
  actor: Actor;
  recentActions: AuditAction[];
  anchorEl: HTMLElement;
  onClose: () => void;
}

const ActorDetailPopover: React.FC<ActorDetailPopoverProps> = ({
  actor,
  recentActions,
  anchorEl,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(anchorEl);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Handle click outside to close
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  // Handle ESC key to close
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Trap focus within popover
  const handlePopoverKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      const popover = popoverRef.current;
      if (!popover) return;

      const focusableElements = popover.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the popover when it opens
    if (popoverRef.current) {
      const firstFocusable = popoverRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger element
      triggerRef.current?.focus();
    };
  }, [handleClickOutside, handleKeyDown]);

  // Calculate position
  const getPosition = () => {
    const rect = anchorEl.getBoundingClientRect();
    const popoverWidth = 380;
    const popoverHeight = 400;
    
    let top = rect.bottom + 8;
    let left = rect.left;

    // Prevent overflow on right edge
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 16;
    }

    // Prevent overflow on bottom edge
    if (top + popoverHeight > window.innerHeight) {
      top = rect.top - popoverHeight - 8;
    }

    return { top, left };
  };

  const position = getPosition();

  return (
    <>
      <div
        ref={popoverRef}
        className="actor-detail-popover glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popover-title"
        aria-describedby="popover-description"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: '380px',
          maxHeight: '500px',
          zIndex: 1000,
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xl)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onKeyDown={handlePopoverKeyDown}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'white',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {actor.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="popover-title"
              className="text-main"
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0 0 0.25rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {actor.name}
            </h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
              {actor.role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="popover-close-btn"
            aria-label="Close popover"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actor Details */}
        <div id="popover-description" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>
                Email
              </span>
              <p className="text-main" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0', wordBreak: 'break-word' }}>
                {actor.email}
              </p>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>
                Last Login
              </span>
              <p className="text-main" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {formatDate(actor.lastLogin)}
                <span className="text-muted" style={{ marginLeft: '0.5rem' }}>
                  ({formatRelativeTime(actor.lastLogin)})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Recent Actions */}
        <div>
          <h3 className="text-main" style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.75rem' }}>
            Recent Actions
          </h3>
          <ul
            role="list"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {recentActions.slice(0, 5).map((action, index) => (
              <li
                key={action.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: index < recentActions.slice(0, 5).length - 1 ? '1px solid var(--glass-border)' : 'none',
                }}
              >
                <p className="text-main" style={{ fontSize: '0.875rem', margin: '0 0 0.25rem', fontWeight: '500' }}>
                  {action.description}
                </p>
                <time
                  className="text-muted"
                  dateTime={action.timestamp}
                  style={{ fontSize: '0.75rem' }}
                  aria-label={`Action performed at ${formatDate(action.timestamp)}`}
                >
                  {formatRelativeTime(action.timestamp)}
                </time>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Link */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <a
            href={`/audit/actor/${actor.id}`}
            className="link-styled"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
            onClick={(e) => {
              e.preventDefault();
              // In a real app, this would navigate to the full audit page
              onClose();
            }}
          >
            View Full Audit Trail
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="popover-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          zIndex: 999,
        }}
        aria-hidden="true"
      />
    </>
  );
};

export default ActorDetailPopover;
