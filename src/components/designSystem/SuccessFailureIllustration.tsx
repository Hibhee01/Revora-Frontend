import React from 'react';

export type SuccessFailureIllustrationVariant =
  | 'transactionSuccess'
  | 'transactionFailure'
  | 'kycApproved'
  | 'kycRejected'
  | 'offeringPublished'
  | 'onchainRejection';

export type SuccessFailureIllustrationProps = {
  /**
   * Visual variant to render.
   *
   * Note: When used as decorative artwork, keep aria-hidden.
   */
  variant: SuccessFailureIllustrationVariant;
  /**
   * Pixel size (width/height). Must be >= 96px to meet the design requirement.
   */
  size?: number;
  /**
   * When the illustration is purely decorative, keep aria-hidden.
   */
  ariaHidden?: boolean;
};

const DEFAULT_SIZE = 96;

/**
 * Success / failure illustration set (SVG).
 * - WCAG: artwork is decorative by default (aria-hidden)
 * - Responsive: uses width/height from props; SVG stays legible at 96px
 * - Dark-mode: uses currentColor + alpha fills
 * - Color-blind safe: uses redundant shapes (check/x/shield/arrow) not color alone
 */
export const SuccessFailureIllustration: React.FC<SuccessFailureIllustrationProps> = ({
  variant,
  size = DEFAULT_SIZE,
  ariaHidden = true,
}) => {
  if (variant === 'onchainRejection') {
    return (
      <OnchainRejectionIllustration
        size={size}
        ariaHidden={ariaHidden}
        ariaLabel="On-chain transaction rejection"
      />
    );
  }

  const color = (() => {
    switch (variant) {
      case 'transactionSuccess':
      case 'kycApproved':
      case 'offeringPublished':
        return 'var(--success)';
      case 'transactionFailure':
      case 'kycRejected':
        return 'var(--error)';
      default:
        return 'currentColor';
    }
  })();

  const label = (() => {
    switch (variant) {
      case 'transactionSuccess':
        return 'Transaction successful';
      case 'transactionFailure':
        return 'Transaction failed';
      case 'kycApproved':
        return 'KYC approved';
      case 'kycRejected':
        return 'KYC rejected';
      case 'offeringPublished':
        return 'Offering published';
      default:
        return 'Status illustration';
    }
  })();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role={ariaHidden ? 'presentation' : 'img'}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : label}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="ds-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      {/* Outer badge (color-blind safe well) */}
      <g filter="url(#ds-shadow)" transform="translate(48 48)">
        <circle
          r="44"
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="1.5"
        />

        {/* Icon well */}
        <circle
          r="30"
          fill="rgba(255,255,255,0.01)"
          stroke="rgba(148,163,184,0.16)"
          strokeWidth="1.5"
        />

        {/* Decorative accent ring */}
        <circle
          r="30"
          fill="none"
          stroke={color}
          strokeOpacity="0.28"
          strokeWidth="4"
          strokeDasharray="12 10"
          transform="rotate(-15)"
        />

        {/* Variant glyph */}
        {variant === 'transactionSuccess' && (
          <SuccessGlyph color={color} />
        )}
        {variant === 'transactionFailure' && (
          <FailureGlyph color={color} />
        )}
        {variant === 'kycApproved' && <KycApprovedGlyph color={color} />}
        {variant === 'kycRejected' && <KycRejectedGlyph color={color} />}
        {variant === 'offeringPublished' && <PublishedGlyph color={color} />}
      </g>

      {/* Small baseline caption dots (invisible to AT; improves shape complexity at 96px) */}
      <g aria-hidden="true" opacity="0.25">
        <circle cx="24" cy="82" r="1.5" fill={color} />
        <circle cx="72" cy="82" r="1.5" fill={color} />
      </g>
    </svg>
  );
};

const Stroke = ({ color }: { color: string }) => {
  return {
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
};

const SuccessGlyph: React.FC<{ color: string }> = ({ color }) => {
  // Check in a circle
  return (
    <g transform="translate(0 0)">
      <circle cx="0" cy="0" r="18" fill="rgba(16,185,129,0.08)" stroke={color} strokeOpacity="0.45" strokeWidth="3" />
      <path d="M-10 2 L-3 9 L12 -9" {...Stroke({ color })} />
    </g>
  );
};

const FailureGlyph: React.FC<{ color: string }> = ({ color }) => {
  // X in a circle
  return (
    <g transform="translate(0 0)">
      <circle cx="0" cy="0" r="18" fill="rgba(239,68,68,0.08)" stroke={color} strokeOpacity="0.45" strokeWidth="3" />
      <path d="M-10 -8 L10 8" {...Stroke({ color })} />
      <path d="M10 -8 L-10 8" {...Stroke({ color })} />
    </g>
  );
};

const KycApprovedGlyph: React.FC<{ color: string }> = ({ color }) => {
  // Shield + check
  return (
    <g>
      <path
        d="M0 -20 C9 -16 15 -16 20 -14 V-2 C20 12 9 22 0 26 C-9 22 -20 12 -20 -2 V-14 C-15 -16 -9 -16 0 -20 Z"
        fill="rgba(16,185,129,0.08)"
        stroke={color}
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M-10 2 L-2 10 L11 -8" {...Stroke({ color })} />
    </g>
  );
};

const KycRejectedGlyph: React.FC<{ color: string }> = ({ color }) => {
  // Shield + X
  return (
    <g>
      <path
        d="M0 -20 C9 -16 15 -16 20 -14 V-2 C20 12 9 22 0 26 C-9 22 -20 12 -20 -2 V-14 C-15 -16 -9 -16 0 -20 Z"
        fill="rgba(239,68,68,0.08)"
        stroke={color}
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M-10 -2 L10 14" {...Stroke({ color })} />
      <path d="M10 -2 L-10 14" {...Stroke({ color })} />
    </g>
  );
};

const PublishedGlyph: React.FC<{ color: string }> = ({ color }) => {
  // Arrow up + check badge
  return (
    <g>
      <path d="M-6 10 L0 4 L6 10" {...Stroke({ color })} />
      <path d="M0 -14 V2" {...Stroke({ color })} />
      <path
        d="M-14 -2 C-14 -14 -6 -18 0 -18 C6 -18 14 -14 14 -2 C14 10 6 18 0 18 C-6 18 -14 10 -14 -2 Z"
        fill="rgba(56,189,248,0.06)"
        stroke={color}
        strokeOpacity="0.45"
        strokeWidth="2.5"
      />
      <path d="M-6 -1 L-2 3 L8 -7" {...Stroke({ color })} />
    </g>
  );
};

export default SuccessFailureIllustration;

