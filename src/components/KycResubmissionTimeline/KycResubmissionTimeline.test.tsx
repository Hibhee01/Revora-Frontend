import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { addBusinessDays, businessDaysBetween, getTurnaroundMessage, isBusinessDay, KycResubmissionTimeline } from './KycResubmissionTimeline';

expect.extend(toHaveNoViolations);

describe('KYC business-day calculations', () => {
  it('skips weekends and supplied holidays', () => {
    const deadline = addBusinessDays('2026-07-24T10:00:00', 3, ['2026-07-27']);
    expect([deadline.getFullYear(), deadline.getMonth(), deadline.getDate()]).toEqual([2026, 6, 30]);
    expect(businessDaysBetween('2026-07-24', deadline, ['2026-07-27'])).toBe(3);
    expect(isBusinessDay(new Date(2026, 6, 25))).toBe(false);
    expect(isBusinessDay(new Date(2026, 6, 27), ['2026-07-27'])).toBe(false);
    expect(isBusinessDay(new Date(2026, 6, 28), ['2026-07-27'])).toBe(true);
  });

  it('normalizes SLA values and rejects invalid dates', () => {
    expect(addBusinessDays('2026-07-24', -2)).toEqual(new Date(2026, 6, 24));
    expect(addBusinessDays('2026-07-24', 1.9)).toEqual(new Date(2026, 6, 27));
    expect(() => addBusinessDays('not-a-date', 3)).toThrow(/invalid date/);
  });

  it('provides every turnaround copy variant', () => {
    expect(getTurnaroundMessage({ status: 'submitted', submittedAt: '2026-07-24', now: '2026-07-25' }).message).toMatch(/Weekends.*do not count/);
    expect(getTurnaroundMessage({ status: 'under-review', submittedAt: '2026-07-24', now: '2026-07-27' }).message).toMatch(/within 2 business days.*Business days exclude/);
    expect(getTurnaroundMessage({ status: 'under-review', submittedAt: '2026-07-24', now: '2026-07-29' }).message).toMatch(/update today/);
    expect(getTurnaroundMessage({ status: 'decision', submittedAt: '2026-07-24', now: '2026-08-01' }).message).toMatch(/decision is ready/);
    expect(getTurnaroundMessage({ status: 'canceled', submittedAt: '2026-07-24', now: '2026-08-01' }).message).toMatch(/canceled/);
    expect(getTurnaroundMessage({ status: 'under-review', submittedAt: '2026-07-24', now: '2026-07-31' }).message).toBe('Review is 2 business days overdue.');
  });
});

describe('KycResubmissionTimeline', () => {
  const baseProps = { submittedAt: '2026-07-24T10:00:00Z', now: '2026-07-27T12:00:00Z' } as const;

  it('announces current progress with semantic structure', () => {
    render(<KycResubmissionTimeline {...baseProps} status="under-review" reviewStartedAt="2026-07-27" />);
    expect(screen.getByRole('list', { name: /KYC resubmission progress/i })).toBeInTheDocument();
    expect(screen.getAllByText('Under review').find((item) => item.closest('li'))?.closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('status')).toHaveTextContent(/standard review time is 3 business days/i);
  });

  it('shows escalation only after the SLA is overdue', () => {
    const { rerender } = render(<KycResubmissionTimeline {...baseProps} status="submitted" />);
    expect(screen.queryByRole('link', { name: /contact support/i })).not.toBeInTheDocument();
    rerender(<KycResubmissionTimeline submittedAt="2026-07-20" now="2026-07-30" status="under-review" escalationHref="/help/kyc" />);
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute('href', '/help/kyc');
  });

  it('renders decision and canceled terminal states', () => {
    const { rerender } = render(<KycResubmissionTimeline {...baseProps} status="decision" decidedAt="2026-07-27" decisionLabel="More information needed" />);
    expect(screen.getAllByText('More information needed')).toHaveLength(2);
    rerender(<KycResubmissionTimeline {...baseProps} status="canceled" />);
    expect(screen.getAllByText('Canceled')).toHaveLength(2);
    expect(screen.getByText(/No further review will take place/)).toBeInTheDocument();
  });

  it('has no detectable axe violations', async () => {
    const { container } = render(<KycResubmissionTimeline {...baseProps} status="under-review" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
