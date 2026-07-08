import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps extends Omit<React.ComponentPropsWithoutRef<typeof Loader2>, 'color'> {
  label?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = '',
  size = 18,
  label = 'Loading',
  'aria-hidden': ariaHidden,
  ...props
}) => {
  // If aria-hidden is true (boolean or string), we don't expose it to screen readers.
  const isHidden = ariaHidden === true || ariaHidden === 'true';

  return (
    <Loader2
      className={`animate-spin-loader ${className}`}
      size={size}
      role={isHidden ? undefined : 'img'}
      aria-label={isHidden ? undefined : label}
      aria-hidden={isHidden ? 'true' : undefined}
      {...props}
    />
  );
};


LoadingSpinner.displayName = 'LoadingSpinner';
