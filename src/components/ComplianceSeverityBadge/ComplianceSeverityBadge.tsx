/**
 * ComplianceSeverityBadge — Three-tier severity badge (Issue #285).
 *
 * Tiers: advisory, warning, blocking.
 * Each tier has a distinct icon, colour, label, and shape.
 * Supports compact (icon only) and detailed (icon + label) variants.
 *
 * WCAG 2.1 AA: colour is never the only cue — each tier uses a distinct
 * icon and shape so meaning survives high-contrast mode, print, and
 * assistive technology.
 */

import React from 'react';
import { Info, AlertTriangle, ShieldAlert, type LucideIcon } from 'lucide-react';
import './ComplianceSeverityBadge.css';

export type ComplianceSeverityTier = 'advisory' | 'warning' | 'blocking';
export type ComplianceSeverityBadgeVariant = 'compact' | 'detailed';

export interface ComplianceSeverityBadgeProps {
  severity: ComplianceSeverityTier;
  variant?: ComplianceSeverityBadgeVariant;
  /** Override the default label */
  label?: string;
  className?: string;
  /** When true, render as inline text without badge styling (for use in legends) */
  asText?: boolean;
}

/* ─── Tier Config ──────────────────────────────────────────────────── */

interface TierConfig {
  icon: LucideIcon;
  label: string;
  description: string;
}

export const SEVERITY_TIER_CONFIG: Record<ComplianceSeverityTier, TierConfig> = {
  advisory: {
    icon: Info,
    label: 'Advisory',
    description: 'Informational notice. No action required. This hold does not block any operations.',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    description: 'Attention recommended. Some features may be limited until resolved.',
  },
  blocking: {
    icon: ShieldAlert,
    label: 'Blocking',
    description: 'Action required. This hold prevents critical operations until resolved.',
  },
};

/* ─── Badge Component ──────────────────────────────────────────────── */

export const ComplianceSeverityBadge: React.FC<ComplianceSeverityBadgeProps> = ({
  severity,
  variant = 'compact',
  label,
  className = '',
  asText = false,
}) => {
  const config = SEVERITY_TIER_CONFIG[severity];
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  if (asText) {
    return (
      <span className={`csb-text csb-text--${severity}`}>
        <Icon size={14} className="csb-text-icon" aria-hidden="true" />
        {displayLabel}
      </span>
    );
  }

  return (
    <span
      className={`csb-badge csb-badge--${severity} csb-badge--${variant} ${className}`.trim()}
      data-testid={`severity-badge-${severity}`}
      data-severity={severity}
      data-variant={variant}
    >
      <span className="csb-badge-face">
        <Icon
          size={variant === 'detailed' ? 16 : 14}
          className="csb-badge-icon"
          aria-hidden="true"
        />
        {variant === 'detailed' && (
          <span className="csb-badge-label">{displayLabel}</span>
        )}
      </span>
    </span>
  );
};
