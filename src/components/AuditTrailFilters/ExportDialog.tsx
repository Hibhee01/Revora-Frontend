/**
 * ExportDialog — modal for configuring and initiating an audit trail export (Issue).
 *
 * Accessibility (WCAG 2.1 AA):
 *  - role="dialog" + aria-modal, labelled by the dialog title
 *  - focus trap and escape handling
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { type AuditFilterState, describeFilters, hasActiveFilters } from './savedFilters';
import { Download, AlertTriangle } from 'lucide-react';

export type ExportScope = 'current' | 'date_range' | 'actor' | 'all';
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportDialogProps {
  open: boolean;
  filters: AuditFilterState;
  onExport: (scope: ExportScope, format: ExportFormat, options: any) => void;
  onClose: () => void;
}

function estimateExportSize(scope: ExportScope, format: ExportFormat, filters: AuditFilterState): { rows: number; sizeBytes: number } {
  // Mock estimation logic
  let rows = 0;
  switch (scope) {
    case 'current':
      rows = hasActiveFilters(filters) ? 500 : 10000;
      break;
    case 'date_range':
      rows = 2500;
      break;
    case 'actor':
      rows = 1200;
      break;
    case 'all':
      rows = 50000;
      break;
  }
  
  let multiplier = 1;
  if (format === 'json') multiplier = 1.5;
  if (format === 'pdf') multiplier = 5;
  
  return { rows, sizeBytes: rows * 200 * multiplier };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  filters,
  onExport,
  onClose,
}) => {
  const [scope, setScope] = useState<ExportScope>('current');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [actor, setActor] = useState(filters.actor || '');
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState(filters.dateTo || '');

  const titleId = useId();
  const summaryId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      // Sync defaults when opened
      setScope(hasActiveFilters(filters) ? 'current' : 'all');
      setFormat('csv');
      setActor(filters.actor || '');
      setDateFrom(filters.dateFrom || '');
      setDateTo(filters.dateTo || '');
      requestAnimationFrame(() => firstInputRef.current?.focus());
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

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onExport(scope, format, { actor, dateFrom, dateTo });
  };

  const estimate = estimateExportSize(scope, format, filters);
  const isLarge = estimate.rows > 10000;

  if (!open) return null;

  return (
    <div
      className="atf-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="export-dialog-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        className="atf-dialog glass-card"
        style={{ maxWidth: '500px' }}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="atf-dialog-title">
          Export Audit Trail
        </h2>
        <p id={summaryId} className="atf-dialog-summary">
          Download a secure copy of the audit logs for reporting or external review.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="input-group" style={{ border: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
            <legend className="input-label" style={{ marginBottom: '0.5rem' }}>Scope</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  value="current"
                  ref={firstInputRef}
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  disabled={!hasActiveFilters(filters)}
                />
                <span>Current filters {hasActiveFilters(filters) ? <span className="text-muted text-sm">({describeFilters(filters)})</span> : <span className="text-muted text-sm">(No active filters)</span>}</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  value="date_range"
                  checked={scope === 'date_range'}
                  onChange={() => setScope('date_range')}
                />
                <span>Date range</span>
              </label>
              
              {scope === 'date_range' && (
                <div style={{ display: 'flex', gap: '1rem', marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                  <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="From date" />
                  <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label="To date" />
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  value="actor"
                  checked={scope === 'actor'}
                  onChange={() => setScope('actor')}
                />
                <span>Specific actor</span>
              </label>

              {scope === 'actor' && (
                <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                  <input type="text" className="input-field" value={actor} onChange={e => setActor(e.target.value)} placeholder="e.g. maria.chen" aria-label="Actor username" />
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                />
                <span>All events</span>
              </label>
            </div>
          </fieldset>

          <div className="input-group">
            <label className="input-label" htmlFor="export-format">Format</label>
            <select
              id="export-format"
              className="input-field"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="json">JSON (Machine readable)</option>
              <option value="pdf">PDF (Printable document)</option>
            </select>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }} aria-live="polite">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span className="text-muted">Estimated rows:</span>
              <span className="font-semibold">{estimate.rows.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span className="text-muted">Estimated size:</span>
              <span className="font-semibold">{formatBytes(estimate.sizeBytes)}</span>
            </div>
            {isLarge && (
              <div style={{ display: 'flex', gap: '0.5rem', color: '#fbbf24', marginTop: '0.75rem', fontSize: '0.875rem', alignItems: 'center' }}>
                <AlertTriangle size={16} />
                <span>Large export. This may take several minutes to generate.</span>
              </div>
            )}
          </div>

          <div className="atf-dialog-actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--sm" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Download size={14} aria-hidden="true" />
              Export {format.toUpperCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
