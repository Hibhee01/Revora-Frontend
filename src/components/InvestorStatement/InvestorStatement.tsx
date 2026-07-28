import React from "react";
import type { AllocationSlice } from "../AllocationWidget";
import type { PerformanceDataPoint } from "../PerformanceTrendWidget";
import "./InvestorStatement.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvestorStatementProps {
  /** Investor name / account holder */
  investorName: string;
  /** Statement date (ISO string) */
  statementDate?: string;
  /** Statement period label e.g. "Q2 2025" or "January – June 2025" */
  statementPeriod: string;
  /** Total amount invested */
  totalInvested: string;
  /** Current portfolio value */
  currentValue: string;
  /** Total return as a percentage (e.g. 12.5) */
  totalReturn: number;
  /** Number of active holdings */
  activeHoldings: number;
  /** Allocation breakdown data */
  allocations: AllocationSlice[];
  /** Performance history data */
  performance: PerformanceDataPoint[];
  /** Currency code (default: USD) */
  currency?: string;
  /** Additional account identifier */
  accountId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number, currency = "USD"): string =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const SLICE_COLOURS = [
  "var(--chart-cat-1, #60a5fa)",
  "var(--chart-cat-2, #34d399)",
  "var(--chart-cat-3, #fbbf24)",
  "var(--chart-cat-4, #a78bfa)",
  "var(--chart-cat-5, #f87171)",
  "var(--chart-cat-6, #22d3ee)",
  "var(--chart-cat-7, #fb923c)",
  "var(--chart-cat-8, #f472b6)",
];

// ─── PDF/UA Compliant Investor Statement Component ─────────────────────────

export const InvestorStatement: React.FC<InvestorStatementProps> = ({
  investorName,
  statementDate = new Date().toISOString(),
  statementPeriod,
  totalInvested,
  currentValue,
  totalReturn,
  activeHoldings,
  allocations,
  performance,
  currency = "USD",
  accountId,
}) => {
  const formattedDate = new Date(statementDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isPositive = totalReturn >= 0;

  return (
    <article
      className="investor-statement"
      lang="en"
      role="document"
      aria-label={`Investor Statement for ${investorName} — ${statementPeriod}`}
      data-testid="investor-statement"
    >
      {/* ── Document Header ── */}
      <header className="statement-header">
        <h1 className="statement-title">Investor Statement</h1>
        <dl className="statement-meta">
          <div className="statement-meta-row">
            <dt>Account Holder</dt>
            <dd>{investorName}</dd>
          </div>
          {accountId && (
            <div className="statement-meta-row">
              <dt>Account ID</dt>
              <dd>{accountId}</dd>
            </div>
          )}
          <div className="statement-meta-row">
            <dt>Statement Period</dt>
            <dd>{statementPeriod}</dd>
          </div>
          <div className="statement-meta-row">
            <dt>Date Generated</dt>
            <dd>{formattedDate}</dd>
          </div>
        </dl>
      </header>

      {/* ── Platform Branding / Disclaimer ── */}
      <p className="statement-disclaimer" role="doc-note">
        This statement is generated for informational purposes only. All values
        are denominated in {currency} and subject to market fluctuations.
        Past performance is not indicative of future results.
      </p>

      {/* ═══════════════════════════════════════════════════
          SECTION 1: Portfolio Summary (KPI Metrics)
          ═══════════════════════════════════════════════════ */}
      <section className="statement-section" aria-labelledby="kpi-heading-statement">
        <h2 id="kpi-heading-statement" className="statement-section-heading">
          Portfolio Summary
        </h2>

        <table className="statement-kpi-table" aria-label="Portfolio key metrics summary">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Value</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Total Invested</th>
              <td className="statement-value">{totalInvested}</td>
              <td>Total capital deployed across all holdings</td>
            </tr>
            <tr>
              <th scope="row">Current Value</th>
              <td className="statement-value">{currentValue}</td>
              <td>Current market value of all holdings</td>
            </tr>
            <tr>
              <th scope="row">Total Return</th>
              <td className={`statement-value ${isPositive ? "text-success" : "text-error"}`}>
                {isPositive ? "+" : ""}
                {totalReturn.toFixed(2)}%
              </td>
              <td>Overall return on investment</td>
            </tr>
            <tr>
              <th scope="row">Active Holdings</th>
              <td className="statement-value">{activeHoldings}</td>
              <td>Number of active investments</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: Allocation Breakdown
          ═══════════════════════════════════════════════════ */}
      <section className="statement-section" aria-labelledby="allocation-heading-statement">
        <h2 id="allocation-heading-statement" className="statement-section-heading">
          Portfolio Allocation
        </h2>

        {allocations.length === 0 ? (
          <p className="statement-empty">No holdings to display.</p>
        ) : (
          <>
            {/* Allocation bar chart (accessible visual representation) */}
            <div className="statement-chart-wrap" role="figure" aria-label="Allocation bar chart">
              <h3 className="statement-subheading">Allocation by Investment</h3>
              <ul className="statement-allocation-bars" aria-label="Portfolio allocation breakdown">
                {allocations.map((slice, i) => {
                  const colour = SLICE_COLOURS[i % SLICE_COLOURS.length];
                  return (
                    <li key={slice.id} className="statement-allocation-item">
                      <div className="statement-allocation-label">
                        <span className="statement-allocation-name">{slice.label}</span>
                        <span className="statement-allocation-value">
                          {formatCurrency(slice.value, currency)} ({slice.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        className="statement-bar-track"
                        role="progressbar"
                        aria-valuenow={slice.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${slice.label}: ${slice.percentage.toFixed(1)}% of portfolio`}
                      >
                        <div
                          className="statement-bar-fill"
                          style={{ width: `${slice.percentage}%`, backgroundColor: colour }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Allocation data table (structured tabular data) */}
            <table className="statement-data-table" aria-label="Allocation data table">
              <caption className="sr-only">Detailed allocation breakdown by investment</caption>
              <thead>
                <tr>
                  <th scope="col">Investment</th>
                  <th scope="col">Value ({currency})</th>
                  <th scope="col">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((slice) => (
                  <tr key={slice.id}>
                    <th scope="row">{slice.label}</th>
                    <td className="statement-value">{formatCurrency(slice.value, currency)}</td>
                    <td>{slice.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
                {allocations.length > 0 && (
                  <tr className="statement-total-row">
                    <th scope="row">Total</th>
                    <td className="statement-value">
                      {formatCurrency(
                        allocations.reduce((sum, s) => sum + s.value, 0),
                        currency
                      )}
                    </td>
                    <td>
                      {allocations.reduce((sum, s) => sum + s.percentage, 0).toFixed(1)}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: Performance History
          ═══════════════════════════════════════════════════ */}
      <section className="statement-section" aria-labelledby="performance-heading-statement">
        <h2 id="performance-heading-statement" className="statement-section-heading">
          Performance History (12-Month)
        </h2>

        {performance.length === 0 ? (
          <p className="statement-empty">No performance data available.</p>
        ) : (
          <>
            {/* Performance change summary */}
            <p className="statement-performance-summary" aria-live="polite">
              Portfolio value changed from{" "}
              <strong>{formatCurrency(performance[0].value, currency)}</strong>
              {" to "}
              <strong>{formatCurrency(performance[performance.length - 1].value, currency)}</strong>
              {" over the period, representing a "}
              <strong className={isPositive ? "text-success" : "text-error"}>
                {isPositive ? "+" : ""}
                {(
                  ((performance[performance.length - 1].value - performance[0].value) /
                    performance[0].value) *
                  100
                ).toFixed(2)}
                %
              </strong>
              {" change."}
            </p>

            {/* Performance data table (PDF/UA compliant) */}
            <table className="statement-data-table" aria-label="Monthly performance data">
              <caption className="sr-only">12-month portfolio performance by month</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Value ({currency})</th>
                  <th scope="col">Change</th>
                  <th scope="col">Change (%)</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((point, i) => {
                  const prev = i > 0 ? performance[i - 1].value : point.value;
                  const change = point.value - prev;
                  const changePct = prev !== 0 ? (change / prev) * 100 : 0;
                  const changeIsPositive = change >= 0;
                  return (
                    <tr key={point.month}>
                      <th scope="row">{point.month}</th>
                      <td className="statement-value">
                        {formatCurrency(point.value, currency)}
                      </td>
                      <td className={i === 0 ? "" : changeIsPositive ? "text-success" : "text-error"}>
                        {i === 0
                          ? "—"
                          : `${changeIsPositive ? "+" : ""}${formatCurrency(change, currency)}`}
                      </td>
                      <td className={i === 0 ? "" : changeIsPositive ? "text-success" : "text-error"}>
                        {i === 0 ? "—" : `${changeIsPositive ? "+" : ""}${changePct.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="statement-total-row">
                  <th scope="row">Total Change</th>
                  <td className="statement-value">
                    {formatCurrency(
                      performance[performance.length - 1].value - performance[0].value,
                      currency
                    )}
                  </td>
                  <td colSpan={2}>
                    {(
                      ((performance[performance.length - 1].value - performance[0].value) /
                        performance[0].value) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: Footer / Disclaimers
          ═══════════════════════════════════════════════════ */}
      <footer className="statement-footer" role="doc-endnotes">
        <h2 className="statement-footer-heading">Important Information</h2>
        <ul className="statement-disclaimer-list">
          <li>
            This statement is provided for informational purposes and does not
            constitute financial advice or a recommendation to buy or sell
            securities.
          </li>
          <li>
            All investment values are denominated in {currency} and are subject
            to market risks including potential loss of principal.
          </li>
          <li>
            Past performance is not indicative of future results. Returns may
            vary and are not guaranteed.
          </li>
          <li>
            RevenueShare distributions are processed on the Stellar network via
            Soroban smart contracts. Transaction records are available on the
            public ledger.
          </li>
        </ul>
        <p className="statement-copyright">
          Revora Platform &copy; {new Date().getFullYear()}. All rights reserved.
        </p>
      </footer>
    </article>
  );
};

