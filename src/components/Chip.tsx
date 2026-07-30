import React from 'react';

interface ChipProps {
  label: string;
  /** Tailwind color class for background, defaults to warning */
  bgClass?: string;
  /** Tailwind color class for text, defaults to warning */
  textClass?: string;
}

/** Reusable chip/pill component used for dirty‑state indication. */
export const Chip: React.FC<ChipProps> = ({
  label,
  bgClass = 'bg-warning-100',
  textClass = 'text-warning-800',
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass} ${textClass}`}
    role="status"
  >
    {label}
  </span>
);

export default Chip;
