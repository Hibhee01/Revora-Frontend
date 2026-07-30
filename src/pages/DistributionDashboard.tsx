import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminHero } from '../components/AdminHero';
import type { AdminTileData, IncidentData } from '../components/AdminHero';
import { Button } from '../components/Button';
import { LockupClaimModal } from '../components/LockupClaimModal';
import { EmptyState } from '../components/designSystem/EmptyState';
import { KycResubmissionTimeline } from '../components/KycResubmissionTimeline';
import { GovernanceResults } from '../components/designSystem/GovernanceResults';
import { DocumentUploadStatus } from '../components/DocumentUploadStatus';
import type { DistributionFilterState } from '../components/DistributionFilterToolbar/DistributionFilterToolbar.types';
import type { PayoutDetail, RecipientItem, RetryEvent } from '../components/PayoutDrillDownPanel/PayoutDrillDownPanel.types';
import { ErrorRateSparklineTile } from '../components/ErrorRateSparklineTile/ErrorRateSparklineTile';
import type { ErrorRateDataPoint } from '../components/ErrorRateSparklineTile/ErrorRateSparklineTile';
import { GovernanceDelegation } from '../components/GovernanceDelegation/GovernanceDelegation';
import { RevenuePayoutChart, RevenuePayoutDataPoint } from '../components/RevenuePayoutChart/RevenuePayoutChart';
import { BlacklistBulkRemoveConfirm, BlacklistEntry } from '../components/BlacklistBulkRemoveConfirm/BlacklistBulkRemoveConfirm';
import { GovernanceProposalDetail, type ProposalData } from '../components/designSystem/GovernanceProposalDetail';
import { UploadQueue } from '../components/UploadQueue/UploadQueue';
import { useUploadQueue, type Uploader } from '../hooks/useUploadQueue';

interface ExtendedPayoutDetail extends PayoutDetail {
  region: string;
}

const MOCK_RECIPIENTS_BASE: RecipientItem[] = [
  { id: 'r1', walletAddress: 'GA…abcd', name: 'Alice', tier: 'Gold', sharePercentage: 40, amount: 40000, status: 'success', gasAllocatedGwei: 18 },
  { id: 'r2', walletAddress: 'GB…ef01', name: 'Bob', tier: 'Silver', sharePercentage: 30, amount: 30000, status: 'success', gasAllocatedGwei: 18 },
  { id: 'r3', walletAddress: 'GC…2345', name: 'Carol', tier: 'Bronze', sharePercentage: 20, amount: 20000, status: 'success', gasAllocatedGwei: 18 },
  { id: 'r4', walletAddress: 'GD…6789', name: 'Dave', tier: 'Bronze', sharePercentage: 10, amount: 10000, status: 'pending', gasAllocatedGwei: 18 },
];

const MOCK_RETRIES: RetryEvent[] = [
  { id: 'ret-1', timestamp: '2026-07-20T10:00:00Z', attemptNumber: 1, status: 'failed', reason: 'Gas estimation underrun.', gasUsedGwei: 21 },
  { id: 'ret-2', timestamp: '2026-07-21T14:30:00Z', attemptNumber: 2, status: 'success', reason: 'Retry with adjusted gas.', gasUsedGwei: 22 },
];

const MOCK_PAYOUTS: ExtendedPayoutDetail[] = [
  {
    id: 'PO-2026-004', payoutNumber: 'PO-2026-004', date: '2026-07-15', time: '14:30 UTC',
    status: 'completed', grossAmount: 105000, netAmount: 100000, protocolFeeUsd: 5000,
    currency: 'USDC', offeringName: 'Nexus Cloud Series A', offeringId: 'off-nexus-001',
    gasFeeUsd: 42.50, gasFeeEth: 0.018, gasPriceGwei: 22, estimatedGasUsd: 45, estimatedGasPriceGwei: 24,
    executionNetwork: 'Stellar', blockNumber: 8912345, contractAddress: '0x…789A', transactionHash: '0x…DEF0',
    recipientsCount: 4, recipients: MOCK_RECIPIENTS_BASE, retries: [],
    region: 'North America', nextPayoutDate: '2026-08-15', nextPayoutEstimateUsd: 105000, nextPayoutLink: '/startup/distributions?payoutId=PO-2026-005',
  },
  {
    id: 'PO-2026-003', payoutNumber: 'PO-2026-003', date: '2026-07-10', time: '09:15 UTC',
    status: 'failed', grossAmount: 82000, netAmount: 78000, protocolFeeUsd: 4000,
    currency: 'USDC', offeringName: 'AeroDynamics Fund II', offeringId: 'off-aero-002',
    gasFeeUsd: 38.20, gasFeeEth: 0.016, gasPriceGwei: 21, estimatedGasUsd: 40, estimatedGasPriceGwei: 23,
    executionNetwork: 'Stellar', blockNumber: 8901234, contractAddress: '0x…456B', transactionHash: '0x…789C',
    recipientsCount: 4, recipients: MOCK_RECIPIENTS_BASE, retries: MOCK_RETRIES,
    region: 'Europe', nextPayoutDate: '2026-08-10', nextPayoutEstimateUsd: 85000, nextPayoutLink: '/startup/distributions?payoutId=PO-2026-005',
  },
];

const MOCK_REVENUE_PAYOUT_DATA: RevenuePayoutDataPoint[] = [
  { period: 'Jan', revenue: 95000, payout: 90000 },
  { period: 'Feb', revenue: 110000, payout: 105000 },
  { period: 'Mar', revenue: 105000, payout: 95000 },
  { period: 'Apr', revenue: 125000, payout: 115000 },
  { period: 'May', revenue: 140000, payout: 130000 },
  { period: 'Jun', revenue: 135000, payout: 125000 },
];

const ERROR_RATE_BY_ISSUER: Array<{
  id: string; title: string; value: string; rate: number; delta: number;
  sparklineData: ErrorRateDataPoint[]; filterValue: string;
}> = [
  {
    id: 'issuer-acme', title: 'ERROR RATE', value: '2.4%', rate: 2.4, delta: -0.8,
    sparklineData: [
      { label: 'W1', value: 3.2 }, { label: 'W2', value: 2.8 },
      { label: 'W3', value: 3.5 }, { label: 'W4', value: 2.4 },
    ],
    filterValue: 'Nexus Cloud Series A',
  },
  {
    id: 'issuer-nexus', title: 'ERROR RATE', value: '4.1%', rate: 4.1, delta: 1.2,
    sparklineData: [
      { label: 'W1', value: 2.9 }, { label: 'W2', value: 3.3 },
      { label: 'W3', value: 3.8 }, { label: 'W4', value: 4.1 },
    ],
    filterValue: 'AeroDynamics Fund II',
  },
  {
    id: 'issuer-aero', title: 'ERROR RATE', value: '1.2%', rate: 1.2, delta: -0.3,
    sparklineData: [
      { label: 'W1', value: 1.5 }, { label: 'W2', value: 1.8 },
      { label: 'W3', value: 1.3 }, { label: 'W4', value: 1.2 },
    ],
    filterValue: 'StellarTech Ventures',
  },
  {
    id: 'issuer-stellar', title: 'ERROR RATE', value: '3.7%', rate: 3.7, delta: 0.5,
    sparklineData: [
      { label: 'W1', value: 3.2 }, { label: 'W2', value: 3.4 },
      { label: 'W3', value: 3.6 }, { label: 'W4', value: 3.7 },
    ],
    filterValue: 'Quantum Labs',
  },
];

const ERROR_RATE_BY_REGION: Array<{
  id: string; title: string; value: string; rate: number; delta: number;
  sparklineData: ErrorRateDataPoint[]; filterValue: string;
}> = [
  {
    id: 'region-na', title: 'ERROR RATE', value: '2.8%', rate: 2.8, delta: 0.4,
    sparklineData: [
      { label: 'W1', value: 2.4 }, { label: 'W2', value: 2.6 },
      { label: 'W3', value: 2.7 }, { label: 'W4', value: 2.8 },
    ],
    filterValue: 'North America',
  },
  {
    id: 'region-eu', title: 'ERROR RATE', value: '1.9%', rate: 1.9, delta: -0.6,
    sparklineData: [
      { label: 'W1', value: 2.5 }, { label: 'W2', value: 2.3 },
      { label: 'W3', value: 2.0 }, { label: 'W4', value: 1.9 },
    ],
    filterValue: 'Europe',
  },
  {
    id: 'region-apac', title: 'ERROR RATE', value: '3.5%', rate: 3.5, delta: 0.9,
    sparklineData: [
      { label: 'W1', value: 2.6 }, { label: 'W2', value: 2.9 },
      { label: 'W3', value: 3.2 }, { label: 'W4', value: 3.5 },
    ],
    filterValue: 'Asia Pacific',
  },
  {
    id: 'region-latam', title: 'ERROR RATE', value: '2.1%', rate: 2.1, delta: -0.2,
    sparklineData: [
      { label: 'W1', value: 2.3 }, { label: 'W2', value: 2.2 },
      { label: 'W3', value: 2.2 }, { label: 'W4', value: 2.1 },
    ],
    filterValue: 'Latin America',
  },
];

const SAMPLE_TILES: AdminTileData[] = [
  {
    id: 'api-latency',
    label: 'API Latency',
    value: '42ms',
    status: 'healthy',
    detail: 'Avg response time – p95 under 100ms',
    href: '/admin/api-latency',
  },
  {
    id: 'relay-health',
    label: 'On-Chain Relay',
    value: 'Connected',
    status: 'healthy',
    detail: 'Last confirmed block: 2s ago',
    href: '/admin/relay-health',
  },
  {
    id: 'open-alerts',
    label: 'Open Alerts',
    value: '3',
    status: 'degraded',
    detail: '2 medium, 1 low severity',
    href: '/admin/alerts',
  },
  {
    id: 'compliance-holds',
    label: 'Compliance Holds',
    value: '1',
    status: 'outage',
    detail: 'Identity reverification required for investor KYB-042',
    href: '/admin/compliance',
  },
];

const SAMPLE_INCIDENT: IncidentData | null = null;

const GOVERNANCE_PROPOSAL: ProposalData = {
  id: 'prop-1',
  title: 'Increase Developer Grant Fund',
  description:
    'A proposal to allocate an additional 500,000 tokens to the developer grant program to support ecosystem growth and accelerate protocol contributor onboarding.',
  proposer: '0x1234...abcd',
  status: 'active',
  endTime: Date.now() + 86_400_000 * 3,
  quorumRequired: 4_000_000,
  quorumReached: 2_500_000,
  results: { for: 2_000_000, against: 450_000, abstain: 50_000 },
  participation: { turnout: 68.4, uniqueVoters: 142, delegates: 12 },
  userVote: null,
};

const mockUploader: Uploader = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const total = 100;
    const tick = () => {
      const next = Math.min(total, progress + 20);
      progress = next;
      onProgress(next);
      if (next >= total) {
        resolve();
      } else {
        window.setTimeout(tick, 120);
      }
    };

    let progress = 0;
    if (file.name.toLowerCase().includes('fail')) {
      reject(new Error('Network unavailable'));
      return;
    }

    window.setTimeout(tick, 120);
  });
};

export const DistributionDashboard: React.FC = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(true);
  const [isBulkRemoveModalOpen, setIsBulkRemoveModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const preopenTargetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(9, 0, 0, 0);
    return d;
  }, []);

  const [filterState, setFilterState] = useState<DistributionFilterState>(() => {
    return {
      searchQuery: searchParams.get('search') || '',
      dateRange: (searchParams.get('date') as any) || 'all',
      issuer: searchParams.get('issuer') || 'all',
      region: searchParams.get('region') || 'all',
      status: searchParams.get('status') || 'all',
      segmentBy: (searchParams.get('segment') as any) || 'none',
      compareMode: searchParams.get('compare') === 'true',
    };
  });



  const handleUploadAll = useCallback(() => {
    uploadFiles(mockUploader);
  }, [uploadFiles]);

  const handleRetry = useCallback(
    (id: string, uploader: Uploader) => {
      retryFile(id, uploader);
    },
    [retryFile],
  );

  const handleResetFilters = useCallback(() => {
    const defaultState: DistributionFilterState = {
      searchQuery: '',
      dateRange: 'all',
      issuer: 'all',
      region: 'all',
      status: 'all',
      segmentBy: 'none',
      compareMode: false,
    };
    updateFiltersAndUrl(defaultState);
  }, [updateFiltersAndUrl]);

  const handleOpenPanel = (id: string) => {
    setSelectedPayoutId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('payoutId', id);
    setSearchParams(newParams);
  };

  const handleClosePanel = () => {
    setSelectedPayoutId(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('payoutId');
    setSearchParams(newParams);
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

  const filteredPayouts = useMemo(() => {
    return payoutsList.filter((p) => {
      const search = filterState.searchQuery.toLowerCase();
      if (
        search &&
        !p.id.toLowerCase().includes(search) &&
        !p.offeringName.toLowerCase().includes(search) &&
        !p.payoutNumber.toLowerCase().includes(search)
      ) {
        return false;
      }

      if (
        filterState.issuer !== 'all' &&
        filterState.issuer !== 'All Issuers' &&
        p.offeringName !== filterState.issuer
      ) {
        return false;
      }

      if (
        filterState.region !== 'all' &&
        filterState.region !== 'All Regions' &&
        p.region !== filterState.region
      ) {
        return false;
      }

      if (
        filterState.status !== 'all' &&
        filterState.status !== 'All Statuses' &&
        p.status !== filterState.status
      ) {
        return false;
      }

      return true;
    });
  }, [payoutsList, filterState]);

  const segmentedData = useMemo(() => {
    const effectiveSegment =
      filterState.segmentBy !== 'none'
        ? filterState.segmentBy
        : filterState.compareMode
        ? 'region'
        : 'none';

    if (effectiveSegment === 'none') return null;

    const groups: {
      [key: string]: { count: number; totalDistributed: number; payouts: ExtendedPayoutDetail[] };
    } = {};

    filteredPayouts.forEach((p) => {
      let key = 'Other';
      if (effectiveSegment === 'region') key = p.region || 'Other';
      if (effectiveSegment === 'offering') key = p.offeringName;
      if (effectiveSegment === 'status') key = p.status.toUpperCase();
      if (effectiveSegment === 'tier') key = p.tier || 'Standard';

      if (!groups[key]) {
        groups[key] = { count: 0, totalDistributed: 0, payouts: [] };
      }
      groups[key].count += 1;
      groups[key].totalDistributed += p.netAmount;
      groups[key].payouts.push(p);
    });

    return groups;
  }, [filteredPayouts, filterState.segmentBy, filterState.compareMode]);

  const selectedPayoutData = useMemo(() => {
    return payoutsList.find((p) => p.id === selectedPayoutId) || null;
  }, [payoutsList, selectedPayoutId]);

  const totalDistributed = useMemo(() => {
    return filteredPayouts.reduce((sum, p) => sum + p.netAmount, 0);
  }, [filteredPayouts]);

  const totalGasSpent = useMemo(() => {
    return filteredPayouts.reduce((sum, p) => sum + p.gasFeeUsd, 0);
  }, [filteredPayouts]);

  const failedCount = useMemo(() => {
    return filteredPayouts.filter((p) => p.status === 'failed').length;
  }, [filteredPayouts]);

  const activePayouts = useMemo(() => {
    return filteredPayouts.filter((p) => p.status === 'processing' || p.status === 'scheduled').length;
  }, [filteredPayouts]);

  const pendingRetries = useMemo(() => {
    return filteredPayouts.reduce((sum, p) => sum + p.retries.filter((r) => r.status === 'failed').length, 0);
  }, [filteredPayouts]);

  const handlePreopenOptIn = useCallback(() => {
    console.log('User opted in for redemption window reminder');
  }, []);

  const handlePreopenDismiss = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <AdminHero
        tiles={SAMPLE_TILES}
        incident={SAMPLE_INCIDENT}
        onDismissIncident={(id) => {
          console.log('Dismissed incident:', id);
        }}
      />
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {!bannerDismissed && (
        <PreOpenBanner
          targetDate={preopenTargetDate}
          onOptIn={handlePreopenOptIn}
          onDismiss={handlePreopenDismiss}
        />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Distribution Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Monitor and audit on-chain RevenueShare payout cycles across your portfolio.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 self-start md:self-auto">
          <div className="glass-card px-4 py-2 flex flex-col items-end">
            <span className="text-xs text-muted uppercase">Delegated Power</span>
            <span className="text-sm font-bold text-white">0 VP</span>
          </div>
          <button 
            onClick={() => setIsBulkRemoveModalOpen(true)}
            className="rounded px-4 py-2 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            Bulk Remove Test
          </button>
          <a href="/startup/report-revenue" className="payout-btn-primary">
            + Report Monthly Revenue
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <DistributionFilterToolbar
        filters={filterState}
        onFilterChange={updateFiltersAndUrl}
        onResetFilters={handleResetFilters}
      />

      <section aria-labelledby="governance-proposal-heading" className="glass-card p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Governance</p>
            <h2 id="governance-proposal-heading" className="text-xl font-semibold text-white">
              Proposal Detail
            </h2>
          </div>
          <p className="text-sm text-muted max-w-2xl">
            Review quorum, support, and the latest vote distribution before casting your decision.
          </p>
        </div>
        <GovernanceProposalDetail proposal={GOVERNANCE_PROPOSAL} />
      </section>

      <section aria-labelledby="upload-queue-heading" className="glass-card p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Documents</p>
            <h2 id="upload-queue-heading" className="text-xl font-semibold text-white">
              Batch Upload Queue
            </h2>
          </div>
          <p className="text-sm text-muted max-w-2xl">
            Track each document’s progress, retry failures, and remove completed or cancelled files.
          </p>
        </div>
        <UploadQueue
          queue={queue}
          onAddFiles={addFiles}
          onRemove={removeFile}
          onRetry={handleRetry}
          onUploadAll={handleUploadAll}
          onClearComplete={clearComplete}
          totalCount={totalCount}
          successCount={successCount}
          errorCount={errorCount}
          uploadingCount={uploadingCount}
          overallProgress={overallProgress}
          uploader={undefined}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        />
      </section>

      {/* Token Supply Configuration */}
      <div className="mt-8">
        <TokenSupplyBlock />
      </div>

      {/* KPI Summary Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        role="list"
        aria-label="Distribution key metrics"
      >
        <div role="listitem" data-testid="kpi-total-distributed">
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-muted text-xs font-medium uppercase tracking-wide">Total Distributed</span>
            <span className="text-2xl font-bold tracking-tight">
              ${totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div role="listitem" data-testid="kpi-active-payouts">
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-muted text-xs font-medium uppercase tracking-wide">Active Payouts</span>
            <span className="text-2xl font-bold tracking-tight">{activePayouts}</span>
          </div>
        </div>
        <div role="listitem" data-testid="kpi-gas-spent">
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-muted text-xs font-medium uppercase tracking-wide">Gas Spent</span>
            <span className="text-2xl font-bold tracking-tight">
              ${totalGasSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div role="listitem" data-testid="kpi-pending-retries">
          <div className="glass-card p-5 flex flex-col gap-2">
            <span className="text-muted text-xs font-medium uppercase tracking-wide">Pending Retries</span>
            <span className="text-2xl font-bold tracking-tight">{pendingRetries}</span>
          </div>
        </div>
      </div>

      {/* ── Revenue vs Payouts Chart ── */}
      <div className="mt-8">
        <RevenuePayoutChart data={MOCK_REVENUE_PAYOUT_DATA} revenueCurrency="USD" payoutCurrency="USD" />
      </div>

      {/* ── Payout Error Rate Sparkline Tiles ── */}
      <section aria-labelledby="error-rate-heading" data-testid="error-rate-section">
        <div className="flex items-center justify-between mb-4">
          <h2 id="error-rate-heading" className="text-xl font-semibold">
            Payout Error Rates
          </h2>
          <Link
            to="/startup/distributions?status=failed"
            className="text-xs text-primary hover:text-primary-hover transition-colors"
            data-testid="error-rate-view-all"
          >
            View all failed →
          </Link>
        </div>

        <div className="space-y-6">
          {/* By Issuer */}
          <div data-testid="error-rate-by-issuer">
            <h3 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">
              By Issuer
            </h3>
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              role="list"
              aria-label="Error rates by issuer"
            >
              {ERROR_RATE_BY_ISSUER.map((item) => (
                <div role="listitem" key={item.id}>
                  <ErrorRateSparklineTile
                    id={item.id}
                    title={item.title}
                    value={item.value}
                    rate={item.rate}
                    delta={item.delta}
                    sparklineData={item.sparklineData}
                    groupBy="issuer"
                    filterValue={item.filterValue}
                    href={`/startup/distributions?issuer=${encodeURIComponent(item.filterValue)}&status=failed`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* By Region */}
          <div data-testid="error-rate-by-region">
            <h3 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">
              By Region
            </h3>
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              role="list"
              aria-label="Error rates by region"
            >
              {ERROR_RATE_BY_REGION.map((item) => (
                <div role="listitem" key={item.id}>
                  <ErrorRateSparklineTile
                    id={item.id}
                    title={item.title}
                    value={item.value}
                    rate={item.rate}
                    delta={item.delta}
                    sparklineData={item.sparklineData}
                    groupBy="region"
                    filterValue={item.filterValue}
                    href={`/startup/distributions?region=${encodeURIComponent(item.filterValue)}&status=failed`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Governance Delegation */}
      <div className="mt-8">
        <GovernanceDelegation />
      </div>

      {/* Governance Results Breakdown */}
      <div className="mt-12">
        <GovernanceResults
          results={{ for: 124, against: 58, abstain: 18 }}
          participation={{ turnout: 63.5, uniqueVoters: 200, delegates: 12 }}
          status="passed"
        />
      </div>

      {/* Financial terms wizard step */}
      <section aria-labelledby="financial-terms-heading">
        <h2
          id="financial-terms-heading"
          style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-md)' }}
        >
          Configure Offering Terms
        </h2>
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <FinancialTermsForm
            onSubmit={(values: Record<FinancialTermsField, number>) => {
              // Replace with real API call
              console.log('Financial terms submitted:', values);
            }}
          />
        </div>
      </section>

      {/* Drill-down Panel */}
      <PayoutDrillDownPanel
        isOpen={selectedPayoutId !== null}
        payoutId={selectedPayoutId}
        payoutData={selectedPayoutData}
        onClose={handleClosePanel}
        onRetryBatch={handleRetryBatch}
        onExportCsv={handleExportCsv}
      />

      <LockupClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        unlockedAmount="$12,480.00"
        gasEstimate={22}
      />

      <BlacklistBulkRemoveConfirm
        isOpen={isBulkRemoveModalOpen}
        onClose={() => setIsBulkRemoveModalOpen(false)}
        entries={[
          { id: '1', value: '0x1234567890abcdef1234567890abcdef12345678', type: 'Wallet' },
          { id: '2', value: '192.168.1.100', type: 'IP' },
          { id: '3', value: 'bad-actor@example.com', type: 'Email' }
        ]}
        onConfirm={async (reason, initials) => {
          console.log('Confirmed bulk remove:', { reason, initials });
          // Mock API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }}
      />
    </div>
  );
};
