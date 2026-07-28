import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  PayoutTimeline,
  daysBetween,
  formatDisplayDate,
  getTodayMarkerPercent,
  parseIsoDate,
  sortPayoutEvents,
  statusLabel,
  toIsoDate,
  type PayoutEvent,
} from './PayoutTimeline';

expect.extend(toHaveNoViolations);

const EVENTS: PayoutEvent[] = [
  { id: 'a', date: '2026-01-01', label: 'Start', amount: '$1', status: 'paid' },
  { id: 'b', date: '2026-03-01', label: 'Mid', amount: '$2', status: 'processing', detail: 'Working' },
  { id: 'c', date: '2026-06-01', label: 'End تقدير', status: 'scheduled' },
];

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('payout timeline helpers', () => {
  it('formats and parses ISO dates', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(parseIsoDate('2026-02-10').getDate()).toBe(10);
    expect(formatDisplayDate('2026-01-15')).toMatch(/2026/);
    expect(formatDisplayDate('not-a-date')).toBeTruthy();
  });

  it('computes day spans and sorts events', () => {
    expect(daysBetween('2026-01-01', '2026-01-11')).toBe(10);
    const sorted = sortPayoutEvents([EVENTS[2], EVENTS[0], EVENTS[1]]);
    expect(sorted.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('places the today marker across the track', () => {
    expect(getTodayMarkerPercent([], '2026-01-01')).toBeNull();
    expect(getTodayMarkerPercent([EVENTS[0]], '2025-12-01')).toBe(0);
    expect(getTodayMarkerPercent([EVENTS[0]], '2026-02-01')).toBe(100);
    expect(getTodayMarkerPercent([EVENTS[0]], '2026-01-01')).toBe(50);
    expect(getTodayMarkerPercent(EVENTS, '2026-01-01')).toBe(0);
    expect(getTodayMarkerPercent(EVENTS, '2026-06-01')).toBe(100);
    const mid = getTodayMarkerPercent(EVENTS, '2026-03-01');
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    expect(getTodayMarkerPercent(
      [
        { id: 'x', date: '2026-01-01', label: 'A', status: 'paid' },
        { id: 'y', date: '2026-01-01', label: 'B', status: 'paid' },
      ],
      '2026-01-01',
    )).toBe(50);
  });

  it('maps status labels', () => {
    expect(statusLabel('paid')).toBe('Paid');
    expect(statusLabel('scheduled')).toBe('Scheduled');
    expect(statusLabel('processing')).toBe('Processing');
    expect(statusLabel('missed')).toBe('Missed');
    expect(statusLabel('pending' as PayoutEvent['status'])).toBe('pending');
  });

  it('parseIsoDate defaults missing month and day', () => {
    expect(parseIsoDate('2026').getFullYear()).toBe(2026);
    expect(parseIsoDate('2026-03').getMonth()).toBe(2);
  });
});

describe('PayoutTimeline', () => {
  it('renders nothing when there are no events', () => {
    const { container } = render(<PayoutTimeline events={[]} />);
    expect(container.querySelector('[data-testid="payout-timeline"]')).toBeNull();
  });

  it('renders a labelled timeline with LTR-isolated dates', () => {
    render(
      <div dir="ltr">
        <PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />
      </div>,
    );
    expect(
      screen.getByRole('region', { name: /payout schedule timeline scroll area/i }),
    ).toBeInTheDocument();
    const dates = document.querySelectorAll('.payout-timeline__date');
    expect(dates.length).toBe(3);
    dates.forEach((node) => expect(node).toHaveAttribute('dir', 'ltr'));
  });

  it('keeps chronological document order under dir=rtl', () => {
    const { container } = render(
      <div dir="rtl">
        <PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />
      </div>,
    );
    const labels = Array.from(container.querySelectorAll('.payout-timeline__label')).map(
      (n) => n.textContent,
    );
    expect(labels[0]).toBe('Start');
    expect(labels[1]).toBe('Mid');
    expect(labels[2]).toContain('End');
  });

  it('positions the today marker via CSS custom property', () => {
    render(
      <PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />,
    );
    const today = screen.getByTestId('payout-timeline-today');
    expect(today.style.getPropertyValue('--pt-today')).toMatch(/%$/);
    expect(within(today).getByText(/today/i)).toBeInTheDocument();
  });

  it('auto-scrolls to today on mount (RTL-aware scrollIntoView)', () => {
    render(
      <div dir="rtl">
        <PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday />
      </div>,
    );
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('uses smooth scroll when reduced motion is not preferred', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    render(<PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' }),
    );
  });

  it('does not scroll when the today marker is absent from the DOM', () => {
    vi.spyOn(Element.prototype, 'querySelector').mockReturnValue(null);
    render(<PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('exposes tooltips with amount and detail', () => {
    render(<PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />);
    expect(screen.getByText('Working')).toBeInTheDocument();
    expect(screen.getByText('$2')).toBeInTheDocument();
    expect(screen.getAllByRole('tooltip').length).toBe(3);
  });

  it('marks markers with accessible names including status', () => {
    render(<PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />);
    expect(
      screen.getByRole('button', { name: /start.*paid/i }),
    ).toBeInTheDocument();
  });

  it('side-by-side LTR/RTL smoke panels', () => {
    render(
      <div style={{ display: 'flex', gap: 12 }}>
        <div dir="ltr" data-testid="ltr-panel">
          <PayoutTimeline
            events={EVENTS}
            today="2026-03-01"
            ariaLabel="LTR payouts"
            autoScrollToToday={false}
          />
        </div>
        <div dir="rtl" data-testid="rtl-panel">
          <PayoutTimeline
            events={EVENTS}
            today="2026-03-01"
            ariaLabel="RTL payouts"
            autoScrollToToday={false}
          />
        </div>
      </div>,
    );
    expect(screen.getByTestId('ltr-panel')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByTestId('rtl-panel')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('region', { name: /ltr payouts scroll/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /rtl payouts scroll/i })).toBeInTheDocument();
  });

  it('has no axe violations in LTR', async () => {
    const { container } = render(
      <div dir="ltr">
        <PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in RTL', async () => {
    const { container } = render(
      <div dir="rtl">
        <PayoutTimeline events={EVENTS} today="2026-03-01" autoScrollToToday={false} />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('supports missed status styling class', () => {
    const { container } = render(
      <PayoutTimeline
        events={[{ id: 'm', date: '2026-01-01', label: 'Missed', status: 'missed' }]}
        today="2026-01-01"
        autoScrollToToday={false}
      />,
    );
    expect(container.querySelector('.payout-timeline__item--missed')).toBeTruthy();
  });
});
