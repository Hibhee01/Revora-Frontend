/**
 * Blacklist CSV Import — Issue #207
 *
 * A four-step wizard for importing blacklisted addresses from CSV files.
 *
 * Steps:
 *  1. Upload — file selection with drag-and-drop
 *  2. Map Columns — auto-detect address/checksum columns, manual override
 *  3. Preview — table with row-level conflict badges
 *  4. Confirm — import confirmation with rollback messaging
 *
 * Features:
 *  - WCAG 2.1 AA: keyboard navigation, aria-live, focus management
 *  - Responsive: stacked on mobile, side-by-side on desktop
 *  - High-contrast and print support
 *  - Pagination for large files
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Button } from './Button';
import {
  BlacklistCsvImportProps,
  WizardStep,
  WIZARD_STEP_LABELS,
  CsvRow,
  PreviewRow,
  ColumnMapping,
  ConflictReason,
  CONFLICT_REASON_LABELS,
} from './BlacklistCsvImport.types';
import './BlacklistCsvImport.css';

/* ─── Helpers ──────────────────────────────────────────────────────── */

function parseCsvText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          cells.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function detectColumnMapping(headers: string[]): ColumnMapping {
  const addressKeywords = ['address', 'wallet', 'account', 'publickey', 'public_key'];
  const checksumKeywords = ['checksum', 'hash', 'signature', 'sig'];

  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[\s_-]/g, ''));

  let addressCol = headers[0] ?? '';
  let checksumCol: string | undefined;

  for (let i = 0; i < lowerHeaders.length; i++) {
    if (addressKeywords.some((kw) => lowerHeaders[i].includes(kw))) {
      addressCol = headers[i];
      break;
    }
  }

  for (let i = 0; i < lowerHeaders.length; i++) {
    if (checksumKeywords.some((kw) => lowerHeaders[i].includes(kw))) {
      checksumCol = headers[i];
      break;
    }
  }

  return { address: addressCol, checksum: checksumCol };
}

function detectConflicts(
  rows: CsvRow[],
  mapping: ColumnMapping,
  existingAddresses: string[],
): PreviewRow[] {
  const seen = new Set<string>();
  return rows.map((row, idx) => {
    const address = (row[mapping.address] ?? '').trim();
    const checksum = mapping.checksum ? (row[mapping.checksum] ?? '').trim() : undefined;

    let conflictReason: ConflictReason | undefined;
    let conflictDetail: string | undefined;

    if (existingAddresses.includes(address)) {
      conflictReason = 'existing_entry';
      conflictDetail = 'Address already exists in the blacklist.';
    } else if (seen.has(address)) {
      conflictReason = 'duplicate_row';
      conflictDetail = 'This address appears more than once in the file.';
    }

    seen.add(address);

    return {
      address,
      checksum,
      conflictReason,
      conflictDetail,
      rowNumber: idx + 1,
    };
  });
}

/* ─── Step Indicator ───────────────────────────────────────────────── */

const STEPS: WizardStep[] = ['upload', 'map', 'preview', 'confirm'];

function StepIndicator({
  currentStep,
}: {
  currentStep: WizardStep;
}) {
  const currentIdx = STEPS.indexOf(currentStep);

  return (
    <nav className="bci-steps" aria-label="Import progress">
      <ol className="bci-steps-list">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li
              key={step}
              className={`bci-step ${isCompleted ? 'bci-step--completed' : ''} ${isCurrent ? 'bci-step--current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="bci-step-number" aria-hidden="true">
                {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
              </span>
              <span className="bci-step-label">{WIZARD_STEP_LABELS[step]}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── Upload Step ──────────────────────────────────────────────────── */

function UploadStep({
  onFileParsed,
}: {
  onFileParsed: (headers: string[], rows: CsvRow[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
        setError('Please select a CSV file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          setError('Failed to read file.');
          return;
        }

        // Strip BOM if present
        const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
        const rows = parseCsvText(clean);

        if (rows.length < 2) {
          setError('File must contain a header row and at least one data row.');
          return;
        }

        const headers = rows[0];
        const dataRows = rows.slice(1).map((cells) => {
          const row: CsvRow = { address: '' };
          headers.forEach((h, i) => {
            row[h] = cells[i] ?? '';
          });
          return row;
        });

        onFileParsed(headers, dataRows);
      };
      reader.onerror = () => setError('Failed to read file.');
      reader.readAsText(file);
    },
    [onFileParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div className="bci-upload">
      <div
        className={`bci-dropzone ${dragOver ? 'bci-dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file. Click or drag and drop."
      >
        <FileSpreadsheet size={32} className="bci-upload-icon" aria-hidden="true" />
        <p className="bci-upload-text">
          Drop a CSV file here, or <span className="bci-upload-link">browse</span>
        </p>
        <p className="bci-upload-hint">Supports .csv files with address data</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="bci-file-input"
          onChange={handleChange}
          aria-label="Select CSV file"
        />
      </div>
      {error && (
        <div className="bci-upload-error" role="alert" aria-live="assertive">
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
}

/* ─── Map Step ─────────────────────────────────────────────────────── */

function MapStep({
  headers,
  mapping,
  onMappingChange,
}: {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (m: ColumnMapping) => void;
}) {
  return (
    <div className="bci-map">
      <p className="bci-map-description">
        Map CSV columns to the required fields. The address column is required.
      </p>
      <div className="bci-map-fields">
        <div className="bci-map-field">
          <label className="bci-map-label" htmlFor="bci-address-col">
            Address Column <span className="bci-required" aria-label="required">*</span>
          </label>
          <select
            id="bci-address-col"
            className="bci-map-select"
            value={mapping.address}
            onChange={(e) => onMappingChange({ ...mapping, address: e.target.value })}
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="bci-map-field">
          <label className="bci-map-label" htmlFor="bci-checksum-col">
            Checksum Column <span className="bci-map-optional">(optional)</span>
          </label>
          <select
            id="bci-checksum-col"
            className="bci-map-select"
            value={mapping.checksum ?? ''}
            onChange={(e) =>
              onMappingChange({ ...mapping, checksum: e.target.value || undefined })
            }
          >
            <option value="">None</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bci-map-preview">
        <p className="bci-map-preview-label">Column preview:</p>
        <div className="bci-map-preview-headers">
          {headers.map((h) => (
            <span
              key={h}
              className={`bci-map-preview-chip ${h === mapping.address ? 'bci-map-preview-chip--address' : ''} ${h === mapping.checksum ? 'bci-map-preview-chip--checksum' : ''}`}
            >
              {h}
              {h === mapping.address && (
                <ArrowRight size={10} aria-hidden="true" className="bci-chip-icon" />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Preview Step ─────────────────────────────────────────────────── */

const PAGE_SIZE = 25;

function PreviewStep({
  rows,
  currentPage,
  onPageChange,
}: {
  rows: PreviewRow[];
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const conflictCount = rows.filter((r) => r.conflictReason).length;
  const cleanCount = rows.length - conflictCount;

  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `${rows.length} rows loaded. ${cleanCount} clean, ${conflictCount} with conflicts.`;
    }
  }, [rows.length, cleanCount, conflictCount]);

  return (
    <div className="bci-preview">
      <div className="bci-preview-summary" aria-live="polite" ref={liveRef}>
        <div className="bci-preview-stat">
          <span className="bci-preview-stat-value">{rows.length}</span>
          <span className="bci-preview-stat-label">Total rows</span>
        </div>
        <div className="bci-preview-stat bci-preview-stat--clean">
          <span className="bci-preview-stat-value">{cleanCount}</span>
          <span className="bci-preview-stat-label">Clean</span>
        </div>
        <div className="bci-preview-stat bci-preview-stat--conflict">
          <span className="bci-preview-stat-value">{conflictCount}</span>
          <span className="bci-preview-stat-label">Conflicts</span>
        </div>
      </div>

      <div className="bci-preview-table-wrap" role="region" aria-label="Import preview table" tabIndex={0}>
        <table className="bci-preview-table">
          <thead>
            <tr>
              <th scope="col" className="bci-th-row">#</th>
              <th scope="col" className="bci-th-address">Address</th>
              <th scope="col" className="bci-th-checksum">Checksum</th>
              <th scope="col" className="bci-th-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.rowNumber}
                className={`bci-tr ${row.conflictReason ? 'bci-tr--conflict' : ''}`}
              >
                <td className="bci-td-row">{row.rowNumber}</td>
                <td className="bci-td-address">
                  <code className="bci-address-code">{row.address || '—'}</code>
                </td>
                <td className="bci-td-checksum">
                  {row.checksum ? (
                    <code className="bci-checksum-code">{row.checksum}</code>
                  ) : (
                    <span className="bci-no-data">—</span>
                  )}
                </td>
                <td className="bci-td-status">
                  {row.conflictReason ? (
                    <span
                      className={`bci-badge bci-badge--${row.conflictReason}`}
                      aria-label={CONFLICT_REASON_LABELS[row.conflictReason]}
                    >
                      <AlertTriangle size={10} aria-hidden="true" />
                      {CONFLICT_REASON_LABELS[row.conflictReason]}
                    </span>
                  ) : (
                    <span className="bci-badge bci-badge--clean">
                      <CheckCircle2 size={10} aria-hidden="true" />
                      Ready
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bci-pagination" role="navigation" aria-label="Preview pagination">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Prev
          </Button>
          <span className="bci-pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Confirm Step ─────────────────────────────────────────────────── */

function ConfirmStep({
  rows,
  onConfirm,
}: {
  rows: PreviewRow[];
  onConfirm: () => void;
}) {
  const conflictCount = rows.filter((r) => r.conflictReason).length;
  const cleanCount = rows.length - conflictCount;

  return (
    <div className="bci-confirm">
      <div className="bci-confirm-summary">
        <CheckCircle2 size={32} className="bci-confirm-icon" aria-hidden="true" />
        <h3 className="bci-confirm-title">Ready to import</h3>
        <p className="bci-confirm-description">
          {cleanCount} address{cleanCount !== 1 ? 'es' : ''} will be added to the blacklist.
          {conflictCount > 0 && (
            <> {conflictCount} conflicted row{conflictCount !== 1 ? 's' : ''} will be skipped.</>
          )}
        </p>
      </div>

      {conflictCount > 0 && (
        <div className="bci-confirm-warnings" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <p>
            <strong>{conflictCount} rows</strong> were flagged and will not be imported.
            Review the preview step to see conflict details.
          </p>
        </div>
      )}

      <div className="bci-confirm-rollback">
        <p className="bci-rollback-text">
          <strong>Rollback:</strong> If imported in error, blacklisted addresses can be
          removed individually from the Distribution Dashboard.
        </p>
      </div>

      <Button variant="primary" onClick={onConfirm} className="bci-confirm-btn">
        <CheckCircle2 size={16} aria-hidden="true" />
        Confirm Import
      </Button>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */

export const BlacklistCsvImport: React.FC<BlacklistCsvImportProps> = ({
  onImport,
  onCancel,
  existingAddresses = [],
  className = '',
}) => {
  const [step, setStep] = useState<WizardStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ address: '' });
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const stepIdx = STEPS.indexOf(step);

  const handleFileParsed = useCallback((h: string[], rows: CsvRow[]) => {
    setHeaders(h);
    setRawRows(rows);
    setMapping(detectColumnMapping(h));
    setStep('map');
  }, []);

  const handleMappingConfirm = useCallback(() => {
    const detected = detectConflicts(rawRows, mapping, existingAddresses);
    setPreviewRows(detected);
    setCurrentPage(1);
    setStep('preview');
  }, [rawRows, mapping, existingAddresses]);

  const handleConfirm = useCallback(() => {
    const cleanRows = previewRows.filter((r) => !r.conflictReason);
    onImport?.(cleanRows);
    setStep('confirm');
  }, [previewRows, onImport]);

  const handleBack = useCallback(() => {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  }, [stepIdx]);

  return (
    <div className={`bci-container ${className}`} role="dialog" aria-label="Blacklist CSV import">
      <div className="bci-header">
        <h2 className="bci-title">Import Blacklist CSV</h2>
        {onCancel && (
          <button
            type="button"
            className="bci-close"
            onClick={onCancel}
            aria-label="Close import wizard"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <StepIndicator currentStep={step} />

      <div className="bci-content">
        {step === 'upload' && <UploadStep onFileParsed={handleFileParsed} />}
        {step === 'map' && (
          <MapStep headers={headers} mapping={mapping} onMappingChange={setMapping} />
        )}
        {step === 'preview' && (
          <PreviewStep
            rows={previewRows}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
        {step === 'confirm' && <ConfirmStep rows={previewRows} onConfirm={handleConfirm} />}
      </div>

      <div className="bci-footer">
        {step !== 'upload' && step !== 'confirm' && (
          <Button variant="secondary" onClick={handleBack}>
            <ChevronLeft size={14} aria-hidden="true" />
            Back
          </Button>
        )}
        {step === 'map' && (
          <Button variant="primary" onClick={handleMappingConfirm}>
            Preview
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        )}
        {step === 'preview' && (
          <Button variant="primary" onClick={handleConfirm}>
            Import
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        )}
        {step === 'confirm' && (
          <Button variant="secondary" onClick={onCancel}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
};

export default BlacklistCsvImport;
