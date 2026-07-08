import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'rect';
  width?: string | number;
  height?: string | number;
  count?: number; // number of skeleton units to render (useful for multiple text lines or repeating blocks)
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return 'skeleton-text';
      case 'title':
        return 'skeleton-title';
      case 'avatar':
        return 'skeleton-avatar';
      case 'rect':
      default:
        return 'skeleton-rect';
    }
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  const elements = Array.from({ length: count }).map((_, index) => {
    // If we're rendering multiple text lines, make the last one shorter (standard typographic placeholder pattern)
    const isLastTextLine = variant === 'text' && count > 1 && index === count - 1;
    const finalClass = `${getVariantClass()} ${isLastTextLine ? 'skeleton-text-short' : ''}`.trim();

    return (
      <span
        key={index}
        className={`skeleton ${finalClass} ${className}`}
        style={style}
        aria-hidden="true"
      />
    );
  });

  if (count > 1) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--spacing-xs)',
          width: '100%'
        }}
      >
        {elements}
      </div>
    );
  }

  return elements[0];
};

Skeleton.displayName = 'Skeleton';
