import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  X,
  MapPin,
  Network,
  Fingerprint,
  Info,
} from "lucide-react";
import "./SessionManagement.css";

interface SessionDevice {
  id: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const MOCK_SESSIONS: SessionDevice[] = [
  {
    id: "sess-1",
    deviceName: "MacBook Pro 16",
    deviceType: "desktop",
    browser: "Chrome 125",
    os: "macOS 15.2",
    ipAddress: "192.168.1.42",
    location: "San Francisco, CA",
    lastActive: "2026-06-26T10:30:00Z",
    isCurrent: true,
  },
  {
    id: "sess-2",
    deviceName: "iPhone 16 Pro",
    deviceType: "mobile",
    browser: "Safari 18",
    os: "iOS 19.0",
    ipAddress: "203.0.113.45",
    location: "San Francisco, CA",
    lastActive: "2026-06-25T22:15:00Z",
    isCurrent: false,
  },
  {
    id: "sess-3",
    deviceName: "Windows Desktop",
    deviceType: "desktop",
    browser: "Firefox 128",
    os: "Windows 11",
    ipAddress: "198.51.100.88",
    location: "New York, NY",
    lastActive: "2026-06-24T14:45:00Z",
    isCurrent: false,
  },
  {
    id: "sess-4",
    deviceName: "iPad Air",
    deviceType: "tablet",
    browser: "Safari 18",
    os: "iPadOS 19.0",
    ipAddress: "203.0.113.102",
    location: "Los Angeles, CA",
    lastActive: "2026-06-20T09:00:00Z",
    isCurrent: false,
  },
];

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DeviceIcon({ type }: { type: SessionDevice["deviceType"] }) {
  switch (type) {
    case "mobile":
      return <Smartphone size={20} aria-hidden="true" />;
    case "tablet":
      return <Laptop size={20} aria-hidden="true" />;
    default:
      return <Monitor size={20} aria-hidden="true" />;
  }
}

function SROnly({ children }: { children: React.ReactNode }) {
  return <span className="sm-sr-only">{children}</span>;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const FOCUSABLE_SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus({ preventScroll: true });
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === "Tab" && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="sm-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleOverlayClick}
    >
      <div className="sm-dialog glass-card" ref={dialogRef}>
        <div className="sm-dialog-icon-wrap">
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <h2 id={titleId} className="sm-dialog-title">{title}</h2>
        <p id={descriptionId} className="sm-dialog-message">{message}</p>
        <div className="sm-dialog-actions">
          <button
            className="sm-btn sm-btn--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="sm-btn sm-btn--danger"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Revoking..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Location Map SVG ─────────────────────────────────────────────── */

function LocationMap({ location }: { location: string }) {
  const isKnown = location && location !== "Unknown" && location !== "VPN detected";
  const mapId = useId();

  return (
    <div
      className="sm-drawer-map-wrap"
      role="img"
      aria-label={isKnown ? `Approximate location: ${location}` : "Location not available"}
    >
      <svg
        viewBox="0 0 200 120"
        className="sm-drawer-map"
        aria-hidden="true"
      >
        {/* Background */}
        <rect width="200" height="120" rx="8" fill="rgba(2,6,23,0.6)" />

        {/* Grid lines */}
        {[40, 80, 120, 160].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="120" stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
        ))}
        {[30, 60, 90].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
        ))}

        {/* Continent outlines (decorative) */}
        <path
          d="M30 40 Q50 20 90 30 Q120 25 140 40 Q160 50 170 70 Q130 90 100 85 Q60 80 30 40Z"
          fill="rgba(59,130,246,0.06)"
          stroke="rgba(59,130,246,0.15)"
          strokeWidth="1"
        />

        {isKnown ? (
          <>
            {/* Pin */}
            <g transform="translate(100, 55)">
              <ellipse cx="0" cy="8" rx="6" ry="2" fill="rgba(239,68,68,0.2)" />
              <path
                d="M0 -12 C-8 -12 -10 -3 0 8 C10 -3 8 -12 0 -12Z"
                fill="var(--error, #ef4444)"
                opacity="0.8"
              />
              <circle cx="0" cy="-4" r="3" fill="white" />
            </g>

            {/* Pulse ring */}
            <circle cx="100" cy="55" r="18" fill="none" stroke="var(--error, #ef4444)" strokeWidth="1" opacity="0.2">
              <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        ) : (
          <>
            {/* Question mark for unknown location */}
            <circle cx="100" cy="50" r="14" fill="rgba(148,163,184,0.1)" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" />
            <text x="100" y="55" textAnchor="middle" fontSize="16" fill="rgba(148,163,184,0.4)" fontWeight="bold">?</text>
            <text x="100" y="85" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.3)">{location === "VPN detected" ? "VPN / Proxy" : "Unknown"}</text>
          </>
        )}
      </svg>

      {/* Accessible text fallback for screen readers */}
      <span className="sm-sr-only">
        {isKnown
          ? `Location indicator showing approximate area for ${location}`
          : `Location information is ${location === "VPN detected" ? "obscured by a VPN or proxy" : "not available"}.`}
      </span>
    </div>
  );
}

/* ─── Device Detail Drawer ─────────────────────────────────────────── */

function DeviceDetailDrawer({
  session,
  onClose,
  onRevoke,
  isRevoking,
}: {
  session: SessionDevice;
  onClose: () => void;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerRef.current) return;

    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    if (!drawerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const drawer = drawerRef.current;
    drawer.addEventListener("keydown", handleKeyDown);
    return () => drawer.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const locationLabel = session.location || "Unknown";

  return (
    <>
      {/* Overlay */}
      <div
        className="sm-drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        id={drawerId}
        className="sm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Device details: ${session.deviceName}`}
        data-testid={`device-drawer-${session.id}`}
      >
        <div className="sm-drawer-header">
          <div className="sm-drawer-header-info">
            <div className="sm-drawer-icon" aria-hidden="true">
              <DeviceIcon type={session.deviceType} />
            </div>
            <div>
              <h2 className="sm-drawer-title">{session.deviceName}</h2>
              {session.isCurrent && (
                <span className="sm-current-badge">Current session</span>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="sm-drawer-close"
            onClick={onClose}
            aria-label="Close device details"
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Location Map */}
        <LocationMap location={locationLabel} />

        {/* Details Section */}
        <div className="sm-drawer-details" role="list">
          <DetailRow
            icon={<Monitor size={14} aria-hidden="true" />}
            label="Browser"
            value={session.browser}
          />
          <DetailRow
            icon={<Monitor size={14} aria-hidden="true" />}
            label="Operating System"
            value={session.os}
          />
          <DetailRow
            icon={<MapPin size={14} aria-hidden="true" />}
            label="Location"
            value={locationLabel}
          />
          <DetailRow
            icon={<Network size={14} aria-hidden="true" />}
            label="IP Address"
            value={session.ipAddress}
          />
          <DetailRow
            icon={<Clock size={14} aria-hidden="true" />}
            label="Last Active"
            value={`${formatRelativeTime(session.lastActive)} — ${formatFullDate(session.lastActive)}`}
          />
          <DetailRow
            icon={<Fingerprint size={14} aria-hidden="true" />}
            label="Session ID"
            value={session.id}
          />
        </div>

        {/* Revoke Action */}
        <div className="sm-drawer-footer">
          {session.isCurrent ? (
            <div className="sm-drawer-current-note">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>This is your current session and cannot be revoked here.</span>
            </div>
          ) : (
            <button
              className="sm-btn sm-btn--destructive sm-drawer-revoke-btn"
              onClick={onRevoke}
              disabled={isRevoking}
              aria-busy={isRevoking}
            >
              <LogOut size={16} aria-hidden="true" />
              {isRevoking ? "Revoking..." : "Revoke session"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="sm-drawer-detail-row" role="listitem">
      <span className="sm-drawer-detail-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="sm-drawer-detail-content">
        <span className="sm-drawer-detail-label">{label}</span>
        <span className="sm-drawer-detail-value">{value}</span>
      </div>
    </div>
  );
}

/* ─── SessionManagement ────────────────────────────────────────────── */

interface SessionManagementProps {
  __initialSessions?: SessionDevice[];
  __onRevokeSingle?: (sessionId: string) => Promise<void>;
  __onRevokeAll?: () => Promise<void>;
}

export function SessionManagement({
  __initialSessions = MOCK_SESSIONS,
  __onRevokeSingle,
  __onRevokeAll,
}: SessionManagementProps) {
  const [sessions, setSessions] = useState<SessionDevice[]>(__initialSessions);
  const [drawerSession, setDrawerSession] = useState<SessionDevice | null>(null);
  const [dialogState, setDialogState] = useState<{
    type: "single" | "all";
    sessionId?: string;
    deviceName?: string;
  } | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => setAnnouncement(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    };
  }, []);

  const handleRevokeSingle = useCallback(async () => {
    if (!dialogState || dialogState.type !== "single" || !dialogState.sessionId) return;

    const sessionId = dialogState.sessionId;
    setRevokingId(sessionId);

    if (__onRevokeSingle) {
      await __onRevokeSingle(sessionId);
    } else {
      await new Promise((r) => setTimeout(r, 800));
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setRevokingId(null);
    setDialogState(null);
    setDrawerSession(null);
    announce(`Session for ${dialogState.deviceName || "device"} revoked`);
  }, [dialogState, __onRevokeSingle, announce]);

  const handleRevokeAll = useCallback(async () => {
    setRevokingAll(true);

    if (__onRevokeAll) {
      await __onRevokeAll();
    } else {
      await new Promise((r) => setTimeout(r, 1200));
    }

    setSessions((prev) => prev.filter((s) => !s.isCurrent));
    setRevokingAll(false);
    setDialogState(null);
    announce("Signed out of all other devices");
  }, [__onRevokeAll, announce]);

  const hasOtherSessions = sessions.some((s) => !s.isCurrent);

  const openDrawer = (session: SessionDevice) => {
    setDrawerSession(session);
  };

  const closeDrawer = () => {
    setDrawerSession(null);
  };

  const handleDrawerRevoke = () => {
    if (!drawerSession) return;
    setDialogState({
      type: "single",
      sessionId: drawerSession.id,
      deviceName: drawerSession.deviceName,
    });
  };

  return (
    <div className="sm-container animate-fade-in" data-testid="session-management">
      {/* ── Live region for screen-reader announcements ── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sm-sr-only"
      >
        {announcement}
      </div>

      {/* ── Page header ── */}
      <div className="sm-header">
        <Link
          to="/"
          className="sm-back-link"
          aria-label="Back to Home"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Home
        </Link>
        <h1 className="sm-title">Session Management</h1>
        <p className="sm-subtitle">
          View and manage your active sessions across all devices.
        </p>
      </div>

      {/* ── Sessions list ── */}
      <section aria-label="Active sessions">
        {sessions.length === 0 ? (
          <div className="sm-empty" role="status">
            <ShieldCheck size={48} aria-hidden="true" />
            <h2 className="sm-empty-title">No active sessions</h2>
            <p className="sm-empty-text">
              All sessions have been signed out. Sign in again to create a new session.
            </p>
          </div>
        ) : (
          <>
            {sessions.length > 1 && hasOtherSessions && (
              <div className="sm-bulk-action">
                <button
                  className="sm-btn sm-btn--destructive"
                  onClick={() => setDialogState({ type: "all" })}
                  disabled={revokingAll}
                  aria-busy={revokingAll}
                >
                  {revokingAll ? (
                    "Signing out..."
                  ) : (
                    <>
                      <LogOut size={16} aria-hidden="true" />
                      Sign out of all other devices
                    </>
                  )}
                </button>
              </div>
            )}

            <ul className="sm-session-list" role="list">
              {sessions.map((session) => {
                const isRevoking = revokingId === session.id;
                const canRevoke = !session.isCurrent && !isRevoking && !revokingAll;

                return (
                  <li
                    key={session.id}
                    className={`sm-session-card glass-card${session.isCurrent ? " sm-session-card--current" : ""}`}
                    data-testid={`session-${session.id}`}
                  >
                    <button
                      type="button"
                      className="sm-session-main"
                      onClick={() => openDrawer(session)}
                      aria-label={`View details for ${session.deviceName}`}
                    >
                      <div className="sm-session-icon" aria-hidden="true">
                        <DeviceIcon type={session.deviceType} />
                      </div>

                      <div className="sm-session-info">
                        <div className="sm-session-name-row">
                          <span className="sm-session-name">{session.deviceName}</span>
                          {session.isCurrent && (
                            <span className="sm-current-badge">
                              Current session
                            </span>
                          )}
                        </div>

                        <div className="sm-session-meta">
                          <span className="sm-meta-item">
                            <Monitor size={12} aria-hidden="true" />
                            {session.browser} on {session.os}
                          </span>
                          <span className="sm-meta-item">
                            <Globe size={12} aria-hidden="true" />
                            {session.location}
                          </span>
                          <span className="sm-meta-item">
                            <Clock size={12} aria-hidden="true" />
                            <span
                              aria-label={`Last active ${formatFullDate(session.lastActive)}`}
                            >
                              {formatRelativeTime(session.lastActive)}
                            </span>
                          </span>
                        </div>

                        <div className="sm-session-ip sm-meta-item">
                          IP: {session.ipAddress}
                        </div>
                      </div>

                      <div className="sm-session-action">
                        <span
                          className="sm-drawer-chevron"
                          aria-hidden="true"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!hasOtherSessions && sessions.length === 1 && (
              <p className="sm-single-session-note text-muted text-sm mt-4 text-center">
                Only your current session is active.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── Device Detail Drawer ── */}
      {drawerSession && (
        <DeviceDetailDrawer
          session={drawerSession}
          onClose={closeDrawer}
          onRevoke={handleDrawerRevoke}
          isRevoking={revokingId === drawerSession.id}
        />
      )}

      {/* ── Confirm Dialog ── */}
      {dialogState?.type === "single" && (
        <ConfirmDialog
          isOpen
          title="Revoke session?"
          message={`This will sign out "${dialogState.deviceName}" immediately. You may need to sign in again on that device.`}
          confirmLabel="Revoke"
          onConfirm={handleRevokeSingle}
          onCancel={() => setDialogState(null)}
          isLoading={revokingId !== null}
        />
      )}

      {dialogState?.type === "all" && (
        <ConfirmDialog
          isOpen
          title="Sign out everywhere?"
          message="This will sign out all other active sessions. Your current session will remain active."
          confirmLabel="Sign out everywhere"
          onConfirm={handleRevokeAll}
          onCancel={() => setDialogState(null)}
          isLoading={revokingAll}
        />
      )}
    </div>
  );
}
