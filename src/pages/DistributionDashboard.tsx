import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import { KycResubmissionTimeline } from '../components/KycResubmissionTimeline';
import { GovernanceResults } from '../components/designSystem/GovernanceResults';
import { DocumentUploadStatus } from '../components/DocumentUploadStatus';
import {
  DistributionFilterToolbar,
  DistributionFilterState,
} from '../components/DistributionFilterToolbar';
import { PayoutDrillDownPanel } from '../components/PayoutDrillDownPanel';
import { MultiIssuerComparisonView } from './MultiIssuerComparisonView';
import {
  ExtendedPayoutDetail,
  MOCK_PAYOUTS,
  MOCK_COMPARISON_ISSUERS,
  IssuerComparisonData,
} from './DistributionDashboard.types';

export const DistributionDashboard: React.FC = () => {
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

  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(
    searchParams.get('payoutId')
  );
  const [payoutsList, setPayoutsList] = useState<ExtendedPayoutDetail[]>(MOCK_PAYOUTS);

  const rowRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const updateFiltersAndUrl = useCallback(
    (newState: DistributionFilterState) => {
      setFilterState(newState);

      const params: Record<string, string> = {};
      if (newState.searchQuery) params.search = newState.searchQuery;
      if (newState.dateRange !== 'all') params.date = newState.dateRange;
      if (newState.issuer !== 'all' && newState.issuer !== 'All Issuers') params.issuer = newState.issuer;
      if (newState.region !== 'all' && newState.region !== 'All Regions') params.region = newState.region;
      if (newState.status !== 'all' && newState.status !== 'All Statuses') params.status = newState.status;
      if (newState.segmentBy !== 'none') params.segment = newState.segmentBy;
      if (newState.compareMode) params.compare = 'true';
      if (selectedPayoutId) params.payoutId = selectedPayoutId;

      setSearchParams(params);
    },
    [selectedPayoutId, setSearchParams]
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

      {/* Segmented Comparison View */}
      {segmentedData && (
        <div data-testid="segmented-compare-container" className="space-y-4">
          <h2 className="text-xl font-semibold">Segmented Comparison</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(segmentedData).map(([key, group]) => (
              <div
                key={key}
                data-testid={`segmented-card-${key}`}
                className="glass-card p-4 space-y-2"
              >
                <h3 className="text-sm font-semibold text-main">{key}</h3>
                <p className="text-xs text-muted">{group.count} payout{group.count !== 1 ? 's' : ''}</p>
                <p className="text-lg font-bold">
                  ${group.totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout Table */}
      {filteredPayouts.length > 0 && (
        <div className="glass-card overflow-hidden" data-testid="payout-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="p-4 text-muted font-medium">Payout ID</th>
                  <th className="p-4 text-muted font-medium">Offering</th>
                  <th className="p-4 text-muted font-medium">Region</th>
                  <th className="p-4 text-muted font-medium">Status</th>
                  <th className="p-4 text-muted font-medium">Net Amount</th>
                  <th className="p-4 text-muted font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-[var(--glass-border)] last:border-0">
                    <td className="p-4 font-mono text-xs">{payout.id}</td>
                    <td className="p-4">{payout.offeringName}</td>
                    <td className="p-4">{payout.region}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          payout.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : payout.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : payout.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-4">
                      ${payout.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        className="payout-btn-secondary text-xs py-1 px-3"
                        onClick={() => handleOpenPanel(payout.id)}
                        data-testid={`inspect-payout-btn-${payout.id}`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPayouts.length === 0 && (
        <div data-testid="empty-results">
          <EmptyState
            variant="distribution-dashboard"
            title="No distributions yet"
            description="No payouts match your search or active filter criteria."
            primaryAction={{
              label: 'Reset Filters',
              onClick: handleResetFilters,
            }}
          />
          <button
            type="button"
            className="payout-btn-primary mt-4"
            onClick={handleResetFilters}
            data-testid="empty-reset-filters-btn"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Multi-Issuer Comparison View */}
      <MultiIssuerComparisonView availableIssuers={MOCK_COMPARISON_ISSUERS} />

      {/* Document Upload Status */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Recent Uploads Queue</h2>
        <DocumentUploadStatus fileName="Q3_Revenue_Report.pdf" status="clean" />
        <DocumentUploadStatus fileName="Financial_Audit_2023.pdf" status="scanning" />
        <DocumentUploadStatus fileName="K-1_Distribution_Schedule.xlsx" status="validating" />
        <DocumentUploadStatus
          fileName="Unrecognized_Document.docx"
          status="quarantined"
          auditNote="Flagged for manual review due to missing digital signature."
          remediationUrl="/support/documents/quarantine"
        />
        <DocumentUploadStatus
          fileName="malicious_payload.exe"
          status="rejected"
          auditNote="Malware signature detected. Upload blocked."
        />
      </div>
      <KycResubmissionTimeline
        status="under-review"
        submittedAt="2026-07-24T10:30:00Z"
        reviewStartedAt="2026-07-27T08:00:00Z"
        holidays={['2026-07-27']}
      <GovernanceResults
        results={{ for: 2500000, against: 450000, abstain: 50000 }}
        participation={{ turnout: 68.4, uniqueVoters: 142, delegates: 12 }}
        status="passed"
      />

      {/* Drill-down Panel */}
      <PayoutDrillDownPanel
        isOpen={selectedPayoutId !== null}
        payoutId={selectedPayoutId}
        payoutData={selectedPayoutData}
        onClose={handleClosePanel}
        onRetryBatch={handleRetryBatch}
        onExportCsv={handleExportCsv}
      />
    </div>
  );
};
