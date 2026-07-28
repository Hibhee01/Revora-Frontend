import React from 'react';

export type OnchainRejectionIllustrationProps = {
  /**
   * Pixel size (width/height). Defaults to 96px.
   */
  size?: number;
  /**
   * When true, SVG is decorative and aria-hidden.
   * Default is true.
   */
  ariaHidden?: boolean;
  /**
   * Optional custom accessible label when ariaHidden is false.
   */
  ariaLabel?: string;
  /**
   * Additional CSS class name.
   */
  className?: string;
};

const DEFAULT_SIZE = 96;

/**
 * OnchainRejectionIllustration — Calm, tokenized SVG error artwork for on-chain rejections.
 *
 * Design characteristics:
 * - Non-blaming, reassuring visual language using brand accents (`var(--primary)`, `var(--text-accent)`)
 *   combined with soft warning/blocked tones (`var(--st-blocked-fg)` / amber accents).
 * - Dual concentric outer ring structure with a central network gas node & adjustment motif.
 * - WCAG 2.1 AA compliant: aria-hidden by default for decorative use; high-contrast tokens in both light & dark mode.
 * - Responsive: scales to any size while preserving SVG precision (viewBox 0 0 96 96).
 */
export const OnchainRejectionIllustration: React.FC<OnchainRejectionIllustrationProps> = ({
  size = DEFAULT_SIZE,
  ariaHidden = true,
  ariaLabel = 'On-chain transaction rejection status illustration',
  className = '',
}) => {
  const primaryColor = 'var(--primary)';
  const accentColor = 'var(--text-accent)';
  const blockedColor = 'var(--st-blocked-fg, #ef4444)';
  const warningAmber = '#f59e0b';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role={ariaHidden ? 'presentation' : 'img'}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : ariaLabel}
      focusable="false"
      className={`onchain-rejection-illustration ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="ocr-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        <linearGradient id="ocr-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Outer badge container */}
      <g filter="url(#ocr-shadow)" transform="translate(48 48)">
        {/* Soft outer aura ring */}
        <circle
          r="44"
          fill="rgba(15, 23, 42, 0.4)"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="1.5"
        />

        {/* Inner well ring */}
        <circle
          r="32"
          fill="rgba(245, 158, 11, 0.05)"
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth="1.5"
        />

        {/* Calm dashed adjustment accent orbit */}
        <circle
          r="32"
          fill="none"
          stroke={warningAmber}
          strokeOpacity="0.35"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          transform="rotate(-25)"
        />

        {/* Blockchain Node / Network Connector Mesh */}
        <g transform="translate(0, 0)">
          {/* Left node */}
          <circle cx="-16" cy="-8" r="4" fill={primaryColor} opacity="0.7" />
          {/* Right node */}
          <circle cx="16" cy="-8" r="4" fill={primaryColor} opacity="0.7" />
          {/* Center gas meter node */}
          <circle cx="0" cy="10" r="5" fill={accentColor} />

          {/* Network connection lines */}
          <path
            d="M-12 -8 L-3 7 M12 -8 L3 7 M-12 -8 L12 -8"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            strokeDasharray="3 3"
          />

          {/* Central Fuel/Gas Gauge Meter Arc */}
          <path
            d="M-14 4 A 15 15 0 0 1 14 4"
            fill="none"
            stroke="url(#ocr-accent-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Gentle Gas Adjustment Needle (Calm indicator pointing to retry region) */}
          <path
            d="M0 10 L6 -6"
            stroke={warningAmber}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="0" cy="10" r="2" fill="#ffffff" />

          {/* Small non-blaming alert pill badge (Top center) */}
          <g transform="translate(0, -22)">
            <rect
              x="-9"
              y="-7"
              width="18"
              height="14"
              rx="7"
              fill={blockedColor}
              fillOpacity="0.15"
              stroke={blockedColor}
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            {/* Pause / Info symbol in badge */}
            <line x1="-3" y1="-3" x2="-3" y2="3" stroke={blockedColor} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="-3" x2="3" y2="3" stroke={blockedColor} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* Decorative baseline dots */}
      <g aria-hidden="true" opacity="0.3">
        <circle cx="20" cy="84" r="1.5" fill={accentColor} />
        <circle cx="76" cy="84" r="1.5" fill={accentColor} />
      </g>
    </svg>
  );
};

export default OnchainRejectionIllustration;
