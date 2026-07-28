import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import { PayoutDrillDownPanel } from '../components/PayoutDrillDownPanel';
import { PayoutDetail } from '../components/PayoutDrillDownPanel/PayoutDrillDownPanel.types';

// Mock dataset of payouts for operations staff
export const MOCK_PAYOUTS: PayoutDetail[] = [
  {
    id: 'PO-2026-004',
    payoutNumber: 'Payout #PO-2026-004',
    date: 'Jul 24, 2026',
    time: '14:32:00 UTC',
    status: 'completed',
    grossAmount: 124500.0,
    netAmount: 121387.5,
    protocolFeeUsd: 3112.5,
    currency: 'USD',
    offeringName: 'Nexus Cloud Series A',
    offeringId: 'OFF-NX-001',
    gasFeeUsd: 42.15,
    gasFeeEth: 0.0125,
    gasPriceGwei: 24.5,
    estimatedGasUsd: 45.0,
    estimatedGasPriceGwei: 26.0,
    executionNetwork: 'Ethereum Mainnet',
    blockNumber: 20485912,
    contractAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    transactionHash: '0x3a91b8d8f92147e8c1b3f94017e849204b1239840291487214981d2938174092',
    recipientsCount: 48,
    recipients: [
      {
        id: 'rec-1',
        walletAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
        name: 'Apex Growth Fund',
        tier: 'Institutional',
        sharePercentage: 18.5,
        amount: 22456.68,
        status: 'success',
        gasAllocatedGwei: 24.5,
      },
      {
        id: 'rec-2',
        walletAddress: '0x388C815CA8B9251b393131C08a7369585673b212',
        name: 'Vanguard Capital',
        tier: 'Series A Lead',
        sharePercentage: 12.0,
        amount: 14566.5,
        status: 'success',
        gasAllocatedGwei: 24.5,
      },
      {
        id: 'rec-3',
        walletAddress: '0x17694323A3EFD57898cf85465e11178864390928',
        name: 'Sora Ventures',
        tier: 'Angel',
        sharePercentage: 5.5,
        amount: 6676.31,
        status: 'success',
        gasAllocatedGwei: 24.5,
      },
    ],
    retries: [
      {
        id: 'ret-1',
        timestamp: 'Jul 24, 2026 14:32:00 UTC',
        attemptNumber: 1,
        status: 'success',
        reason: 'Smart contract batch execution finalized successfully.',
        txHash: '0x3a91b8d8f92147e8c1b3f94017e849204b1239840291487214981d2938174092',
        gasUsedGwei: 24.5,
      },
    ],
    nextPayoutDate: 'Aug 24, 2026',
    nextPayoutEstimateUsd: 130000.0,
    nextPayoutLink: '/startup/report-revenue',
  },
  {
    id: 'PO-2026-003',
    payoutNumber: 'Payout #PO-2026-003',
    date: 'Jun 24, 2026',
    time: '10:15:22 UTC',
    status: 'failed',
    grossAmount: 98000.0,
    netAmount: 95550.0,
    protocolFeeUsd: 2450.0,
    currency: 'USD',
    offeringName: 'AeroDynamics AI',
    offeringId: 'OFF-AD-002',
    gasFeeUsd: 88.4,
    gasFeeEth: 0.0265,
    gasPriceGwei: 78.2,
    estimatedGasUsd: 50.0,
    estimatedGasPriceGwei: 35.0,
    executionNetwork: 'Ethereum Mainnet',
    blockNumber: 20241088,
    contractAddress: '0xB47e3cd837dDF8e4A57F05d70Ab865de6e193BBB',
    transactionHash: '0xfe89012389140912409128094182409182409128049128049128490128409128',
    recipientsCount: 32,
    recipients: [
      {
        id: 'rec-4',
        walletAddress: '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c',
        name: 'Horizon Partners',
        tier: 'Institutional',
        sharePercentage: 25.0,
        amount: 23887.5,
        status: 'failed',
        gasAllocatedGwei: 78.2,
      },
      {
        id: 'rec-5',
        walletAddress: '0x0000000000000000000000000000000000000000',
        name: 'Null Address Error',
        tier: 'Standard',
        sharePercentage: 1.0,
        amount: 955.5,
        status: 'failed',
        gasAllocatedGwei: 78.2,
      },
    ],
    retries: [
      {
        id: 'ret-2',
        timestamp: 'Jun 24, 2026 10:15:22 UTC',
        attemptNumber: 1,
        status: 'failed',
        reason: 'Gas price spike exceeded max slippage tolerance (OUT_OF_GAS).',
        errorDetails: 'Error: VM Exception while processing transaction: revert OUT_OF_GAS_LIMIT_EXCEEDED at 0x71C... (78.2 Gwei)',
        txHash: '0xfe89012389140912409128094182409182409128049128049128490128409128',
        gasUsedGwei: 78.2,
      },
    ],
    nextPayoutDate: 'Jul 28, 2026 (Retry Scheduled)',
    nextPayoutEstimateUsd: 98000.0,
    nextPayoutLink: '/startup/report-revenue',
  },
  {
    id: 'PO-2026-002',
    payoutNumber: 'Payout #PO-2026-002',
    date: 'May 24, 2026',
    time: '16:00:10 UTC',
    status: 'processing',
    grossAmount: 110000.0,
    netAmount: 107250.0,
    protocolFeeUsd: 2750.0,
    currency: 'USD',
    offeringName: 'BioHealth Tech',
    offeringId: 'OFF-BH-003',
    gasFeeUsd: 28.5,
    gasFeeEth: 0.0085,
    gasPriceGwei: 18.0,
    estimatedGasUsd: 30.0,
    estimatedGasPriceGwei: 20.0,
    executionNetwork: 'Arbitrum One',
    blockNumber: 18921004,
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    transactionHash: '0x8872149182490128409128409128409128409128049128409128409128409128',
    recipientsCount: 22,
    recipients: [
      {
        id: 'rec-6',
        walletAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        name: 'BioCap Syndicate',
        tier: 'Syndicate',
        sharePercentage: 40.0,
        amount: 42900.0,
        status: 'pending',
        gasAllocatedGwei: 18.0,
      },
    ],
    retries: [],
    nextPayoutDate: 'Jun 24, 2026',
    nextPayoutEstimateUsd: 115000.0,
    nextPayoutLink: '/startup/report-revenue',
  },
];

export const DistributionDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(
    searchParams.get('payoutId')
  );
  const [payoutsList, setPayoutsList] = useState<PayoutDetail[]>(MOCK_PAYOUTS);

  const rowRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Sync URL query param
  useEffect(() => {
    const paramId = searchParams.get('payoutId');
    if (paramId !== selectedPayoutId) {
      setSelectedPayoutId(paramId);
    }
  }, [searchParams]);

  const handleOpenPanel = (id: string) => {
    setSelectedPayoutId(id);
    setSearchParams({ payoutId: id });
  };

  const handleClosePanel = () => {
    setSelectedPayoutId(null);
    setSearchParams({});
  };

  const handleRetryBatch = (payoutId: string) => {
    setPayoutsList((prev) =>
      prev.map((p) => {
        if (p.id === payoutId) {
          return {
            ...p,
            status: 'processing',
            retries: [
              ...p.retries,
              {
                id: `ret-${Date.now()}`,
                timestamp: new Date().toISOString(),
                attemptNumber: p.retries.length + 1,
                status: 'success',
                reason: 'Ops staff triggered retry dispatch.',
                gasUsedGwei: 22.0,
              },
            ],
          };
        }
        return p;
      })
    );
  };

  const handleExportCsv = (payoutId: string) => {
    const payout = payoutsList.find((p) => p.id === payoutId);
    if (!payout) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Wallet,Name,Tier,Share%,Amount,Status']
        .concat(
          payout.recipients.map(
            (r) =>
              `${r.walletAddress},${r.name || ''},${r.tier},${r.sharePercentage},${r.amount},${r.status}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${payout.id}_recipients.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter payouts based on search and status
  const filteredPayouts = useMemo(() => {
    return payoutsList.filter((p) => {
      const matchesSearch =
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.offeringName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.payoutNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payoutsList, searchQuery, statusFilter]);

  const selectedPayoutData = useMemo(() => {
    return payoutsList.find((p) => p.id === selectedPayoutId) || null;
  }, [payoutsList, selectedPayoutId]);

  // Aggregate metrics
  const totalDistributed = useMemo(() => {
    return payoutsList.reduce((sum, p) => sum + p.netAmount, 0);
  }, [payoutsList]);

  const totalGasSpent = useMemo(() => {
    return payoutsList.reduce((sum, p) => sum + p.gasFeeUsd, 0);
  }, [payoutsList]);

  const failedCount = useMemo(() => {
    return payoutsList.filter((p) => p.status === 'failed').length;
  }, [payoutsList]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Distribution Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Monitor and audit on-chain RevenueShare payout cycles across your portfolio.
          </p>
        </div>

        <a
          href="/startup/report-revenue"
          className="payout-btn-primary self-start md:self-auto"
        >
          + Report Monthly Revenue
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="payout-metric-card" data-testid="kpi-total-distributed">
          <p className="payout-metric-label">Total Distributed</p>
          <p className="payout-metric-value">${totalDistributed.toLocaleString('en-US')}</p>
          <p className="payout-metric-subtext">Net investor allocations</p>
        </div>

        <div className="payout-metric-card" data-testid="kpi-active-payouts">
          <p className="payout-metric-label">Active Payout Cycles</p>
          <p className="payout-metric-value">{payoutsList.length}</p>
          <p className="payout-metric-subtext">Completed & in-flight</p>
        </div>

        <div className="payout-metric-card" data-testid="kpi-gas-spent">
          <p className="payout-metric-label">Total Gas Spent</p>
          <p className="payout-metric-value">${totalGasSpent.toFixed(2)}</p>
          <p className="payout-metric-subtext">Ethereum & Arbitrum L2</p>
        </div>

        <div className="payout-metric-card" data-testid="kpi-pending-retries">
          <p className="payout-metric-label">Failed Batches</p>
          <p className="payout-metric-value" style={{ color: failedCount > 0 ? '#ef4444' : '#10b981' }}>
            {failedCount}
          </p>
          <p className="payout-metric-subtext">Requires ops action</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="w-full sm:w-72">
          <input
            type="search"
            className="payout-search-input w-full"
            placeholder="Search payout ID, offering..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter payout history"
            data-testid="payout-dashboard-search"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label htmlFor="status-filter" className="text-xs text-muted font-medium">
            Status:
          </label>
          <select
            id="status-filter"
            className="payout-search-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            data-testid="payout-status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payout History Table */}
      {filteredPayouts.length > 0 ? (
        <div className="overflow-x-auto bg-slate-900/40 rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm border-collapse" data-testid="payout-table">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="p-4">Payout ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Offering</th>
                <th className="p-4">Gross Amount</th>
                <th className="p-4">Recipients</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayouts.map((payout) => {
                const isSelected = selectedPayoutId === payout.id;
                return (
                  <tr
                    key={payout.id}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/60' : ''
                    }`}
                    onClick={() => handleOpenPanel(payout.id)}
                  >
                    <td className="p-4 font-mono font-semibold text-white">
                      {payout.id}
                    </td>
                    <td className="p-4 text-slate-300">{payout.date}</td>
                    <td className="p-4 text-white font-medium">{payout.offeringName}</td>
                    <td className="p-4 font-semibold text-white">
                      ${payout.grossAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-300">{payout.recipientsCount} wallets</td>
                    <td className="p-4">
                      <span className={`payout-status-badge payout-status-badge--${payout.status}`}>
                        <span className="payout-status-dot" />
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        ref={(el) => (rowRefs.current[payout.id] = el)}
                        type="button"
                        className="payout-btn-secondary"
                        aria-expanded={isSelected}
                        aria-controls="payout-panel"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPanel(payout.id);
                        }}
                        data-testid={`inspect-payout-btn-${payout.id}`}
                      >
                        Inspect Details ↗
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : payoutsList.length === 0 ? (
        <EmptyState
          variant="distribution-dashboard"
          title="No distributions yet"
          description="When revenue is reported and payouts are processed, your distribution history will appear here."
          primaryAction={{
            label: 'Report Revenue',
            href: '/startup/report-revenue',
          }}
          secondaryAction={{
            label: 'Back to Discovery',
            href: '/investor/portal',
          }}
        />
      ) : (
        <div className="bg-slate-900/40 p-8 rounded-xl border border-slate-800 text-center">
          <p className="text-muted text-sm">No payouts match your search or filter criteria.</p>
          <button
            type="button"
            className="payout-btn-secondary mt-4"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Drill-down Side Panel */}
      <PayoutDrillDownPanel
        isOpen={Boolean(selectedPayoutId)}
        payoutId={selectedPayoutId}
        payoutData={selectedPayoutData}
        onClose={handleClosePanel}
        onRetryBatch={handleRetryBatch}
        onExportCsv={handleExportCsv}
        triggerRef={{ current: selectedPayoutId ? rowRefs.current[selectedPayoutId] || null : null }}
      />

      <ExitConfirmationModal
        isOpen={blocker.state === 'blocked'}
        onStay={handleStay}
        onDiscard={handleDiscard}
        onSaveAndExit={handleSaveAndExit}
      />
    </div>
  );
};

