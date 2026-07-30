import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LayoutDashboard,
  FileText,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { SuccessFailureIllustration } from './designSystem/SuccessFailureIllustration';
import { StatusTimeline, type Milestone } from './StatusTimeline';
import './OfferingRegistrationSuccess.css';

export type NextStepCard = {
  icon: React.ReactNode;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
  label: string;
};

export type OfferingRegistrationSuccessProps = {
  referenceNumber?: string;
  issuerName?: string;
  offeringName?: string;
  submissionDate?: string;
  estimatedReviewDays?: number;
  milestones?: Milestone[];
  nextSteps?: NextStepCard[];
  onContactSupport?: () => void;
};

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'submitted',
    label: 'Offering Submitted',
    description: 'Your offering has been received by our team.',
    status: 'completed',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'under-review',
    label: 'Under Review',
    description: 'Our compliance team is reviewing your submission.',
    status: 'in-progress',
  },
  {
    id: 'compliance',
    label: 'Compliance Check',
    description: 'Legal and regulatory verification in progress.',
    status: 'pending',
  },
  {
    id: 'published',
    label: 'Offering Published',
    description: 'Your offering will go live on the platform.',
    status: 'pending',
  },
];

const DEFAULT_NEXT_STEPS: NextStepCard[] = [
  {
    icon: <LayoutDashboard size={22} aria-hidden="true" />,
    title: 'Dashboard',
    description: 'Track the review status and manage your offerings from your startup dashboard.',
    to: '/startup/dashboard',
    label: 'Go to Dashboard',
  },
  {
    icon: <FileText size={22} aria-hidden="true" />,
    title: 'Documents',
    description: 'Upload additional documents or update existing ones for your offering.',
    to: '/startup/documents',
    label: 'View Documents',
  },
  {
    icon: <MessageCircle size={22} aria-hidden="true" />,
    title: 'Support',
    description: 'Have questions? Our team is ready to help you through the review process.',
    label: 'Contact Support',
    onClick: undefined,
  },
];

export const OfferingRegistrationSuccess: React.FC<OfferingRegistrationSuccessProps> = ({
  referenceNumber = 'REF-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
  issuerName,
  offeringName,
  submissionDate,
  estimatedReviewDays = 5,
  milestones = DEFAULT_MILESTONES,
  nextSteps = DEFAULT_NEXT_STEPS,
  onContactSupport,
}) => {
  const [illustrationFailed, setIllustrationFailed] = useState(false);

  const title = issuerName
    ? `${issuerName}, your offering has been submitted`
    : 'Your offering has been submitted';
  const subtitle = offeringName
    ? `We've received "${offeringName}" and our team will begin reviewing it shortly.`
    : `We've received your offering and our team will begin reviewing it shortly.`;

  const estimatedDate = submissionDate
    ? (() => {
        const d = new Date(submissionDate);
        d.setUTCDate(d.getUTCDate() + estimatedReviewDays);
        return d.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        });
      })()
    : null;

  const handleIllustrationError = () => {
    setIllustrationFailed(true);
  };

  return (
    <div className="ors-container" role="main" aria-labelledby="ors-hero-title">
      <div className="ors-hero">
        <div className="ors-hero-illustration-wrap" aria-hidden="true">
          {illustrationFailed ? (
            <div className="ors-hero-illustration-fallback" role="presentation">
              <CheckCircle size={48} />
            </div>
          ) : (
            <div onError={handleIllustrationError}>
              <SuccessFailureIllustration
                variant="offeringPublished"
                size={96}
                ariaHidden={true}
              />
            </div>
          )}
        </div>

        <h1 id="ors-hero-title" className="ors-hero-title">
          {title}
        </h1>

        <p className="ors-hero-subtitle">{subtitle}</p>

        <div
          className="ors-reference-badge"
          role="text"
          aria-label={`Reference number: ${referenceNumber}`}
          title={`Reference: ${referenceNumber}`}
        >
          <CheckCircle size={14} aria-hidden="true" />
          {referenceNumber}
        </div>
      </div>

      <section className="ors-section" aria-labelledby="ors-timeline-title">
        <div className="ors-section-header">
          <h2 id="ors-timeline-title" className="ors-section-title">
            Review Timeline
          </h2>
          <p className="ors-section-description">
            Here is what to expect after submission.
            {estimatedDate && (
              <>
                {' '}Estimated review completion by <strong>{estimatedDate}</strong>.
              </>
            )}
          </p>
        </div>
        <div className="glass-card ors-timeline-card">
          <StatusTimeline
            milestones={milestones}
            orientation="horizontal"
            ariaLabel="Offering registration progress"
          />
        </div>
      </section>

      <section className="ors-section" aria-labelledby="ors-next-steps-title">
        <div className="ors-section-header">
          <h2 id="ors-next-steps-title" className="ors-section-title">
            Next Steps
          </h2>
          <p className="ors-section-description">
            While your offering is being reviewed, you can take these actions.
          </p>
        </div>

        <nav className="ors-next-steps-grid" aria-label="Quick actions">
          {nextSteps.map((step, index) => {
            const isSupport = !step.to;
            const id = `ors-cta-${index}`;

            if (isSupport) {
              return (
                <div key={id} className="glass-card ors-cta-card" role="group" aria-labelledby={`${id}-title`}>
                  <div className="ors-cta-card-icon-wrap">
                    {step.icon}
                  </div>
                  <div className="ors-cta-card-content">
                    <h3 id={`${id}-title`} className="ors-cta-card-title">{step.title}</h3>
                    <p className="ors-cta-card-description">{step.description}</p>
                  </div>
                  <button
                    type="button"
                    className="ors-cta-card-action"
                    onClick={onContactSupport || step.onClick}
                    aria-label={step.label}
                  >
                    {step.label}
                    <ArrowRight size={14} className="ors-cta-card-action-icon" aria-hidden="true" />
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={id}
                to={step.to!}
                className="glass-card ors-cta-card"
                aria-label={`${step.label}: ${step.description}`}
              >
                <div className="ors-cta-card-icon-wrap" aria-hidden="true">
                  {step.icon}
                </div>
                <div className="ors-cta-card-content">
                  <h3 className="ors-cta-card-title">{step.title}</h3>
                  <p className="ors-cta-card-description">{step.description}</p>
                </div>
                <span className="ors-cta-card-action">
                  {step.label}
                  <ArrowRight size={14} className="ors-cta-card-action-icon" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="glass-card ors-support-section" aria-labelledby="ors-support-title">
        <h2 id="ors-support-title" className="ors-section-title" style={{ fontSize: 'var(--font-size-base)' }}>
          Need help?
        </h2>
        <p className="ors-support-text">
          Our support team is available to answer questions about the review process, document requirements, or timeline expectations.
        </p>
        {onContactSupport ? (
          <button
            type="button"
            className="ors-support-link"
            onClick={onContactSupport}
            aria-label="Contact support team"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Contact Support
          </button>
        ) : (
          <a
            href="mailto:support@revora.com"
            className="ors-support-link"
            aria-label="Email support team at support@revora.com"
          >
            <MessageCircle size={16} aria-hidden="true" />
            support@revora.com
          </a>
        )}
      </section>
    </div>
  );
};

export default OfferingRegistrationSuccess;

