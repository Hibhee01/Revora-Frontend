import React from 'react';
import { AlertCircle, Check, Circle, Clock3, X } from 'lucide-react';
import './KycResubmissionTimeline.css';

export type KycReviewStatus = 'submitted' | 'under-review' | 'decision' | 'canceled';

export interface KycResubmissionTimelineProps {
  status: KycReviewStatus;
  submittedAt: string | Date;
  reviewStartedAt?: string | Date;
  decidedAt?: string | Date;
  decisionLabel?: 'Approved' | 'More information needed';
  slaBusinessDays?: number;
  holidays?: Array<string | Date>;
  now?: string | Date;
  escalationHref?: string;
}

function toDate(value: string | Date): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('KYC timeline received an invalid date');
  return date;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(value: string | Date): Date {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function holidayKeys(holidays: Array<string | Date>): Set<string> {
  return new Set(holidays.map((holiday) => dateKey(startOfDay(holiday))));
}

export function isBusinessDay(date: Date, holidays: Array<string | Date> = []): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6 && !holidayKeys(holidays).has(dateKey(date));
}

export function addBusinessDays(start: string | Date, days: number, holidays: Array<string | Date> = []): Date {
  const result = startOfDay(start);
  const blocked = holidayKeys(holidays);
  let remaining = Math.max(0, Math.floor(days));
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6 && !blocked.has(dateKey(result))) remaining -= 1;
  }
  return result;
}

export function businessDaysBetween(start: string | Date, end: string | Date, holidays: Array<string | Date> = []): number {
  const cursor = startOfDay(start);
  const finish = startOfDay(end);
  const blocked = holidayKeys(holidays);
  let count = 0;
  while (cursor < finish) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6 && !blocked.has(dateKey(cursor))) count += 1;
  }
  return count;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

export function getTurnaroundMessage({ status, submittedAt, slaBusinessDays = 3, holidays = [], now = new Date() }:
  Pick<KycResubmissionTimelineProps, 'status' | 'submittedAt' | 'slaBusinessDays' | 'holidays' | 'now'>) {
  const today = startOfDay(now);
  const deadline = addBusinessDays(submittedAt, slaBusinessDays, holidays);
  const overdue = status !== 'decision' && status !== 'canceled' && today > deadline;
  const remaining = Math.max(0, businessDaysBetween(today, deadline, holidays));

  if (status === 'decision') return { deadline, overdue: false, message: 'Review complete. Your decision is ready.' };
  if (status === 'canceled') return { deadline, overdue: false, message: 'This application was canceled. No further review will take place.' };
  if (overdue) {
    const days = businessDaysBetween(deadline, today, holidays);
    return { deadline, overdue: true, message: `Review is ${days} business ${days === 1 ? 'day' : 'days'} overdue.` };
  }

  const timing = remaining === 0 ? 'We expect an update today.' :
    `We expect an update within ${remaining} business ${remaining === 1 ? 'day' : 'days'}, by ${formatDate(deadline)}.`;
  const calendarNote = !isBusinessDay(today, holidays) ?
    ' Weekends and listed holidays do not count toward review time.' :
    ' Business days exclude weekends and listed holidays.';
  return { deadline, overdue: false, message: `${timing}${calendarNote}` };
}

export const KycResubmissionTimeline: React.FC<KycResubmissionTimelineProps> = ({
  status, submittedAt, reviewStartedAt, decidedAt, decisionLabel = 'Approved', slaBusinessDays = 3,
  holidays = [], now = new Date(), escalationHref = '/support?topic=kyc-review',
}) => {
  const currentIndex = status === 'submitted' ? 0 : status === 'under-review' ? 1 : 2;
  const turnaround = getTurnaroundMessage({ status, submittedAt, slaBusinessDays, holidays, now });
  const steps = [
    { label: 'Submitted', description: 'We received your updated documents.', date: submittedAt },
    { label: 'Under review', description: 'Our compliance team checks your information.', date: reviewStartedAt },
    { label: status === 'canceled' ? 'Canceled' : decisionLabel === 'Approved' ? 'Decision' : decisionLabel,
      description: status === 'canceled' ? 'The application will not be reviewed.' : 'We’ll notify you as soon as the review is complete.', date: decidedAt },
  ];

  return (
    <section className={`kyc-resubmission${turnaround.overdue ? ' kyc-resubmission--overdue' : ''}`} aria-labelledby="kyc-resubmission-title">
      <div className="kyc-resubmission__header">
        <div><p className="kyc-resubmission__eyebrow">Identity verification</p><h2 id="kyc-resubmission-title">Your resubmission progress</h2></div>
        <span className="kyc-resubmission__status">{status === 'canceled' ? 'Canceled' : steps[currentIndex].label}</span>
      </div>
      <ol className="kyc-resubmission__timeline" aria-label="KYC resubmission progress">
        {steps.map((step, index) => {
          const complete = status !== 'canceled' && index < currentIndex;
          const current = index === currentIndex;
          const canceled = status === 'canceled' && index === 2;
          const state = complete ? 'complete' : canceled ? 'canceled' : current ? 'current' : 'upcoming';
          const Icon = complete ? Check : canceled ? X : current ? Clock3 : Circle;
          return (
            <li key={step.label} className={`kyc-resubmission__step kyc-resubmission__step--${state}`} aria-current={current ? 'step' : undefined}>
              <span className="kyc-resubmission__node" aria-hidden="true"><Icon size={18} /></span>
              <div className="kyc-resubmission__step-copy">
                <span className="kyc-resubmission__step-label">{step.label}</span>
                <span className="sr-only"> — {state === 'complete' ? 'completed' : state === 'upcoming' ? 'not started' : state}</span>
                <span className="kyc-resubmission__step-description">{step.description}</span>
                {step.date && <time dateTime={toDate(step.date).toISOString()}>{formatDate(toDate(step.date))}</time>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="kyc-resubmission__turnaround" role="status">
        <AlertCircle size={20} aria-hidden="true" />
        <div><strong>{turnaround.overdue ? 'Review taking longer than expected' : 'Expected turnaround'}</strong>
          <p>{turnaround.message} Our standard review time is {slaBusinessDays} business {slaBusinessDays === 1 ? 'day' : 'days'}.</p>
          {turnaround.overdue && <a href={escalationHref}>Contact support about this review</a>}
        </div>
      </div>
    </section>
  );
};
