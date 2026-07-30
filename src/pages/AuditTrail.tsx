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
import { ExportDialog, type ExportScope, type ExportFormat } from '../components/AuditTrailFilters/ExportDialog';
import { PinnedSearchSidebar } from '../components/AuditTrailFilters/PinnedSearchSidebar';
import { ExportHistoryTable } from '../components/ExportHistory/ExportHistoryTable';
import { EventDiffViewer } from '../components/EventDiffViewer';
import type { EventDiff } from '../components/EventDiffViewer';
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
  /** Optional structured diff — when present a "Show diff" toggle appears */
  diff?: EventDiff;
}

export const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'a1',
    timestamp: '2026-07-25T09:14:00Z',
    actor: 'maria.chen',
    action: 'payout',
    details: 'Approved payout batch #4821 (USDC 12,400)',
    diff: {
      eventType: 'payout.approved',
      fields: [
        { label: 'Status', before: 'pending', after: 'approved' },
        { label: 'Approved by', before: undefined, after: 'maria.chen' },
        { label: 'Amount (USDC)', before: '12400', after: '12400' },
        { label: 'Approval note', before: undefined, after: 'Reviewed and cleared per Q2 compliance checklist.' },
      ],
    },
  },
  {
    id: 'a2',
    timestamp: '2026-07-25T08:02:00Z',
    actor: 'system',
    action: 'payout',
    details: 'Payout batch #4821 settled on Stellar',
    diff: {
      eventType: 'payout.settled',
      fields: [
        { label: 'Status', before: 'approved', after: 'settled' },
        { label: 'Tx hash', before: undefined, after: '0xabc…def' },
        { label: 'Network', before: undefined, after: 'Stellar mainnet' },
      ],
    },
  },
  {
    id: 'a3',
    timestamp: '2026-07-24T16:45:00Z',
    actor: 'j.okafor',
    action: 'investment',
    details: 'Investment of USDC 5,000 in TechFlow AI',
    diff: {
      eventType: 'investment.created',
      fields: [
        { label: 'Amount (USDC)', before: undefined, after: '5000' },
        { label: 'Offering', before: undefined, after: 'TechFlow AI — Seed Round' },
        { label: 'Investor', before: undefined, after: 'j.okafor' },
        { label: 'KYC status', before: 'pending', after: 'verified' },
      ],
    },
  },
  {
    id: 'a4',
    timestamp: '2026-07-24T11:20:00Z',
    actor: 'maria.chen',
    action: 'compliance',
    details: 'Placed compliance hold on Quantum Ledger offering',
    diff: {
      eventType: 'offering.compliance_hold',
      fields: [
        { label: 'Offering status', before: 'listed', after: 'compliance_hold' },
        { label: 'Hold reason', before: undefined, after: 'Missing audited financials for FY2025.' },
        { label: 'Hold expiry', before: undefined, after: '2026-08-07' },
        { label: 'Config (JSON)', before: '{"visible":true,"accepting_investments":true}', after: '{"visible":false,"accepting_investments":false}' },
      ],
    },
  },
  {
    id: 'a5',
    timestamp: '2026-07-23T14:08:00Z',
    actor: 'system',
    action: 'report',
    details: 'Monthly revenue report ingested for Nexus Pay',
    diff: {
      eventType: 'revenue_report.ingested',
      fields: [
        { label: 'Report period', before: undefined, after: '2026-06' },
        { label: 'Gross revenue (USD)', before: '0', after: '184320.50' },
        { label: 'Submitted by', before: undefined, after: 'system (CSV import)' },
        { label: 'Verification hash', before: undefined, after: '__redacted__' },
      ],
    },
  },
  {
    id: 'a6',
    timestamp: '2026-07-22T10:30:00Z',
    actor: 'j.okafor',
    action: 'login',
    details: 'Signed in from new device (2FA verified)',
    // No diff — not all event types produce a field-level diff
  },
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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [exportStatus, setExportStatus] = useState('');
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

  const handleExport = (scope: ExportScope, format: ExportFormat, options: any) => {
    setExportDialogOpen(false);
    setExportStatus('Export started... compiling ' + format.toUpperCase() + ' document.');
    
    // Simulate export progress and completion
    setTimeout(() => {
      setExportStatus('Export complete! Downloading ' + format.toUpperCase() + '...');
      setTimeout(() => {
        setExportStatus(''); // Clear toast after a few seconds
      }, 5000);
    }, 3000);
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
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setExportDialogOpen(true)}
              >
                Export...
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
            {/* Export toast announced politely */}
            {exportStatus && (
              <div aria-live="polite" className="atf-toast" style={{ position: 'fixed', bottom: '1rem', right: '1rem', background: '#333', color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} data-testid="export-toast">
                {exportStatus}
              </div>
            )}
          </form>

          </form>

<div
  className="flex items-center justify-between mt-4 mb-3"
  aria-live="polite"
>
  <h2 className="text-lg font-semibold">
    Audit Results
  </h2>

  <p className="text-sm text-muted">
    Showing <strong>{results.length}</strong> {results.length === 1 ? 'entry' : 'entries'}
  </p>
</div>

/* Results */
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
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          <span>{entry.details}</span>
                          {entry.diff && (
                            <EventDiffViewer
                              diff={entry.diff}
                              entryLabel={`${entry.actor} ${entry.action} at ${new Date(entry.timestamp).toLocaleString()}`}
                            />
                          )}
                        </div>
                      </td>
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

      <ExportDialog
        open={exportDialogOpen}
        filters={filters}
        onExport={handleExport}
        onClose={() => setExportDialogOpen(false)}
      />
    </div>
  );
};
