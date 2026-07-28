import React, { useState } from "react";
import { X, FileText } from "lucide-react";
import { ComplianceSeverityBadge, ComplianceSeverityLegend } from "./ComplianceSeverityBadge";
import type { ComplianceSeverityTier } from "./ComplianceSeverityBadge";
import { ComplianceAppealForm } from "./ComplianceAppealForm";
import "./ComplianceAppealForm.css";

export type ComplianceSeverity = ComplianceSeverityTier;

export interface ComplianceHold {
  id: string;
  type: string;
  severity: ComplianceSeverity;
  title: string;
  message: string;
  canDismiss?: boolean;
  /** When true, shows an "Appeal" button that opens the appeal form */
  appealable?: boolean;
}

interface ComplianceHoldBannerProps {
  holds: ComplianceHold[];
  onDismiss?: (holdId: string) => void;
  /** Called when an appeal is submitted for a hold */
  onAppeal?: (data: {
    holdId: string;
    reason: string;
    explanation: string;
    attachments: File[];
  }) => Promise<void>;
  className?: string;
  id?: string;
}

/**
 * ComplianceHoldBanner component for displaying compliance holds with severity badges
 * and optional appeal submission.
 *
 * Follows WCAG 2.1 AA guidelines for contrast and screen reader accessibility.
 * Includes reduced-motion support and responsive design.
 */
export const ComplianceHoldBanner: React.FC<ComplianceHoldBannerProps> = ({
  holds,
  onDismiss,
  onAppeal,
  className = "",
  id = "compliance-hold-banner",
}) => {
  const [appealingHold, setAppealingHold] = useState<ComplianceHold | null>(null);

  if (!holds || holds.length === 0) return null;

  const getSeverityConfig = (severity: ComplianceSeverity) => {
    switch (severity) {
      case "advisory":
        return {
          bgClass: "bg-[rgba(59,130,246,0.1)]",
          borderClass: "border-[rgba(59,130,246,0.2)]",
          textClass: "text-[#60a5fa]",
          ariaRole: "status" as const,
          ariaLive: "polite" as const,
        };
      case "warning":
        return {
          bgClass: "bg-[rgba(245,158,11,0.1)]",
          borderClass: "border-[rgba(245,158,11,0.2)]",
          textClass: "text-[#fbbf24]",
          ariaRole: "alert" as const,
          ariaLive: "assertive" as const,
        };
      case "blocking":
        return {
          bgClass: "bg-[rgba(239,68,68,0.1)]",
          borderClass: "border-[rgba(239,68,68,0.2)]",
          textClass: "text-[#f87171]",
          ariaRole: "alert" as const,
          ariaLive: "assertive" as const,
        };
    }
  };

  const hasMultiple = holds.length > 1;

  return (
    <>
      <div
        className={`flex flex-col gap-3 ${className}`}
        id={id}
        role="region"
        aria-label="Compliance holds"
      >
        {/* Severity legend trigger — shown when multiple holds */}
        {hasMultiple && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted">
              {holds.length} hold{holds.length !== 1 ? "s" : ""} active
            </span>
            <ComplianceSeverityLegend />
          </div>
        )}

        {holds.map((hold) => {
          const config = getSeverityConfig(hold.severity);

          return (
            <div
              key={hold.id}
              className={`relative flex items-start gap-3 p-4 rounded-lg border ${config.bgClass} ${config.borderClass} ${config.textClass} animate-fade-in`}
              role={config.ariaRole}
              aria-live={config.ariaLive}
              aria-atomic="true"
            >
              <ComplianceSeverityBadge
                severity={hold.severity}
                variant="compact"
                className="mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">{hold.title}</p>
                <p className="text-sm opacity-90">{hold.message}</p>

                {/* Appeal button */}
                {hold.appealable && onAppeal && (
                  <button
                    onClick={() => setAppealingHold(hold)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    type="button"
                    aria-label={`Appeal ${hold.title}`}
                  >
                    <FileText size={12} aria-hidden="true" />
                    Appeal
                  </button>
                )}
              </div>

              {hold.canDismiss && onDismiss && (
                <button
                  onClick={() => onDismiss(hold.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label={`Dismiss ${hold.title}`}
                  type="button"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}

        {/* Severity legend trigger — shown even with a single hold */}
        {!hasMultiple && holds.length === 1 && (
          <div className="flex items-center justify-end">
            <ComplianceSeverityLegend />
          </div>
        )}
      </div>

      {/* Appeal Form Dialog */}
      {appealingHold && (
        <ComplianceAppealForm
          holdId={appealingHold.id}
          holdTitle={appealingHold.title}
          onSubmit={onAppeal}
          onClose={() => setAppealingHold(null)}
          isOpen={!!appealingHold}
        />
      )}
    </>
  );
};
