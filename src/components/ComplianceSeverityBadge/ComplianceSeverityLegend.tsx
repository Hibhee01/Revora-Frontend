/**
 * ComplianceSeverityLegend — Accessible severity-tier legend popover (Issue #285).
 *
 * Triggered by a "?" affordance button. Shows the three severity tiers with
 * icons, labels, and plain-language descriptions.
 */

import React, { useId, useRef, useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { ComplianceSeverityBadge, SEVERITY_TIER_CONFIG } from './ComplianceSeverityBadge';
import type { ComplianceSeverityTier } from './ComplianceSeverityBadge';

export interface ComplianceSeverityLegendProps {
  className?: string;
}

const TIERS: ComplianceSeverityTier[] = ['advisory', 'warning', 'blocking'];

export const ComplianceSeverityLegend: React.FC<ComplianceSeverityLegendProps> = ({
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span className={`csb-legend-wrap ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="csb-legend-trigger"
        aria-label="About severity levels"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <HelpCircle size={14} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          className="csb-legend-popover"
          role="tooltip"
          data-testid="severity-legend-popover"
        >
          <div className="csb-legend-header">Severity Levels</div>
          <div className="csb-legend-list">
            {TIERS.map((tier) => {
              const config = SEVERITY_TIER_CONFIG[tier];
              return (
                <div key={tier} className="csb-legend-item">
                  <ComplianceSeverityBadge severity={tier} variant="detailed" />
                  <p className="csb-legend-desc">{config.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </span>
  );
};
