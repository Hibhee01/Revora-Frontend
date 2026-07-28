import React, { useEffect, useRef, useState } from 'react';
import { Clock, RefreshCw, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './OnchainBadge.css';

export type OnchainBadgeVariant = 'pending' | 'retrying' | 'confirming' | 'confirmed';

export interface OnchainBadgeProps {
  variant: OnchainBadgeVariant;
  currentConfirmations?: number;
  targetConfirmations?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getAriaLabel(
  variant: OnchainBadgeVariant,
  current?: number,
  target?: number,
): string {
  switch (variant) {
    case 'pending':
      return 'Transaction pending - waiting for network confirmation';
    case 'retrying':
      return 'Transaction retrying - attempting to resubmit to the network';
    case 'confirming':
      return `Transaction confirming - ${current ?? 0} of ${target ?? 0} confirmations received`;
    case 'confirmed':
      return `Transaction confirmed with ${current ?? 0} of ${target ?? 0} confirmations`;
  }
}

function Counter({
  value,
  reduced,
}: {
  value: number;
  reduced: boolean;
}) {
  const [displayed, setDisplayed] = useState(reduced ? value : 0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (reduced) {
      setDisplayed(value);
      return;
    }

    const DURATION = 800;
    const from = 0;
    startRef.current = 0;

    function animate(timestamp: number) {
      if (startRef.current === 0) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, reduced]);

  return (
    <span className="ob-counter" aria-hidden="true">
      {displayed}
    </span>
  );
}

const SIZE_ICON_MAP = { sm: 12, md: 14, lg: 18 } as const;

function getIcon(variant: OnchainBadgeVariant, size: number) {
  const common = { size, 'aria-hidden': true as const };
  switch (variant) {
    case 'pending':
      return <Clock {...common} />;
    case 'retrying':
      return <RefreshCw {...common} />;
    case 'confirming':
      return <ArrowUpCircle {...common} />;
    case 'confirmed':
      return <CheckCircle2 {...common} />;
  }
}

export const OnchainBadge: React.FC<OnchainBadgeProps> = ({
  variant,
  currentConfirmations = 0,
  targetConfirmations = 0,
  size = 'md',
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const label = getAriaLabel(variant, currentConfirmations, targetConfirmations);
  const iconSize = SIZE_ICON_MAP[size];
  const showCounter = variant === 'confirming' || variant === 'confirmed';

  return (
    <span
      className={`onchain-badge onchain-badge--${variant} onchain-badge--${size}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label={label}
      data-testid={`onchain-badge-${variant}`}
    >
      <span className="ob-icon">{getIcon(variant, iconSize)}</span>
      <span className="ob-label">
        {variant === 'pending' && 'Pending'}
        {variant === 'retrying' && 'Retrying'}
        {variant === 'confirming' && 'Confirming'}
        {variant === 'confirmed' && 'Confirmed'}
      </span>
      {showCounter && (
        <>
          <span className="ob-separator" aria-hidden="true">·</span>
          <Counter value={currentConfirmations} reduced={reducedMotion} />
          <span className="ob-target" aria-hidden="true">
            /{targetConfirmations}
          </span>
        </>
      )}
    </span>
  );
};

OnchainBadge.displayName = 'OnchainBadge';

export default OnchainBadge;
