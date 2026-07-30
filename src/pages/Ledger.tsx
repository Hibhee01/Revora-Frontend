import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface SubEvent {
  id: string;
  date: string;
  type: string;
  amount: number;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: 'investment' | 'payout' | 'distribution' | 'fee';
  amount: number;
  asset: string;
  status: 'confirmed' | 'pending' | 'failed';
  reference: string;
  subEvents?: SubEvent[];
}

// ────────────────────────────────────────
// Mock Data
// ────────────────────────────────────────

const MOCK_ENTRIES: LedgerEntry[] = Array.from({ length: 50 }, (_, i) => {
  const types: LedgerEntry['type'][] = ['investment', 'payout', 'distribution', 'fee'];
  const statuses: LedgerEntry['status'][] = ['confirmed', 'pending', 'failed'];

  // Variety of sub-event scenarios
  const scenario = i % 5;
  let subEvents: SubEvent[] | undefined;
  if (scenario === 0) {
    // Multiple sub-events (splits, retries, adjustments)
    subEvents = [
      { id: `SUB-${i}-1`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Split', amount: 50 },
      { id: `SUB-${i}-2`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Retry', amount: 30 },
      { id: `SUB-${i}-3`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Adjustment', amount: 25 },
    ];
  } else if (scenario === 1) {
    // Two sub-events
    subEvents = [
      { id: `SUB-${i}-1`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Split', amount: 50 },
      { id: `SUB-${i}-2`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Adjustment', amount: 25 },
    ];
  } else if (scenario === 2) {
    // Many sub-events (edge case: nested rows)
    subEvents = Array.from({ length: 8 }, (_, j) => ({
      id: `SUB-${i}-${j + 1}`,
      date: new Date(2025, 0, i + j + 1).toISOString().split('T')[0],
      type: j % 2 === 0 ? 'Split' : 'Adjustment',
      amount: Math.floor(Math.random() * 100) + 10,
    }));
  } else if (scenario === 3) {
    // Empty sub-events array (edge case)
    subEvents = [];
  }
  // scenario === 4: undefined subEvents (no related events)

  return {
    id: `ENT-${String(i + 1).padStart(4, '0')}`,
    date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
    type: types[i % types.length],
    amount: Math.floor(Math.random() * 10000) / 100,
    asset: 'USDC',
    status: statuses[i % statuses.length],
    reference: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    subEvents,
  };
});

// ────────────────────────────────────────
// Status badge helper
// ────────────────────────────────────────

const STATUS_STYLES: Record<LedgerEntry['status'], string> = {
  confirmed:
    'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20',
  pending:
    'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20',
  failed:
    'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
};

const TYPE_STYLES: Record<LedgerEntry['type'], string> = {
  investment:
    'bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-600/20',
  payout:
    'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20',
  distribution:
    'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-600/20',
  fee:
    'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-600/20',
};

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

export const Ledger: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [liveMessage, setLiveMessage] = useState('');
  const pageSize = 10;

  // Refs for focus management
  const toggleRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const totalPages = Math.ceil(MOCK_ENTRIES.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return MOCK_ENTRIES.slice(start, start + pageSize);
  }, [currentPage]);

  const toggleRow = useCallback(
    (id: string, label?: string) => {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        const isNowExpanded = !next.has(id);

        if (next.has(id)) {
          next.delete(id);
          setLiveMessage(`${label ?? id} collapsed`);
        } else {
          next.add(id);
          setLiveMessage(`${label ?? id} expanded`);
        }

        // Focus management: after state update, focus the toggle button
        requestAnimationFrame(() => {
          const button = toggleRefs.current.get(id);
          if (button) {
            button.focus();
          }
        });

        return next;
      });
    },
    [],
  );

  // Page change doesn't reset expanded state — persistence across paging
  // is intentional per the requirements.

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-10 animate-fade-in">
      {/* Live region for screen-reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="ledger-live-region"
      >
        {liveMessage}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Ledger
        </h1>
        <p className="text-muted text-sm mt-1">
          Detailed transaction history and ledger entries.
        </p>
      </div>

      {/* Table container */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {/* Desktop table */}
        <table
          className="min-w-full divide-y divide-gray-200 hidden sm:table"
          aria-label="Ledger entries table"
          role="grid"
        >
          <thead className="bg-gray-50">
            <tr role="row">
              <th scope="col" className="w-12 px-4 py-3">
                <span className="sr-only">Expand</span>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[16%]"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]"
              >
                Asset
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pageData.map((row) => {
              const isExpanded = expandedRows.has(row.id);
              const hasSubEvents =
                row.subEvents !== undefined && row.subEvents.length > 0;
              const hasEmptySubEvents =
                row.subEvents !== undefined && row.subEvents.length === 0;
              const subEventCount = row.subEvents?.length ?? 0;

              return (
                <React.Fragment key={row.id}>
                  {/* Parent row */}
                  <tr
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      isExpanded
                        ? 'bg-blue-50/40 border-l-4 border-l-blue-400'
                        : ''
                    }`}
                    aria-expanded={
                      hasSubEvents || hasEmptySubEvents
                        ? isExpanded
                        : undefined
                    }
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      {hasSubEvents || hasEmptySubEvents ? (
                        <button
                          ref={(el) => {
                            if (el) toggleRefs.current.set(row.id, el);
                            else toggleRefs.current.delete(row.id);
                          }}
                          onClick={() =>
                            toggleRow(row.id, `Ledger ${row.id}`)
                          }
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                          aria-expanded={isExpanded}
                          aria-controls={`sub-events-${row.id}`}
                          aria-label={
                            isExpanded
                              ? `Collapse sub-events for ${row.id}`
                              : `Expand ${subEventCount} sub-event${subEventCount !== 1 ? 's' : ''} for ${row.id}`
                          }
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform duration-200 ease-in-out ${
                              isExpanded ? 'rotate-90' : 'rotate-0'
                            }`}
                            aria-hidden="true"
                          />
                          {subEventCount > 0 && (
                            <span className="sr-only">
                              {subEventCount} sub-events
                            </span>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-300 cursor-not-allowed focus:outline-none"
                          aria-expanded={false}
                          aria-label={`No related events for ${row.id}`}
                        >
                          <ChevronRight
                            className="h-4 w-4 rotate-0"
                            aria-hidden="true"
                          />
                        </button>
                      )}
                      {/* Badge for sub-event count */}
                      {hasSubEvents && (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded-full"
                          aria-hidden="true"
                        >
                          {subEventCount}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          TYPE_STYLES[row.type]
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium tabular-nums">
                      ${row.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.asset}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[row.status]
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                      {row.reference}
                    </td>
                  </tr>

                  {/* Expanded sub-event row — with sub-events */}
                  {isExpanded && hasSubEvents && (
                    <tr
                      id={`sub-events-${row.id}`}
                      className="bg-blue-50/20 border-l-4 border-l-blue-400"
                      role="row"
                      aria-label={`Sub-events for ${row.id}`}
                    >
                      <td colSpan={7} className="px-4 sm:px-10 py-0">
                        <div className="overflow-x-auto">
                          <table
                            className="min-w-full"
                            aria-label={`Sub-events detail for ${row.id}`}
                            role="grid"
                          >
                            <thead>
                              <tr className="border-b border-blue-200">
                                <th
                                  scope="col"
                                  className="w-[14%] px-4 py-2 text-left text-[11px] font-semibold text-blue-700 uppercase tracking-wider"
                                >
                                  Sub-event Date
                                </th>
                                <th
                                  scope="col"
                                  className="w-[16%] px-4 py-2 text-left text-[11px] font-semibold text-blue-700 uppercase tracking-wider"
                                >
                                  Type
                                </th>
                                <th
                                  scope="col"
                                  className="w-[14%] px-4 py-2 text-left text-[11px] font-semibold text-blue-700 uppercase tracking-wider"
                                >
                                  Amount
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-2 text-left text-[11px] font-semibold text-blue-700 uppercase tracking-wider"
                                >
                                  Sub-event ID
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-100">
                              {row.subEvents!.map((subEvent, idx) => (
                                <tr
                                  key={subEvent.id}
                                  className="hover:bg-blue-100/40 transition-colors duration-100"
                                >
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                    {subEvent.date}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                      {subEvent.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 font-medium tabular-nums">
                                    ${subEvent.amount.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                                    {subEvent.id}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {subEventCount > 10 && (
                          <div className="text-center py-2">
                            <p className="text-xs text-blue-600">
                              Showing all {subEventCount} sub-events. Scroll to
                              view more.
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Expanded row — empty sub-events message */}
                  {isExpanded && hasEmptySubEvents && (
                    <tr
                      id={`sub-events-${row.id}`}
                      className="bg-blue-50/20 border-l-4 border-l-blue-400"
                      role="row"
                    >
                      <td
                        colSpan={7}
                        className="px-10 py-6 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg
                            className="w-8 h-8 text-blue-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                            />
                          </svg>
                          <p
                            className="text-sm text-gray-500"
                            id={`empty-hint-${row.id}`}
                          >
                            No related events for this entry.
                          </p>
                          <p className="text-xs text-gray-400">
                            Sub-events like splits, retries, or adjustments
                            will appear here when available.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* ── Mobile card layout ── */}
        <div className="sm:hidden divide-y divide-gray-200" role="list" aria-label="Ledger entries">
          {pageData.map((row) => {
            const isExpanded = expandedRows.has(row.id);
            const hasSubEvents =
              row.subEvents !== undefined && row.subEvents.length > 0;
            const hasEmptySubEvents =
              row.subEvents !== undefined && row.subEvents.length === 0;
            const subEventCount = row.subEvents?.length ?? 0;

            return (
              <div key={row.id} role="listitem">
                {/* Mobile parent card */}
                <div
                  className={`p-4 transition-colors duration-150 ${
                    isExpanded
                      ? 'bg-blue-50/40 border-l-4 border-l-blue-400'
                      : 'hover:bg-gray-50'
                  }`}
                  aria-expanded={
                    hasSubEvents || hasEmptySubEvents
                      ? isExpanded
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Expand toggle */}
                      {(hasSubEvents || hasEmptySubEvents) ? (
                        <button
                          ref={(el) => {
                            if (el) toggleRefs.current.set(row.id, el);
                            else toggleRefs.current.delete(row.id);
                          }}
                          onClick={() =>
                            toggleRow(row.id, `Ledger ${row.id}`)
                          }
                          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors shrink-0"
                          aria-expanded={isExpanded}
                          aria-controls={`sub-events-mobile-${row.id}`}
                          aria-label={
                            isExpanded
                              ? `Collapse sub-events for ${row.id}`
                              : `Expand ${subEventCount} sub-event${subEventCount !== 1 ? 's' : ''} for ${row.id}`
                          }
                        >
                          <ChevronRight
                            className={`h-5 w-5 transition-transform duration-200 ease-in-out ${
                              isExpanded ? 'rotate-90' : 'rotate-0'
                            }`}
                            aria-hidden="true"
                          />
                          {subEventCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded-full">
                              {subEventCount}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 text-gray-300">
                          <ChevronRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      )}

                      {/* Key info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {row.id}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_STYLES[row.status]
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {row.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        ${row.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{row.asset}</p>
                    </div>
                  </div>

                  {/* Mobile secondary row info */}
                  <div className="flex items-center gap-2 mt-2 ml-11">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        TYPE_STYLES[row.type]
                      }`}
                    >
                      {row.type}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {row.reference}
                    </span>
                  </div>
                </div>

                {/* Mobile expanded sub-events */}
                {isExpanded && hasSubEvents && (
                  <div
                    id={`sub-events-mobile-${row.id}`}
                    className="bg-blue-50/20 border-l-4 border-l-blue-400 px-4 py-3"
                    role="region"
                    aria-label={`Sub-events for ${row.id}`}
                  >
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                      Sub-events ({subEventCount})
                    </p>
                    <div className="space-y-2">
                      {row.subEvents!.map((subEvent) => (
                        <div
                          key={subEvent.id}
                          className="bg-white rounded-md border border-blue-100 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {subEvent.date}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {subEvent.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              ${subEvent.amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              {subEvent.id}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {subEventCount > 10 && (
                      <p className="text-xs text-blue-600 text-center mt-2">
                        Showing all {subEventCount} sub-events
                      </p>
                    )}
                  </div>
                )}

                {/* Mobile expanded — empty sub-events */}
                {isExpanded && hasEmptySubEvents && (
                  <div
                    id={`sub-events-mobile-${row.id}`}
                    className="bg-blue-50/20 border-l-4 border-l-blue-400 px-4 py-5 text-center"
                    role="region"
                    aria-label={`Sub-events for ${row.id}`}
                  >
                    <svg
                      className="w-8 h-8 text-blue-300 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                    <p
                      className="text-sm text-gray-500 mt-2"
                      id={`empty-hint-mobile-${row.id}`}
                    >
                      No related events for this entry.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          {/* Mobile pagination */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 self-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, MOCK_ENTRIES.length)} of{' '}
                {MOCK_ENTRIES.length} results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={
                        page === currentPage ? 'page' : undefined
                      }
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
