/**
 * StartupDashboard page — /startup/dashboard
 *
 * Wires the IssuerDashboardHero with representative mock data.
 * In a real app, replace mockData with API calls / store selectors.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IssuerDashboardHero } from '../components/IssuerDashboardHero';
import type {
  IssuerKpiData,
  NextPayout,
  IssuerDashboardHeroProps,
} from '../components/IssuerDashboardHero';
import { RevenueReportingCalendar } from '../components/RevenueReportingCalendar';
import type { RevenueReport, ReportStatus } from '../components/RevenueReportingCalendar.types';

/* ─── Helper ────────────────────────────────────────────────────────── */

function isoRelative(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/* ─── Mock data ─────────────────────────────────────────────────────── */

const mockMrr: IssuerKpiData = {
  value: '$42,000',
  status: 'success',
  change: 8.3,
  changeLabel: 'vs last month',
};

const mockArr: IssuerKpiData = {
  value: '$504,000',
  status: 'success',
  change: 8.3,
  changeLabel: 'annualised',
};

const mockDau: IssuerKpiData = {
  value: '1,240',
  status: 'success',
  change: -3.1,
  changeLabel: 'vs yesterday',
};

const mockNextPayout: NextPayout = {
  date: isoRelative(12),
  estimatedAmount: 8750,
  currency: 'USD',
};

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

const mockReports: RevenueReport[] = [
  {
    id: 'rpt-001',
    date: `${y}-${String(m + 1).padStart(2, '0')}-05`,
    dueDate: `${y}-${String(m + 1).padStart(2, '0')}-05`,
    status: 'accepted',
    grossRevenue: 125000,
    currency: 'USD',
    locale: 'en-US',
    acceptedAt: `${y}-${String(m + 1).padStart(2, '0')}-08`,
    notes: 'Q2 revenue report approved.',
  },
  {
    id: 'rpt-002',
    date: `${y}-${String(m + 1).padStart(2, '0')}-12`,
    dueDate: `${y}-${String(m + 1).padStart(2, '0')}-12`,
    status: 'submitted',
    grossRevenue: 98000,
    currency: 'USD',
    locale: 'en-US',
    submittedAt: `${y}-${String(m + 1).padStart(2, '0')}-10`,
  },
  {
    id: 'rpt-003',
    date: isoRelative(4),
    dueDate: isoRelative(4),
    status: 'due',
    grossRevenue: undefined,
    currency: 'USD',
    locale: 'en-US',
  },
];

/* ─── Scenario switcher (demo / dev only) ───────────────────────────── */

type Scenario =
  | 'nominal'
  | 'due-soon'
  | 'due-today'
  | 'overdue-mild'
  | 'overdue-moderate'
  | 'overdue-critical'
  | 'submitted'
  | 'accepted'
  | 'loading'
  | 'error'
  | 'empty-metrics';

interface ScenarioConfig {
  label: string;
  props: Partial<IssuerDashboardHeroProps>;
}

const scenarios: Record<Scenario, ScenarioConfig> = {
  nominal: {
    label: 'Nominal (no report due)',
    props: {},
  },
  'due-soon': {
    label: 'Report due in 4 days',
    props: { reportStatus: 'due', reportDueDate: isoRelative(4) },
  },
  'due-today': {
    label: 'Report due today',
    props: { reportStatus: 'due', reportDueDate: isoRelative(0) },
  },
  'overdue-mild': {
    label: 'Overdue — mild (2 days)',
    props: { reportStatus: 'overdue', reportDueDate: isoRelative(-2) },
  },
  'overdue-moderate': {
    label: 'Overdue — moderate (10 days)',
    props: { reportStatus: 'overdue', reportDueDate: isoRelative(-10) },
  },
  'overdue-critical': {
    label: 'Overdue — critical (35 days)',
    props: { reportStatus: 'overdue', reportDueDate: isoRelative(-35) },
  },
  submitted: {
    label: 'Report submitted',
    props: { reportStatus: 'submitted' },
  },
  accepted: {
    label: 'Report accepted',
    props: { reportStatus: 'accepted' },
  },
  loading: {
    label: 'All KPIs loading',
    props: {
      mrr: { value: null, status: 'loading' },
      arr: { value: null, status: 'loading' },
      dau: { value: null, status: 'loading' },
    },
  },
  error: {
    label: 'All KPIs errored',
    props: {
      mrr: { value: null, status: 'error' },
      arr: { value: null, status: 'error' },
      dau: { value: null, status: 'error' },
    },
  },
  'empty-metrics': {
    label: 'Empty metrics (new issuer)',
    props: {
      mrr: { value: null, status: 'empty' },
      arr: { value: null, status: 'empty' },
      dau: { value: null, status: 'empty' },
      nextPayout: undefined,
    },
  },
};

/* ─── Page component ────────────────────────────────────────────────── */

export const StartupDashboard: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<Scenario>('due-soon');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [viewMonth, setViewMonth] = useState<string | undefined>(undefined);

  const scenarioProps = scenarios[activeScenario].props;

  const heroProps: IssuerDashboardHeroProps = {
    companyName: 'Acme Corp',
    mrr: mockMrr,
    arr: mockArr,
    dau: mockDau,
    nextPayout: mockNextPayout,
    ...scenarioProps,
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      {/* ── Scenario switcher (dev / demo tool) ── */}
      <div
        className="glass-card p-4"
        aria-label="Demo scenario switcher"
        role="region"
      >
        <p className="text-xs text-muted uppercase tracking-wide font-medium mb-3">
          Demo scenarios
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(scenarios) as Scenario[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              className={`
                px-3 py-1 rounded-md text-xs font-medium transition-colors focus-ring
                ${activeScenario === key
                  ? 'bg-primary/20 border border-primary/40 text-primary'
                  : 'bg-white/5 border border-white/10 text-muted hover:bg-white/10'}
              `}
              aria-pressed={activeScenario === key}
            >
              {scenarios[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Issuer Dashboard Hero ── */}
      <IssuerDashboardHero {...heroProps} />

      {/* ── Revenue Reporting Calendar ── */}
      <section aria-labelledby="calendar-section-heading">
        <h2
          id="calendar-section-heading"
          className="text-xl font-semibold text-main mb-4"
        >
          Revenue Reporting Calendar
        </h2>
        <RevenueReportingCalendar
          reports={mockReports}
          selectedDate={selectedDate}
          viewMonth={viewMonth}
          locale="en-US"
          weekStartsOn={0}
          onDateSelect={setSelectedDate}
          onMonthChange={setViewMonth}
          onSubmitReport={(date) => alert(`Submit report for ${date}`)}
          onReportAction={(id, action) => alert(`Action "${action}" on ${id}`)}
        />
      </section>

      {/* ── Navigation ── */}
      <nav aria-label="Startup navigation" className="flex gap-4 text-sm">
        <Link to="/startup/report-revenue" className="link-styled">
          Submit Revenue Report
        </Link>
        <Link to="/" className="link-styled">
          Back to Home
        </Link>
      </nav>
    </div>
  );
};
