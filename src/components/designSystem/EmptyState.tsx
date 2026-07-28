import React from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export type EmptyStateVariant =
  | 'distribution-dashboard'
  | 'payout-schedule'
  | 'ledger'
  | 'audit-trail'
  | 'notifications'
  | 'revenue-reports'
  | 'governance-proposals'
  | 'governance-votes'
  | 'governance-delegates';

export type EmptyStateSeverity = 'default' | 'error';

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
};

export type EmptyStateProps = {
  /** Visual variant — selects the branded illustration */
  variant: EmptyStateVariant;
  /** Severity: default (blue/primary) or error (red) */
  severity?: EmptyStateSeverity;
  /** Heading text */
  title: string;
  /** Supporting body copy */
  description: string;
  /** Primary CTA (required) */
  primaryAction: EmptyStateAction;
  /** Optional secondary CTA */
  secondaryAction?: EmptyStateAction;
  /** SVG illustration size in px (width/height). Default 96 */
  size?: number;
  /** Additional CSS class on the root element */
  className?: string;
  /** Optional context node (e.g. echoed search query for filtered states) */
  context?: React.ReactNode;
  /** Use monochrome colors, optimized for print */
  isMonochrome?: boolean;
};

const DEFAULT_SIZE = 96;

/* ─── Component ────────────────────────────────────────────────────────────── */

/**
 * EmptyState — branded, reusable empty-state shell.
 *
 * Features:
 *  - Decorative SVG illustration (aria-hidden) selected by `variant`
 *  - Light/dark mode via existing CSS custom properties
 *  - Responsive: fluid padding, max-width text column, clamp-based typography
 *  - WCAG 2.1 AA: role="status", aria-live="polite", aria-labelledby, focus-visible
 *  - RTL-ready: uses logical properties where possible; dir inherited from parent
 *
 * Design tokens consumed (from index.css :root):
 *  --ds-state-gap, --ds-state-pad-y, --ds-state-pad-x, --ds-state-max-w,
 *  --ds-state-icon-size, --text-main, --text-muted, --primary, --primary-hover,
 *  --error, --glass-bg, --glass-border, --glass-blur, --shadow-xl, --radius-2xl
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  severity = 'default',
  title,
  description,
  primaryAction,
  secondaryAction,
  size = DEFAULT_SIZE,
  className = '',
  context,
  isMonochrome = false,
}) => {
  const headingId = `empty-state-heading-${variant}-${severity}`;
  const isError = severity === 'error';

  const renderAction = (action: EmptyStateAction, isPrimary: boolean) => {
    const baseClass = isPrimary ? (isError ? 'btn-primary' : 'btn-primary') : 'btn-secondary';
    const sizeClass = isPrimary ? '' : 'btn--sm';
    const actionClass = `empty-state-action ${baseClass} ${sizeClass}`.trim();

    if (action.href) {
      return (
        <a
          href={action.href}
          className={actionClass}
          aria-label={action.ariaLabel || action.label}
        >
          {action.label}
        </a>
      );
    }

    return (
      <button
        type="button"
        className={actionClass}
        onClick={action.onClick}
        aria-label={action.ariaLabel || action.label}
      >
        {action.label}
      </button>
    );
  };

  return (
    <div
      className={`empty-state-container ${isError ? 'empty-state-container--error' : ''} ${className}`}
      role="status"
      aria-live="polite"
      aria-labelledby={headingId}
    >
      {/* Decorative illustration */}
      <div className="empty-state-icon-wrap" aria-hidden="true">
        <EmptyStateIllustration variant={variant} size={size} severity={severity} isMonochrome={isMonochrome} />
      </div>

      {/* Text content */}
      <div className="empty-state-content">
        <h2 id={headingId} className="empty-state-title">
          {title}
        </h2>
        <p className="empty-state-body">{description}</p>
        {context && <div className="empty-state-context">{context}</div>}
      </div>

      {/* Actions */}
      <div className="empty-state-actions">
        {renderAction(primaryAction, true)}
        {secondaryAction && renderAction(secondaryAction, false)}
      </div>
    </div>
  );
};

/* ─── Illustration ─────────────────────────────────────────────────────────── */

type IllustrationProps = {
  variant: EmptyStateVariant;
  size: number;
  severity: EmptyStateSeverity;
  isMonochrome?: boolean;
};

/**
 * EmptyStateIllustration — decorative SVG set.
 *
 * Color strategy:
 *  - Uses `currentColor` for strokes so the icon inherits the parent's text colour.
 *  - Uses CSS custom properties (var(--primary), var(--text-muted), etc.) for fills
 *    so the illustration adapts automatically to light/dark mode.
 *  - All fills use alpha channels for subtlety on both backgrounds.
 *
 * Accessibility:
 *  - aria-hidden="true" by default (purely decorative).
 *  - role="presentation" when aria-hidden.
 */
const EmptyStateIllustration: React.FC<IllustrationProps> = ({ variant, size, severity, isMonochrome }) => {
  const isError = severity === 'error';
  
  const primaryColor = isMonochrome ? '#000000' : (isError ? 'var(--error)' : 'var(--primary)');
  const mutedColor = isMonochrome ? '#555555' : 'var(--text-muted)';
  const accentColor = isMonochrome ? '#333333' : 'var(--text-accent)';
  const badgeOuterFill = isMonochrome ? '#ffffff' : 'rgba(15,23,42,0.6)';
  const badgeInnerFill = isMonochrome ? '#f8f9fa' : 'rgba(15,23,42,0.4)';
  const badgeOuterStroke = isMonochrome ? '#e2e8f0' : (isError ? 'rgba(239,68,68,0.25)' : 'rgba(148,163,184,0.2)');
  const badgeInnerStroke = isMonochrome ? '#cbd5e1' : (isError ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.12)');

  const glyph = (() => {
    switch (variant) {
      case 'distribution-dashboard':
        return <DistributionDashboardGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'payout-schedule':
        return <PayoutScheduleGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'ledger':
        return <LedgerGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'audit-trail':
        return <AuditTrailGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'notifications':
        return <NotificationsGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'revenue-reports':
        return <RevenueReportsGlyph primaryColor={primaryColor} mutedColor={mutedColor} accentColor={accentColor} isError={isError} />;
      case 'governance-proposals':
        return <GovernanceProposalsGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'governance-votes':
        return <GovernanceVotesGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      case 'governance-delegates':
        return <GovernanceDelegatesGlyph primaryColor={primaryColor} mutedColor={mutedColor} isError={isError} />;
      default:
        return null;
    }
  })();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="es-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.25)" />
        </filter>
      </defs>

      {/* Outer badge */}
      <g filter={isMonochrome ? '' : "url(#es-shadow)"} transform="translate(48 48)">
        <circle
          r="44"
          fill={badgeOuterFill}
          stroke={badgeOuterStroke}
          strokeWidth="1.5"
        />
        {/* Icon well */}
        <circle
          r="30"
          fill={badgeInnerFill}
          stroke={badgeInnerStroke}
          strokeWidth="1.5"
        />
        {/* Decorative accent ring */}
        <circle
          r="30"
          fill="none"
          stroke={primaryColor}
          strokeOpacity="0.22"
          strokeWidth="3"
          strokeDasharray="10 8"
          transform="rotate(-20)"
        />
        {/* Variant glyph */}
        {glyph}
      </g>

      {/* Baseline dots (decorative, improves shape complexity at small sizes) */}
      <g aria-hidden="true" opacity="0.2">
        <circle cx="24" cy="82" r="1.5" fill={primaryColor} />
        <circle cx="72" cy="82" r="1.5" fill={primaryColor} />
      </g>
    </svg>
  );
};

/* ─── Glyph Primitives ─────────────────────────────────────────────────────── */

const strokeStyle = (color: string, width = 3.5) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

const fillStyle = (color: string, opacity = 0.1) => ({
  fill: color,
  fillOpacity: opacity,
});

/* ─── Distribution Dashboard Glyph ─────────────────────────────────────────── */
// Bar chart with 3 bars of varying heights

const DistributionDashboardGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({
  primaryColor,
  mutedColor,
  isError,
}) => (
  <g>
    {/* Chart area background */}
    <rect
      x="-16"
      y="-16"
      width="32"
      height="32"
      rx="4"
      {...fillStyle(primaryColor, 0.06)}
      stroke={primaryColor}
      strokeOpacity="0.3"
      strokeWidth="1.5"
    />
    {/* Bars */}
    <rect x="-12" y="4" width="5" height="10" rx="1.5" {...fillStyle(primaryColor, 0.35)} />
    <rect x="-5" y="-2" width="5" height="16" rx="1.5" {...fillStyle(primaryColor, 0.5)} />
    <rect x="2" y="-8" width="5" height="22" rx="1.5" {...fillStyle(primaryColor, 0.7)} />
    {/* Trend line */}
    <path d="M-10 6 L-3 0 L4 -6 L10 -10" {...strokeStyle(primaryColor, 2.5)} />
    {/* Dot at end */}
    <circle cx="10" cy="-10" r="2" fill={primaryColor} />
    {/* Error overlay: X mark */}
    {isError && (
      <g>
        <circle cx="0" cy="0" r="20" fill="rgba(239,68,68,0.12)" />
        <path d="M-8 -8 L8 8" {...strokeStyle(primaryColor, 3)} />
        <path d="M8 -8 L-8 8" {...strokeStyle(primaryColor, 3)} />
      </g>
    )}
  </g>
);

/* ─── Payout Schedule Glyph ────────────────────────────────────────────────── */
// Calendar with a check mark

const PayoutScheduleGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({
  primaryColor,
  mutedColor,
  isError,
}) => (
  <g>
    {/* Calendar body */}
    <rect
      x="-14"
      y="-12"
      width="28"
      height="26"
      rx="3"
      {...fillStyle(primaryColor, 0.08)}
      stroke={primaryColor}
      strokeOpacity="0.4"
      strokeWidth="2.5"
    />
    {/* Calendar header */}
    <rect x="-14" y="-12" width="28" height="6" rx="3" {...fillStyle(primaryColor, 0.2)} />
    {/* Header divider */}
    <line x1="-14" y1="-6" x2="14" y2="-6" stroke={primaryColor} strokeOpacity="0.3" strokeWidth="1.5" />
    {/* Calendar rings */}
    <line x1="-6" y1="-16" x2="-6" y2="-10" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="6" y1="-16" x2="6" y2="-10" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    {/* Grid lines */}
    <line x1="-14" y1="2" x2="14" y2="2" stroke={mutedColor} strokeOpacity="0.2" strokeWidth="1" />
    <line x1="-14" y1="8" x2="14" y2="8" stroke={mutedColor} strokeOpacity="0.2" strokeWidth="1" />
    <line x1="-4" y1="-6" x2="-4" y2="14" stroke={mutedColor} strokeOpacity="0.2" strokeWidth="1" />
    <line x1="4" y1="-6" x2="4" y2="14" stroke={mutedColor} strokeOpacity="0.2" strokeWidth="1" />
    {/* Check mark or X mark */}
    {isError ? (
      <path d="M-6 -4 L6 4 M6 -4 L-6 4" {...strokeStyle(primaryColor, 3)} />
    ) : (
      <path d="M-6 2 L-2 6 L8 -4" {...strokeStyle(primaryColor, 3)} />
    )}
  </g>
);

/* ─── Ledger Glyph ─────────────────────────────────────────────────────────── */
// Open book with lines

const LedgerGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({
  primaryColor,
  mutedColor,
  isError,
}) => (
  <g>
    {/* Book cover left */}
    <path
      d="M-14 -10 C-14 -14 -8 -16 0 -16 L0 14 C-8 14 -14 12 -14 8 Z"
      {...fillStyle(primaryColor, 0.08)}
      stroke={primaryColor}
      strokeOpacity="0.35"
      strokeWidth="2"
    />
    {/* Book cover right */}
    <path
      d="M14 -10 C14 -14 8 -16 0 -16 L0 14 C8 14 14 12 14 8 Z"
      {...fillStyle(primaryColor, 0.08)}
      stroke={primaryColor}
      strokeOpacity="0.35"
      strokeWidth="2"
    />
    {/* Spine */}
    <line x1="0" y1="-16" x2="0" y2="14" stroke={primaryColor} strokeOpacity="0.5" strokeWidth="2" />
    {/* Lines on left page */}
    <line x1="-10" y1="-6" x2="-2" y2="-6" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="-10" y1="0" x2="-2" y2="0" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="-10" y1="6" x2="-2" y2="6" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    {/* Lines on right page */}
    <line x1="2" y1="-6" x2="10" y2="-6" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="0" x2="10" y2="0" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2" y1="6" x2="6" y2="6" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    {/* Error overlay */}
    {isError && (
      <g>
        <circle cx="0" cy="0" r="18" fill="rgba(239,68,68,0.1)" />
        <path d="M-7 -7 L7 7 M7 -7 L-7 7" {...strokeStyle(primaryColor, 2.5)} />
      </g>
    )}
  </g>
);

/* ─── Audit Trail Glyph ────────────────────────────────────────────────────── */
// Magnifying glass over a trail of dots

const AuditTrailGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({
  primaryColor,
  mutedColor,
  isError,
}) => (
  <g>
    {/* Trail dots */}
    <circle cx="-10" cy="8" r="2.5" fill={mutedColor} fillOpacity="0.4" />
    <circle cx="-4" cy="2" r="2.5" fill={mutedColor} fillOpacity="0.5" />
    <circle cx="2" cy="-4" r="2.5" fill={primaryColor} fillOpacity="0.6" />
    <circle cx="8" cy="-10" r="2.5" fill={primaryColor} fillOpacity="0.8" />
    {/* Magnifying glass */}
    <circle cx="6" cy="-6" r="8" fill="rgba(15,23,42,0.5)" stroke={primaryColor} strokeOpacity="0.6" strokeWidth="2.5" />
    <line x1="12" y1="-12" x2="18" y2="-18" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
    {/* Error overlay */}
    {isError && (
      <g>
        <circle cx="6" cy="-6" r="12" fill="rgba(239,68,68,0.1)" />
        <path d="M2 -10 L10 -2 M10 -10 L2 -2" {...strokeStyle(primaryColor, 2.5)} />
      </g>
    )}
  </g>
);

/* ─── Notifications Glyph ──────────────────────────────────────────────────── */
// Bell with a small notification dot

const NotificationsGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({
  primaryColor,
  mutedColor,
  isError,
}) => (
  <g>
    {/* Bell body */}
    <path
      d="M-6 -8 C-6 -14 -2 -16 0 -16 C2 -16 6 -14 6 -8 L6 -2 C6 2 10 4 10 8 L-10 8 C-10 4 -6 2 -6 -2 Z"
      {...fillStyle(primaryColor, 0.1)}
      stroke={primaryColor}
      strokeOpacity="0.5"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Bell clapper */}
    <ellipse cx="0" cy="10" rx="4" ry="2.5" fill={primaryColor} fillOpacity="0.4" />
    {/* Notification dot or error X */}
    {isError ? (
      <g>
        <circle cx="8" cy="-10" r="5" fill="rgba(239,68,68,0.15)" />
        <path d="M5 -13 L11 -7 M11 -13 L5 -7" {...strokeStyle(primaryColor, 2)} />
      </g>
    ) : (
      <>
        <circle cx="8" cy="-10" r="3.5" fill={primaryColor} />
        <circle cx="8" cy="-10" r="1.5" fill="rgba(15,23,42,0.8)" />
      </>
    )}
  </g>
);

/* ─── Revenue Reports Glyph ────────────────────────────────────────────────── */
// Document with chart bars and a dollar accent

const RevenueReportsGlyph: React.FC<{ primaryColor: string; mutedColor: string; accentColor: string; isError: boolean }> = ({
  primaryColor,
  mutedColor,
  accentColor,
  isError,
}) => (
  <g>
    {/* Document */}
    <rect
      x="-10"
      y="-14"
      width="20"
      height="28"
      rx="2"
      {...fillStyle(primaryColor, 0.06)}
      stroke={primaryColor}
      strokeOpacity="0.35"
      strokeWidth="2"
    />
    {/* Fold corner */}
    <path d="M6 -14 L10 -10 L6 -10 Z" fill={primaryColor} fillOpacity="0.2" />
    {/* Document lines */}
    <line x1="-6" y1="-6" x2="6" y2="-6" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="-6" y1="0" x2="4" y2="0" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="-6" y1="6" x2="6" y2="6" stroke={mutedColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
    {/* Mini chart */}
    <rect x="-6" y="10" width="3" height="4" rx="0.5" fill={accentColor} fillOpacity="0.5" />
    <rect x="-1" y="7" width="3" height="7" rx="0.5" fill={accentColor} fillOpacity="0.6" />
    <rect x="4" y="4" width="3" height="10" rx="0.5" fill={accentColor} fillOpacity="0.7" />
    {/* Dollar sign accent or error overlay */}
    {isError ? (
      <g>
        <circle cx="8" cy="-8" r="6" fill="rgba(239,68,68,0.12)" />
        <path d="M5 -11 L11 -5 M11 -11 L5 -5" {...strokeStyle(primaryColor, 2.5)} />
      </g>
    ) : (
      <>
        <circle cx="8" cy="-8" r="4" fill={accentColor} fillOpacity="0.15" stroke={accentColor} strokeOpacity="0.5" strokeWidth="1.5" />
        <text x="8" y="-5" textAnchor="middle" fontSize="6" fill={accentColor} fontWeight="bold" fontFamily="Inter, system-ui, sans-serif">$</text>
      </>
    )}
  </g>
);

/* ─── Governance Glyphs ────────────────────────────────────────────────────── */

const GovernanceProposalsGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({ primaryColor, mutedColor, isError }) => (
  <g>
    <rect x="-10" y="-14" width="20" height="28" rx="2" {...fillStyle(primaryColor, 0.08)} stroke={primaryColor} strokeOpacity="0.4" strokeWidth="2" />
    <line x1="-5" y1="-8" x2="5" y2="-8" stroke={mutedColor} strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="-5" y1="-2" x2="2" y2="-2" stroke={mutedColor} strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="5" cy="6" r="6" {...fillStyle(primaryColor, 0.15)} stroke={primaryColor} strokeOpacity="0.6" strokeWidth="2" />
    <path d="M5 3 L5 9 M2 6 L8 6" stroke={primaryColor} strokeOpacity="0.8" strokeWidth="1.5" />
    {isError && (
      <g>
        <circle cx="0" cy="0" r="16" fill="rgba(239,68,68,0.1)" />
        <path d="M-6 -6 L6 6 M6 -6 L-6 6" {...strokeStyle(primaryColor, 2.5)} />
      </g>
    )}
  </g>
);

const GovernanceVotesGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({ primaryColor, mutedColor, isError }) => (
  <g>
    <rect x="-14" y="-2" width="28" height="18" rx="2" {...fillStyle(primaryColor, 0.08)} stroke={primaryColor} strokeOpacity="0.4" strokeWidth="2" />
    <line x1="-8" y1="-2" x2="8" y2="-2" stroke={primaryColor} strokeOpacity="0.6" strokeWidth="2" />
    <path d="M-6 -14 L6 -14 L6 -2 L-6 -2 Z" {...fillStyle(mutedColor, 0.1)} stroke={mutedColor} strokeOpacity="0.5" strokeWidth="1.5" />
    <path d="M-2 -10 L2 -10" stroke={mutedColor} strokeOpacity="0.5" strokeWidth="1" />
    {isError && (
      <g>
        <circle cx="0" cy="0" r="16" fill="rgba(239,68,68,0.1)" />
        <path d="M-6 -6 L6 6 M6 -6 L-6 6" {...strokeStyle(primaryColor, 2.5)} />
      </g>
    )}
  </g>
);

const GovernanceDelegatesGlyph: React.FC<{ primaryColor: string; mutedColor: string; isError: boolean }> = ({ primaryColor, mutedColor, isError }) => (
  <g>
    <circle cx="0" cy="-6" r="6" {...fillStyle(primaryColor, 0.1)} stroke={primaryColor} strokeOpacity="0.4" strokeWidth="2" />
    <path d="M-10 12 C-10 4 10 4 10 12" {...fillStyle(primaryColor, 0.1)} stroke={primaryColor} strokeOpacity="0.4" strokeWidth="2" />
    <path d="M8 0 L10 4 L14 4 L11 7 L12 11 L8 8.5 L4 11 L5 7 L2 4 L6 4 Z" {...fillStyle(primaryColor, 0.2)} stroke={primaryColor} strokeOpacity="0.8" strokeWidth="1.5" />
    {isError && (
      <g>
        <circle cx="0" cy="0" r="16" fill="rgba(239,68,68,0.1)" />
        <path d="M-6 -6 L6 6 M6 -6 L-6 6" {...strokeStyle(primaryColor, 2.5)} />
      </g>
    )}
  </g>
);

export default EmptyState;
