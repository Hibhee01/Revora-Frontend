<<<<<<< Updated upstream
/**
 * Audit Trail page with saved-filter and pinned-search UX (Issue #235).
 *
 * Auditors reuse the same complex filter combinations daily, so this page
 * supports:
 *  - a filter bar (free text, action type, actor, date range) synced to the
 *    URL query string — any filter combination is shareable via link,
 *  - "Save filter": name + optional description via an accessible dialog,
 *  - a pinned-search sidebar with keyboard-first reorder controls,
 *  - per-user persistence (localStorage, namespaced by user id).
 *
 * See docs/uiux/ux235-audit-trail-saved-filters.md for the design rationale,
 * accessibility notes, and axe results.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Save } from 'lucide-react';
import { EmptyState } from '../components/designSystem/EmptyState';
import { SaveFilterDialog } from '../components/AuditTrailFilters/SaveFilterDialog';
import { PinnedSearchSidebar } from '../components/AuditTrailFilters/PinnedSearchSidebar';
import { ExportHistoryTable } from '../components/ExportHistory/ExportHistoryTable';
import {
  type AuditFilterState,
  type SavedFilter,
  EMPTY_FILTERS,
  createSavedFilter,
  filtersFromSearchParams,
  filtersToSearchParams,
  hasActiveFilters,
  loadSavedFilters,
  movePinned,
  persistSavedFilters,
  removeSavedFilter,
  togglePinned,
} from '../components/AuditTrailFilters/savedFilters';
import '../components/AuditTrailFilters/AuditTrailFilters.css';

/* ─── Mock audit data (until the audit API lands) ────────────────────────── */

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  actor: string;
  action: string;
  details: string;
}

export const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-07-25T09:14:00Z', actor: 'maria.chen', action: 'payout', details: 'Approved payout batch #4821 (USDC 12,400)' },
  { id: 'a2', timestamp: '2026-07-25T08:02:00Z', actor: 'system', action: 'payout', details: 'Payout batch #4821 settled on Stellar' },
  { id: 'a3', timestamp: '2026-07-24T16:45:00Z', actor: 'j.okafor', action: 'investment', details: 'Investment of USDC 5,000 in TechFlow AI' },
  { id: 'a4', timestamp: '2026-07-24T11:20:00Z', actor: 'maria.chen', action: 'compliance', details: 'Placed compliance hold on Quantum Ledger offering' },
  { id: 'a5', timestamp: '2026-07-23T14:08:00Z', actor: 'system', action: 'report', details: 'Monthly revenue report ingested for Nexus Pay' },
  { id: 'a6', timestamp: '2026-07-22T10:30:00Z', actor: 'j.okafor', action: 'login', details: 'Signed in from new device (2FA verified)' },
];

export const ACTION_OPTIONS = ['payout', 'investment', 'compliance', 'report', 'login'] as const;

/** Apply a filter combination to entries (pure; exported for tests). */
export function filterEntries(entries: AuditEntry[], filters: AuditFilterState): AuditEntry[] {
  const q = filters.query.trim().toLowerCase();
  const actor = filters.actor.trim().toLowerCase();
  return entries.filter((entry) => {
    if (q && !`${entry.actor} ${entry.action} ${entry.details}`.toLowerCase().includes(q)) return false;
    if (filters.action && entry.action !== filters.action) return false;
    if (actor && !entry.actor.toLowerCase().includes(actor)) return false;
    const day = entry.timestamp.slice(0, 10);
    if (filters.dateFrom && day < filters.dateFrom) return false;
    if (filters.dateTo && day > filters.dateTo) return false;
    return true;
  });
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export interface AuditTrailProps {
  /** Audit entries to display; defaults to mock data until the API lands. */
  entries?: AuditEntry[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ entries = MOCK_AUDIT_ENTRIES }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the source of truth for the active filter combination.
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => loadSavedFilters());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'audit' | 'export'>('audit');

  // Persist per-user whenever the saved list changes.
  useEffect(() => {
    persistSavedFilters(savedFilters);
  }, [savedFilters]);

  const setFilters = useCallback(
    (next: AuditFilterState) => {
      setActiveFilterId(null);
      setShareStatus('');
      setSearchParams(filtersToSearchParams(next), { replace: true });
    },
    [setSearchParams]
  );

  const updateField = (field: keyof AuditFilterState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFilters({ ...filters, [field]: event.target.value });

  const handleSave = (name: string, description: string) => {
    const created = createSavedFilter(name, description, filters);
    setSavedFilters((prev) => [...prev, created]);
    setActiveFilterId(created.id);
    setDialogOpen(false);
  };

  const handleApply = (filter: SavedFilter) => {
    setSearchParams(filtersToSearchParams(filter.filters), { replace: true });
    setActiveFilterId(filter.id);
    setShareStatus('');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/investor/audit-trail?${filtersToSearchParams(filters).toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('Link copied to clipboard.');
    } catch {
      setShareStatus(url); // Clipboard blocked: surface the URL for manual copy.
    }
  };

  const results = filterEntries(entries, filters);
  const filtersActive = hasActiveFilters(filters);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted text-sm mt-1">
          Complete activity log for compliance and transparency.
        </p>
      </div> 

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeTab === 'audit' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
        <button 
          className={`btn ${activeTab === 'export' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
          onClick={() => setActiveTab('export')}
        >
          Export History
        </button>
      </div>

      {activeTab === 'audit' ? (
        <div className="atf-layout">
          <PinnedSearchSidebar
          savedFilters={savedFilters}
          activeFilterId={activeFilterId}
          onApply={handleApply}
          onMove={(id, direction) => setSavedFilters((prev) => movePinned(prev, id, direction))}
          onUnpin={(id) => setSavedFilters((prev) => togglePinned(prev, id))}
          onDelete={(id) => {
            setSavedFilters((prev) => removeSavedFilter(prev, id));
            if (activeFilterId === id) setActiveFilterId(null);
          }}
        />

        <div className="atf-main">
          {/* Filter bar */}
          <form
            className="atf-filterbar glass-card"
            role="search"
            aria-label="Audit trail filters"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="input-group">
              <label className="input-label" htmlFor="atf-query">Search</label>
              <input
                id="atf-query"
                className="input-field"
                type="search"
                value={filters.query}
                onChange={updateField('query')}
                placeholder="Actor, action, details…"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="atf-action">Action</label>
              <select
                id="atf-action"
                className="input-field"
                value={filters.action}
                onChange={updateField('action')}
              >
                <option value="">Any action</option>
                {ACTION_OPTIONS.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="atf-actor">Actor</label>
              <input
                id="atf-actor"
                className="input-field"
                type="text"
                value={filters.actor}
                onChange={updateField('actor')}
                placeholder="e.g. maria.chen"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="atf-from">From</label>
              <input
                id="atf-from"
                className="input-field"
                type="date"
                value={filters.dateFrom}
                onChange={updateField('dateFrom')}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="atf-to">To</label>
              <input
                id="atf-to"
                className="input-field"
                type="date"
                value={filters.dateTo}
                onChange={updateField('dateTo')}
              />
            </div>

            <div className="atf-filterbar-actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setDialogOpen(true)}
                disabled={!filtersActive}
                title={filtersActive ? undefined : 'Set at least one filter to save it'}
              >
                <Save size={14} aria-hidden="true" /> Save filter
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleShare}
                disabled={!filtersActive}
              >
                <Link2 size={14} aria-hidden="true" /> Copy link
              </button>
              {filtersActive && (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Share feedback announced politely */}
            <div aria-live="polite" className="atf-share-status" data-testid="share-status">
              {shareStatus}
            </div>
          </form>

          {/* Results */}
          {results.length === 0 ? (
            filtersActive ? (
              <EmptyState
                variant="audit-trail"
                title="No entries match these filters"
                description="Adjust or clear the filters to see more of the audit trail."
                context={<span>Filters are hiding all {entries.length} entries.</span>}
                primaryAction={{ label: 'Clear filters', onClick: () => setFilters(EMPTY_FILTERS) }}
              />
            ) : (
              <EmptyState
                variant="audit-trail"
                title="No audit trail entries"
                description="Activity logs will appear here as transactions and events occur on the platform."
                primaryAction={{ label: 'Refresh', onClick: () => window.location.reload() }}
                secondaryAction={{ label: 'Back to Discovery', href: '/investor/portal' }}
              />
            )
          ) : (
            <div className="atf-results glass-card">
              <table className="atf-table">
                <caption className="sr-only">
                  Audit trail entries{filtersActive ? ' (filtered)' : ''}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Action</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.timestamp).toLocaleString()}</td>
                      <td>{entry.actor}</td>
                      <td>{entry.action}</td>
                      <td>{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      ) : (
        <ExportHistoryTable />
      )}

      <SaveFilterDialog
        open={dialogOpen}
        filters={filters}
        existing={savedFilters}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
};
=======
import React, { useState } from 'react';
import ActorDetailPopover from '../components/ActorDetailPopover';

export interface AuditAction {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface Actor {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  avatar?: string;
}

const AuditTrail: React.FC = () => {
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // Mock data - in production this would come from an API
  const actors: Actor[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@revora.org',
      role: 'Administrator',
      lastLogin: '2024-01-15T09:30:00Z',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@revora.org',
      role: 'Auditor',
      lastLogin: '2024-01-14T16:45:00Z',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@revora.org',
      role: 'Manager',
      lastLogin: '2024-01-15T08:15:00Z',
    },
  ];

  const mockActions: Record<string, AuditAction[]> = {
    '1': [
      { id: 'a1', type: 'user_created', description: 'Created new user account', timestamp: '2024-01-15T10:00:00Z' },
      { id: 'a2', type: 'permission_updated', description: 'Updated user permissions', timestamp: '2024-01-15T09:45:00Z' },
      { id: 'a3', type: 'settings_changed', description: 'Modified system settings', timestamp: '2024-01-15T09:30:00Z' },
      { id: 'a4', type: 'export_generated', description: 'Generated audit report', timestamp: '2024-01-14T14:20:00Z' },
      { id: 'a5', type: 'user_deleted', description: 'Deleted inactive user', timestamp: '2024-01-14T11:30:00Z' },
    ],
    '2': [
      { id: 'b1', type: 'audit_reviewed', description: 'Reviewed compliance logs', timestamp: '2024-01-14T17:00:00Z' },
      { id: 'b2', type: 'flag_raised', description: 'Raised security flag', timestamp: '2024-01-14T16:45:00Z' },
      { id: 'b3', type: 'report_viewed', description: 'Viewed monthly report', timestamp: '2024-01-14T15:30:00Z' },
      { id: 'b4', type: 'filter_applied', description: 'Applied date filter', timestamp: '2024-01-14T14:00:00Z' },
      { id: 'b5', type: 'export_downloaded', description: 'Downloaded CSV export', timestamp: '2024-01-13T18:45:00Z' },
    ],
    '3': [
      { id: 'c1', type: 'team_updated', description: 'Updated team assignments', timestamp: '2024-01-15T08:30:00Z' },
      { id: 'c2', type: 'project_created', description: 'Created new project', timestamp: '2024-01-15T08:15:00Z' },
      { id: 'c3', type: 'milestone_completed', description: 'Marked milestone complete', timestamp: '2024-01-14T10:00:00Z' },
      { id: 'c4', type: 'budget_approved', description: 'Approved budget request', timestamp: '2024-01-13T14:30:00Z' },
      { id: 'c5', type: 'comment_added', description: 'Added project comment', timestamp: '2024-01-12T09:15:00Z' },
    ],
  };

  const handleActorClick = (actor: Actor, event: React.MouseEvent<HTMLElement>) => {
    setSelectedActor(actor);
    setPopoverAnchor(event.currentTarget);
  };

  const closePopover = () => {
    setSelectedActor(null);
    setPopoverAnchor(null);
  };

  const getRecentActions = (actorId: string): AuditAction[] => {
    return mockActions[actorId] || [];
  };

  return (
    <div className="audit-trail-page">
      <div className="glass-card" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-main" style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          Audit Trail
        </h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Track and review all system actions performed by users. Click on an actor to view their details and recent activity.
        </p>

        <section aria-label="Actor list">
          <h2 className="text-main" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Active Actors
          </h2>
          <div className="actor-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {actors.map((actor) => (
              <button
                key={actor.id}
                className="glass-card-interactive actor-card"
                onClick={(e) => handleActorClick(actor, e)}
                style={{
                  padding: '1.25rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '1rem',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-blur)',
                  transition: 'all 0.2s ease',
                }}
                aria-label={`View details for ${actor.name}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'white',
                    }}
                  >
                    {actor.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="text-main" style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      {actor.name}
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                      {actor.role}
                    </p>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedActor && popoverAnchor && (
          <ActorDetailPopover
            actor={selectedActor}
            recentActions={getRecentActions(selectedActor.id)}
            anchorEl={popoverAnchor}
            onClose={closePopover}
          />
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
>>>>>>> Stashed changes
