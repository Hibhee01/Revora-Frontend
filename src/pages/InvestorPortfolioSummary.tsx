import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { KpiHeader } from "../components/KpiHeader";
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

  const formatUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const { showStatement, printStatement } = usePrintStatement();

  return (
    <>
      {/* ── PDF/UA Statement Overlay (shown when printing) ── */}
      {showStatement && (
        <div className="statement-print-overlay" data-testid="statement-print-overlay">
          <InvestorStatement
            investorName="John Doe"
            statementPeriod="July 2024 – June 2025"
            totalInvested={formatUSD(totalInvested)}
            currentValue={formatUSD(currentValue)}
            totalReturn={totalReturn}
            activeHoldings={__allocations.length}
            allocations={__allocations}
            performance={__performance}
            accountId="REV-ACC-001"
          />
        </div>
      )}

      {/* ── Normal page content (hidden during print) ── */}
      <div
        className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in"
        data-testid="portfolio-summary"
        hidden={showStatement}
      >
        {/* ── Back nav + page title + print button ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/investor/portal"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-main transition-colors mb-2"
              aria-label="Back to Investor Discovery"
            >
              <ArrowLeft size={14} aria-hidden="true" className="icon-rtl" />
              Back to Discovery
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Summary</h1>
            <p className="text-muted text-sm mt-1">
              Your holdings, allocation, and 12-month performance at a glance.
            </p>
          </div>

          {/* ── Print Statement button ── */}
          <button
            className="btn btn--secondary btn--sm flex items-center gap-2 whitespace-nowrap"
            onClick={printStatement}
            aria-label="Print or save as PDF your investor statement"
            data-testid="print-statement-btn"
          >
            <Printer size={16} aria-hidden="true" />
            <span>Print Statement</span>
          </button>
        </div>

        {/* ── KPI header strip ── */}
        <KpiHeader
          totalInvested={formatUSD(totalInvested)}
          currentValue={formatUSD(currentValue)}
          totalReturn={totalReturn}
          activeHoldings={__allocations.length}
        />

        {/* ── Two-column widget area (stacks on mobile) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AllocationWidget slices={__allocations} />
          <PerformanceTrendWidget data={__performance} />
        </div>
      </div>
    </>
  );
};
