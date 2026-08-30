import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  Rocket,
  TrendingUp,
  ShieldCheck,
  X,
  SlidersHorizontal,
  CalendarDays,
  CircleDollarSign,
  BarChart3,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { EmptyState } from "./designSystem/EmptyState";

// ─── Skeleton Loading Card ─────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="glass-card p-6 space-y-4" aria-hidden="true">
    <div className="skeleton-pulse skeleton-icon" />
    <div className="space-y-2">
      <div className="skeleton-pulse skeleton-pulse-lg" />
      <div className="skeleton-pulse skeleton-pulse-sm" />
    </div>
    <div className="pt-4 border-t border-[rgba(148,163,184,0.1)]">
      <div className="flex justify-between text-xs mb-2">
        <div className="skeleton-pulse" style={{ width: "3rem", height: "0.75rem" }} />
        <div className="skeleton-pulse" style={{ width: "5rem", height: "0.75rem" }} />
      </div>
      <div className="skeleton-pulse skeleton-bar" />
    </div>
    <div className="skeleton-pulse skeleton-button" />
  </div>
);

// ─── Payout Schedule Types & Components ───────────────────────────────────────

export type PayoutStatus = 'Upcoming' | 'Processing' | 'Paid' | 'Missed';

export interface Payout {
  id: string;
  date: string;
  amount: number;
  status: PayoutStatus;
}

export interface PayoutScheduleProps {
  payouts: Payout[];
}

const getStatusIcon = (status: PayoutStatus) => {
  switch (status) {
    case 'Upcoming': return <Calendar size={14} aria-hidden="true" />;
    case 'Processing': return <Clock size={14} aria-hidden="true" />;
    case 'Paid': return <CheckCircle size={14} aria-hidden="true" />;
    case 'Missed': return <AlertCircle size={14} aria-hidden="true" />;
  }
};

const getStatusColor = (status: PayoutStatus) => {
  switch (status) {
    case 'Upcoming': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Processing': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'Paid': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'Missed': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

export const PayoutSchedule: React.FC<PayoutScheduleProps> = ({ payouts }) => {
  if (!payouts || payouts.length === 0) {
    return (
      <div className="glass-card p-8 text-center" role="region" aria-label="Payout Schedule">
        <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
        <p className="text-muted text-sm">When you invest in offerings, your expected payouts will appear here.</p>
      </div>
    );
  }

  // Sort payouts chronologically
  const sortedPayouts = [...payouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Find next payout
  const nextPayout = sortedPayouts.find(p => p.status === 'Upcoming' || p.status === 'Processing');
  
  // Group by month/year
  const groupedPayouts = sortedPayouts.reduce((acc, payout) => {
    const d = new Date(payout.date);
    const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(payout);
    return acc;
  }, {} as Record<string, Payout[]>);

  return (
    <section aria-labelledby="payout-schedule-heading" className="space-y-6">
      <h2 id="payout-schedule-heading" className="text-2xl font-bold tracking-tight">Payout Schedule</h2>
      
      {nextPayout && (
        <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20" aria-label="Next expected payout">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="text-sm font-medium text-primary mb-1">Next Expected Payout</h3>
              <p className="text-3xl font-bold">${nextPayout.amount.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted">
                <Calendar size={16} aria-hidden="true" />
                <span>{new Date(nextPayout.date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(nextPayout.status)}`}>
                {getStatusIcon(nextPayout.status)}
                {nextPayout.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 relative">
        {Object.entries(groupedPayouts).map(([monthYear, monthPayouts]) => (
          <div key={monthYear} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
              {monthYear}
            </h3>
            <ul className="space-y-3" aria-label={`Payouts for ${monthYear}`}>
              {monthPayouts.map(payout => (
                <li key={payout.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors" tabIndex={0}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Clock size={18} className="text-muted" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">${payout.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted">{new Date(payout.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(payout.status)}`}>
                      {getStatusIcon(payout.status)}
                      {payout.status}
                    </span>
                    <button className="btn btn--icon btn--sm text-muted hover:text-white" aria-label={`View details for payout ${payout.id}`}>
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Offering {
  id: number;
  name: string;
  category: string;
  revenueShare: number;
  target: number;
  raised: number;
}

/** Discriminated union for all UI states of the discovery result area */
type DiscoveryState =
  | { kind: 'loaded'; offerings: Offering[] }
  | { kind: 'filtered-empty'; query: string; hasFilters: boolean }
  | { kind: 'truly-empty' }
  | { kind: 'error'; retryCount: number };

export interface DistributionRecord {
  id: string;
  date: string;
  amount: number;
  currency?: string;
}

export type DistributionState =
  | { kind: 'loaded'; distributions: DistributionRecord[] }
  | { kind: 'empty' }
  | { kind: 'error' };

interface InvestorDiscoveryProps {
  __simulateState?: DiscoveryState;
  /** Test-only state injection; production data should use the same record contract. */
  __simulateDistributionState?: DistributionState;
  __onClearFilters?: () => void;
  __onRetry?: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_OFFERINGS: Offering[] = [
  { id: 1, name: 'TechFlow AI', category: 'Enterprise SaaS', revenueShare: 15, target: 250000, raised: 112500 },
  { id: 2, name: 'Quantum Ledger', category: 'DeFi Infrastructure', revenueShare: 12, target: 500000, raised: 140000 },
  { id: 3, name: 'Nexus Pay', category: 'Cross-Border Payments', revenueShare: 18, target: 300000, raised: 186000 },
];

const MOCK_DISTRIBUTIONS: DistributionRecord[] = [
  { id: 'dist-jan', date: '2026-01-31', amount: 1240, currency: 'USDC' },
  { id: 'dist-feb', date: '2026-02-28', amount: 1380, currency: 'USDC' },
  { id: 'dist-mar', date: '2026-03-31', amount: 1525, currency: 'USDC' },
  { id: 'dist-apr', date: '2026-04-30', amount: 1480, currency: 'USDC' },
  { id: 'dist-may', date: '2026-05-31', amount: 1690, currency: 'USDC' },
];

const formatDistributionAmount = (amount: number, currency = 'USDC') => {
  const asset = /^[A-Z0-9]{3,5}$/.test(currency) ? currency : 'USDC';
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  return asset === 'USD' ? `$${formatted}` : `${formatted} ${asset}`;
};

const formatDistributionDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  );

const projectNextPayoutDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const nextMonthLastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, nextMonthLastDay));
};

/** Drops malformed and duplicate records before they can distort investor-facing totals. */
export const normaliseDistributionHistory = (records: DistributionRecord[]): DistributionRecord[] => {
  const seen = new Set<string>();

  return records
    .filter((record) => {
      const valid =
        Boolean(record?.id) &&
        !seen.has(record.id) &&
        typeof record.amount === 'number' &&
        Number.isFinite(record.amount) &&
        record.amount >= 0 &&
        !Number.isNaN(Date.parse(record.date));

      if (valid) seen.add(record.id);
      return valid;
    })
    .sort((left, right) => left.date.localeCompare(right.date));
};

const DistributionDashboard: React.FC<{
  state: DistributionState;
  onRetry: () => void;
}> = ({ state, onRetry }) => {
  const [showTable, setShowTable] = useState(false);
  const distributions = useMemo(
    () => (state.kind === 'loaded' ? normaliseDistributionHistory(state.distributions) : []),
    [state],
  );

  const totalDistributed = distributions.reduce((total, record) => total + record.amount, 0);
  const lastPayout = distributions.at(-1);
  const projectedNextPayout = lastPayout ? projectNextPayoutDate(lastPayout.date) : null;
  const maximumAmount = Math.max(...distributions.map((record) => record.amount), 1);
  const chartDescription = distributions.length
    ? `Past distributions range from ${formatDistributionDate(distributions[0].date)} to ${formatDistributionDate(distributions.at(-1)!.date)} and total ${formatDistributionAmount(totalDistributed)}.`
    : 'No past distributions are available.';

  if (state.kind === 'error') {
    return (
      <section className="glass-card p-6" aria-labelledby="distribution-dashboard-heading" role="alert">
        <h2 id="distribution-dashboard-heading" className="text-xl font-semibold">Distribution dashboard</h2>
        <p className="text-muted text-sm mt-2">Payout history could not be loaded. Your investment records have not changed.</p>
        <button className="btn-primary mt-4 py-2 px-4 text-sm" onClick={onRetry}>Try again</button>
      </section>
    );
  }

  if (state.kind === 'empty' || distributions.length === 0) {
    return (
      <section className="glass-card p-6" aria-labelledby="distribution-dashboard-heading">
        <h2 id="distribution-dashboard-heading" className="text-xl font-semibold">Distribution dashboard</h2>
        <p className="text-muted text-sm mt-2">No distributions have been paid yet. When a payout is complete, its history will appear here.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="distribution-dashboard-heading" data-testid="distribution-dashboard">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Investor returns</p>
          <h2 id="distribution-dashboard-heading" className="text-xl font-semibold">Distribution dashboard</h2>
        </div>
        <p className="text-sm text-muted">Your confirmed payout history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="list" aria-label="Distribution key metrics">
        <div className="glass-card p-5" role="listitem">
          <CircleDollarSign size={18} className="text-primary mb-3" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total distributed</p>
          <p className="text-2xl font-bold mt-1">{formatDistributionAmount(totalDistributed, lastPayout?.currency)}</p>
        </div>
        <div className="glass-card p-5" role="listitem">
          <CalendarDays size={18} className="text-primary mb-3" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Last payout</p>
          <p className="text-lg font-semibold mt-1">{formatDistributionDate(lastPayout!.date)}</p>
          <p className="text-sm text-muted">{formatDistributionAmount(lastPayout!.amount, lastPayout!.currency)}</p>
        </div>
        <div className="glass-card p-5" role="listitem">
          <BarChart3 size={18} className="text-primary mb-3" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Projected next payout</p>
          <p className="text-lg font-semibold mt-1">{projectedNextPayout?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-sm text-muted">Projection based on the latest payout cadence</p>
        </div>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Payout history</h3>
            <p className="text-sm text-muted">Bars show each confirmed distribution; the line tracks the cumulative amount.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm self-start"
            aria-expanded={showTable}
            aria-controls="distribution-history-table"
            onClick={() => setShowTable((visible) => !visible)}
          >
            {showTable ? 'View chart' : 'View as table'}
          </button>
        </div>

        {!showTable && (
          <>
            <div className="hidden md:block mt-6" data-testid="distribution-chart">
              <svg viewBox="0 0 640 250" width="100%" role="img" aria-labelledby="distribution-chart-title distribution-chart-description">
                <title id="distribution-chart-title">Past distribution amounts and cumulative total</title>
                <desc id="distribution-chart-description">{chartDescription}</desc>
                <line x1="48" y1="204" x2="610" y2="204" stroke="currentColor" opacity="0.25" />
                {distributions.map((record, index) => {
                  const x = 76 + index * (500 / distributions.length);
                  const height = Math.max(4, (record.amount / maximumAmount) * 142);
                  return (
                    <g key={record.id}>
                      <rect x={x} y={204 - height} width="34" height={height} rx="3" fill="#22d3ee" />
                      <text x={x + 17} y="222" textAnchor="middle" fontSize="12" fill="currentColor">{new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}</text>
                    </g>
                  );
                })}
                <polyline
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="3"
                  points={distributions.map((record, index) => {
                    const cumulative = distributions.slice(0, index + 1).reduce((total, item) => total + item.amount, 0);
                    return `${93 + index * (500 / distributions.length)},${204 - (cumulative / totalDistributed) * 142}`;
                  }).join(' ')}
                />
              </svg>
              <div className="flex gap-4 text-xs text-muted mt-2" aria-hidden="true">
                <span><span className="inline-block h-2 w-2 mr-1 rounded-sm bg-cyan-400" />Distribution</span>
                <span><span className="inline-block h-0.5 w-3 mr-1 align-middle bg-lime-400" />Cumulative total</span>
              </div>
            </div>
            <p className="md:hidden text-sm text-muted mt-5">Payout history is shown as a table on small screens.</p>
          </>
        )}

        {showTable && (
          <div id="distribution-history-table" className="overflow-x-auto mt-6" tabIndex={-1}>
            <table className="w-full text-sm" aria-label="Distribution payout history">
              <thead><tr className="border-b border-[rgba(148,163,184,0.2)]"><th scope="col" className="text-left py-2 text-muted">Date</th><th scope="col" className="text-right py-2 text-muted">Distribution</th><th scope="col" className="text-right py-2 text-muted">Cumulative total</th></tr></thead>
              <tbody>{distributions.map((record, index) => <tr key={record.id} className="border-b border-[rgba(148,163,184,0.1)]"><td className="py-3">{formatDistributionDate(record.date)}</td><td className="py-3 text-right">{formatDistributionAmount(record.amount, record.currency)}</td><td className="py-3 text-right">{formatDistributionAmount(distributions.slice(0, index + 1).reduce((total, item) => total + item.amount, 0), record.currency)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export const InvestorDiscovery: React.FC<InvestorDiscoveryProps> = ({
  __simulateState,
  __simulateDistributionState,
  __onClearFilters,
  __onRetry,
}) => {
  const [isLoading, setIsLoading] = useState(
    typeof process !== "undefined" && process.env.NODE_ENV === "test" ? false : true
  );
  const [query, setQuery] = useState("");
  const [filtersActive, setFiltersActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [distributionSimDismissed, setDistributionSimDismissed] = useState(false);

  /** When true, the externally-supplied __simulateState is ignored */
  const [simDismissed, setSimDismissed] = useState(false);

  useEffect(() => {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      return;
    }
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const effectiveSimState = simDismissed ? null : (__simulateState ?? null);

  const seedOfferings =
    effectiveSimState?.kind === 'loaded' ? effectiveSimState.offerings : MOCK_OFFERINGS;

  /**
   * Resolve the current discovery state, merging the simulated state with the
   * live search/filter controls when in "loaded" mode.
   */
  const resolveState = useCallback((): DiscoveryState => {
    if (effectiveSimState && effectiveSimState.kind !== 'loaded') {
      return effectiveSimState;
    }

    const trimmed = query.trim().toLowerCase();
    const filtered =
      trimmed || filtersActive
        ? seedOfferings.filter((o) => o.name.toLowerCase().includes(trimmed))
        : seedOfferings;

    if (seedOfferings.length === 0) return { kind: 'truly-empty' };
    if (filtered.length === 0) return { kind: 'filtered-empty', query: trimmed, hasFilters: filtersActive };
    return { kind: 'loaded', offerings: filtered };
  }, [query, filtersActive, effectiveSimState, seedOfferings]);

  const state = resolveState();
  const distributionState = distributionSimDismissed || !__simulateDistributionState
    ? { kind: 'loaded', distributions: MOCK_DISTRIBUTIONS } as DistributionState
    : __simulateDistributionState;

  const handleClearFilters = () => {
    setQuery('');
    setFiltersActive(false);
    setRetryCount(0);
    setSimDismissed(true);
    __onClearFilters?.();
  };

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    setIsLoading(true);
    setSimDismissed(true);
    __onRetry?.();
    if (typeof process === "undefined" || process.env.NODE_ENV !== "test") {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleToggleFilters = () => {
    setFiltersActive((f) => !f);
  };

  const handleDistributionRetry = () => {
    setDistributionSimDismissed(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Offerings</h1>
          <p className="text-muted text-sm mt-1">
            Explore high-potential RevenueShare offerings on Stellar.
          </p>
        </div>

        {/* ── Search + Filter bar ── */}
        {(!effectiveSimState || effectiveSimState.kind === 'loaded') && (
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 text-muted" size={18} aria-hidden="true" />
            <input
              id="offering-search"
              type="search"
              placeholder="Search startups…"
              className="input-field pl-10 h-10 text-sm"
              aria-label="Search startup offerings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button
                className="absolute right-3 top-2.5 text-muted hover:text-main transition-colors"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                data-testid="clear-search-btn"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            className={`btn btn--icon btn--sm ${filtersActive ? 'discovery-filter-btn--active' : ''}`}
            aria-label={filtersActive ? 'Filters active — click to clear' : 'Filter results'}
            aria-pressed={filtersActive}
            onClick={handleToggleFilters}
            data-testid="filter-toggle-btn"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {filtersActive && <span className="discovery-filter-badge" aria-hidden="true" />}
          </button>
        </div>
      )}
      </div>

      {/* ── Active filter indicator ── */}
      {filtersActive && (
        <div className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
          <Filter size={14} aria-hidden="true" />
          <span>Filters active</span>
          <button
            className="link-styled text-xs"
            onClick={handleClearFilters}
            aria-label="Clear all active filters"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Loading State: Skeleton Cards ── */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading available offerings"
          aria-busy="true"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
          <span className="sr-only">Loading available startup offerings...</span>
        </div>
      )}

      {!isLoading && state.kind === 'loaded' && (
        <DistributionDashboard state={distributionState} onRetry={handleDistributionRetry} />
      )}

      {/* ── Result Area ── */}
      {!isLoading && (
        <section aria-labelledby="offerings-heading" aria-live="polite">
          <h2 id="offerings-heading" className="sr-only">
            Offerings
          </h2>

          {state.kind === 'loaded' && (
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in"
              aria-label="Available startup offerings"
              aria-live="polite"
            >
              {state.offerings.map((offering) => {
                const progress = Math.round((offering.raised / offering.target) * 100);
                const target = `$${offering.target.toLocaleString()}`;
                return (
                  <div
                    key={offering.id}
                    data-testid={`offering-card-${offering.id}`}
                    className="glass-card glass-card-interactive p-6 space-y-4"
                  >
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Rocket size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{offering.name}</h3>
                      <p className="text-xs text-muted">{offering.category}</p>
                    </div>
                    <div className="pt-4 border-t border-[rgba(148,163,184,0.1)]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Target</span>
                        <span>{target}</span>
                      </div>
                      <div
                        className="w-full bg-slate-800 rounded-full h-1.5"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${progress}% funded`}
                      >
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <button className="btn-primary py-2 text-xs">
                      View Prospectus
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {state.kind === 'filtered-empty' && (
            <EmptyState
              variant="distribution-dashboard"
              title="No offerings match your search"
              description={
                state.query
                  ? `We couldn't find any offerings matching "${state.query}".`
                  : 'No offerings matching the active filters.'
              }
              primaryAction={{
                label: 'Clear filters',
                onClick: handleClearFilters,
                ariaLabel: 'Clear all search filters and show all offerings',
                testId: 'clear-filters-btn',
              }}
              context={
                state.query ? (
                  <span className="empty-state-context" aria-label={`Search term: ${state.query}`}>
                    Searched for &ldquo;{state.query}&rdquo;
                  </span>
                ) : undefined
              }
            />
          )}

          {state.kind === 'truly-empty' && (
            <EmptyState
              variant="distribution-dashboard"
              title="No offerings yet"
              description="Check back soon — new RevenueShare offerings are added regularly as startups join the platform."
              primaryAction={{
                label: 'How it works',
                href: '/',
              }}
              secondaryAction={{
                label: 'Back to Home',
                href: '/',
              }}
            />
          )}

          {state.kind === 'error' && (
            <EmptyState
              variant="distribution-dashboard"
              severity="error"
              title="Couldn't load offerings"
              description="Your portfolio and account are unaffected. Please try again in a moment."
              primaryAction={{
                label: 'Try again',
                onClick: handleRetry,
                ariaLabel: 'Try again to retry loading offerings',
              }}
              context={
                state.retryCount > 0 ? (
                  <span className="empty-state-context">
                    Retried {state.retryCount} {state.retryCount === 1 ? 'time' : 'times'} — still having trouble? Contact support.
                  </span>
                ) : undefined
              }
            />
          )}
        </section>
      )}

      {/* ── Portfolio CTA (loaded state only, after loading) ── */}
      {!isLoading && state.kind === 'loaded' && (
        <div className="glass-card p-12 text-center bg-gradient-to-b from-transparent to-[rgba(59,130,246,0.05)]">
          <TrendingUp className="mx-auto mb-4 text-accent" size={48} aria-hidden="true" />
          <h2 className="text-xl font-semibold mb-2">Build Your Portfolio</h2>
          <p className="text-muted text-sm max-w-md mx-auto mb-6">
            Start investing in verified startups. All distributions are handled
            automatically via Soroban smart contracts.
          </p>
          <div className="flex justify-center gap-4">
            <button className="btn btn--secondary btn--sm flex items-center gap-2">
              <ShieldCheck size={18} aria-hidden="true" />
              How it works
            </button>
          </div>
        </div>
      )}

      {/* ── Payout Schedule ── */}
      {!isLoading && state.kind === 'loaded' && (
        <PayoutSchedule payouts={effectiveSimState?.kind === 'loaded' ? (effectiveSimState as any).payouts || [] : []} />
      )}
    </div>
  );
};
