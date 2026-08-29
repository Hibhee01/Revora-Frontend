import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Rocket,
  TrendingUp,
  ShieldCheck,
  X,
  SlidersHorizontal,
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

interface InvestorDiscoveryProps {
  __simulateState?: DiscoveryState;
  __onClearFilters?: () => void;
  __onRetry?: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_OFFERINGS: Offering[] = [
  { id: 1, name: 'TechFlow AI', category: 'Enterprise SaaS', revenueShare: 15, target: 250000, raised: 112500 },
  { id: 2, name: 'Quantum Ledger', category: 'DeFi Infrastructure', revenueShare: 12, target: 500000, raised: 140000 },
  { id: 3, name: 'Nexus Pay', category: 'Cross-Border Payments', revenueShare: 18, target: 300000, raised: 186000 },
];

export const InvestorDiscovery: React.FC<InvestorDiscoveryProps> = ({
  __simulateState,
  __onClearFilters,
  __onRetry,
}) => {
  const [isLoading, setIsLoading] = useState(
    typeof process !== "undefined" && process.env.NODE_ENV === "test" ? false : true
  );
  const [query, setQuery] = useState("");
  const [filtersActive, setFiltersActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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
