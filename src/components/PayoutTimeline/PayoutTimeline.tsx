/**
 * PayoutTimeline — horizontal payout-schedule timeline (Issue #272).
 *
 * RTL mirror pass:
 * - Scrollport uses `dir` inheritance so overflow scrolls toward inline-start
 * - Today marker positioned with `inset-inline-start` (right edge in RTL)
 * - Tooltips prefer the inline-start side ("RTL-first" placement)
 * - ISO / numeric dates render inside LTR bidi isolates
 */

import React, { useEffect, useId, useMemo, useRef } from 'react';
import './PayoutTimeline.css';

export type PayoutEventStatus = 'paid' | 'scheduled' | 'processing' | 'missed';

export interface PayoutEvent {
  id: string;
  /** ISO-8601 date (YYYY-MM-DD) — always displayed LTR */
  date: string;
  label: string;
  amount?: string;
  status: PayoutEventStatus;
  /** Optional longer description shown in the tooltip */
  detail?: string;
}

export interface PayoutTimelineProps {
  events: PayoutEvent[];
  /** ISO date used for the "today" marker; defaults to local today */
  today?: string;
  ariaLabel?: string;
  className?: string;
  /**
   * When true, auto-scrolls so the today marker (or nearest event) is in view
   * after mount. Honours RTL scroll direction via the scrollport `dir`.
   */
  autoScrollToToday?: boolean;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = parseIsoDate(aIso).getTime();
  const b = parseIsoDate(bIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Sort ascending by date (document order = chronological; CSS mirrors in RTL). */
export function sortPayoutEvents(events: PayoutEvent[]): PayoutEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Position of the today marker as a percent along the track [0, 100],
 * based on the span of the (sorted) events. Clamped to the track ends.
 */
export function getTodayMarkerPercent(
  sorted: PayoutEvent[],
  todayIso: string,
): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) {
    const cmp = todayIso.localeCompare(sorted[0].date);
    if (cmp < 0) return 0;
    if (cmp > 0) return 100;
    return 50;
  }
  const start = sorted[0].date;
  const end = sorted[sorted.length - 1].date;
  const span = daysBetween(start, end);
  if (span <= 0) return 50;
  const offset = daysBetween(start, todayIso);
  const pct = (offset / span) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function formatDisplayDate(iso: string, locale = 'en-US'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(parseIsoDate(iso));
  } catch {
    return iso;
  }
}

export function statusLabel(status: PayoutEventStatus): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'scheduled':
      return 'Scheduled';
    case 'processing':
      return 'Processing';
    case 'missed':
      return 'Missed';
    default:
      return status;
  }
}

export const PayoutTimeline: React.FC<PayoutTimelineProps> = ({
  events,
  today,
  ariaLabel = 'Payout schedule timeline',
  className = '',
  autoScrollToToday = true,
}) => {
  const reactId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayIso = today ?? toIsoDate(new Date());

  const sorted = useMemo(() => sortPayoutEvents(events), [events]);
  const todayPercent = useMemo(
    () => getTodayMarkerPercent(sorted, todayIso),
    [sorted, todayIso],
  );

  useEffect(() => {
    if (!autoScrollToToday || !scrollRef.current || todayPercent == null) return;
    const marker = scrollRef.current.querySelector<HTMLElement>(
      '[data-testid="payout-timeline-today"]',
    );
    if (!marker) return;
    // scrollIntoView({ inline }) is direction-aware — correct for LTR and RTL.
    marker.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [autoScrollToToday, todayPercent, sorted.length]);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <section
      className={`payout-timeline ${className}`.trim()}
      aria-label={ariaLabel}
      data-testid="payout-timeline"
    >
      <div
        className="payout-timeline__scroll"
        ref={scrollRef}
        data-testid="payout-timeline-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${ariaLabel} scroll area`}
      >
        <div className="payout-timeline__track" data-testid="payout-timeline-track">
          <ol className="payout-timeline__list">
            {sorted.map((event, index) => {
              const tipId = `${reactId}-tip-${event.id}`;
              const isLast = index === sorted.length - 1;
              return (
                <li
                  key={event.id}
                  className={`payout-timeline__item payout-timeline__item--${event.status}`}
                >
                  <button
                    type="button"
                    className="payout-timeline__marker"
                    aria-describedby={tipId}
                    aria-label={`${event.label}, ${formatDisplayDate(event.date)}, ${statusLabel(event.status)}${
                      event.amount ? `, ${event.amount}` : ''
                    }`}
                  >
                    <span className="payout-timeline__dot" aria-hidden="true" />
                  </button>

                  <div
                    id={tipId}
                    role="tooltip"
                    className="payout-timeline__tooltip"
                  >
                    <span className="payout-timeline__tooltip-date" dir="ltr">
                      {formatDisplayDate(event.date)}
                    </span>
                    <span className="payout-timeline__tooltip-label">{event.label}</span>
                    {event.amount && (
                      <span className="payout-timeline__tooltip-amount" dir="ltr">
                        {event.amount}
                      </span>
                    )}
                    {event.detail && (
                      <span className="payout-timeline__tooltip-detail">{event.detail}</span>
                    )}
                    <span className="payout-timeline__tooltip-status">
                      {statusLabel(event.status)}
                    </span>
                  </div>

                  <span className="payout-timeline__date" dir="ltr">
                    {formatDisplayDate(event.date)}
                  </span>
                  <span className="payout-timeline__label" title={event.label}>
                    {event.label}
                  </span>

                  {!isLast && (
                    <span
                      className={`payout-timeline__connector payout-timeline__connector--${event.status}`}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {todayPercent != null && (
            <div
              className="payout-timeline__today"
              style={{ ['--pt-today' as string]: `${todayPercent}%` }}
              data-testid="payout-timeline-today"
            >
              <span className="payout-timeline__today-line" aria-hidden="true" />
              <span className="payout-timeline__today-label">
                Today{' '}
                <span className="payout-timeline__num" dir="ltr">
                  {formatDisplayDate(todayIso)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

PayoutTimeline.displayName = 'PayoutTimeline';
