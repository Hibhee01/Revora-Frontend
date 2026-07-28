import React, { useState, useMemo } from 'react';
import './CohortHeatmap.css';

export interface CohortPayout {
  monthIndex: number;
  payoutAmount: number;
  payoutPercentage: number;
}

export interface CohortData {
  cohortName: string;
  cohortSize: number;
  payouts: CohortPayout[];
}

export interface CohortHeatmapProps {
  data: CohortData[];
  maxMonths?: number;
}

export const CohortHeatmap: React.FC<CohortHeatmapProps> = ({ data, maxMonths = 12 }) => {
  const [colorBlindSafe, setColorBlindSafe] = useState(false);

  // Map a percentage (0 to max) to an index 0-9
  const maxPercentage = useMemo(() => {
    let max = 0;
    data.forEach((cohort) => {
      cohort.payouts.forEach((p) => {
        if (p.payoutPercentage > max) max = p.payoutPercentage;
      });
    });
    return max > 0 ? max : 1;
  }, [data]);

  const getColorClass = (percentage: number) => {
    if (percentage === 0) return 'heatmap-val-0';
    const index = Math.min(9, Math.floor((percentage / maxPercentage) * 10));
    return `heatmap-val-${index}`;
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className={`cohort-heatmap-container ${colorBlindSafe ? 'heatmap-cb-safe' : ''}`}>
      <div className="cohort-heatmap-header">
        <h2 className="cohort-heatmap-title">Cohort Payout Heatmap</h2>
        <div className="cohort-heatmap-controls">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted">
            <input
              type="checkbox"
              className="rounded border-gray-600 bg-transparent text-primary focus:ring-primary"
              checked={colorBlindSafe}
              onChange={(e) => setColorBlindSafe(e.target.checked)}
              aria-label="Enable color-blind safe mode and patterns"
            />
            Color-blind safe
          </label>
        </div>
      </div>

      <div className="cohort-heatmap-scroll" tabIndex={0} aria-label="Heatmap scroll container">
        <div
          className="cohort-heatmap-grid"
          style={{ gridTemplateColumns: `auto repeat(${maxMonths}, 3rem)` }}
          role="grid"
          aria-label="Cohort payout heatmap"
        >
          {/* Header Row */}
          <div role="row" className="contents">
            <div role="columnheader" className="heatmap-col-label" style={{ justifyContent: 'flex-start', paddingLeft: '0.5rem' }}>
              Cohort
            </div>
            {Array.from({ length: maxMonths }).map((_, i) => (
              <div key={i} role="columnheader" className="heatmap-col-label" aria-label={`Month ${i + 1}`}>
                M{i + 1}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {data.map((cohort, rowIndex) => (
            <div key={cohort.cohortName} role="row" className="contents">
              <div role="rowheader" className="heatmap-row-label">
                {cohort.cohortName} <span className="text-muted ml-2 text-xs">({cohort.cohortSize})</span>
              </div>
              
              {Array.from({ length: maxMonths }).map((_, monthIndex) => {
                const payoutInfo = cohort.payouts.find((p) => p.monthIndex === monthIndex);
                if (!payoutInfo) {
                  return (
                    <div
                      key={monthIndex}
                      role="gridcell"
                      className="heatmap-cell heatmap-cell-empty"
                      aria-label={`${cohort.cohortName} Month ${monthIndex + 1}: No data`}
                    >
                      -
                    </div>
                  );
                }

                return (
                  <button
                    key={monthIndex}
                    role="gridcell"
                    className={`heatmap-cell ${getColorClass(payoutInfo.payoutPercentage)}`}
                    aria-label={`${cohort.cohortName} Month ${monthIndex + 1}: ${formatter.format(payoutInfo.payoutAmount)} payout, ${payoutInfo.payoutPercentage.toFixed(1)}%`}
                  >
                    {Math.round(payoutInfo.payoutPercentage)}%
                    <div className="heatmap-tooltip">
                      <strong>{cohort.cohortName} - M{monthIndex + 1}</strong><br />
                      Payout: {formatter.format(payoutInfo.payoutAmount)}<br />
                      Rate: {payoutInfo.payoutPercentage.toFixed(1)}%
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted mt-2 flex items-center justify-between">
        <div>Payout percentages over time.</div>
        <div className="heatmap-legend" aria-hidden="true">
          Less
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`legend-box heatmap-val-${i}`} />
          ))}
          More
        </div>
      </div>
    </div>
  );
};
