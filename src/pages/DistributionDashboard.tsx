import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { LockupClaimModal } from '../components/LockupClaimModal';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import { UploadQueue } from '../components/UploadQueue';
import { useUploadQueue, type Uploader } from '../hooks/useUploadQueue';
import { FinancialTermsForm } from '../components/FinancialTermsForm';
import type { FinancialTermsField } from '../utils/financialTermsValidation';

export const DistributionDashboard: React.FC = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

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

export const DistributionDashboard: React.FC = () => {
  const {
    queue,
    addFiles,
    removeFile,
    retryFile,
    uploadFiles,
    clearComplete,
    totalCount,
    successCount,
    errorCount,
    uploadingCount,
    overallProgress,
  } = useUploadQueue();

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

        <a href="/startup/report-revenue" className="payout-btn-primary self-start md:self-auto">
          + Report Monthly Revenue
        </a>
      </div>

      {/* Filter Toolbar */}
      <DistributionFilterToolbar
        filters={filterState}
        onFilterChange={updateFiltersAndUrl}
        onResetFilters={handleResetFilters}
      />

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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
        <ThumbnailGrid
          files={uploadedFiles}
          onView={handleViewFile}
          onReplace={handleReplaceFile}
          onRemove={handleRemoveFile}
          onReorder={handleReorderFiles}
        />
      </div>

      {/* Governance Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Governance</h2>
        <a
          href="/startup/governance/proposals/create"
          className="payout-btn-primary"
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          + Create Proposal
        </a>
      </div>

      {/* Governance Proposal Detail */}
      <section aria-label="Governance proposal detail">
        <GovernanceProposalDetail
          proposal={{
            id: 'prop-1',
            title: 'Increase Developer Grant Fund',
            description:
              'A proposal to allocate an additional 500,000 tokens to the developer grant program to support ecosystem growth.',
            proposer: '0x1234...abcd',
            status: 'active',
            endTime: Date.now() + 86400000 * 3,
            quorumRequired: 4_000_000,
            quorumReached: 2_500_000,
            results: { for: 2000000, against: 450000, abstain: 50000 },
            participation: { turnout: 68.4, uniqueVoters: 142, delegates: 12 },
            userVote: null,
          }}
          onVote={(choice) => {
            console.log(`Vote cast: ${choice}`);
          }}
        />
      </section>

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
    </div>
  );
};
