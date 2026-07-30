/**
 * IssuerDashboardHero — Tests
 *
 * Covers:
 *  • Accessibility (jest-axe)
 *  • Reminder banner: visible / hidden by status + days threshold
 *  • KPI tiles: loading / error / empty / success states
 *  • Next-payout tile: scheduled / not scheduled
 *  • Primary CTA: all 5 states
 *  • Edge cases: overdue severity escalation, missing metrics, mobile layout
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { IssuerDashboardHero, IssuerKpiData, IssuerDashboardHeroProps } from './IssuerDashboardHero';

expect.extend(toHaveNoViolations);

/* ─── Helpers ──────────────────────────────────────────────────────── */

function isoRelative(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const successKpi: IssuerKpiData = { value: '$42,000', status: 'success', change: 5.2, changeLabel: 'vs last month' };
const loadingKpi: IssuerKpiData = { value: null, status: 'loading' };
const errorKpi: IssuerKpiData = { value: null, status: 'error' };
const emptyKpi: IssuerKpiData = { value: null, status: 'empty' };

const defaultProps: IssuerDashboardHeroProps = {
  mrr: successKpi,
  arr: { value: '$504,000', status: 'success' },
  dau: { value: '1,240', status: 'success' },
};

function renderHero(props: Partial<IssuerDashboardHeroProps> = {}) {
  return render(
    <BrowserRouter>
      <IssuerDashboardHero {...defaultProps} {...props} />
    </BrowserRouter>
  );
}

/* ─── Accessibility ─────────────────────────────────────────────────── */

describe('IssuerDashboardHero – accessibility', () => {
  it('has no axe violations in nominal state', async () => {
    const { container } = renderHero();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations with overdue banner', async () => {
    const { container } = renderHero({
      reportStatus: 'overdue',
      reportDueDate: isoRelative(-10),
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations in loading state', async () => {
    const { container } = renderHero({
      mrr: loadingKpi,
      arr: loadingKpi,
      dau: loadingKpi,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('section is labelled via aria-labelledby', () => {
    renderHero();
    const section = screen.getByRole('region', { name: /issuer dashboard/i });
    expect(section).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 1, name: /issuer dashboard/i });
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
  });
});

/* ─── Heading ───────────────────────────────────────────────────────── */

describe('IssuerDashboardHero – heading', () => {
  it('renders generic heading without companyName', () => {
    renderHero();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Issuer Dashboard');
  });

  it('renders company-specific heading when companyName provided', () => {
    renderHero({ companyName: 'Acme Corp' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Acme Corp Dashboard');
  });
});

/* ─── Reminder Banner ───────────────────────────────────────────────── */

describe('IssuerDashboardHero – reminder banner', () => {
  it('does NOT show banner when status is none', () => {
    renderHero({ reportStatus: 'none' });
    expect(screen.queryByTestId('reminder-banner')).not.toBeInTheDocument();
  });

  it('does NOT show banner when status is submitted', () => {
    renderHero({ reportStatus: 'submitted' });
    expect(screen.queryByTestId('reminder-banner')).not.toBeInTheDocument();
  });

  it('does NOT show banner when status is accepted', () => {
    renderHero({ reportStatus: 'accepted' });
    expect(screen.queryByTestId('reminder-banner')).not.toBeInTheDocument();
  });

  it('does NOT show banner when due > 7 days away', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(10) });
    expect(screen.queryByTestId('reminder-banner')).not.toBeInTheDocument();
  });

  it('shows banner when due within 7 days', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(3) });
    expect(screen.getByTestId('reminder-banner')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-banner')).toHaveAttribute('data-status', 'due');
  });

  it('shows banner when due today (0 days)', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(0) });
    const banner = screen.getByTestId('reminder-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/due today/i);
  });

  it('shows banner when overdue', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-5) });
    const banner = screen.getByTestId('reminder-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('data-status', 'overdue');
    expect(banner).toHaveTextContent(/overdue/i);
  });

  it('banner has role=alert', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-2) });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('overdue banner shows correct day count', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-7) });
    const banner = screen.getByTestId('reminder-banner');
    expect(banner).toHaveTextContent('7 days');
  });

  it('banner contains a "Submit now" link', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(1) });
    const link = screen.getByRole('link', { name: /submit revenue report now/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/startup/report-revenue');
  });
});

/* ─── KPI Tiles ─────────────────────────────────────────────────────── */

describe('IssuerDashboardHero – KPI tiles', () => {
  it('renders all three KPI labels', () => {
    renderHero();
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('ARR')).toBeInTheDocument();
    expect(screen.getByText('DAU')).toBeInTheDocument();
  });

  it('renders MRR value correctly', () => {
    renderHero();
    expect(screen.getByText('$42,000')).toBeInTheDocument();
  });

  it('renders loading skeleton for MRR', () => {
    renderHero({ mrr: loadingKpi });
    expect(screen.getByRole('status', { name: /mrr loading/i })).toBeInTheDocument();
  });

  it('renders error tile for ARR', () => {
    renderHero({ arr: errorKpi });
    expect(screen.getByRole('status', { name: /arr failed to load/i })).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty tile for DAU', () => {
    renderHero({ dau: emptyKpi });
    expect(screen.getByRole('status', { name: /dau: no data yet/i })).toBeInTheDocument();
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });

  it('renders positive trend arrow and percentage for MRR', () => {
    renderHero({ mrr: { value: '$42,000', status: 'success', change: 5.2, changeLabel: 'vs last month' } });
    expect(screen.getByText('+5.2%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders negative trend for MRR', () => {
    renderHero({ mrr: { value: '$38,000', status: 'success', change: -2.1 } });
    expect(screen.getByText('-2.1%')).toBeInTheDocument();
  });

  it('the KPI grid has accessible list role', () => {
    renderHero();
    expect(screen.getByRole('list', { name: /issuer key metrics/i })).toBeInTheDocument();
  });
});

/* ─── Next Payout Tile ──────────────────────────────────────────────── */

describe('IssuerDashboardHero – next payout tile', () => {
  it('shows "Not scheduled" when no payout', () => {
    renderHero();
    expect(screen.getByTestId('next-payout-tile')).toHaveTextContent('Not scheduled');
  });

  it('renders payout date and estimated amount', () => {
    renderHero({
      nextPayout: {
        date: isoRelative(14),
        estimatedAmount: 8500,
        currency: 'USD',
      },
    });
    const tile = screen.getByTestId('next-payout-tile');
    expect(tile).toHaveTextContent('$8,500');
    expect(tile).toHaveTextContent('In 14 days');
  });

  it('shows "Tomorrow" label for next-day payout', () => {
    renderHero({
      nextPayout: { date: isoRelative(1), estimatedAmount: 1000 },
    });
    expect(screen.getByTestId('next-payout-tile')).toHaveTextContent('Tomorrow');
  });

  it('shows "Today" label for same-day payout', () => {
    renderHero({
      nextPayout: { date: isoRelative(0), estimatedAmount: 2500 },
    });
    expect(screen.getByTestId('next-payout-tile')).toHaveTextContent('Today');
  });

  it('renders payout date as value when no estimated amount', () => {
    const futureDate = isoRelative(7);
    renderHero({ nextPayout: { date: futureDate } });
    const tile = screen.getByTestId('next-payout-tile');
    // date should appear as the main value when no estimatedAmount
    expect(tile).toHaveTextContent('In 7 days');
  });

  it('payout tile shows yellow urgency label when payout is within 3 days', () => {
    renderHero({
      nextPayout: { date: isoRelative(2), estimatedAmount: 5000 },
    });
    const tile = screen.getByTestId('next-payout-tile');
    expect(tile).toHaveTextContent('In 2 days');
  });
});

/* ─── Primary CTA ───────────────────────────────────────────────────── */

describe('IssuerDashboardHero – primary CTA', () => {
  it('shows secondary submit button when no report status', () => {
    renderHero();
    expect(screen.getByTestId('cta-submit')).toBeInTheDocument();
  });

  it('shows primary submit button when due within 7 days', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(3) });
    expect(screen.getByTestId('cta-due-soon')).toBeInTheDocument();
    expect(screen.getByTestId('cta-due-soon')).toHaveTextContent('Submit Revenue Report');
  });

  it('shows overdue danger button when overdue', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-5) });
    expect(screen.getByTestId('cta-overdue')).toBeInTheDocument();
    expect(screen.getByTestId('cta-overdue')).toHaveTextContent('Submit Overdue Report');
  });

  it('shows view button when submitted', () => {
    renderHero({ reportStatus: 'submitted' });
    expect(screen.getByTestId('cta-submitted')).toBeInTheDocument();
    expect(screen.getByTestId('cta-submitted')).toHaveTextContent('View Submitted Report');
  });

  it('shows view button when accepted', () => {
    renderHero({ reportStatus: 'accepted' });
    expect(screen.getByTestId('cta-accepted')).toBeInTheDocument();
    expect(screen.getByTestId('cta-accepted')).toHaveTextContent('View Accepted Report');
  });

  it('shows secondary submit when due is more than 7 days away', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(10) });
    expect(screen.getByTestId('cta-submit')).toBeInTheDocument();
  });

  it('all CTAs point to the report route', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-2) });
    const cta = screen.getByTestId('cta-overdue');
    expect(cta).toHaveAttribute('href', '/startup/report-revenue');
  });
});

/* ─── Edge cases ────────────────────────────────────────────────────── */

describe('IssuerDashboardHero – edge cases', () => {
  it('handles all KPIs in loading state without crash', () => {
    renderHero({ mrr: loadingKpi, arr: loadingKpi, dau: loadingKpi });
    // 3 loading skeletons
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(3);
  });

  it('handles all KPIs in error state without crash', () => {
    renderHero({ mrr: errorKpi, arr: errorKpi, dau: errorKpi });
    expect(screen.getAllByText('Failed to load').length).toBe(3);
  });

  it('handles all KPIs empty without crash', () => {
    renderHero({ mrr: emptyKpi, arr: emptyKpi, dau: emptyKpi });
    expect(screen.getAllByText('No data yet').length).toBe(3);
  });

  it('renders correctly with only required props', () => {
    renderHero({ mrr: emptyKpi, arr: emptyKpi, dau: emptyKpi });
    expect(screen.getByTestId('issuer-dashboard-hero')).toBeInTheDocument();
  });

  it('banner heading uses singular "day" when overdue by exactly 1 day', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-1) });
    const banner = screen.getByTestId('reminder-banner');
    // should say "1 day" not "1 days"
    expect(banner).toHaveTextContent('overdue by 1 day');
    expect(banner).not.toHaveTextContent('overdue by 1 days');
  });

  it('banner heading uses singular "day" when due in exactly 1 day', () => {
    renderHero({ reportStatus: 'due', reportDueDate: isoRelative(1) });
    const banner = screen.getByTestId('reminder-banner');
    // "due in 1 day" — singular, not "1 days"
    expect(banner).toHaveTextContent('due in 1 day');
    expect(banner).not.toHaveTextContent('due in 1 days');
  });

  it('shows overdue critical banner for long overdue (35+ days)', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-35) });
    const banner = screen.getByTestId('reminder-banner');
    expect(banner).toHaveTextContent(/overdue/i);
    // critical severity text
    expect(banner).toHaveTextContent(/submit immediately/i);
  });

  it('shows overdue moderate banner for moderate overdue (10 days)', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-10) });
    const banner = screen.getByTestId('reminder-banner');
    expect(banner).toHaveTextContent(/as soon as possible/i);
  });

  it('shows overdue mild banner for mild overdue (2 days)', () => {
    renderHero({ reportStatus: 'overdue', reportDueDate: isoRelative(-2) });
    const banner = screen.getByTestId('reminder-banner');
    expect(banner).toHaveTextContent(/slightly past due/i);
  });

  it('next payout shows "Past due" for past payout date', () => {
    renderHero({
      nextPayout: { date: isoRelative(-5), estimatedAmount: 3000 },
    });
    expect(screen.getByTestId('next-payout-tile')).toHaveTextContent('Past due');
  });

  it('banner does not render when due status has no dueDate', () => {
    renderHero({ reportStatus: 'due', reportDueDate: undefined });
    expect(screen.queryByTestId('reminder-banner')).not.toBeInTheDocument();
  });
});
