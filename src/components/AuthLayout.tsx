import React, { useId } from 'react';

/**
 * AuthLayout – shared wrapper for Login, Signup, and ForgotPassword pages.
 *
 * ## Layout Slots
 * | Prop        | Element   | CSS Class         | Description                                   |
 * |-------------|-----------|-------------------|-----------------------------------------------|
 * | title       | `<h1>`    | `.auth-title`     | Page-level heading (required, single per page)|
 * | subtitle    | `<p>`     | `.auth-subtitle`  | Short description below the title (optional)  |
 * | helperText  | `<p>`     | `.auth-helper`    | Tertiary note (security tips, hints) (optional)|
 * | children    | —         | —                 | Form content rendered below the header        |
 *
 * ## Responsive Behaviour
 * - Mobile (≥320px): full-width with 1.25rem horizontal padding, 1.5rem vertical padding
 * - Tablet/Desktop (≥480px): max-width capped at 480px with 2.5rem padding
 *
 * ## Accessibility
 * - `<main>` landmark wraps the card for screen-reader navigation
 * - `aria-labelledby` links `<main>` to the `<h1>` title
 * - Header is wrapped in `<header>` for semantic structure
 */

export interface AuthLayoutProps {
  children: React.ReactNode;
  /** Required page heading — rendered as a single `<h1>` */
  title: string;
  /** Optional short description shown beneath the title */
  subtitle?: string;
  /** Optional tertiary helper note (security tips, hints) */
  helperText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  helperText,
}) => {
  const titleId = useId();

  return (
    <div className="auth-page-container">
      <aside className="auth-marketing-panel animate-fade-in">
        <div className="auth-marketing-content">
          <h2 className="auth-marketing-title">
            Revora on <span className="text-primary">Stellar</span>
          </h2>
          <p className="auth-marketing-description">
            Tokenized revenue-sharing infrastructure. Bridge the gap between visionaries and supporters with secure, on-chain execution.
          </p>
          <ul className="auth-marketing-list">
            <li>
              <span className="auth-marketing-icon">✓</span>
              Instant USDC payouts
            </li>
            <li>
              <span className="auth-marketing-icon">✓</span>
              Transparent on-chain ledger
            </li>
            <li>
              <span className="auth-marketing-icon">✓</span>
              Automated compliance
            </li>
          </ul>
        </div>
        <div className="auth-marketing-glow"></div>
      </aside>

      <main role="main" aria-labelledby={titleId} className="auth-layout-outer animate-fade-in">
        <div className="auth-card glass-card">
          <header className="auth-header">
            <h1 id={titleId} className="auth-title">
              {title}
            </h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            {helperText && <p className="auth-helper">{helperText}</p>}
          </header>
          <div className="auth-body">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
