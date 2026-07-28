/**
 * KycRejectionPanel — rejection reasons with corrective actions (Issue #229).
 *
 * Rejected KYC applications must never end in a dead end. This panel lists
 * each canonical reason as a chip + plain-language explanation and a CTA
 * that jumps to the failing KYC step (or Contact support for unclear /
 * AML-review cases).
 *
 * Accessibility (WCAG 2.1 AA):
 *  - labelled region landmark + list semantics
 *  - severity conveyed with icon AND text (not colour alone)
 *  - each CTA is a real button/link with an accessible name that includes
 *    the reason chip label
 *  - polite live region announces focus jumps to the target step
 *  - stacked layout under 720px; logical properties for RTL
 */

import React, { useId, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Info,
  LifeBuoy,
  ShieldAlert,
} from 'lucide-react';
import {
  type KycRejectionReason,
  type KycRejectionSeverity,
  type KycStepId,
  type ResolvedKycRejection,
  DEFAULT_SUPPORT_HREF,
  KYC_STEP_LABELS,
  countBlockingReasons,
  resolveRejectionReasons,
} from './kycRejectionTaxonomy';
import './KycRejectionPanel.css';

export interface KycRejectionPanelProps {
  /** Rejection reason instances from the application decision. */
  reasons: KycRejectionReason[];
  /** Called when the user activates a corrective CTA for a KYC step. */
  onNavigateToStep?: (stepId: KycStepId, reason: ResolvedKycRejection) => void;
  /** Override for the contact-support href (defaults to /support/kyc). */
  supportHref?: string;
  /** Optional panel title override. */
  title?: string;
  className?: string;
  id?: string;
}

function severityConfig(severity: KycRejectionSeverity) {
  switch (severity) {
    case 'blocking':
      return {
        Icon: ShieldAlert,
        label: 'Blocking',
        className: 'kyc-rej-item--blocking',
      };
    case 'warning':
      return {
        Icon: AlertTriangle,
        label: 'Needs attention',
        className: 'kyc-rej-item--warning',
      };
    case 'info':
      return {
        Icon: Info,
        label: 'Information',
        className: 'kyc-rej-item--info',
      };
  }
}

export const KycRejectionPanel: React.FC<KycRejectionPanelProps> = ({
  reasons,
  onNavigateToStep,
  supportHref = DEFAULT_SUPPORT_HREF,
  title = 'Why your verification was rejected',
  className = '',
  id = 'kyc-rejection-panel',
}) => {
  const headingId = useId();
  const summaryId = useId();
  const [announcement, setAnnouncement] = useState('');

  if (!reasons || reasons.length === 0) return null;

  const resolved = resolveRejectionReasons(reasons);
  const blockingCount = countBlockingReasons(resolved);
  const hasUnclear = resolved.some((r) => r.code === 'UNCLEAR' || r.contactSupport);

  const handleCorrectiveAction = (reason: ResolvedKycRejection) => {
    if (reason.contactSupport) {
      setAnnouncement(`Opening support for: ${reason.chipLabel}.`);
      return;
    }
    setAnnouncement(
      `Opening ${KYC_STEP_LABELS[reason.stepId]} to fix: ${reason.chipLabel}.`
    );
    onNavigateToStep?.(reason.stepId, reason);
  };

  return (
    <section
      id={id}
      className={`kyc-rej-panel glass-card ${className}`.trim()}
      role="region"
      aria-labelledby={headingId}
      aria-describedby={summaryId}
      data-testid="kyc-rejection-panel"
    >
      <header className="kyc-rej-header">
        <div className="kyc-rej-header-icon" aria-hidden="true">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h2 id={headingId} className="kyc-rej-title">
            {title}
          </h2>
          <p id={summaryId} className="kyc-rej-summary">
            {resolved.length === 1
              ? '1 issue needs your attention before you can continue.'
              : `${resolved.length} issues need your attention${
                  blockingCount > 0 ? ` (${blockingCount} blocking)` : ''
                }. Fix each one below — nothing here is a dead end.`}
          </p>
        </div>
      </header>

      {/* Announce corrective-action navigation for assistive tech */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ul className="kyc-rej-list" role="list">
        {resolved.map((reason) => {
          const config = severityConfig(reason.severity);
          const Icon = config.Icon;
          const isSupport = Boolean(reason.contactSupport);

          return (
            <li
              key={reason.id}
              className={`kyc-rej-item ${config.className}`}
              data-testid={`kyc-rejection-item-${reason.id}`}
              data-code={reason.code}
              data-severity={reason.severity}
            >
              <div className="kyc-rej-item-main">
                <div className="kyc-rej-item-meta">
                  <span
                    className="kyc-rej-severity"
                    data-testid={`kyc-severity-${reason.id}`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="kyc-rej-severity-label">{config.label}</span>
                  </span>
                  <span className="kyc-rej-chip" data-testid={`kyc-chip-${reason.id}`}>
                    {reason.chipLabel}
                  </span>
                  <span className="kyc-rej-step-hint">
                    Step: {KYC_STEP_LABELS[reason.stepId]}
                  </span>
                </div>

                <p className="kyc-rej-explanation">{reason.displayExplanation}</p>
              </div>

              <div className="kyc-rej-item-action">
                {isSupport ? (
                  <a
                    className="btn btn--primary btn--sm kyc-rej-cta"
                    href={supportHref}
                    aria-label={`${reason.actionLabel}: ${reason.chipLabel}`}
                    onClick={() => handleCorrectiveAction(reason)}
                  >
                    <LifeBuoy size={14} aria-hidden="true" />
                    {reason.actionLabel}
                    <ArrowRight size={14} aria-hidden="true" className="kyc-rej-cta-arrow" />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm kyc-rej-cta"
                    onClick={() => handleCorrectiveAction(reason)}
                    aria-label={`${reason.actionLabel}: ${reason.chipLabel}`}
                  >
                    {reason.actionLabel}
                    <ArrowRight size={14} aria-hidden="true" className="kyc-rej-cta-arrow" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Always-visible contact-support fallback affordance */}
      <footer className="kyc-rej-footer" data-testid="kyc-support-fallback">
        <HelpCircle size={16} aria-hidden="true" className="kyc-rej-footer-icon" />
        <p className="kyc-rej-footer-copy">
          {hasUnclear
            ? 'Still stuck? Our support team can walk you through any unclear rejection.'
            : 'If a fix does not work or something looks wrong, contact support — we will help you finish verification.'}
          {' '}
          <a
            href={supportHref}
            className="kyc-rej-footer-link"
            aria-label="Contact support about KYC rejection"
          >
            Contact support
          </a>
        </p>
      </footer>
    </section>
  );
};

export default KycRejectionPanel;
