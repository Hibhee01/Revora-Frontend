import React from 'react';

export interface ProgressBarProps {
  value?: number; // percentage from 0 to 100. If omitted, progress is indeterminate.
  label?: string; // accessible name for the progress bar.
  showLabelText?: boolean; // if true, displays visual label and percentage.
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label = 'Loading progress',
  showLabelText = false,
  className = '',
}) => {
  const isIndeterminate = value === undefined;
  const clampedValue = value !== undefined ? Math.max(0, Math.min(100, value)) : undefined;

  return (
    <div className={`progress-bar-wrapper ${className}`}>
      {showLabelText && !isIndeterminate && (
        <div 
          className="progress-bar-label-text" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 'var(--spacing-2xs)', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-muted)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          <span>{label}</span>
          <span aria-hidden="true">{Math.round(clampedValue!)}%</span>
        </div>
      )}
      <div
        className="progress-bar-container"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {isIndeterminate ? (
          <div className="progress-bar-indeterminate" />
        ) : (
          <div className="progress-bar-fill" style={{ width: `${clampedValue}%` }} />
        )}
      </div>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';
