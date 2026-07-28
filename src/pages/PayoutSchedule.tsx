/**
 * Payout Schedule with per-payout status pills (Issue #221).
 *
 * Status pills use labeled icons + accessible tooltips so colour is never the
 * only cue. See docs/uiux/ux221-payout-status-pills.md.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import {
  PayoutStatusPill,
  type PayoutStatus,
  PAYOUT_STATUS_ORDER,
} from '../components/PayoutStatusPill';
import '../components/PayoutStatusPill/PayoutStatusPill.css';

export interface PayoutRow {
  id: string;
  recipient: string;
  amount: string;
  scheduledFor: string;
  status: PayoutStatus;
  detail?: string;
}

export const DEMO_PAYOUTS: PayoutRow[] = [
  {
    id: 'p1',
    recipient: 'maria.chen@revora.io',
    amount: 'USDC 1,240.00',
    scheduledFor: '2026-08-01',
    status: 'scheduled',
  },
  {
    id: 'p2',
    recipient: 'j.okafor@revora.io',
    amount: 'USDC 860.50',
    scheduledFor: '2026-07-28',
    status: 'preparing',
  },
  {
    id: 'p3',
    recipient: 'techflow-treasury',
    amount: 'USDC 4,100.00',
    scheduledFor: '2026-07-27',
    status: 'sending',
  },
  {
    id: 'p4',
    recipient: 'nexus-pay-ops',
    amount: 'USDC 2,050.00',
    scheduledFor: '2026-07-20',
    status: 'confirmed',
    detail: 'Ledger #4821',
  },
  {
    id: 'p5',
    recipient: 'quantum-ledger',
    amount: 'USDC 990.00',
    scheduledFor: '2026-07-26',
    status: 'retrying',
  },
  {
    id: 'p6',
    recipient: 'dormant-wallet',
    amount: 'USDC 125.00',
    scheduledFor: '2026-07-15',
    status: 'failed',
  },
  {
    id: 'p7',
    recipient: 'canceled-batch',
    amount: 'USDC 500.00',
    scheduledFor: '2026-07-10',
    status: 'canceled',
  },
];

export interface PayoutScheduleProps {
  payouts?: PayoutRow[];
  /** When true, render the empty state instead of the schedule table. */
  empty?: boolean;
}

export const PayoutSchedule: React.FC<PayoutScheduleProps> = ({
  payouts = DEMO_PAYOUTS,
  empty = false,
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payout Schedule</h1>
        <p className="text-muted text-sm mt-1">
          View upcoming and past RevenueShare payout dates.
        </p>
      </div>

      {empty || payouts.length === 0 ? (
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
        <>
          {/* Legend: full-variant pills documenting the canonical set */}
          <section
            className="psp-legend glass-card"
            aria-labelledby="psp-legend-heading"
            data-testid="payout-status-legend"
          >
            <h2 id="psp-legend-heading" className="psp-legend-title">
              Payout statuses
            </h2>
            <p className="psp-legend-copy text-muted text-sm">
              Each status uses an icon and label — colour is never the only cue.
              Focus a pill or hover to read the full description; press Escape to dismiss the tooltip.
            </p>
            <ul className="psp-legend-list">
              {PAYOUT_STATUS_ORDER.map((status) => (
                <li key={status}>
                  <PayoutStatusPill status={status} variant="full" />
                </li>
              ))}
            </ul>
          </section>

          <div className="psp-schedule glass-card" data-testid="payout-schedule-table">
            <table className="psp-table">
              <caption className="sr-only">
                Scheduled and historical RevenueShare payouts
              </caption>
              <thead>
                <tr>
                  <th scope="col">Recipient</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((row) => (
                  <tr key={row.id} className="psp-table-row" data-testid={`payout-row-${row.id}`}>
                    <td>{row.recipient}</td>
                    <td>{row.amount}</td>
                    <td>
                      <time dateTime={row.scheduledFor}>{row.scheduledFor}</time>
                    </td>
                    <td>
                      <PayoutStatusPill
                        status={row.status}
                        variant="compact"
                        detail={row.detail}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-muted text-sm">
        <Link to="/" className="link-styled">Back to Home</Link>
      </p>
    </div>
  );
};
