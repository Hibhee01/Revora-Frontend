/**
 * PayoutSchedule — Gantt-style timeline view with table alternative (Issue #219).
 *
 * Features:
 * - Gantt chart with lane rows per issuer, payout bars with status colours,
 *   today marker, and zoom controls (week/month/quarter)
 * - Accessible table with status pills and tooltips
 * - Hover popovers on gantt bars
 * - WCAG 2.1 AA, responsive, RTL-ready
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Table2, BarChart3 } from 'lucide-react';
import { PayoutStatusPill, PAYOUT_STATUS_ORDER } from '../components/PayoutStatusPill';
import { EmptyState } from '../components/designSystem/EmptyState';
import { CalendarExportDialog } from '../components/CalendarExportDialog';
import { Button } from '../components/Button';

/* ─── Types ─────────────────────────────────────────────────────────── */

export type PayoutData = {
  id: string;
  recipient: string;
  amount: string;
  scheduledFor: string; // ISO date YYYY-MM-DD
  status: string;
};

export type PayoutScheduleProps = {
  /** When true, show the empty state instead of the schedule */
  empty?: boolean;
  /** Payout data. Falls back to DEMO_PAYOUTS. */
  payouts?: PayoutData[];
};

/* ─── Demo Data ─────────────────────────────────────────────────────── */

export const DEMO_PAYOUTS: PayoutData[] = [
  { id: 'p1', recipient: 'Issuer A', amount: 'USDC 12,500', scheduledFor: '2026-07-15', status: 'confirmed' },
  { id: 'p2', recipient: 'Issuer A', amount: 'USDC 12,500', scheduledFor: '2026-08-15', status: 'preparing' },
  { id: 'p3', recipient: 'Issuer B', amount: 'USDC 8,200', scheduledFor: '2026-07-20', status: 'sending' },
  { id: 'p4', recipient: 'Issuer B', amount: 'USDC 8,200', scheduledFor: '2026-08-20', status: 'scheduled' },
  { id: 'p5', recipient: 'Issuer C', amount: 'USDC 5,000', scheduledFor: '2026-07-10', status: 'confirmed' },
  { id: 'p6', recipient: 'Issuer C', amount: 'USDC 5,000', scheduledFor: '2026-07-25', status: 'failed' },
  { id: 'p7', recipient: 'Issuer C', amount: 'USDC 5,000', scheduledFor: '2026-08-10', status: 'retrying' },
  { id: 'p8', recipient: 'Issuer D', amount: 'USDC 3,000', scheduledFor: '2026-07-30', status: 'canceled' },
];

/* ─── Date Helpers ──────────────────────────────────────────────────── */

type ZoomLevel = 'week' | 'month' | 'quarter';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function getRange(payouts: PayoutData[], zoom: ZoomLevel): { start: Date; end: Date; label: string } {
  if (payouts.length === 0) {
    const now = new Date();
    if (zoom === 'week') return { start: getWeekStart(now), end: addDays(getWeekStart(now), 7), label: 'This Week' };
    if (zoom === 'quarter')
      return { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end: addMonths(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1), 0), label: 'This Quarter' };
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: 'This Month' };
  }

  const dates = payouts.map((p) => parseDate(p.scheduledFor));
  let min = new Date(Math.min(...dates.map((d) => d.getTime())));
  let max = new Date(Math.max(...dates.map((d) => d.getTime())));

  if (zoom === 'week') {
    min = getWeekStart(min);
    max = addDays(getWeekStart(max), 7);
  } else if (zoom === 'month') {
    min = new Date(min.getFullYear(), min.getMonth(), 1);
    max = new Date(max.getFullYear(), max.getMonth() + 1, 1);
  } else {
    min = new Date(min.getFullYear(), Math.floor(min.getMonth() / 3) * 3, 1);
    max = new Date(max.getFullYear(), Math.floor(max.getMonth() / 3) * 3 + 3, 1);
  }

  const label = formatDate(min) + ' — ' + formatDate(max);
  return { start: min, end: max, label };
}

/* ─── Gantt Bar ─────────────────────────────────────────────────────── */

function statusBarColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'var(--success, #10b981)';
    case 'preparing':
    case 'sending':
      return 'var(--primary, #3b82f6)';
    case 'scheduled':
      return '#94a3b8';
    case 'retrying':
      return '#f59e0b';
    case 'failed':
      return 'var(--error, #ef4444)';
    case 'canceled':
      return '#64748b';
    default:
      return '#94a3b8';
  }
}

/* ─── Main Component ────────────────────────────────────────────────── */

export const PayoutSchedule: React.FC<PayoutScheduleProps> = ({ empty = false, payouts: payoutsProp }) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showGantt, setShowGantt] = useState(false); // default to table for backward compatibility
  const [zoom, setZoom] = useState<ZoomLevel>('month');

  const payouts = payoutsProp ?? DEMO_PAYOUTS;

  /* ─── Group by issuer for Gantt lanes ─── */
  const lanes = useMemo(() => {
    const map = new Map<string, PayoutData[]>();
    for (const p of payouts) {
      const arr = map.get(p.recipient) ?? [];
      arr.push(p);
      map.set(p.recipient, arr);
    }
    return Array.from(map.entries()).map(([issuer, items]) => ({
      issuer,
      items: items.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    }));
  }, [payouts]);

  /* ─── Time range ─── */
  const range = useMemo(() => getRange(lanes.flatMap((l) => l.items), zoom), [lanes, zoom]);
  const totalDays = daysBetween(range.start, range.end) || 1;

  const todayOffset = daysBetween(range.start, new Date());

  /* ─── Tooltip state for gantt bars ─── */
  const [hoveredPayout, setHoveredPayout] = useState<string | null>(null);

  if (empty) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payout Schedule</h1>
            <p className="text-muted text-sm mt-1">
              View upcoming and past RevenueShare payout dates.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsExportDialogOpen(true)}
            style={{ width: 'auto' }}
          >
            <Calendar size={18} />
            Subscribe
          </Button>
        </div>
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
        <CalendarExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Schedule</h1>
          <p className="text-muted text-sm mt-1">
            View upcoming and past RevenueShare payout dates.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setIsExportDialogOpen(true)}
          style={{ width: 'auto' }}
        >
          <Calendar size={18} />
          Subscribe
        </Button>
      </div>

      {/* View toggle & Zoom controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={showGantt}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showGantt
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-[rgba(148,163,184,0.08)] text-muted border border-transparent'
            }`}
            onClick={() => setShowGantt(true)}
          >
            <BarChart3 size={14} aria-hidden="true" />
            Gantt
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!showGantt}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !showGantt
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-[rgba(148,163,184,0.08)] text-muted border border-transparent'
            }`}
            onClick={() => setShowGantt(false)}
          >
            <Table2 size={14} aria-hidden="true" />
            Table
          </button>
        </div>

        {showGantt && (
          <div className="flex items-center gap-2" role="group" aria-label="Zoom controls">
            {(['week', 'month', 'quarter'] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-all ${
                  zoom === level
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-[rgba(148,163,184,0.08)] text-muted border border-transparent hover:bg-[rgba(148,163,184,0.15)]'
                }`}
                onClick={() => setZoom(level)}
                aria-pressed={zoom === level}
              >
                {level}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Range label - only in Gantt view */}
      {showGantt && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{range.label}</span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" aria-hidden="true" />
            Today
          </div>
        </div>
      )}

      {/* Gantt Chart View (presentational — table alternative below) */}
      {showGantt && (
        <div
          className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] p-4 overflow-x-auto"
          aria-label={`Gantt chart showing payout schedule, ${lanes.length} issuers, ${payouts.length} payouts`}
        >
          <div className="min-w-[600px]">
            {/* Header row: month/week labels */}
            <div className="flex mb-2">
              <div className="w-36 shrink-0 pr-3" aria-hidden="true" />
              <div className="flex-1 relative h-6" aria-hidden="true">
                {zoom === 'month' &&
                  Array.from({ length: Math.min(12, totalDays) }, (_, i) => {
                    const d = addDays(range.start, i * Math.max(1, Math.floor(totalDays / 12)));
                    const isMajor = d.getDate() <= 7;
                    if (!isMajor) return null;
                    return (
                      <div
                        key={i}
                        className="absolute text-[10px] text-muted font-medium"
                        style={{ left: `${(daysBetween(range.start, d) / totalDays) * 100}%`, top: 0 }}
                      >
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    );
                  })}
                {zoom === 'week' &&
                  Array.from({ length: 7 }, (_, i) => {
                    const d = addDays(range.start, i);
                    return (
                      <div
                        key={i}
                        className="absolute text-[10px] text-muted"
                        style={{ left: `${(i / 7) * 100}%`, top: 0 }}
                      >
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    );
                  })}
                {zoom === 'quarter' &&
                  Array.from({ length: 3 }, (_, i) => {
                    const d = addMonths(range.start, i);
                    return (
                      <div
                        key={i}
                        className="absolute text-[10px] text-muted font-medium"
                        style={{ left: `${(daysBetween(range.start, d) / totalDays) * 100}%`, top: 0 }}
                      >
                        {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Gantt lanes */}
            {lanes.map((lane) => (
              <div key={lane.issuer} className="flex items-center mb-3 last:mb-0">
                {/* Lane label */}
                <div className="w-36 shrink-0 pr-3 flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-main truncate" title={lane.issuer}>
                    {lane.issuer}
                  </span>
                  <span className="text-[10px] text-muted whitespace-nowrap">
                    {lane.items.length}
                  </span>
                </div>

                {/* Bar track */}
                <div className="flex-1 relative h-8 rounded-md bg-[rgba(2,6,23,0.4)] border border-[rgba(148,163,184,0.06)]">
                  {/* Today marker */}
                  {todayOffset >= 0 && todayOffset <= totalDays && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10 pointer-events-none"
                      style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                      aria-hidden="true"
                    >
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                  )}

                  {/* Payout bars */}
                  {lane.items.map((item) => {
                    const itemDate = parseDate(item.scheduledFor);
                    const offset = daysBetween(range.start, itemDate);
                    const pct = (offset / totalDays) * 100;
                    const color = statusBarColor(item.status);
                    const isFailedOrCanceled = item.status === 'failed' || item.status === 'canceled';
                    const isHovered = hoveredPayout === item.id;

                    return (
                      <div
                        key={item.id}
                        className="absolute rounded-sm transition-all duration-150 cursor-default"
                        style={{
                          left: `${Math.max(0, pct)}%`,
                          width: `${Math.max(2, 100 / totalDays)}%`,
                          top: '25%',
                          height: '50%',
                          minWidth: 4,
                          backgroundColor: color,
                          opacity: isHovered ? 1 : 0.8,
                          ...(isFailedOrCanceled
                            ? {
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 6px), ${color}`,
                              }
                            : {}),
                        }}
                        title={`${lane.issuer}: ${item.amount} — ${item.scheduledFor} — ${item.status}`}
                        onMouseEnter={() => setHoveredPayout(item.id)}
                        onMouseLeave={() => setHoveredPayout(null)}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none"
                            role="tooltip"
                          >
                            <div className="bg-[#0f172a] border border-[rgba(148,163,184,0.2)] rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl">
                              <div className="font-semibold text-text-main">{lane.issuer}</div>
                              <div className="text-muted mt-0.5">{item.amount}</div>
                              <div className="text-muted">{item.scheduledFor}</div>
                              <div className="mt-0.5">
                                <PayoutStatusPill status={item.status} variant="compact" showTooltip={false} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Gantt pattern key */}
          <div className="mt-4 pt-3 border-t border-[rgba(148,163,184,0.1)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted">Pattern key:</span>
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px), #64748b' }}
                />
                Failed / Canceled
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <span className="inline-block w-2 h-0.5 rounded bg-primary/60" />
                Today marker
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table View (accessible fallback, also shown by default) */}
      {!showGantt && (
        <div
          className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] overflow-x-auto"
          data-testid="payout-schedule-table"
        >
          <table className="psp-table w-full">
            <thead>
              <tr>
                <th scope="col">Recipient</th>
                <th scope="col">Amount</th>
                <th scope="col">Scheduled For</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {lanes.flatMap((lane) =>
                lane.items.map((item) => (
                  <tr key={item.id} className="psp-table-row" data-testid={`payout-row-${item.id}`}>
                    <td className="font-medium text-text-main">{item.recipient}</td>
                    <td className="text-muted">{item.amount}</td>
                    <td className="text-muted">{item.scheduledFor}</td>
                    <td>
                      <PayoutStatusPill status={item.status} variant="compact" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Legend (always visible, full variant pills) */}
      <div
        className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.35)] p-4"
        data-testid="payout-status-legend"
      >
        <h2 className="text-sm font-semibold text-text-main mb-2">Status Legend</h2>
        <p className="text-xs text-muted mb-3 max-w-lg">
          Payouts move through these lifecycle stages. Each status has a distinct icon,
          label, and colour so meaning is never conveyed by colour alone.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Payout status definitions">
          {PAYOUT_STATUS_ORDER.map((status) => (
            <li key={status}>
              <PayoutStatusPill status={status} variant="full" />
            </li>
          ))}
        </ul>
      </div>

      <CalendarExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
};

export default PayoutSchedule;
