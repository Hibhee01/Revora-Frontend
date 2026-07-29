/**
 * Integration tests for the Audit Trail page (Issue #235).
 * Covers URL-driven filters (shareable links), the save → pin → apply loop,
 * per-user persistence, share link copy, empty states, and axe checks.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AuditTrail, MOCK_AUDIT_ENTRIES, filterEntries } from './AuditTrail';
import {
  EMPTY_FILTERS,
  createSavedFilter,
  loadSavedFilters,
  persistSavedFilters,
} from '../components/AuditTrailFilters/savedFilters';

expect.extend(toHaveNoViolations);

function renderPage(
  initialUrl = '/investor/audit-trail',
  props: React.ComponentProps<typeof AuditTrail> = {}
) {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <AuditTrail {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ─── filterEntries (pure) ──────────────────────────────────────────────── */

describe('filterEntries', () => {
  it('returns all entries for the empty filter state', () => {
    expect(filterEntries(MOCK_AUDIT_ENTRIES, EMPTY_FILTERS)).toHaveLength(MOCK_AUDIT_ENTRIES.length);
  });

  it('filters by free text across actor, action, and details', () => {
    const hits = filterEntries(MOCK_AUDIT_ENTRIES, { ...EMPTY_FILTERS, query: 'batch #4821' });
    expect(hits.map((e) => e.id)).toEqual(['a1', 'a2']);
  });

  it('filters by action, actor substring, and date range', () => {
    expect(
      filterEntries(MOCK_AUDIT_ENTRIES, { ...EMPTY_FILTERS, action: 'login' }).map((e) => e.id)
    ).toEqual(['a6']);

    expect(
      filterEntries(MOCK_AUDIT_ENTRIES, { ...EMPTY_FILTERS, actor: 'maria' }).map((e) => e.id)
    ).toEqual(['a1', 'a4']);

    expect(
      filterEntries(MOCK_AUDIT_ENTRIES, {
        ...EMPTY_FILTERS,
        dateFrom: '2026-07-24',
        dateTo: '2026-07-24',
      }).map((e) => e.id)
    ).toEqual(['a3', 'a4']);
  });

  it('combines all criteria with AND semantics', () => {
    const hits = filterEntries(MOCK_AUDIT_ENTRIES, {
      query: 'payout',
      action: 'payout',
      actor: 'system',
      dateFrom: '2026-07-25',
      dateTo: '2026-07-25',
    });
    expect(hits.map((e) => e.id)).toEqual(['a2']);
  });
});

/* ─── page integration ──────────────────────────────────────────────────── */

describe('AuditTrail page', () => {
  it('renders the heading, filter bar, sidebar, and results table', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /audit trail/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: /audit trail filters/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /pinned searches/i })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(MOCK_AUDIT_ENTRIES.length + 1); // + header
  });

  it('applies filters from the URL on load (shareable links)', () => {
    renderPage('/investor/audit-trail?action=payout&actor=system');
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText(/settled on stellar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/action/i)).toHaveValue('payout');
    expect(screen.getByLabelText(/actor/i)).toHaveValue('system');
  });

  it('filters live as the user types and shows the filtered empty state', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^search$/i), 'no-such-entry-xyz');

    expect(screen.getByText(/no entries match these filters/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`hiding all ${MOCK_AUDIT_ENTRIES.length} entries`, 'i'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(screen.getAllByRole('row')).toHaveLength(MOCK_AUDIT_ENTRIES.length + 1);
  });

  it('disables Save filter and Copy link until a filter is active', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('button', { name: /save filter/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/action/i), 'payout');
    expect(screen.getByRole('button', { name: /save filter/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeEnabled();
  });

  it('completes the save → pin → apply loop', async () => {
    const user = userEvent.setup();
    renderPage();

    // Configure and save a filter
    await user.selectOptions(screen.getByLabelText(/action/i), 'compliance');
    await user.click(screen.getByRole('button', { name: /save filter/i }));

    const dialog = await screen.findByRole('dialog', { name: /save filter/i });
    await user.type(within(dialog).getByLabelText(/name/i), 'Compliance holds');
    await user.click(within(dialog).getByRole('button', { name: /save and pin/i }));

    // Dialog closes; the pinned row appears and is active
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const row = screen.getByRole('button', { name: /apply saved search: Compliance holds/i });
    expect(row).toHaveAttribute('aria-current', 'true');

    // Persisted per-user
    expect(loadSavedFilters().map((f) => f.name)).toEqual(['Compliance holds']);

    // Change filters away, then re-apply from the sidebar
    await user.selectOptions(screen.getByLabelText(/action/i), 'login');
    expect(screen.getAllByRole('row').slice(1)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /apply saved search: Compliance holds/i }));
    expect(screen.getByLabelText(/action/i)).toHaveValue('compliance');
    expect(within(screen.getAllByRole('row')[1]).getByText(/compliance hold/i)).toBeInTheDocument();
  });

  it('loads previously saved filters for the user on mount', () => {
    persistSavedFilters([
      createSavedFilter('Preloaded', '', { ...EMPTY_FILTERS, action: 'report' }),
    ]);
    renderPage();
    expect(screen.getByRole('button', { name: /apply saved search: Preloaded/i })).toBeInTheDocument();
  });

  it('unpins and deletes from the sidebar', async () => {
    const user = userEvent.setup();
    persistSavedFilters([
      createSavedFilter('Keep', '', { ...EMPTY_FILTERS, action: 'payout' }),
      createSavedFilter('Drop', '', { ...EMPTY_FILTERS, action: 'login' }),
    ]);
    renderPage();

    await user.click(screen.getByRole('button', { name: /unpin Keep/i }));
    expect(screen.queryByRole('button', { name: /apply saved search: Keep/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete saved search Drop/i }));
    expect(screen.queryByRole('button', { name: /apply saved search: Drop/i })).not.toBeInTheDocument();
    expect(loadSavedFilters().map((f) => f.name)).toEqual(['Keep']);
  });

  it('reorders pinned searches with the move buttons', async () => {
    const user = userEvent.setup();
    persistSavedFilters([
      createSavedFilter('Alpha', '', { ...EMPTY_FILTERS, action: 'payout' }),
      createSavedFilter('Beta', '', { ...EMPTY_FILTERS, action: 'login' }),
    ]);
    renderPage();

    await user.click(screen.getByRole('button', { name: /move Beta up/i }));

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByRole('button', { name: /apply saved search: Beta/i })).toBeInTheDocument();
    expect(loadSavedFilters().map((f) => f.name)).toEqual(['Beta', 'Alpha']);
  });

  it('rejects duplicate names in the save dialog', async () => {
    const user = userEvent.setup();
    persistSavedFilters([createSavedFilter('Taken', '', { ...EMPTY_FILTERS, action: 'payout' })]);
    renderPage();

    await user.selectOptions(screen.getByLabelText(/action/i), 'payout');
    await user.click(screen.getByRole('button', { name: /save filter/i }));

    const dialog = await screen.findByRole('dialog', { name: /save filter/i });
    await user.type(within(dialog).getByLabelText(/name/i), 'taken');
    await user.click(within(dialog).getByRole('button', { name: /save and pin/i }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent(/already exists/i);
    expect(loadSavedFilters()).toHaveLength(1);
  });

  it('copies a shareable link with the current filters', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderPage('/investor/audit-trail?action=payout');
    await user.click(screen.getByRole('button', { name: /copy link/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/investor/audit-trail?action=payout'));
    expect(screen.getByTestId('share-status')).toHaveTextContent(/link copied/i);
  });

  it('falls back to showing the URL when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });

    renderPage('/investor/audit-trail?action=login');
    await user.click(screen.getByRole('button', { name: /copy link/i }));

    await waitFor(() =>
      expect(screen.getByTestId('share-status')).toHaveTextContent(/action=login/)
    );
  });

  it('offers a filter-bar Clear button that resets to the unfiltered view', async () => {
    const user = userEvent.setup();
    renderPage('/investor/audit-trail?action=login');
    expect(screen.getAllByRole('row').slice(1)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(screen.getAllByRole('row').slice(1)).toHaveLength(MOCK_AUDIT_ENTRIES.length);
    expect(screen.getByRole('button', { name: /save filter/i })).toBeDisabled();
  });

  it('does not navigate when the filter form is submitted (Enter key)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^search$/i), 'payout{Enter}');
    // Still on the page with filters applied — no navigation/reload occurred
    expect(screen.getByRole('heading', { name: /audit trail/i, level: 1 })).toBeInTheDocument();
  });

  it('shows the truly-empty state when there are no entries at all', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...original, reload },
      configurable: true,
    });

    renderPage('/investor/audit-trail', { entries: [] });

    expect(screen.getByText(/no audit trail entries/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(reload).toHaveBeenCalled();

    Object.defineProperty(window, 'location', { value: original, configurable: true });
  });

  it('closes the save dialog via Cancel without saving', async () => {
    const user = userEvent.setup();
    renderPage('/investor/audit-trail?action=payout');

    await user.click(screen.getByRole('button', { name: /save filter/i }));
    const dialog = await screen.findByRole('dialog', { name: /save filter/i });

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(loadSavedFilters()).toHaveLength(0);
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderPage('/investor/audit-trail?action=payout');
    expect(await axe(container)).toHaveNoViolations();
  });
});

/* ─── export scope dialog integration ─────────────────────────────── */

describe('export integration', () => {
  it('renders the Export button in the filter bar', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('opens the export scope dialog when Export is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(screen.getByRole('dialog', { name: /export audit trail/i })).toBeInTheDocument();
  });

  it('shows the correct estimate in the export dialog based on filtered results', async () => {
    const user = userEvent.setup();
    renderPage('/investor/audit-trail?action=payout');

    await user.click(screen.getByRole('button', { name: 'Export' }));

    const dialog = screen.getByRole('dialog', { name: /export audit trail/i });
    expect(within(dialog).getByTestId('export-estimate')).toHaveTextContent(/2/);
  });

  it('shows toast on export completion', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Export' }));

    const dialog = await screen.findByRole('dialog', { name: /export audit trail/i });
    await user.click(within(dialog).getByRole('button', { name: /^export$/i }));

    vi.advanceTimersByTime(2000);

    const toast = await screen.findByTestId('export-toast');
    expect(toast).toHaveTextContent(/export complete/i);

    vi.useRealTimers();
  });

  it('closes the export dialog after export completes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('dialog', { name: /export audit trail/i })).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: /export audit trail/i });
    await user.click(within(dialog).getByRole('button', { name: /^export$/i }));

    vi.advanceTimersByTime(2000);

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /export audit trail/i })).not.toBeInTheDocument());

    vi.useRealTimers();
  });
});
