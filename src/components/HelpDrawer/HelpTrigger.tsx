/**
 * HelpTrigger — small icon button that opens the contextual help drawer.
 *
 * Renders a HelpCircle icon button with an accessible label.
 * Forwards its ref so the HelpDrawer can return focus on close.
 */

import React, { forwardRef } from 'react';
import { HelpCircle } from 'lucide-react';

export interface HelpTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label. Defaults to "Open contextual help". */
  label?: string;
}

export const HelpTrigger = forwardRef<HTMLButtonElement, HelpTriggerProps>(
  ({ label = 'Open contextual help', className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        className={`hd-trigger ${className}`.trim()}
        {...rest}
      >
        <HelpCircle size={18} aria-hidden="true" />
      </button>
    );
  },
);

HelpTrigger.displayName = 'HelpTrigger';
