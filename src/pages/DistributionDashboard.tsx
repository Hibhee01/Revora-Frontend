import React from 'react';
import { EmptyState } from '../components/designSystem/EmptyState';
import { CohortHeatmap, CohortData } from '../components/CohortHeatmap';

const mockCohortData: CohortData[] = [
  {
    cohortName: '2025 Q1',
    cohortSize: 120,
    payouts: [
      { monthIndex: 0, payoutAmount: 15000, payoutPercentage: 15 },
      { monthIndex: 1, payoutAmount: 22000, payoutPercentage: 22 },
      { monthIndex: 2, payoutAmount: 18000, payoutPercentage: 18 },
      { monthIndex: 3, payoutAmount: 25000, payoutPercentage: 25 },
      { monthIndex: 4, payoutAmount: 30000, payoutPercentage: 30 },
      { monthIndex: 5, payoutAmount: 28000, payoutPercentage: 28 },
    ],
  },
  {
    cohortName: '2025 Q2',
    cohortSize: 85,
    payouts: [
      { monthIndex: 0, payoutAmount: 10000, payoutPercentage: 10 },
      { monthIndex: 1, payoutAmount: 14000, payoutPercentage: 14 },
      { monthIndex: 2, payoutAmount: 19000, payoutPercentage: 19 },
      { monthIndex: 3, payoutAmount: 21000, payoutPercentage: 21 },
    ],
  },
  {
    cohortName: '2025 Q3',
    cohortSize: 45,
    payouts: [
      { monthIndex: 0, payoutAmount: 8000, payoutPercentage: 8 },
      { monthIndex: 1, payoutAmount: 12000, payoutPercentage: 12 },
    ],
  },
  {
    cohortName: '2025 Q4',
    cohortSize: 15,
    payouts: [],
  },
];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Distribution Dashboard</h1>
        <p className="text-muted text-sm mt-1 mb-8">
          Track RevenueShare distributions across your portfolio.
        </p>
        <RedemptionBanner totalCapacity={10000} currentSubscription={12500} />
      </div>

      <div className="glass-card p-6">
        <CohortHeatmap data={mockCohortData} maxMonths={12} />
      </div>

      <EmptyState
        variant="distribution-dashboard"
        title="No other distributions yet"
        description="When more revenue is reported and payouts are processed, your distribution history will appear here."
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

