import React, { useMemo } from 'react';
import { EmptyState } from '../components/designSystem/EmptyState';
import {
  PayoutTimeline,
  toIsoDate,
  type PayoutEvent,
} from '../components/PayoutTimeline';

/**
 * Demo schedule used until live payout APIs are wired.
 * Chronological document order; CSS mirrors under dir="rtl".
 */
export function buildDemoPayoutEvents(todayIso: string): PayoutEvent[] {
  const today = new Date(`${todayIso}T12:00:00`);
  const shift = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return toIsoDate(d);
  };

  return [
    {
      id: 'p1',
      date: shift(-90),
      label: 'Q1 RevenueShare',
      amount: '$12,400',
      status: 'paid',
      detail: 'Settled on-chain',
    },
    {
      id: 'p2',
      date: shift(-45),
      label: 'Q2 Interim',
      amount: '$8,250',
      status: 'paid',
    },
    {
      id: 'p3',
      date: shift(-7),
      label: 'Processing cycle',
      amount: '$9,100',
      status: 'processing',
      detail: 'Awaiting final attestation',
    },
    {
      id: 'p4',
      date: shift(14),
      label: 'Next distribution',
      amount: '$10,000',
      status: 'scheduled',
    },
    {
      id: 'p5',
      date: shift(60),
      label: 'Q3 estimate',
      amount: '$11,500',
      status: 'scheduled',
    },
    {
      id: 'p6',
      date: shift(120),
      label: 'Long-horizon reserve',
      amount: '$15,000',
      status: 'scheduled',
      detail: 'Extended duration milestone',
    },
  ];
}

export interface PayoutScheduleProps {
  /** Inject events for tests; omit to use demo data */
  events?: PayoutEvent[];
  /** Empty schedule forces the empty state */
  empty?: boolean;
  today?: string;
}

export const PayoutSchedule: React.FC<PayoutScheduleProps> = ({
  events,
  empty = false,
  today,
}) => {
  const todayIso = today ?? toIsoDate(new Date());
  const resolved = useMemo(() => {
    if (empty) return [] as PayoutEvent[];
    if (events) return events;
    return buildDemoPayoutEvents(todayIso);
  }, [empty, events, todayIso]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payout Schedule</h1>
        <p className="text-muted text-sm mt-1">
          View upcoming and past RevenueShare payout dates.
        </p>
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          variant="payout-schedule"
          title="No payouts scheduled"
          description="Payouts will appear here once revenue is reported and the distribution cycle begins."
          primaryAction={{
            label: 'Report Revenue',
            href: '/startup/report-revenue',
          }}
          secondaryAction={{
            label: 'Learn How It Works',
            href: '/',
          }}
        />
      ) : (
        <PayoutTimeline
          events={resolved}
          today={todayIso}
          ariaLabel="RevenueShare payout schedule"
          autoScrollToToday
        />
      )}
    </div>
  );
};
