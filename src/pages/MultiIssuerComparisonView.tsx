import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { IssuerComparisonData, MOCK_COMPARISON_ISSUERS } from './DistributionDashboard.types';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export interface MultiIssuerComparisonViewProps {
  /** All available issuers to choose from */
  availableIssuers: IssuerComparisonData[];
  /** Maximum number of issuers that can be compared at once */
  maxColumns?: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const COMPLIANCE_CONFIG: Record<
  IssuerComparisonData['complianceStatus'],
  { label: string; className: string }
> = {
  compliant: { label: 'Compliant', className: 'mic-compliance--compliant' },
  review: { label: 'In Review', className: 'mic-compliance--review' },
  hold: { label: 'Hold', className: 'mic-compliance--hold' },
};

/* ─── Component ────────────────────────────────────────────────────────────── */

export const MultiIssuerComparisonView: React.FC<MultiIssuerComparisonViewProps> = ({
  availableIssuers,
  maxColumns = 4,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const selectedIssuers = useMemo(
    () => availableIssuers.filter((issuer) => selectedIds.includes(issuer.issuerId)),
    [availableIssuers, selectedIds]
  );

  const toggleIssuer = (issuerId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(issuerId)) {
        return prev.filter((id) => id !== issuerId);
      }
      if (prev.length >= maxColumns) {
        return prev;
      }
      return [...prev, issuerId];
    });
  };

  const clearAll = () => setSelectedIds([]);

  const isHovered = (issuerId: string) => hoveredColumn === issuerId;
  const isDimmed = (issuerId: string) =>
    hoveredColumn !== null && hoveredColumn !== issuerId;

  return (
    <section
      className="glass-card p-6 space-y-6 animate-fade-in"
      aria-labelledby="mic-heading"
      data-testid="multi-issuer-comparison"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="mic-heading" className="text-xl font-bold tracking-tight">
            Multi-Issuer Comparison
          </h2>
          <p className="text-muted text-sm mt-1">
            Select up to {maxColumns} issuers to compare KPIs, trends, and compliance side by side.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            className="btn btn--sm btn-secondary self-start sm:self-auto"
            onClick={clearAll}
            aria-label="Clear all selected issuers"
            data-testid="mic-clear-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Picker Chip Row */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Select issuers to compare"
        data-testid="mic-picker-row"
      >
        {availableIssuers.map((issuer) => {
          const isSelected = selectedIds.includes(issuer.issuerId);
          return (
            <button
              key={issuer.issuerId}
              type="button"
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 border focus-visible:outline-2 focus-visible:outline-offset-2
                ${
                  isSelected
                    ? 'border-current bg-opacity-10'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg-accent)] hover:border-[var(--glass-border-bright)]'
                }
              `}
              style={{
                borderColor: isSelected ? issuer.color : undefined,
                backgroundColor: isSelected ? `${issuer.color}15` : undefined,
                color: isSelected ? issuer.color : undefined,
              }}
              onClick={() => toggleIssuer(issuer.issuerId)}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} ${issuer.issuerName}`}
              data-testid={`mic-chip-${issuer.issuerId}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isSelected ? issuer.color : 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <span className="truncate max-w-[180px]">{issuer.issuerName}</span>
              {isSelected ? (
                <X size={14} aria-hidden="true" />
              ) : (
                <Plus size={14} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {selectedIssuers.length === 0 && (
        <div
          className="flex flex-col items-center justify-center text-center py-12 gap-3"
          data-testid="mic-empty-state"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--primary)' }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <p className="text-muted text-sm max-w-sm">
            Pick issuers above to see a side-by-side comparison of key metrics, trend charts, and compliance status.
          </p>
        </div>
      )}

      {/* Comparison Grid */}
      {selectedIssuers.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(selectedIssuers.length, maxColumns)}, minmax(0, 1fr))`,
          }}
          role="grid"
          aria-label="Issuer comparison columns"
          data-testid="mic-grid"
        >
          {selectedIssuers.map((issuer) => (
            <div
              key={issuer.issuerId}
              role="gridcell"
              className={`
                mic-column rounded-xl border p-4 space-y-4 transition-all duration-200
                ${isHovered(issuer.issuerId) ? 'mic-column--hover' : ''}
                ${isDimmed(issuer.issuerId) ? 'mic-column--dim' : ''}
              `}
              style={{
                borderColor: isHovered(issuer.issuerId) ? issuer.color : 'var(--glass-border)',
                backgroundColor: isHovered(issuer.issuerId) ? `${issuer.color}08` : 'var(--glass-bg-accent)',
              }}
              onMouseEnter={() => setHoveredColumn(issuer.issuerId)}
              onMouseLeave={() => setHoveredColumn(null)}
              onFocus={() => setHoveredColumn(issuer.issuerId)}
              onBlur={() => setHoveredColumn(null)}
              tabIndex={0}
              aria-label={`Comparison column for ${issuer.issuerName}`}
              data-testid={`mic-column-${issuer.issuerId}`}
            >
              {/* Column Header */}
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: issuer.color }}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold truncate" title={issuer.issuerName}>
                  {issuer.issuerName}
                </h3>
              </div>

              {/* KPI Tiles */}
              <div className="space-y-2" role="list" aria-label={`Key metrics for ${issuer.issuerName}`}>
                <KpiTile label="Total Distributed" value={formatCurrency(issuer.kpis.totalDistributed)} />
                <KpiTile label="Active Payouts" value={String(issuer.kpis.activePayouts)} />
                <KpiTile label="Gas Spent" value={`$${issuer.kpis.gasSpent.toFixed(2)}`} />
                <KpiTile label="Pending Retries" value={String(issuer.kpis.pendingRetries)} />
              </div>

              {/* Chart Snippet */}
              <div
                className="mic-chart-snippet"
                aria-label={`${issuer.issuerName} trend chart`}
                data-testid={`mic-chart-${issuer.issuerId}`}
              >
                <p className="text-xs text-muted font-medium mb-2">6-Month Trend</p>
                <svg viewBox="0 0 200 60" className="w-full h-12" aria-hidden="true">
                  {(() => {
                    const max = Math.max(...issuer.chartData.map((d) => d.value));
                    const barWidth = 160 / issuer.chartData.length;
                    return issuer.chartData.map((d, i) => {
                      const barHeight = max > 0 ? (d.value / max) * 50 : 0;
                      const x = 10 + i * barWidth;
                      const y = 55 - barHeight;
                      return (
                        <rect
                          key={d.label}
                          x={x}
                          y={y}
                          width={barWidth - 4}
                          height={barHeight}
                          rx="2"
                          fill={issuer.color}
                          opacity={isHovered(issuer.issuerId) ? 1 : 0.7}
                          className="transition-opacity duration-200"
                        >
                          <title>{`${d.label}: $${d.value.toLocaleString()}`}</title>
                        </rect>
                      );
                    });
                  })()}
                </svg>
                <div className="flex justify-between text-[10px] text-muted px-1">
                  {issuer.chartData.map((d) => (
                    <span key={d.label}>{d.label}</span>
                  ))}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Compliance</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    COMPLIANCE_CONFIG[issuer.complianceStatus].className
                  }`}
                  data-testid={`mic-compliance-${issuer.issuerId}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        issuer.complianceStatus === 'compliant'
                          ? 'var(--success)'
                          : issuer.complianceStatus === 'review'
                          ? 'var(--error)'
                          : '#f59e0b',
                    }}
                    aria-hidden="true"
                  />
                  {COMPLIANCE_CONFIG[issuer.complianceStatus].label}
                </span>
              </div>
              {issuer.complianceNote && (
                <p className="text-xs text-muted" aria-label={`Compliance note: ${issuer.complianceNote}`}>
                  {issuer.complianceNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ─── Sub-component ────────────────────────────────────────────────────────── */

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-[var(--glass-border)] last:border-0"
      role="listitem"
    >
      <span className="text-xs text-muted font-medium">{label}</span>
      <span className="text-sm font-semibold text-main">{value}</span>
    </div>
  );
}
