import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardHero, KPIData } from "../components/DashboardHero";
import { AllocationWidget, AllocationSlice } from "../components/AllocationWidget";
import { PerformanceTrendWidget, PerformanceDataPoint } from "../components/PerformanceTrendWidget";
import { InvestorStatement, usePrintStatement } from "../components/InvestorStatement";

// ─── Mock data (replace with real API call) ───────────────────────────────────

const MOCK_ALLOCATIONS: AllocationSlice[] = [
  { id: "1", label: "TechFlow AI", value: 45000, percentage: 45 },
  { id: "2", label: "Quantum Ledger", value: 30000, percentage: 30 },
  { id: "3", label: "Nexus Pay", value: 25000, percentage: 25 },
];

const MOCK_PERFORMANCE: PerformanceDataPoint[] = [
  { month: "Jul", value: 88000 },
  { month: "Aug", value: 90500 },
  { month: "Sep", value: 87000 },
  { month: "Oct", value: 91200 },
  { month: "Nov", value: 93400 },
  { month: "Dec", value: 95000 },
  { month: "Jan", value: 94100 },
  { month: "Feb", value: 97300 },
  { month: "Mar", value: 99800 },
  { month: "Apr", value: 101500 },
  { month: "May", value: 99200 },
  { month: "Jun", value: 103000 },
];

interface InvestorPortfolioSummaryProps {
  /** Inject mock data for testing */
  __allocations?: AllocationSlice[];
  __performance?: PerformanceDataPoint[];
}

export const InvestorPortfolioSummary: React.FC<InvestorPortfolioSummaryProps> = ({
  __allocations = MOCK_ALLOCATIONS,
  __performance = MOCK_PERFORMANCE,
}) => {
  const totalInvested = __allocations.reduce((s, a) => s + a.value, 0);
  const currentValue = __performance.length > 0 ? __performance[__performance.length - 1].value : totalInvested;
  const totalReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  
  const isNewInvestor = __allocations.length === 0;

  const totalValueKPI: KPIData = {
    label: "Total Value",
    value: currentValue,
    type: 'currency',
    status: isNewInvestor ? 'empty' : 'success',
    trend: totalReturn,
  };

  const realizedGainsKPI: KPIData = {
    label: "Realized Gains",
    value: isNewInvestor ? null : currentValue - totalInvested, // simplified for mock
    type: 'currency',
    status: isNewInvestor ? 'empty' : 'success',
  };

  const upcomingPayoutsKPI: KPIData = {
    label: "Upcoming Payouts",
    value: isNewInvestor ? null : 3,
    type: 'number',
    status: isNewInvestor ? 'empty' : 'success',
    actionText: isNewInvestor ? undefined : 'View calendar',
    actionLink: isNewInvestor ? undefined : '/investor/calendar'
  };

  const pendingActionsKPI: KPIData = {
    label: "Pending Actions",
    value: 1,
    type: 'number',
    status: 'success', // Always show 1 for mock purposes
    actionText: 'Review now',
    actionLink: '/investor/actions'
  };

  const sparklineData = __performance.map(p => p.value);

  const { showStatement, printStatement } = usePrintStatement();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in" data-testid="portfolio-summary">
      {/* ── Back nav ── */}
      <div className="mb-2">
        <Link
          to="/investor/portal"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-main transition-colors"
          aria-label="Back to Investor Discovery"
        >
          <ArrowLeft size={14} aria-hidden="true" className="icon-rtl" />
          Back to Discovery
        </Link>
      </div>

      {/* ── Hero Band ── */}
      <DashboardHero
        totalValue={totalValueKPI}
        realizedGains={realizedGainsKPI}
        upcomingPayouts={upcomingPayoutsKPI}
        pendingActions={pendingActionsKPI}
        sparklineData={sparklineData}
        isNewInvestor={isNewInvestor}
      />

      {/* ── Two-column widget area (stacks on mobile) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AllocationWidget slices={__allocations} />
        <PerformanceTrendWidget data={__performance} />
      </div>
    </div>
  );
};
