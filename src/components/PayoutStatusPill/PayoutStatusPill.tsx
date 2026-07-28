/**
 * PayoutStatusPill — labeled status pill with accessible tooltip (Issue #221).
 *
 * Colour is never the only cue: every pill shows an icon + text label, and a
 * longer plain-language description is exposed via a screen-reader-first
 * tooltip that:
 *  - opens on hover and keyboard focus,
 *  - is dismissible via Escape,
 *  - is associated with the trigger via aria-describedby,
 *  - reappears after ESC once focus/hover is cleared and re-entered.
 *
 * Variants: `compact` (dense rows) and `full` (label + optional detail).
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Package,
  RefreshCw,
  Send,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  type PayoutStatus,
  type PayoutStatusIconName,
  getPayoutStatusDefinition,
  normalizePayoutStatus,
} from './payoutStatuses';
import './PayoutStatusPill.css';

const ICONS: Record<PayoutStatusIconName, LucideIcon> = {
  calendar: CalendarClock,
  package: Package,
  send: Send,
  check: CheckCircle2,
  refresh: RefreshCw,
  x: XCircle,
  ban: Ban,
};

export type PayoutStatusPillVariant = 'compact' | 'full';

export interface PayoutStatusPillProps {
  /** Canonical status, or a raw string that will be normalised. */
  status: PayoutStatus | string;
  /** `compact` for dense table rows; `full` for detail views. */
  variant?: PayoutStatusPillVariant;
  /** Optional secondary line shown only in the full variant. */
  detail?: string;
  /** Override the tooltip description (defaults to taxonomy copy). */
  tooltip?: string;
  /** When false, the tooltip is omitted (label + icon remain). Default true. */
  showTooltip?: boolean;
  className?: string;
  id?: string;
}

export const PayoutStatusPill: React.FC<PayoutStatusPillProps> = ({
  status: statusProp,
  variant = 'compact',
  detail,
  tooltip,
  showTooltip = true,
  className = '',
  id,
}) => {
  const status = normalizePayoutStatus(statusProp);
  const def = getPayoutStatusDefinition(status);
  const Icon = ICONS[def.icon];
  const reactId = useId();
  const tooltipId = `${reactId}-tip`;
  const triggerRef = useRef<HTMLSpanElement>(null);

  const [open, setOpen] = useState(false);
  /** After ESC, suppress until hover/focus fully clears. */
  const [dismissed, setDismissed] = useState(false);

  const description = tooltip ?? def.description;
  const tooltipVisible = showTooltip && open && !dismissed;

  const openTip = useCallback(() => {
    if (!dismissed) setOpen(true);
  }, [dismissed]);

  const closeTip = useCallback(() => {
    setOpen(false);
  }, []);

  const clearDismissed = useCallback(() => {
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (!tooltipVisible) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setDismissed(true);
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tooltipVisible]);

  const handleBlur = () => {
    closeTip();
    clearDismissed();
  };

  return (
    <span
      ref={triggerRef}
      id={id}
      className={`psp-pill psp-pill--${status} psp-pill--${variant} ${className}`.trim()}
      data-testid="payout-status-pill"
      data-status={status}
      data-variant={variant}
      tabIndex={showTooltip ? 0 : undefined}
      aria-describedby={showTooltip ? tooltipId : undefined}
      onMouseEnter={openTip}
      onMouseLeave={() => {
        closeTip();
        clearDismissed();
      }}
      onFocus={openTip}
      onBlur={handleBlur}
    >
      <span className="psp-pill-face" data-testid="payout-status-face">
        <Icon
          size={variant === 'full' ? 16 : 14}
          className="psp-pill-icon"
          aria-hidden="true"
        />
        <span className="psp-pill-label">{def.label}</span>
        {variant === 'full' && detail ? (
          <span className="psp-pill-detail">{detail}</span>
        ) : null}
      </span>

      {showTooltip && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`psp-tooltip ${tooltipVisible ? 'psp-tooltip--open' : ''}`}
          data-testid="payout-status-tooltip"
          // Keep in the a11y tree for aria-describedby even when visually hidden.
          // Visual open state is controlled by .psp-tooltip--open.
        >
          {description}
        </span>
      )}
    </span>
  );
};

export default PayoutStatusPill;
