import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/designSystem/EmptyState';
import { GovernanceResults } from '../components/designSystem/GovernanceResults';

export const DistributionDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter state from URL search params
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

  // Sync state changes to URL search params
  const updateFiltersAndUrl = useCallback(
    (newState: DistributionFilterState) => {
      setFilterState(newState);

      const params: Record<string, string> = {};
      if (newState.searchQuery) params.search = newState.searchQuery;
      if (newState.dateRange !== 'all') params.date = newState.dateRange;
      if (newState.issuer !== 'all') params.issuer = newState.issuer;
      if (newState.region !== 'all') params.region = newState.region;
      if (newState.status !== 'all') params.status = newState.status;
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

  // Filter dataset based on all active filters
  const filteredPayouts = useMemo(() => {
    return payoutsList.filter((p) => {
      // Search
      const search = filterState.searchQuery.toLowerCase();
      if (
        search &&
        !p.id.toLowerCase().includes(search) &&
        !p.offeringName.toLowerCase().includes(search) &&
        !p.payoutNumber.toLowerCase().includes(search)
      ) {
        return false;
      }

      // Issuer
      if (
        filterState.issuer !== 'all' &&
        filterState.issuer !== 'All Issuers' &&
        p.offeringName !== filterState.issuer
      ) {
        return false;
      }

      // Region
      if (
        filterState.region !== 'all' &&
        filterState.region !== 'All Regions' &&
        p.region !== filterState.region
      ) {
        return false;
      }

      // Status
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

  // Segmented Groups calculation (for compare mode or segmented view)
  const segmentedData = useMemo(() => {
    const effectiveSegment =
      filterState.segmentBy !== 'none'
        ? filterState.segmentBy
        : filterState.compareMode
        ? 'region'
        : 'none';

    if (effectiveSegment === 'none') return null;

    const groups: { [key: string]: { count: number; totalDistributed: number; payouts: ExtendedPayoutDetail[] } } = {};

    filteredPayouts.forEach((p) => {
      let key = 'Other';
      if (effectiveSegment === 'region') key = p.region;
      if (effectiveSegment === 'offering') key = p.offeringName;
      if (effectiveSegment === 'status') key = p.status.toUpperCase();

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

  // Aggregate summary metrics
  const totalDistributed = useMemo(() => {
    return filteredPayouts.reduce((sum, p) => sum + p.netAmount, 0);
  }, [filteredPayouts]);

  const totalGasSpent = useMemo(() => {
    return filteredPayouts.reduce((sum, p) => sum + p.gasFeeUsd, 0);
  }, [filteredPayouts]);

  const failedCount = useMemo(() => {
    return filteredPayouts.filter((p) => p.status === 'failed').length;
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Uploads Queue</h2>
        <div className="space-y-4">
          <DocumentUploadStatus
            fileName="Q3_Revenue_Report.pdf"
            status="clean"
          />
          <DocumentUploadStatus
            fileName="Financial_Audit_2023.pdf"
            status="scanning"
          />
          <DocumentUploadStatus
            fileName="K-1_Distribution_Schedule.xlsx"
            status="validating"
          />
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
      </div>

      <GovernanceResults
        results={{ for: 2500000, against: 450000, abstain: 50000 }}
        participation={{ turnout: 68.4, uniqueVoters: 142, delegates: 12 }}
        status="passed"
      />

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
    </div>
  );
};

