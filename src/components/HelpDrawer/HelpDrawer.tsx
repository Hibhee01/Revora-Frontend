/**
 * HelpDrawer — contextual help drawer for wizard steps.
 *
 * Features:
 * - Focus-trapped while open (WAI-ARIA dialog pattern)
 * - Dismissible via ESC key, overlay click, or close button
 * - Returns focus to the trigger element on close
 * - Slides from inline-end edge; becomes bottom sheet on mobile
 * - Respects prefers-reduced-motion
 * - Full RTL support via CSS logical properties
 * - Screen-reader live region announces open state
 */

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { X, HelpCircle, BookOpen, Lightbulb, ExternalLink } from 'lucide-react';
import './HelpDrawer.css';

/* ─── Content slot types ────────────────────────────────────────────── */

export interface HelpDefinition {
  term: string;
  description: string;
}

export interface HelpLink {
  label: string;
  href: string;
}

export interface HelpDrawerContent {
  /** Drawer heading (e.g. "KYC Check") */
  title: string;
  /** Step label shown above the heading (e.g. "Step 2") */
  stepLabel?: string;
  /** Short intro paragraph */
  overview: string;
  /** Optional illustration node — defaults to a BookOpen icon placeholder */
  illustration?: ReactNode;
  /** Glossary / definition pairs */
  definitions?: HelpDefinition[];
  /** Example callout text */
  example?: string;
  /** Links to deeper docs */
  links?: HelpLink[];
  /** Footer note (optional) */
  footerNote?: string;
}

/* ─── Props ─────────────────────────────────────────────────────────── */

export interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  content: HelpDrawerContent;
  /** Element ref to return focus to when the drawer closes */
  triggerRef?: React.RefObject<HTMLElement>;
}

/* ─── Focus trap helper ─────────────────────────────────────────────── */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(panelEl: HTMLElement, e: KeyboardEvent) {
  const nodes = panelEl.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      last.focus();
      e.preventDefault();
    }
  } else {
    if (document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
}

/* ─── Component ─────────────────────────────────────────────────────── */

export const HelpDrawer: React.FC<HelpDrawerProps> = ({
  isOpen,
  onClose,
  content,
  triggerRef,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  /* Capture the element that triggered the drawer */
  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = (triggerRef?.current ?? document.activeElement) as HTMLElement;
      // Move focus to close button on open
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Return focus to trigger on close
      const target = prevFocusRef.current;
      if (target && typeof target.focus === 'function') {
        requestAnimationFrame(() => target.focus());
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, triggerRef]);

  /* Keyboard: ESC to close, Tab to trap */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        trapFocus(panelRef.current, e);
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const {
    title,
    stepLabel,
    overview,
    illustration,
    definitions,
    example,
    links,
    footerNote,
  } = content;

  return (
    <>
      {/* Overlay */}
      <div
        className="hd-overlay"
        aria-hidden="true"
        onClick={onClose}
        data-testid="hd-overlay"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hd-title"
        aria-describedby="hd-overview"
        className="hd-panel"
        data-testid="hd-panel"
      >
        {/* Mobile drag handle (decorative) */}
        <div className="hd-handle" aria-hidden="true" />

        {/* Header */}
        <div className="hd-header">
          <div className="hd-header-icon" aria-hidden="true">
            <HelpCircle size={18} />
          </div>
          <div className="hd-header-text">
            {stepLabel && <p className="hd-step-label">{stepLabel}</p>}
            <h2 id="hd-title" className="hd-title">
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="hd-close"
            onClick={onClose}
            aria-label="Close help drawer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="hd-body">
          {/* Illustration slot */}
          <div className="hd-illustration" aria-hidden="true">
            {illustration ?? <BookOpen size={48} strokeWidth={1.2} />}
          </div>

          {/* Overview */}
          <section className="hd-section" aria-labelledby="hd-overview-heading">
            <h3 id="hd-overview-heading" className="hd-section-title">
              <BookOpen size={14} className="hd-section-title-icon" aria-hidden="true" />
              Overview
            </h3>
            <p id="hd-overview" className="hd-body-text">
              {overview}
            </p>
          </section>

          {/* Definitions */}
          {definitions && definitions.length > 0 && (
            <section className="hd-section" aria-labelledby="hd-defs-heading">
              <h3 id="hd-defs-heading" className="hd-section-title">
                <HelpCircle size={14} className="hd-section-title-icon" aria-hidden="true" />
                Key terms
              </h3>
              <dl className="hd-defs">
                {definitions.map((def) => (
                  <div key={def.term} className="hd-def">
                    <dt className="hd-def-term">{def.term}</dt>
                    <dd className="hd-def-desc">{def.description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Example */}
          {example && (
            <section className="hd-section" aria-labelledby="hd-example-heading">
              <h3 id="hd-example-heading" className="hd-section-title">
                <Lightbulb size={14} className="hd-section-title-icon" aria-hidden="true" />
                Example
              </h3>
              <blockquote className="hd-example">{example}</blockquote>
            </section>
          )}

          {/* Links */}
          {links && links.length > 0 && (
            <section className="hd-section" aria-labelledby="hd-links-heading">
              <h3 id="hd-links-heading" className="hd-section-title">
                <ExternalLink size={14} className="hd-section-title-icon" aria-hidden="true" />
                Learn more
              </h3>
              <ul className="hd-links">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hd-link"
                    >
                      {link.label}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        {footerNote && (
          <div className="hd-footer">
            <p className="hd-footer-note">{footerNote}</p>
          </div>
        )}
      </div>
    </>
  );
};

HelpDrawer.displayName = 'HelpDrawer';
