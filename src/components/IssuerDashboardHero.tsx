/**
 * IssuerDashboardHero — Issue: Issuer Dashboard Hero
 *
 * Displays:
 *  • Reporting reminder banner (shown when a report is due within 7 days or overdue)
 *  • Next-payout tile
 *  • KPI tiles: MRR, ARR, DAU
 *  • Primary "Submit Revenue Report" CTA (conditional on report status)
 *
 * Accessibility: WCAG 2.1 AA — role/aria-live on banner, sr-only labels,
 * focus-ring on all interactive elements, reduced-motion safe animations.
 *
 * Responsive: single column → 2 → 4 columns for KPI grid.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Users,
  CalendarClock,
  ArrowRight,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { Button } from './Button';
import {
  ReportStatus,
  getOverdueDays,
  getOverdueSeverity,
} from './RevenueReportingCalendar.types';

/* ─── Public Types ──────────────────────────────────────────────────── */

export type KpiStatus = 'loading' | 'error' | 'empty' | 'success';

export interface IssuerKpiData {
  /** Display value (formatted string shown in the tile) */
  value?: string | null;
  /** Percentage change vs prior period — positive = up, negative = down */
  change?: number;
  /** Human-readable change label, e.g. "vs last month" */
  changeLabel?: string;
  /** Tile load state */
  status: KpiStatus;
}

export interface NextPayout {
  /** ISO date string of the upcoming payout */
  date: string;
  /** Estimated payout amount in USD cents (or the display currency) */
  estimatedAmount?: number;
  /** Currency code, default USD */
  currency?: string;
}

export interface IssuerDashboardHeroProps {
  /** Company / issuer display name shown in the heading */
  companyName?: string;
  /** MRR (Monthly Recurring Revenue) KPI */
  mrr: IssuerKpiData;
  /** ARR (Annual Recurring Revenue) KPI */
  arr: IssuerKpiData;
  /** DAU (Daily Active Users) KPI */
  dau: IssuerKpiData;
  /** Next scheduled payout info — omit if none */
  nextPayout?: NextPayout;
  /** The upcoming or overdue report that drives the banner + CTA */
  reportStatus?: ReportStatus;
  /** ISO due date of the next report — used to calculate days remaining */
  reportDueDate?: string;
  /** Report ID used to build the submit link  */
  reportId?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

const formatCurrency = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents);

function daysUntil(isoDate: string): number {
  const due = new Date(isoDate);
  const now = new Date();
  // Compare calendar days only (drop time component)
  const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueDay - nowDay) / (1000 * 60 * 60 * 24));
}

/* ─── Reminder Banner ───────────────────────────────────────────────── */

interface ReminderBannerProps {
  reportStatus: ReportStatus;
  reportDueDate?: string;
  /** Link to the report submission page */
  submitPath: string;
}

/**
 * Shown when:
 *  • status === 'due'    AND daysUntil(dueDate) <= 7
 *  • status === 'overdue'
 *
 * Hidden when status is 'submitted', 'accepted', or 'none'.
 */
const ReminderBanner: React.FC<ReminderBannerProps> = ({
  reportStatus,
  reportDueDate,
  submitPath,
}) => {
  if (reportStatus === 'submitted' || reportStatus === 'accepted' || reportStatus === 'none') {
    return null;
  }

  // For 'due' status only show when within 7 days
  if (reportStatus === 'due') {
    if (!reportDueDate) return null;
    const days = daysUntil(reportDueDate);
    if (days > 7) return null;
  }

  const isOverdue = reportStatus === 'overdue';

  let overdueDays = 0;
  let overdueSeverity: 'mild' | 'moderate' | 'critical' = 'mild';
  if (isOverdue && reportDueDate) {
    overdueDays = getOverdueDays(reportDueDate);
    overdueSeverity = getOverdueSeverity(overdueDays);
  }

  const dueDays = !isOverdue && reportDueDate ? daysUntil(reportDueDate) : 0;

  // Derive banner appearance from severity / status
  const config = (() => {
    if (isOverdue) {
      if (overdueSeverity === 'critical') {
        return {
          bg: 'bg-[rgba(239,68,68,0.12)]',
          border: 'border-[rgba(239,68,68,0.35)]',
          text: 'text-[#f87171]',
          icon: <AlertTriangle size={18} aria-hidden="true" />,
          ariaLive: 'assertive' as const,
          heading: `Revenue report overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
          body: 'Overdue reports may delay your next investor payout. Submit immediately to stay compliant.',
        };
      }
      if (overdueSeverity === 'moderate') {
        return {
          bg: 'bg-[rgba(245,158,11,0.12)]',
          border: 'border-[rgba(245,158,11,0.35)]',
          text: 'text-[#fbbf24]',
          icon: <AlertTriangle size={18} aria-hidden="true" />,
          ariaLive: 'assertive' as const,
          heading: `Revenue report overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
          body: 'Submit your revenue report as soon as possible to avoid payout delays.',
        };
      }
      // mild
      return {
        bg: 'bg-[rgba(245,158,11,0.08)]',
        border: 'border-[rgba(245,158,11,0.25)]',
        text: 'text-[#fbbf24]',
        icon: <AlertCircle size={18} aria-hidden="true" />,
        ariaLive: 'polite' as const,
        heading: `Revenue report overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
        body: 'Your revenue report is slightly past due. Please submit it soon.',
      };
    }

    // due — within 7 days
    if (dueDays === 0) {
      return {
        bg: 'bg-[rgba(239,68,68,0.08)]',
        border: 'border-[rgba(239,68,68,0.25)]',
        text: 'text-[#f87171]',
        icon: <Clock size={18} aria-hidden="true" />,
        ariaLive: 'assertive' as const,
        heading: 'Revenue report due today',
        body: 'Your revenue report is due today. Submit before midnight to avoid penalties.',
      };
    }
    return {
      bg: 'bg-[rgba(59,130,246,0.08)]',
      border: 'border-[rgba(59,130,246,0.25)]',
      text: 'text-[#60a5fa]',
      icon: <Clock size={18} aria-hidden="true" />,
      ariaLive: 'polite' as const,
      heading: `Revenue report due in ${dueDays} day${dueDays !== 1 ? 's' : ''}`,
      body: `Submit your monthly revenue report before ${
        reportDueDate
          ? new Date(reportDueDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })
          : 'the due date'
      } to keep payouts on schedule.`,
    };
  })();

  return (
    <div
      role="alert"
      aria-live={config.ariaLive}
      aria-atomic="true"
      data-testid="reminder-banner"
      data-status={reportStatus}
      className={`
        flex flex-col sm:flex-row sm:items-center gap-3
        p-4 rounded-lg border
        animate-fade-in
        ${config.bg} ${config.border}
        issuer-hero__banner
      `}
    >
      {/* Icon + text */}
      <div className={`flex items-start gap-3 flex-1 ${config.text}`}>
        <span className="mt-0.5 flex-shrink-0">{config.icon}</span>
        <div>
          <p className="text-sm font-semibold leading-snug">{config.heading}</p>
          <p className="text-sm opacity-80 mt-0.5">{config.body}</p>
        </div>
      </div>

      {/* CTA — same path as primary CTA, but compact */}
      <Link
        to={submitPath}
        className={`
          inline-flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto
          px-3 py-1.5 rounded-lg text-xs font-semibold
          border transition-colors
          focus-ring
          ${config.border} ${config.text}
          bg-white/5 hover:bg-white/10
        `}
        aria-label="Submit revenue report now"
      >
        Submit now <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
};

/* ─── KPI Tile ──────────────────────────────────────────────────────── */

interface KpiTileProps {
  label: string;
  data: IssuerKpiData;
  icon: React.ReactNode;
  'data-testid': string;
}

const KpiTile: React.FC<KpiTileProps> = ({ label, data, icon, 'data-testid': testId }) => {
  /* Loading skeleton */
  if (data.status === 'loading') {
    return (
      <div
        className="glass-card p-5 flex flex-col justify-center animate-pulse min-h-[112px]"
        aria-busy="true"
        aria-label={`${label} loading`}
        data-testid={testId}
        role="status"
      >
        <div className="w-7 h-7 bg-slate-800 rounded-full mb-3" />
        <div className="h-3 bg-slate-800 rounded w-1/2 mb-2" />
        <div className="h-6 bg-slate-800 rounded w-3/4" />
      </div>
    );
  }

  /* Error state */
  if (data.status === 'error') {
    return (
      <div
        className="glass-card p-5 flex flex-col gap-2 min-h-[112px] border-red-500/20 bg-red-500/5"
        data-testid={testId}
        role="status"
        aria-label={`${label} failed to load`}
      >
        <span className="text-error" aria-hidden="true">
          <AlertTriangle size={20} />
        </span>
        <span className="text-xs text-muted uppercase tracking-wide font-medium">{label}</span>
        <span className="text-sm font-medium text-error">Failed to load</span>
      </div>
    );
  }

  /* Empty / no data */
  if (data.status === 'empty' || data.value == null) {
    return (
      <div
        className="glass-card p-5 flex flex-col gap-2 min-h-[112px]"
        data-testid={testId}
        role="status"
        aria-label={`${label}: no data yet`}
      >
        <span className="text-slate-500" aria-hidden="true">{icon}</span>
        <span className="text-xs text-muted uppercase tracking-wide font-medium">{label}</span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <Minus size={16} aria-hidden="true" />
          <span className="text-sm">No data yet</span>
        </span>
      </div>
    );
  }

  /* Success */
  const isUp = data.change !== undefined && data.change >= 0;
  const isDown = data.change !== undefined && data.change < 0;

  return (
    <div
      className="glass-card p-5 flex flex-col justify-between min-h-[112px]"
      data-testid={testId}
    >
      <div>
        <div className="flex items-center gap-2 text-muted mb-2">
          <span className="text-accent" aria-hidden="true">{icon}</span>
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-main" aria-label={`${label}: ${data.value}`}>
          {data.value}
        </div>
      </div>

      {data.change !== undefined && (
        <div
          className={`mt-3 flex items-center gap-1 text-xs font-medium ${isUp ? 'text-success' : 'text-error'}`}
          aria-label={`${data.changeLabel ?? 'Change'}: ${data.change >= 0 ? '+' : ''}${data.change.toFixed(1)}%`}
        >
          {isUp ? (
            <TrendingUp size={13} aria-hidden="true" />
          ) : (
            <TrendingDown size={13} aria-hidden="true" />
          )}
          <span>
            {isUp && !isDown ? '+' : ''}
            {data.change.toFixed(1)}%
          </span>
          {data.changeLabel && (
            <span className="text-muted font-normal">{data.changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Next Payout Tile ──────────────────────────────────────────────── */

interface NextPayoutTileProps {
  payout?: NextPayout;
}

const NextPayoutTile: React.FC<NextPayoutTileProps> = ({ payout }) => {
  if (!payout) {
    return (
      <div
        className="glass-card p-5 flex flex-col gap-2 min-h-[112px]"
        data-testid="next-payout-tile"
        aria-label="Next payout: no payout scheduled"
      >
        <span className="text-slate-500" aria-hidden="true">
          <CalendarClock size={20} />
        </span>
        <span className="text-xs text-muted uppercase tracking-wide font-medium">Next Payout</span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <Minus size={16} aria-hidden="true" />
          <span className="text-sm">Not scheduled</span>
        </span>
      </div>
    );
  }

  const payoutDate = new Date(payout.date + 'T00:00:00');
  const formattedDate = payoutDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((payoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const relativeLabel =
    diffDays === 0
      ? 'Today'
      : diffDays === 1
      ? 'Tomorrow'
      : diffDays > 1
      ? `In ${diffDays} days`
      : 'Past due';

  return (
    <div
      className="glass-card p-5 flex flex-col justify-between min-h-[112px]"
      data-testid="next-payout-tile"
      aria-label={`Next payout: ${formattedDate}${payout.estimatedAmount != null ? `, estimated ${formatCurrency(payout.estimatedAmount, payout.currency)}` : ''}`}
    >
      <div>
        <div className="flex items-center gap-2 text-muted mb-2">
          <span className="text-accent" aria-hidden="true">
            <CalendarClock size={20} />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide">Next Payout</span>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-main">
          {payout.estimatedAmount != null
            ? formatCurrency(payout.estimatedAmount, payout.currency)
            : formattedDate}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {payout.estimatedAmount != null && (
          <span className="text-muted">{formattedDate}</span>
        )}
        <span
          className={`font-medium ${diffDays <= 3 ? 'text-[#fbbf24]' : 'text-success'}`}
          aria-label={`Payout ${relativeLabel.toLowerCase()}`}
        >
          {relativeLabel}
        </span>
      </div>
    </div>
  );
};

/* ─── Primary CTA ───────────────────────────────────────────────────── */

interface PrimaryCtaProps {
  reportStatus?: ReportStatus;
  reportDueDate?: string;
  submitPath: string;
}

/**
 * CTA state machine:
 *
 * | reportStatus  | daysUntil | CTA shown                        |
 * |---------------|-----------|----------------------------------|
 * | 'due'         | ≤ 7       | "Submit Revenue Report" (primary)|
 * | 'overdue'     | n/a       | "Submit Overdue Report" (danger) |
 * | 'submitted'   | n/a       | "View Submitted Report" (secondary)|
 * | 'accepted'    | n/a       | "View Accepted Report" (secondary) |
 * | 'none' / undefined | n/a  | "Submit Revenue Report" (secondary) |
 * | 'due'         | > 7       | secondary button only            |
 */
const PrimaryCta: React.FC<PrimaryCtaProps> = ({
  reportStatus,
  reportDueDate,
  submitPath,
}) => {
  if (!reportStatus || reportStatus === 'none') {
    return (
      <Link
        to={submitPath}
        className="btn-secondary inline-flex items-center gap-2 focus-ring"
        aria-label="Submit revenue report"
        data-testid="cta-submit"
      >
        <DollarSign size={16} aria-hidden="true" />
        Submit Revenue Report
      </Link>
    );
  }

  if (reportStatus === 'overdue') {
    return (
      <Link
        to={submitPath}
        className="
          inline-flex items-center gap-2 whitespace-nowrap
          px-5 py-2.5 rounded-lg font-semibold text-sm
          bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)]
          text-[#f87171] hover:bg-[rgba(239,68,68,0.25)]
          transition-colors focus-ring
        "
        aria-label="Submit overdue revenue report"
        data-testid="cta-overdue"
      >
        <AlertTriangle size={16} aria-hidden="true" />
        Submit Overdue Report
      </Link>
    );
  }

  if (reportStatus === 'due') {
    const days = reportDueDate ? daysUntil(reportDueDate) : 8;
    if (days <= 7) {
      return (
        <Link
          to={submitPath}
          className="btn-primary inline-flex items-center gap-2 focus-ring"
          aria-label="Submit revenue report — due soon"
          data-testid="cta-due-soon"
        >
          <DollarSign size={16} aria-hidden="true" />
          Submit Revenue Report
        </Link>
      );
    }
    return (
      <Link
        to={submitPath}
        className="btn-secondary inline-flex items-center gap-2 focus-ring"
        aria-label="Submit revenue report"
        data-testid="cta-submit"
      >
        <DollarSign size={16} aria-hidden="true" />
        Submit Revenue Report
      </Link>
    );
  }

  if (reportStatus === 'submitted') {
    return (
      <Link
        to={submitPath}
        className="btn-secondary inline-flex items-center gap-2 focus-ring"
        aria-label="View submitted report"
        data-testid="cta-submitted"
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        View Submitted Report
      </Link>
    );
  }

  if (reportStatus === 'accepted') {
    return (
      <Link
        to={submitPath}
        className="btn-secondary inline-flex items-center gap-2 focus-ring"
        aria-label="View accepted report"
        data-testid="cta-accepted"
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        View Accepted Report
      </Link>
    );
  }
};

/* ─── Main Component ────────────────────────────────────────────────── */

export const IssuerDashboardHero: React.FC<IssuerDashboardHeroProps> = ({
  companyName,
  mrr,
  arr,
  dau,
  nextPayout,
  reportStatus,
  reportDueDate,
}) => {
  const submitPath = '/startup/report-revenue';

  return (
    <section
      className="mb-8 space-y-5 animate-fade-in"
      aria-labelledby="issuer-hero-heading"
      data-testid="issuer-dashboard-hero"
    >
      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            id="issuer-hero-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight text-main"
          >
            {companyName ? `${companyName} Dashboard` : 'Issuer Dashboard'}
          </h1>
          <p className="text-muted text-sm mt-1">
            Track your revenue metrics, upcoming obligations, and payout schedule.
          </p>
        </div>

        {/* Primary action CTA */}
        <div className="flex-shrink-0">
          <PrimaryCta
            reportStatus={reportStatus}
            reportDueDate={reportDueDate}
            submitPath={submitPath}
          />
        </div>
      </div>

      {/* ── Reminder banner (conditional) ── */}
      <ReminderBanner
        reportStatus={reportStatus ?? 'none'}
        reportDueDate={reportDueDate}
        submitPath={submitPath}
      />

      {/* ── KPI + payout tile grid ── */}
      {/*
        Layout: 4 tiles on lg, 2 on sm, 1 on mobile
        Order:  MRR | ARR | DAU | Next Payout
      */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        role="list"
        aria-label="Issuer key metrics"
      >
        <div role="listitem">
          <KpiTile
            label="MRR"
            data={mrr}
            icon={<DollarSign size={20} />}
            data-testid="kpi-tile-mrr"
          />
        </div>
        <div role="listitem">
          <KpiTile
            label="ARR"
            data={arr}
            icon={<BarChart2 size={20} />}
            data-testid="kpi-tile-arr"
          />
        </div>
        <div role="listitem">
          <KpiTile
            label="DAU"
            data={dau}
            icon={<Users size={20} />}
            data-testid="kpi-tile-dau"
          />
        </div>
        <div role="listitem">
          <NextPayoutTile payout={nextPayout} />
        </div>
      </div>
    </section>
  );
};
