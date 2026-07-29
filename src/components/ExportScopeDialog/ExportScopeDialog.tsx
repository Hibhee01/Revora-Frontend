import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { AuditFilterState } from '../AuditTrailFilters/savedFilters';
import { EMPTY_FILTERS, hasActiveFilters } from '../AuditTrailFilters/savedFilters';
import './ExportScopeDialog.css';

export type ExportScope = 'current-filter' | 'date-range' | 'all-events' | 'per-actor';
export type ExportFormat = 'CSV' | 'PDF' | 'JSON';

export interface ExportParams {
  scope: ExportScope;
  format: ExportFormat;
  dateFrom: string;
  dateTo: string;
  actor: string;
}

export interface ExportScopeDialogProps {
  open: boolean;
  filters: AuditFilterState;
  totalEntries: number;
  filteredEntries: number;
  onExport: (params: ExportParams) => void;
  onClose: () => void;
}

const FORMATS: ExportFormat[] = ['CSV', 'PDF', 'JSON'];

interface ScopeConfig {
  value: ExportScope;
  label: string;
  description: string;
  estimateMultiplier: number;
}

const SCOPE_OPTIONS: ScopeConfig[] = [
  {
    value: 'current-filter',
    label: 'Current filter',
    description: 'Export only the entries matching your current filter criteria.',
    estimateMultiplier: 0,
  },
  {
    value: 'date-range',
    label: 'Custom date range',
    description: 'Export entries within a specific date range.',
    estimateMultiplier: 0,
  },
  {
    value: 'all-events',
    label: 'All events',
    description: 'Export the complete audit trail without any filtering.',
    estimateMultiplier: 0,
  },
  {
    value: 'per-actor',
    label: 'Per actor',
    description: 'Export entries for a specific actor.',
    estimateMultiplier: 0,
  },
];

function estimateBytes(rows: number): number {
  return rows * 500;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  if (i === 0) return `${Math.round(value)} B`;
  return `${value.toFixed(1)} ${sizes[i]}`;
}

function estimateRowsForScope(
  scope: ExportScope,
  totalEntries: number,
  filteredEntries: number,
  _dateFrom: string,
  _dateTo: string,
  _actor: string
): number {
  switch (scope) {
    case 'current-filter':
      return filteredEntries;
    case 'date-range':
      return totalEntries > 0 ? Math.max(1, Math.round(totalEntries * 0.6)) : 0;
    case 'all-events':
      return totalEntries;
    case 'per-actor':
      return totalEntries > 0 ? Math.max(1, Math.round(totalEntries * 0.3)) : 0;
  }
}

export const ExportScopeDialog: React.FC<ExportScopeDialogProps> = ({
  open,
  filters,
  totalEntries,
  filteredEntries,
  onExport,
  onClose,
}) => {
  const [scope, setScope] = useState<ExportScope>('current-filter');
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actorField, setActorField] = useState('');
  const [exporting, setExporting] = useState(false);

  const titleId = useId();
  const scopeLegendId = useId();
  const formatLegendId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setScope('current-filter');
      setFormat('CSV');
      setDateFrom('');
      setDateTo('');
      setActorField(filters.actor || '');
      setExporting(false);
      const raf = requestAnimationFrame(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const root = event.currentTarget;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([aria-hidden="true"]), input:not([disabled]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), textarea:not([disabled]):not([aria-hidden="true"]), [href]:not([aria-hidden="true"]), [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
        )
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    []
  );

  const estimatedRows = estimateRowsForScope(scope, totalEntries, filteredEntries, dateFrom, dateTo, actorField);
  const estimatedBytes = estimateBytes(estimatedRows);
  const isLargeExport = estimatedRows > 10000 || estimatedBytes > 5 * 1024 * 1024;
  const showDateRange = scope === 'date-range';
  const showActor = scope === 'per-actor';

  const handleExport = () => {
    setExporting(true);
    onExport({
      scope,
      format,
      dateFrom: showDateRange ? dateFrom : '',
      dateTo: showDateRange ? dateTo : '',
      actor: showActor ? actorField : '',
    });
  };

  if (!open) return null;

  return (
    <div
      className="atf-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="export-scope-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="esd-dialog glass-card"
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="atf-dialog-title">
          Export Audit Trail
        </h2>

        <fieldset className="esd-fieldset">
          <legend id={scopeLegendId} className="esd-legend">Scope</legend>
          <div role="radiogroup" aria-labelledby={scopeLegendId} className="esd-radio-group">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`esd-radio-label ${scope === opt.value ? 'esd-radio-label--active' : ''}`}
              >
                <input
                  type="radio"
                  name="export-scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  onChange={() => setScope(opt.value)}
                  className="sr-only"
                />
                <span className="esd-radio-control" aria-hidden="true">
                  {scope === opt.value && <span className="esd-radio-dot" />}
                </span>
                <span className="esd-radio-text">
                  <span className="esd-radio-label-text">{opt.label}</span>
                  <span className="esd-radio-desc">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {showDateRange && (
          <div className="esd-date-range" data-testid="esd-date-range">
            <div className="input-group">
              <label className="input-label" htmlFor={`esd-from-${titleId}`}>From</label>
              <input
                id={`esd-from-${titleId}`}
                className="input-field"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor={`esd-to-${titleId}`}>To</label>
              <input
                id={`esd-to-${titleId}`}
                className="input-field"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {showActor && (
          <div className="input-group" data-testid="esd-actor-field">
            <label className="input-label" htmlFor={`esd-actor-${titleId}`}>Actor</label>
            <input
              id={`esd-actor-${titleId}`}
              className="input-field"
              type="text"
              value={actorField}
              onChange={(e) => setActorField(e.target.value)}
              placeholder="e.g. maria.chen"
            />
          </div>
        )}

        <fieldset className="esd-fieldset">
          <legend id={formatLegendId} className="esd-legend">Format</legend>
          <div role="radiogroup" aria-labelledby={formatLegendId} className="esd-format-group">
            {FORMATS.map((fmt) => (
              <label
                key={fmt}
                className={`esd-format-label ${format === fmt ? 'esd-format-label--active' : ''}`}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={fmt}
                  checked={format === fmt}
                  onChange={() => setFormat(fmt)}
                  className="sr-only"
                />
                {fmt}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="esd-estimate" aria-live="polite" data-testid="export-estimate">
          <span>
            Estimated: <strong>{estimatedRows.toLocaleString()}</strong> rows &middot;{' '}
            <strong>{formatBytes(estimatedBytes)}</strong>
          </span>
        </div>

        {isLargeExport && (
          <div className="esd-warning" role="alert" data-testid="export-large-warning">
            This export contains a large amount of data ({estimatedRows.toLocaleString()} rows,{' '}
            {formatBytes(estimatedBytes)}). It may take several minutes to complete.
          </div>
        )}

        {exporting && (
          <div className="esd-progress" data-testid="export-progress">
            <div className="esd-progress-label">Exporting {estimatedRows.toLocaleString()} rows as {format}&hellip;</div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        <div className="atf-dialog-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn--primary btn--sm ${exporting ? 'btn-loading' : ''}`}
            onClick={handleExport}
            disabled={exporting}
            aria-busy={exporting}
          >
            {exporting ? 'Exporting\u2026' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
