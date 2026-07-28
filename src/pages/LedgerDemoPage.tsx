import React from 'react';
import LedgerTable from '../components/LedgerTable/LedgerTable';
import type { Column } from '../components/LedgerTable/LedgerTable';

interface LedgerEntry {
  id: string;
  date: string;
  type: 'investment' | 'payout' | 'distribution' | 'fee';
  amount: number;
  asset: string;
  status: 'confirmed' | 'pending' | 'failed';
  reference: string;
}

const MOCK_ENTRIES: LedgerEntry[] = Array.from({ length: 150 }, (_, i) => {
  const types: LedgerEntry['type'][] = ['investment', 'payout', 'distribution', 'fee'];
  const statuses: LedgerEntry['status'][] = ['confirmed', 'pending', 'failed'];
  return {
    id: `ENT-${String(i + 1).padStart(4, '0')}`,
    date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
    type: types[i % types.length],
    amount: Math.floor(Math.random() * 10000) / 100,
    asset: 'USDC',
    status: statuses[i % statuses.length],
    reference: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };
});

const columns: Column<LedgerEntry>[] = [
  {
    key: 'id',
    label: 'Entry ID',
    width: '110px',
    render: (r) => <span className="font-mono text-xs">{r.id}</span>,
  },
  {
    key: 'date',
    label: 'Date',
    width: '120px',
    render: (r) => r.date,
  },
  {
    key: 'type',
    label: 'Type',
    width: '120px',
    render: (r) => (
      <span
        className={`lt-type-badge lt-type-badge--${r.type}`}
      >
        {r.type}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    width: '120px',
    render: (r) =>
      r.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
  {
    key: 'asset',
    label: 'Asset',
    width: '80px',
    render: (r) => r.asset,
  },
  {
    key: 'status',
    label: 'Status',
    width: '110px',
    render: (r) => (
      <span className={`lt-status lt-status--${r.status}`}>
        {r.status}
      </span>
    ),
  },
  {
    key: 'reference',
    label: 'Reference',
    render: (r) => <span className="font-mono text-xs text-muted">{r.reference}</span>,
  },
];

function DetailContent({ row }: { row: LedgerEntry }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-muted">Entry ID</span>
          <p className="text-sm font-medium">{row.id}</p>
        </div>
        <div>
          <span className="text-xs text-muted">Date</span>
          <p className="text-sm font-medium">{row.date}</p>
        </div>
        <div>
          <span className="text-xs text-muted">Type</span>
          <p className="text-sm font-medium">{row.type}</p>
        </div>
        <div>
          <span className="text-xs text-muted">Amount</span>
          <p className="text-sm font-medium">
            {row.amount.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted">Status</span>
          <p className="text-sm font-medium">{row.status}</p>
        </div>
        <div>
          <span className="text-xs text-muted">Reference</span>
          <p className="text-sm font-mono text-xs">{row.reference}</p>
        </div>
      </div>
    </div>
  );
}

export const LedgerDemoPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ledger Entries</h1>
        <p className="text-muted text-sm mt-1">
          Browse all ledger entries with virtualized rows, customizable columns,
          and density controls.
        </p>
      </div>

      <LedgerTable
        data={MOCK_ENTRIES}
        columns={columns}
        rowKey={(r) => r.id}
        rowDetail={(row) => <DetailContent row={row} />}
        pageSize={50}
        defaultDensity="normal"
        ariaLabel="Ledger entries table"
        groupableColumns={[
          { key: 'date', label: 'Date' },
          { key: 'type', label: 'Type' },
          { key: 'status', label: 'Status' }
        ]}
        renderGroupHeader={(value, items) => {
          const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
          return (
            <span className="font-medium flex items-center gap-4">
              <span>{value}</span>
              <span className="text-muted text-sm">({items.length} items)</span>
              <span className="text-sm font-mono bg-black/10 px-2 py-0.5 rounded ml-4">
                Total: {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </span>
          );
        }}
      />
    </div>
  );
};

export default LedgerDemoPage;
