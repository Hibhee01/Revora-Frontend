import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface PageLoaderProps {
  label?: string; // visible text and accessible status label.
  showText?: boolean; // whether to visually display the text label below the spinner.
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  label = 'Loading application...',
  showText = true,
  className = '',
}) => {
  return (
    <div className={`page-loader-overlay ${className}`} role="status" aria-live="polite">
      <LoadingSpinner size={40} label={label} />
      {showText && <span className="page-loader-text">{label}</span>}
    </div>
  );
};

PageLoader.displayName = 'PageLoader';
