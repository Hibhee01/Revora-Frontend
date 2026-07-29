import React from "react";
import { CheckCircle2, Circle, ExternalLink, ChevronRight } from "lucide-react";

export interface RemediationStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: (stepId: string) => void;
  disabled?: boolean;
}

interface RemediationChecklistProps {
  steps: RemediationStep[];
  className?: string;
  id?: string;
  title?: string;
}

/**
 * RemediationChecklist component for displaying actionable steps to resolve compliance holds.
 * 
 * Follows WCAG 2.1 AA guidelines for contrast and screen reader accessibility.
 * Includes reduced-motion support and responsive design.
 * 
 * @example
 * ```tsx
 * <RemediationChecklist
 *   title="Steps to resolve"
 *   steps={[
 *     {
 *       id: "1",
 *       title: "Upload government ID",
 *       description: "Provide a valid passport or driver's license",
 *       completed: false,
 *       actionLabel: "Upload now",
 *       onAction: (id) => console.log(id)
 *     }
 *   ]}
 * />
 * ```
 */
export const RemediationChecklist: React.FC<RemediationChecklistProps> = ({
  steps,
  className = "",
  id = "remediation-checklist",
  title = "Steps to resolve",
}) => {
  if (!steps || steps.length === 0) return null;

  const completedCount = steps.filter((step) => step.completed).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div
      className={`rounded-lg border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.5)] p-5 ${className}`}
      id={id}
      role="region"
      aria-label="Remediation checklist"
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#e5e7eb] mb-2">
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[rgba(148,163,184,0.2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3b82f6] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={totalCount}
                aria-label={`${completedCount} of ${totalCount} steps completed`}
              />
            </div>
            <span className="text-sm text-[#cbd5e1]">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
      )}

      <ul className="space-y-3" role="list">
        {steps.map((step, index) => {
          const Icon = step.completed ? CheckCircle2 : Circle;
          const isDisabled = step.disabled || step.completed;

          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                step.completed
                  ? "bg-[rgba(16,185,129,0.05)]"
                  : "bg-[rgba(148,163,184,0.05)] hover:bg-[rgba(148,163,184,0.1)]"
              }`}
              role="listitem"
              aria-current={!step.completed && steps.findIndex(s => !s.completed) === index ? "step" : undefined}
            >
              <div className="flex-shrink-0 pt-0.5">
                <Icon
                  size={20}
                  className={
                    step.completed
                      ? "text-[#10b981]"
                      : "text-[#64748b]"
                  }
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.completed
                      ? "text-[#10b981] line-through"
                      : "text-[#e5e7eb]"
                  }`}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-sm text-[#cbd5e1] mt-1">
                    {step.description}
                  </p>
                )}
                {(step.actionLabel || step.actionUrl) && !step.completed && (
                  <button
                    onClick={() => {
                      if (step.onAction && !isDisabled) {
                        step.onAction(step.id);
                      } else if (step.actionUrl && !step.disabled) {
                        window.open(step.actionUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    disabled={isDisabled}
                    className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      isDisabled
                        ? "text-[#64748b] cursor-not-allowed"
                        : "text-[#3b82f6] hover:text-[#2563eb]"
                    }`}
                    type="button"
                    aria-label={`${step.actionLabel || "Learn more"} for ${step.title}`}
                  >
                    {step.actionLabel || "Learn more"}
                    {step.actionUrl ? (
                      <ExternalLink size={14} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} aria-hidden="true" className="icon-rtl" />
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
