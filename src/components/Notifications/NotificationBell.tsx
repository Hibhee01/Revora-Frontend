/**
 * NotificationBell — Issue #493
 *
 * Renders a bell button with an unread-count badge.
 *
 * Motion behaviour
 * ─────────────────
 * Default  : badge pulses via CSS animation (@keyframes nb-pulse).
 * Reduced  : useReducedMotion() → animation disabled, badge gets a
 *            static high-contrast ring (--nb-badge-static-ring) so the
 *            state change is communicated by colour alone, not movement.
 *            Both variants meet WCAG 3:1 contrast against the header bg.
 *
 * Accessibility (WCAG 2.1 AA)
 * ────────────────────────────
 * • Button has aria-label="Notifications" + aria-expanded.
 * • Badge uses role="status" + aria-label="N unread notifications".
 * • Badge is aria-hidden when count is 0 (not rendered).
 * • Live-region on the button announces new counts politely.
 * • Focus ring via :focus-visible only (no outline on mouse click).
 * • Escape closes the panel.
 */

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import NotificationPanel from './NotificationPanel';
import type { Notification } from './notificationsData';
import './NotificationBell.css';

export interface NotificationBellProps {
  notifications: Notification[];
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications }) => {
  const [isOpen, setIsOpen]     = useState(false);
  const reducedMotion           = useReducedMotion();
  const unreadCount             = notifications.filter((n) => !n.read).length;

  const toggle = () => setIsOpen((o) => !o);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape')                 { setIsOpen(false); }
  };

  return (
    <div className="nb-root" data-testid="notification-bell">
      <button
        type="button"
        className="nb-button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        data-testid="nb-trigger"
      >
        <Bell className="nb-icon" size={22} aria-hidden="true" />

        {unreadCount > 0 && (
          <span
            className={`nb-badge ${reducedMotion ? 'nb-badge--static' : 'nb-badge--pulse'}`}
            role="status"
            aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
            aria-live="polite"
            aria-atomic="true"
            data-testid="nb-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
