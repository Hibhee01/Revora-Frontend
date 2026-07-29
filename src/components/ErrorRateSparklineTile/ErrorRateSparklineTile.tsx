import React, { useId } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import "./ErrorRateSparklineTile.css";

export interface ErrorRateDataPoint {
  label: string;
  value: number;
}

export interface ErrorRateSparklineTileProps {
  id: string;
  title: string;
  value: string;
  rate: number;
  delta: number;
  sparklineData: ErrorRateDataPoint[];
  groupBy: "issuer" | "region";
  filterValue?: string;
  href?: string;
  onClick?: () => void;
}

function sparklinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points.reduce(
    (d, p, i) => d + (i === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`),
    ""
  );
}

function MiniSparkline({ data, rate }: { data: ErrorRateDataPoint[]; rate: number }) {
  if (data.length === 0) return null;

  const W = 64;
  const H = 28;
  const padX = 2;
  const padY = 3;

  const values = data.map((d) => d.value);
  const minVal = 0;
  const maxVal = Math.max(Math.max(...values), rate * 1.2, 0.1);
  const range = maxVal - minVal || 1;

  const pts = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * (W - 2 * padX),
    y: H - padY - ((d.value - minVal) / range) * (H - 2 * padY),
  }));

  const path = sparklinePath(pts);
  const isUpward = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const strokeColor = isUpward ? "var(--error, #ef4444)" : "var(--success, #10b981)";

  return (
    <svg
      className="error-rate-sparkline-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Trend: ${isUpward ? "increasing" : "decreasing"}`}
    >
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={1.5}
          fill={strokeColor}
          aria-hidden="true"
        />
      ))}
    </svg>
  );
}

export const ErrorRateSparklineTile: React.FC<ErrorRateSparklineTileProps> = ({
  id,
  title,
  value,
  rate,
  delta,
  sparklineData,
  groupBy,
  filterValue,
  href,
  onClick,
}) => {
  const headingId = useId();
  const isDeltaPositive = delta > 0;
  const isDeltaNegative = delta < 0;
  const isDeltaZero = delta === 0;

  const deltaColorClass = isDeltaPositive
    ? "error-rate-delta--bad"
    : isDeltaNegative
    ? "error-rate-delta--good"
    : "error-rate-delta--neutral";

  const DeltaIcon = isDeltaPositive
    ? TrendingUp
    : isDeltaNegative
    ? TrendingDown
    : Minus;

  const deltaArrow = isDeltaPositive ? "↑" : isDeltaNegative ? "↓" : "→";
  const deltaAriaLabel = isDeltaPositive
    ? `Worsened by ${Math.abs(delta).toFixed(1)}%`
    : isDeltaNegative
    ? `Improved by ${Math.abs(delta).toFixed(1)}%`
    : "No change";

  const content = (
    <div
      className={`glass-card error-rate-tile ${href || onClick ? "error-rate-tile--interactive" : ""}`}
      data-testid={`error-rate-tile-${id}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-labelledby={headingId}
    >
      <div className="error-rate-tile__header">
        <span className="error-rate-tile__title">{title}</span>
        <AlertTriangle size={14} className="error-rate-tile__icon" aria-hidden="true" />
      </div>

      <div className="error-rate-tile__body">
        <span className="error-rate-tile__value" id={headingId}>
          {value}
        </span>
        <MiniSparkline data={sparklineData} rate={rate} />
      </div>

      <div
        className={`error-rate-tile__delta ${deltaColorClass}`}
        aria-label={deltaAriaLabel}
      >
        <DeltaIcon size={12} aria-hidden="true" />
        <span>{deltaArrow} {Math.abs(delta).toFixed(1)}%</span>
      </div>

      <div className="error-rate-tile__footer">
        <span className="error-rate-tile__group-label">
          {groupBy === "issuer" ? "Issuer" : "Region"}: {filterValue || "—"}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="error-rate-tile__link" aria-labelledby={headingId}>
        {content}
      </Link>
    );
  }

  return content;
};
