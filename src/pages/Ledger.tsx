import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

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

const MOCK_ENTRIES: LedgerEntry[] = Array.from({ length: 50 }, (_, i) => {
  const types: LedgerEntry['type'][] = ['investment', 'payout', 'distribution', 'fee'];
  const statuses: LedgerEntry['status'][] = ['confirmed', 'pending', 'failed'];
  
  const hasSubEvents = i % 3 === 0;
  const subEvents = hasSubEvents ? [
    { id: `SUB-${i}-1`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Split', amount: 50 },
    { id: `SUB-${i}-2`, date: new Date(2025, 0, i + 1).toISOString().split('T')[0], type: 'Adjustment', amount: 25 },
  ] : undefined;

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

export const Ledger: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const totalPages = Math.ceil(MOCK_ENTRIES.length / pageSize);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return MOCK_ENTRIES.slice(start, start + pageSize);
  }, [currentPage]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
        <p className="text-muted text-sm mt-1">
          Detailed transaction history and ledger entries.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200" aria-label="Ledger entries table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <span className="sr-only">Expand</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pageData.map((row) => {
              const isExpanded = expandedRows.has(row.id);
              const hasSubEvents = row.subEvents && row.subEvents.length > 0;

              return (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {hasSubEvents ? (
                        <button
                          onClick={() => toggleRow(row.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-expanded={isExpanded}
                          aria-controls={`sub-events-${row.id}`}
                          aria-label={isExpanded ? "Collapse row" : "Expand row"}
                        >
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-gray-200 cursor-not-allowed focus:outline-none"
                          aria-expanded={false}
                          aria-label="No related events"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{row.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{row.status}</td>
                  </tr>
                  
                  {isExpanded && hasSubEvents && (
                    <tr id={`sub-events-${row.id}`} className="bg-gray-50">
                      <td colSpan={5} className="px-10 py-4">
                        <table className="min-w-full divide-y divide-gray-200 bg-white border border-gray-200 rounded-md" aria-label={`Sub-events for ${row.id}`}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-event Date</th>
                              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {row.subEvents!.map((subEvent) => (
                              <tr key={subEvent.id}>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">{subEvent.date}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">{subEvent.type}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">${subEvent.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                  {isExpanded && !hasSubEvents && (
                    <tr id={`sub-events-${row.id}`} className="bg-gray-50">
                      <td colSpan={5} className="px-10 py-4 text-sm text-gray-500 text-center">
                        No related events found.
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, MOCK_ENTRIES.length)}</span> of <span className="font-medium">{MOCK_ENTRIES.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
