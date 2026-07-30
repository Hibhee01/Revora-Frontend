/**
 * EventDiffViewer — before/after field diff panel for Audit Trail rows.
 *
 * Features
 * ─────────
 * • Expand/collapse per row via a "Show diff" toggle button
 * • Field-level rows: label | before value | after value
 * • Word-level tokenised diff on string values (insert / delete / equal)
 * • Change-type badge per field: added | removed | changed
 * • Long values (>120 chars) collapsed with "Show more" affordance
 * • JSON blobs pretty-printed; binary / redacted values surfaced clearly
 * • Copy diff (plain text) and Download diff (.txt) toolbar actions
 * • Focus-managed: toggle button aria-expanded; panel role="region"
 * • WCAG 2.1 AA: visible focus rings, logical properties (RTL-safe)
 * • Responsive: stacked layout on mobile (< 600 px)
 * • prefers-reduced-motion respected via CSS
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Check,
  GitCompare,
} from 'lucide-react';
import './EventDiffViewer.css';

/* ─── Public types ──────────────────────────────────────────────────── */

/** Sentinel values with special rendering */
export type SpecialValue = '__redacted__' | '__binary__';

export type DiffFieldValue = string | number | boolean | null | undefined | SpecialValue;

export interface DiffField {
  /** Human-readable field name, e.g. "Revenue share %" */
  label: string;
  /** Value before the event. Omit or set undefined for "added" fields. */
  before?: DiffFieldValue;
  /** Value after the event. Omit or set undefined for "removed" fields. */
  after?: DiffFieldValue;
}

export interface EventDiff {
  /** Fields that changed (or were added/removed). */
  fields: DiffField[];
  /** Optional event label, e.g. "offering.updated" */
  eventType?: string;
}

export interface EventDiffViewerProps {
  diff: EventDiff;
  /** If true, panel is open on mount */
  defaultOpen?: boolean;
  /** Accessible label for the toggle button context, e.g. the entry actor+action */
  entryLabel?: string;
}

/* ─── Word-level diff ───────────────────────────────────────────────── */

type Token = { type: 'equal' | 'insert' | 'delete'; text: string };

/**
 * Produce a word-level token diff between two strings.
 * Uses a greedy LCS on word boundaries — good enough for field values.
 */
function wordDiff(before: string, after: string): { before: Token[]; after: Token[] } {
  const bWords = before.split(/(\s+)/);
  const aWords = after.split(/(\s+)/);

  // Build LCS length table
  const m = bWords.length;
  const n = aWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = bWords[i] === aWords[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const beforeTokens: Token[] = [];
  const afterTokens: Token[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && bWords[i] === aWords[j]) {
      beforeTokens.push({ type: 'equal', text: bWords[i] });
      afterTokens.push({ type: 'equal', text: aWords[j] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      afterTokens.push({ type: 'insert', text: aWords[j] });
      j++;
    } else {
      beforeTokens.push({ type: 'delete', text: bWords[i] });
      i++;
    }
  }
  return { before: beforeTokens, after: afterTokens };
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

const LONG_VALUE_THRESHOLD = 120;
const REDACTED = '__redacted__';
const BINARY = '__binary__';

function stringifyValue(v: DiffFieldValue): string {
  if (v === undefined || v === null) return '';
  if (v === REDACTED || v === BINARY) return String(v);
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  }
  // Attempt pretty-print if it looks like JSON
  if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
    try { return JSON.stringify(JSON.parse(v), null, 2); } catch { /* fall through */ }
  }
  return String(v);
}

function getChangeType(field: DiffField): 'added' | 'removed' | 'changed' {
  const hasBefore = field.before !== undefined && field.before !== null && field.before !== '';
  const hasAfter = field.after !== undefined && field.after !== null && field.after !== '';
  if (!hasBefore) return 'added';
  if (!hasAfter) return 'removed';
  return 'changed';
}

function buildPlainText(fields: DiffField[], eventType?: string): string {
  const lines: string[] = [];
  if (eventType) lines.push(`Event: ${eventType}`, '');
  fields.forEach((f) => {
    lines.push(`Field: ${f.label}`);
    lines.push(`  Before: ${stringifyValue(f.before)}`);
    lines.push(`  After:  ${stringifyValue(f.after)}`);
    lines.push('');
  });
  return lines.join('\n');
}

/* ─── Token renderer ────────────────────────────────────────────────── */

function TokenList({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((tok, i) => (
        <span
          key={i}
          className={
            tok.type === 'insert' ? 'edv-token-insert'
            : tok.type === 'delete' ? 'edv-token-delete'
            : 'edv-token-equal'
          }
        >
          {tok.text}
        </span>
      ))}
    </>
  );
}

/* ─── Value cell ────────────────────────────────────────────────────── */

interface ValueCellProps {
  value: DiffFieldValue;
  side: 'before' | 'after';
  /** Tokens already computed (only for string pairs) */
  tokens?: Token[];
}

const ValueCell: React.FC<ValueCellProps> = ({ value, side, tokens }) => {
  const [expanded, setExpanded] = useState(false);

  if (value === REDACTED) {
    return (
      <div className={`edv-value edv-value--${side} edv-value--redacted`} aria-label="Redacted value">
        ████████
      </div>
    );
  }
  if (value === BINARY) {
    return (
      <div className={`edv-value edv-value--${side} edv-value--binary`} aria-label="Binary payload">
        [binary data]
      </div>
    );
  }
  if (value === undefined || value === null || value === '') {
    return (
      <div className={`edv-value edv-value--${side} edv-value--empty`} aria-label="Empty value">
        (none)
      </div>
    );
  }

  const str = stringifyValue(value);
  const isLong = str.length > LONG_VALUE_THRESHOLD;
  const displayStr = isLong && !expanded ? str.slice(0, LONG_VALUE_THRESHOLD) + '…' : str;
  const hasTokens = tokens && tokens.length > 0;

  return (
    <div className={`edv-value edv-value--${side}`}>
      {hasTokens && !isLong ? (
        <TokenList tokens={tokens} />
      ) : (
        <>
          {displayStr}
          {isLong && (
            <div>
              <button
                type="button"
                className="edv-expand-btn"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <><ChevronUp size={10} aria-hidden="true" /> Show less</>
                ) : (
                  <><ChevronDown size={10} aria-hidden="true" /> Show more ({str.length - LONG_VALUE_THRESHOLD} more chars)</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Field row ─────────────────────────────────────────────────────── */

interface FieldRowProps {
  field: DiffField;
}

const FieldRow: React.FC<FieldRowProps> = ({ field }) => {
  const changeType = getChangeType(field);
  const badgeLabels = { added: 'Added', removed: 'Removed', changed: 'Changed' };

  // Compute word-level diff only for string pairs of reasonable length
  let beforeTokens: Token[] | undefined;
  let afterTokens: Token[] | undefined;
  if (
    changeType === 'changed' &&
    typeof field.before === 'string' &&
    typeof field.after === 'string' &&
    field.before !== REDACTED && field.before !== BINARY &&
    field.after !== REDACTED && field.after !== BINARY &&
    field.before.length < 600 && field.after.length < 600
  ) {
    const result = wordDiff(field.before, field.after);
    beforeTokens = result.before;
    afterTokens = result.after;
  }

  return (
    <li className="edv-field">
      <div className="edv-field-label">
        <span>{field.label}</span>
        <span
          className={`edv-change-badge edv-change-badge--${changeType}`}
          aria-label={badgeLabels[changeType]}
        >
          {badgeLabels[changeType]}
        </span>
      </div>
      <ValueCell value={field.before} side="before" tokens={beforeTokens} />
      <ValueCell value={field.after} side="after" tokens={afterTokens} />
    </li>
  );
};

/* ─── Main component ────────────────────────────────────────────────── */

export const EventDiffViewer: React.FC<EventDiffViewerProps> = ({
  diff,
  defaultOpen = false,
  entryLabel = 'this entry',
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (copyState !== 'copied') return;
    const timeoutId = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const handleCopy = useCallback(async () => {
    const text = buildPlainText(diff.fields, diff.eventType);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      // Fallback: nothing we can do without clipboard access
    }
  }, [diff]);

  const handleDownload = useCallback(() => {
    const text = buildPlainText(diff.fields, diff.eventType);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-${diff.eventType ?? 'event'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [diff]);

  const changedCount = diff.fields.length;

  return (
    <div className="edv-root">
      {/* Toggle */}
      <button
        ref={toggleRef}
        type="button"
        className="edv-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${open ? 'Hide' : 'Show'} field diff for ${entryLabel}. ${changedCount} field${changedCount !== 1 ? 's' : ''} changed.`}
        onClick={toggleOpen}
      >
        <GitCompare size={12} aria-hidden="true" />
        {open ? 'Hide diff' : `Show diff (${changedCount})`}
        {open ? <ChevronUp size={11} aria-hidden="true" /> : <ChevronDown size={11} aria-hidden="true" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={`Field diff${diff.eventType ? ` for ${diff.eventType}` : ''}`}
          className="edv-panel"
        >
          {/* Toolbar */}
          <div className="edv-toolbar">
            <span className="edv-toolbar-label">
              {changedCount} field{changedCount !== 1 ? 's' : ''} changed
              {diff.eventType ? ` · ${diff.eventType}` : ''}
            </span>
            <div className="edv-toolbar-actions">
              <span className="sr-only" aria-live="polite">
                {copyState === 'copied' ? 'Diff copied to clipboard.' : ''}
              </span>
              <button
                type="button"
                className={`edv-action-btn${copyState === 'copied' ? ' edv-action-btn--copied' : ''}`}
                onClick={handleCopy}
                aria-label="Copy diff as plain text"
              >
                {copyState === 'copied' ? (
                  <><Check size={11} aria-hidden="true" /> Copied</>
                ) : (
                  <><Copy size={11} aria-hidden="true" /> Copy diff</>
                )}
              </button>
              <button
                type="button"
                className="edv-action-btn"
                onClick={handleDownload}
                aria-label="Download diff as text file"
              >
                <Download size={11} aria-hidden="true" /> Download
              </button>
            </div>
          </div>

          {/* Column headers (hidden on mobile via CSS) */}
          <div className="edv-col-headers" aria-hidden="true">
            <div className="edv-col-header">Field</div>
            <div className="edv-col-header edv-col-header--before">Before</div>
            <div className="edv-col-header edv-col-header--after">After</div>
          </div>

          {/* Fields */}
          {diff.fields.length === 0 ? (
            <p className="edv-no-diff">No field-level changes recorded for this event.</p>
          ) : (
            <ul className="edv-field-list" aria-label="Changed fields">
              {diff.fields.map((field) => (
                <FieldRow key={field.label} field={field} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

EventDiffViewer.displayName = 'EventDiffViewer';
