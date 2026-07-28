/**
 * Document Replacement Flow — Issue #226
 *
 * A responsive, accessible wizard flow that gives users confidence
 * when replacing a document by presenting the old and new versions
 * side-by-side with metadata, a diff summary, and the ability to
 * keep both versions with a clearly labeled active version.
 *
 * Features:
 * - Three-step wizard: Upload → Review Diff → Confirm
 * - Side-by-side version comparison (stacked on mobile)
 * - File metadata: size, uploaded by, timestamp, type, hash
 * - Diff summary (lines/pages/bytes added, removed, changed)
 * - Toggle to keep both versions, with version labeling
 * - Active-version selector (radio) that marks which version is "Active"
 * - WCAG 2.1 AA: aria-live, focus management, visible focus, keyboard nav
 * - RTL-aware, responsive, reduced-motion, forced-colors
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Minus,
  FileDiff,
  User,
  Calendar,
  HardDrive,
  Hash,
  ShieldCheck,
  FileType,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './Button';
import {
  formatDate,
  SupportedLocale,
} from '../constants/i18n';
import './DocumentReplacementFlow.css';

/* ─── Types ──────────────────────────────────────────────────────── */

export interface DocumentVersion {
  id: string;
  versionLabel: string; // e.g. "v1", "v2", "Original", "Replacement"
  fileName: string;
  fileType: string; // e.g. "PDF", "CSV", "XLSX"
  fileSizeBytes: number;
  uploadedBy: {
    id: string;
    name: string;
    email?: string;
  };
  uploadedAt: string; // ISO
  sha256?: string;
  previewUrl?: string;
  /** Optional page count for docs */
  pageCount?: number;
  /** Optional line count for text docs */
  lineCount?: number;
  notes?: string;
}

export interface DiffSummary {
  bytesAdded: number;
  bytesRemoved: number;
  linesAdded?: number;
  linesRemoved?: number;
  pagesAdded?: number;
  pagesRemoved?: number;
  fieldsChanged?: Array<{
    name: string;
    oldValue: string;
    newValue: string;
  }>;
  highConfidenceMatch: boolean; // whether the diff engine is confident
  summaryText: string; // human-readable summary
}

export type ReplacementStep = 'upload' | 'review' | 'confirm' | 'success';

export interface DocumentReplacementFlowProps {
  /** Existing document to replace */
  oldVersion: DocumentVersion;
  /** Optional pre-uploaded new version; if omitted, step 1 uploads one */
  initialNewVersion?: DocumentVersion | null;
  /** Optional pre-computed diff (e.g. from API) */
  initialDiff?: DiffSummary | null;
  /** Locale */
  locale?: string;
  /** Optional document name override */
  documentName?: string;
  /** Called with the final decision on submit */
  onConfirm?: (result: {
    newVersion: DocumentVersion;
    oldVersion: DocumentVersion;
    keepBoth: boolean;
    activeVersionId: string;
  }) => void;
  /** Called when the flow is canceled */
  onCancel?: () => void;
  /** Called when a new file is picked / dropped. Return the new DocumentVersion. */
  onFileSelected?: (file: File) => Promise<DocumentVersion> | DocumentVersion;
  /** Called when a diff is needed. Return DiffSummary if available. */
  onComputeDiff?: (
    oldVersion: DocumentVersion,
    newVersion: DocumentVersion,
  ) => Promise<DiffSummary> | DiffSummary;
  /** Additional CSS class */
  className?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function computeMockDiff(
  oldVersion: DocumentVersion,
  newVersion: DocumentVersion,
): DiffSummary {
  const bytesAdded = Math.max(newVersion.fileSizeBytes - oldVersion.fileSizeBytes, 0);
  const bytesRemoved = Math.max(oldVersion.fileSizeBytes - newVersion.fileSizeBytes, 0);

  const linesAdded =
    newVersion.lineCount && oldVersion.lineCount
      ? Math.max(newVersion.lineCount - oldVersion.lineCount, 0)
      : undefined;
  const linesRemoved =
    newVersion.lineCount && oldVersion.lineCount
      ? Math.max(oldVersion.lineCount - newVersion.lineCount, 0)
      : undefined;

  const pagesAdded =
    newVersion.pageCount && oldVersion.pageCount
      ? Math.max(newVersion.pageCount - oldVersion.pageCount, 0)
      : undefined;
  const pagesRemoved =
    newVersion.pageCount && oldVersion.pageCount
      ? Math.max(oldVersion.pageCount - newVersion.pageCount, 0)
      : undefined;

  const parts: string[] = [];
  if (bytesAdded > 0 || bytesRemoved > 0) {
    parts.push(
      `${formatBytes(bytesAdded)} added, ${formatBytes(bytesRemoved)} removed`,
    );
  }
  if (linesAdded !== undefined || linesRemoved !== undefined) {
    parts.push(`${linesAdded ?? 0} lines +, ${linesRemoved ?? 0} lines −`);
  }
  if (pagesAdded !== undefined || pagesRemoved !== undefined) {
    if ((pagesAdded ?? 0) > 0 || (pagesRemoved ?? 0) > 0) {
      parts.push(`${pagesAdded ?? 0} pages +, ${pagesRemoved ?? 0} pages −`);
    }
  }

  const summaryText =
    parts.length > 0 ? parts.join(' · ') : 'File size and contents unchanged.';

  return {
    bytesAdded,
    bytesRemoved,
    linesAdded,
    linesRemoved,
    pagesAdded,
    pagesRemoved,
    highConfidenceMatch: true,
    summaryText,
    fieldsChanged: undefined,
  };
}

/* ─── Step Indicator ─────────────────────────────────────────────── */

interface StepIndicatorProps {
  steps: Array<{ key: ReplacementStep; label: string }>;
  current: ReplacementStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, current }) => {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <ol
      className="drf-step-indicator"
      role="list"
      aria-label="Replacement progress"
    >
      {steps.map((step, idx) => {
        const status =
          idx < currentIndex
            ? 'complete'
            : idx === currentIndex
              ? 'current'
              : 'upcoming';
        return (
          <li
            key={step.key}
            className={`drf-step drf-step--${status}`}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className="drf-step-bubble" aria-hidden="true">
              {status === 'complete' ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                idx + 1
              )}
            </span>
            <span className="drf-step-label">{step.label}</span>
            {idx < steps.length - 1 && (
              <span className="drf-step-connector" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

/* ─── Version Card (side-by-side) ────────────────────────────────── */

interface VersionCardProps {
  version: DocumentVersion;
  variant: 'old' | 'new';
  locale: string;
  isActive: boolean;
  selectable: boolean;
  onToggleActive?: () => void;
  actions?: React.ReactNode;
}

const VersionCard: React.FC<VersionCardProps> = ({
  version,
  variant,
  locale,
  isActive,
  selectable,
  onToggleActive,
  actions,
}) => {
  const radioId = useId();

  return (
    <article
      className={`drf-version-card drf-version-card--${variant} ${isActive ? 'drf-version-card--active' : ''}`}
      aria-labelledby={`${radioId}-title`}
    >
      <header className="drf-version-card-header">
        <span
          className={`drf-version-badge drf-version-badge--${variant}`}
          aria-hidden="true"
        >
          {variant === 'old' ? 'Previous version' : 'New version'}
        </span>
        {isActive && (
          <span className="drf-active-badge" role="status" aria-live="polite">
            <ShieldCheck size={12} aria-hidden="true" />
            Active
          </span>
        )}
      </header>

      <div className="drf-version-preview">
        <div className="drf-preview-icon" aria-hidden="true">
          <FileText size={32} />
        </div>
        <div className="drf-preview-meta">
          <h4 id={`${radioId}-title`} className="drf-preview-name">
            {version.fileName}
          </h4>
          <span className="drf-preview-label">
            {version.versionLabel}
          </span>
        </div>
      </div>

      <dl className="drf-version-meta">
        <div className="drf-meta-item">
          <dt aria-hidden="true">
            <FileType size={14} /> Type
          </dt>
          <dd>{version.fileType.toUpperCase()}</dd>
        </div>
        <div className="drf-meta-item">
          <dt aria-hidden="true">
            <HardDrive size={14} /> Size
          </dt>
          <dd>{formatBytes(version.fileSizeBytes)}</dd>
        </div>
        <div className="drf-meta-item">
          <dt aria-hidden="true">
            <User size={14} /> Uploaded by
          </dt>
          <dd title={version.uploadedBy.email}>
            {version.uploadedBy.name}
          </dd>
        </div>
        <div className="drf-meta-item">
          <dt aria-hidden="true">
            <Calendar size={14} /> Uploaded
          </dt>
          <dd>
            {formatDate(
              version.uploadedAt,
              locale as SupportedLocale,
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              },
            )}
          </dd>
        </div>
        {version.pageCount !== undefined && (
          <div className="drf-meta-item">
            <dt aria-hidden="true">
              <FileText size={14} /> Pages
            </dt>
            <dd>{version.pageCount}</dd>
          </div>
        )}
        {version.sha256 && (
          <div className="drf-meta-item drf-meta-item--hash">
            <dt aria-hidden="true">
              <Hash size={14} /> SHA-256
            </dt>
            <dd className="drf-hash" title={version.sha256}>
              {version.sha256.slice(0, 10)}…{version.sha256.slice(-6)}
            </dd>
          </div>
        )}
      </dl>

      {selectable && (
        <label
          className="drf-active-selector"
          htmlFor={`${radioId}-radio`}
        >
          <input
            id={`${radioId}-radio`}
            type="radio"
            name="drf-active-version"
            checked={isActive}
            onChange={onToggleActive}
            aria-label={`Mark version ${version.versionLabel} as active`}
          />
          <span className="drf-active-selector-label">
            {isActive ? 'This is the active version' : 'Mark as active version'}
          </span>
        </label>
      )}

      {actions && <div className="drf-version-actions">{actions}</div>}
    </article>
  );
};

/* ─── Diff Summary Panel ─────────────────────────────────────────── */

interface DiffSummaryPanelProps {
  diff: DiffSummary;
}

const DiffSummaryPanel: React.FC<DiffSummaryPanelProps> = ({ diff }) => {
  const [expanded, setExpanded] = useState(true);
  const headerId = useId();

  return (
    <section
      className="drf-diff-summary"
      aria-labelledby={headerId}
    >
      <button
        type="button"
        className="drf-diff-summary-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`${headerId}-body`}
      >
        <div className="drf-diff-summary-title">
          <FileDiff size={18} aria-hidden="true" />
          <h3 id={headerId}>What changed</h3>
          {!diff.highConfidenceMatch && (
            <span className="drf-diff-warn-pill" title="Diff accuracy may be limited for binary files">
              <AlertTriangle size={12} aria-hidden="true" />
              Approximate
            </span>
          )}
        </div>
        <span className="drf-diff-summary-text" aria-live="polite">
          {diff.summaryText}
        </span>
        <span className="drf-diff-summary-toggle" aria-hidden="true">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div id={`${headerId}-body`} className="drf-diff-summary-body">
          <div className="drf-diff-grid" role="group" aria-label="Change breakdown">
            <div className="drf-diff-stat drf-diff-stat--added">
              <div className="drf-diff-stat-icon" aria-hidden="true">
                <Plus size={16} />
              </div>
              <div className="drf-diff-stat-content">
                <span className="drf-diff-stat-value">
                  +{formatBytes(diff.bytesAdded)}
                </span>
                <span className="drf-diff-stat-label">Bytes added</span>
              </div>
            </div>
            <div className="drf-diff-stat drf-diff-stat--removed">
              <div className="drf-diff-stat-icon" aria-hidden="true">
                <Minus size={16} />
              </div>
              <div className="drf-diff-stat-content">
                <span className="drf-diff-stat-value">
                  −{formatBytes(diff.bytesRemoved)}
                </span>
                <span className="drf-diff-stat-label">Bytes removed</span>
              </div>
            </div>
            {diff.linesAdded !== undefined && diff.linesRemoved !== undefined && (
              <>
                <div className="drf-diff-stat drf-diff-stat--added">
                  <div className="drf-diff-stat-icon" aria-hidden="true">
                    <Plus size={16} />
                  </div>
                  <div className="drf-diff-stat-content">
                    <span className="drf-diff-stat-value">
                      +{diff.linesAdded}
                    </span>
                    <span className="drf-diff-stat-label">Lines added</span>
                  </div>
                </div>
                <div className="drf-diff-stat drf-diff-stat--removed">
                  <div className="drf-diff-stat-icon" aria-hidden="true">
                    <Minus size={16} />
                  </div>
                  <div className="drf-diff-stat-content">
                    <span className="drf-diff-stat-value">
                      −{diff.linesRemoved}
                    </span>
                    <span className="drf-diff-stat-label">Lines removed</span>
                  </div>
                </div>
              </>
            )}
            {diff.pagesAdded !== undefined && diff.pagesRemoved !== undefined && (
              <>
                <div className="drf-diff-stat drf-diff-stat--added">
                  <div className="drf-diff-stat-icon" aria-hidden="true">
                    <Plus size={16} />
                  </div>
                  <div className="drf-diff-stat-content">
                    <span className="drf-diff-stat-value">
                      +{diff.pagesAdded}
                    </span>
                    <span className="drf-diff-stat-label">Pages added</span>
                  </div>
                </div>
                <div className="drf-diff-stat drf-diff-stat--removed">
                  <div className="drf-diff-stat-icon" aria-hidden="true">
                    <Minus size={16} />
                  </div>
                  <div className="drf-diff-stat-content">
                    <span className="drf-diff-stat-value">
                      −{diff.pagesRemoved}
                    </span>
                    <span className="drf-diff-stat-label">Pages removed</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {diff.fieldsChanged && diff.fieldsChanged.length > 0 && (
            <div className="drf-fields-changed">
              <h4 className="drf-fields-changed-title">
                <Sparkles size={14} aria-hidden="true" />
                Fields changed
              </h4>
              <ul className="drf-fields-changed-list" role="list">
                {diff.fieldsChanged.map((field, idx) => (
                  <li key={`${field.name}-${idx}`} className="drf-field-row">
                    <span className="drf-field-name">{field.name}</span>
                    <span className="drf-field-val drf-field-val--old">
                      <X size={12} aria-hidden="true" /> {field.oldValue}
                    </span>
                    <span
                      className="drf-field-arrow"
                      aria-hidden="true"
                    >
                      <ArrowRight size={12} />
                    </span>
                    <span className="drf-field-val drf-field-val--new">
                      <Check size={12} aria-hidden="true" /> {field.newValue}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

/* ─── Step 1: Upload ─────────────────────────────────────────────── */

interface UploadStepProps {
  oldVersion: DocumentVersion;
  onFileSelected?: (file: File) => Promise<DocumentVersion> | DocumentVersion;
  onNext: (version: DocumentVersion) => void;
  onCancel?: () => void;
  locale: string;
  preselected?: DocumentVersion | null;
}

const UploadStep: React.FC<UploadStepProps> = ({
  oldVersion,
  onFileSelected,
  onNext,
  onCancel,
  locale,
  preselected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();

  // If a preselected version was passed in, skip to next step
  useEffect(() => {
    if (preselected) {
      onNext(preselected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);
      try {
        const newVersion = onFileSelected
          ? await onFileSelected(file)
          : // Fallback: build a synthetic version based on file metadata
            ({
              id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              versionLabel: 'v2 (replacement)',
              fileName: file.name,
              fileType:
                (file.type.split('/')[1] || file.name.split('.').pop() || 'bin').toUpperCase(),
              fileSizeBytes: file.size,
              uploadedBy: oldVersion.uploadedBy,
              uploadedAt: new Date().toISOString(),
            } as DocumentVersion);
        onNext(newVersion);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Could not process the selected file.',
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileSelected, onNext, oldVersion.uploadedBy],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void processFile(f);
  };

  return (
    <section
      className="drf-step-panel"
      aria-labelledby={headingId}
    >
      <div className="drf-step-heading">
        <h2 id={headingId}>Upload replacement document</h2>
        <p className="drf-step-sub">
          Drag & drop a file below, or pick one from your device. The file will be compared with the previous version.
        </p>
      </div>

      <div
        className={`drf-dropzone ${isDragging ? 'drf-dropzone--drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void processFile(f);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="drf-file-input"
          onChange={handleChange}
          aria-label="Select replacement document from device"
          disabled={isProcessing}
        />

        <div className="drf-dropzone-inner" aria-hidden="true">
          <div className="drf-dropzone-icon">
            <Upload size={28} />
          </div>
          <p className="drf-dropzone-primary">
            {isProcessing
              ? 'Processing file…'
              : 'Drop your replacement file here'}
          </p>
          <p className="drf-dropzone-secondary">
            or{' '}
            <button
              type="button"
              className="drf-dropzone-link"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
            >
              browse files
            </button>{' '}
            on your device
          </p>
        </div>
      </div>

      {error && (
        <div className="drf-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="drf-current-doc">
        <h4 className="drf-current-doc-title">Replacing</h4>
        <div className="drf-current-doc-card">
          <FileText size={20} aria-hidden="true" />
          <div>
            <div className="drf-current-doc-name">{oldVersion.fileName}</div>
            <div className="drf-current-doc-sub">
              {oldVersion.versionLabel} · {formatBytes(oldVersion.fileSizeBytes)} · uploaded{' '}
              {formatDate(
                oldVersion.uploadedAt,
                locale as SupportedLocale,
                { month: 'short', day: 'numeric', year: 'numeric' },
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="drf-step-actions">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} type="button">
            Cancel
          </Button>
        )}
      </div>
    </section>
  );
};

/* ─── Step 2: Review ─────────────────────────────────────────────── */

interface ReviewStepProps {
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
  diff: DiffSummary;
  keepBoth: boolean;
  onToggleKeepBoth: () => void;
  activeVersionId: string;
  onSetActiveOld: () => void;
  onSetActiveNew: () => void;
  onBack: () => void;
  onNext: () => void;
  locale: string;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  oldVersion,
  newVersion,
  diff,
  keepBoth,
  onToggleKeepBoth,
  activeVersionId,
  onSetActiveOld,
  onSetActiveNew,
  onBack,
  onNext,
  locale,
}) => {
  const headingId = useId();

  return (
    <section className="drf-step-panel" aria-labelledby={headingId}>
      <div className="drf-step-heading">
        <h2 id={headingId}>Review changes</h2>
        <p className="drf-step-sub">
          Compare the previous and new versions, then choose which version will be marked as active.
        </p>
      </div>

      <div className="drf-version-compare">
        <VersionCard
          version={oldVersion}
          variant="old"
          locale={locale}
          isActive={activeVersionId === oldVersion.id}
          selectable
          onToggleActive={onSetActiveOld}
        />
        <div
          className="drf-vs-divider"
          aria-hidden="true"
        >
          <span className="drf-vs-badge">VS</span>
        </div>
        <VersionCard
          version={newVersion}
          variant="new"
          locale={locale}
          isActive={activeVersionId === newVersion.id}
          selectable
          onToggleActive={onSetActiveNew}
        />
      </div>

      <DiffSummaryPanel diff={diff} />

      <div className="drf-retention">
        <label className="drf-retention-switch">
          <input
            type="checkbox"
            checked={keepBoth}
            onChange={onToggleKeepBoth}
            aria-describedby="drf-retention-desc"
          />
          <span className="drf-retention-box" aria-hidden="true" />
          <span className="drf-retention-text">
            Keep both versions
            <span id="drf-retention-desc" className="drf-retention-sub">
              The previous version will remain available in the version history and the selected version will be labeled "Active".
            </span>
          </span>
        </label>

        {!keepBoth && (
          <div className="drf-retention-warn" role="note">
            <AlertTriangle size={16} aria-hidden="true" />
            If you proceed without keeping both versions, the previous version will be permanently replaced.
          </div>
        )}
      </div>

      <div className="drf-step-actions">
        <Button variant="secondary" onClick={onBack} type="button">
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </Button>
        <Button variant="primary" onClick={onNext} type="button">
          Continue to confirm
          <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
};

/* ─── Step 3: Confirm ────────────────────────────────────────────── */

interface ConfirmStepProps {
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
  diff: DiffSummary;
  keepBoth: boolean;
  activeVersionId: string;
  documentName?: string;
  onBack: () => void;
  onConfirm: () => void;
  locale: string;
  isConfirming?: boolean;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  oldVersion,
  newVersion,
  diff,
  keepBoth,
  activeVersionId,
  documentName,
  onBack,
  onConfirm,
  locale,
  isConfirming,
}) => {
  const headingId = useId();
  const activeVersion =
    activeVersionId === newVersion.id ? newVersion : oldVersion;
  const inactiveVersion =
    activeVersionId === newVersion.id ? oldVersion : newVersion;

  return (
    <section className="drf-step-panel" aria-labelledby={headingId}>
      <div className="drf-step-heading">
        <h2 id={headingId}>Confirm replacement</h2>
        <p className="drf-step-sub">
          Please review the summary below before finalizing.
        </p>
      </div>

      <div className="drf-confirm-summary">
        {documentName && (
          <div className="drf-confirm-row">
            <span className="drf-confirm-key">Document</span>
            <span className="drf-confirm-value">{documentName}</span>
          </div>
        )}
        <div className="drf-confirm-row">
          <span className="drf-confirm-key">Active version</span>
          <span className="drf-confirm-value">
            <ShieldCheck size={14} aria-hidden="true" />
            {activeVersion.versionLabel} · {activeVersion.fileName}
          </span>
        </div>
        <div className="drf-confirm-row">
          <span className="drf-confirm-key">Version retention</span>
          <span className="drf-confirm-value">
            {keepBoth ? (
              <>
                <CheckCircle2 size={14} aria-hidden="true" />
                Keeping both versions.{' '}
                <span className="drf-confirm-muted">
                  {inactiveVersion.versionLabel} remains in history.
                </span>
              </>
            ) : (
              <>
                <RotateCcw size={14} aria-hidden="true" />
                Replacing previous version (previous will no longer be available).
              </>
            )}
          </span>
        </div>
        <div className="drf-confirm-row">
          <span className="drf-confirm-key">Summary of changes</span>
          <span className="drf-confirm-value">{diff.summaryText}</span>
        </div>
      </div>

      <div className="drf-confirm-compare">
        <VersionCard
          version={oldVersion}
          variant="old"
          locale={locale}
          isActive={activeVersionId === oldVersion.id}
          selectable={false}
        />
        <VersionCard
          version={newVersion}
          variant="new"
          locale={locale}
          isActive={activeVersionId === newVersion.id}
          selectable={false}
        />
      </div>

      <div className="drf-step-actions">
        <Button variant="secondary" onClick={onBack} type="button">
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          type="button"
          loading={isConfirming}
        >
          {keepBoth ? (
            <>Save both & set active</>
          ) : (
            <>Confirm replacement</>
          )}
        </Button>
      </div>
    </section>
  );
};

/* ─── Step 4: Success ────────────────────────────────────────────── */

interface SuccessStepProps {
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
  keepBoth: boolean;
  activeVersionId: string;
  documentName?: string;
  locale: string;
  onDone?: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
  oldVersion,
  newVersion,
  keepBoth,
  activeVersionId,
  documentName,
  locale,
  onDone,
}) => {
  const headingId = useId();
  const activeVersion =
    activeVersionId === newVersion.id ? newVersion : oldVersion;

  return (
    <section className="drf-step-panel drf-step-panel--success" aria-labelledby={headingId}>
      <div className="drf-success-icon" aria-hidden="true">
        <CheckCircle2 size={48} />
      </div>
      <div className="drf-step-heading drf-step-heading--center">
        <h2 id={headingId}>
          {keepBoth ? 'Versions saved' : 'Document replaced'}
        </h2>
        <p className="drf-step-sub">
          {keepBoth
            ? `Both versions are available in the document history. ${activeVersion.versionLabel} is marked as the active version.`
            : `${newVersion.versionLabel} has replaced ${oldVersion.versionLabel}.`}
          {documentName ? ` (${documentName})` : ''}
        </p>
      </div>

      <div className="drf-success-summary">
        <div className="drf-success-row">
          <span className="drf-success-label">Active version</span>
          <span className="drf-success-value drf-success-value--active">
            <ShieldCheck size={14} aria-hidden="true" />
            {activeVersion.versionLabel} · {activeVersion.fileName}
          </span>
        </div>
        <div className="drf-success-row">
          <span className="drf-success-label">Uploaded</span>
          <span className="drf-success-value">
            {formatDate(
              newVersion.uploadedAt,
              locale as SupportedLocale,
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              },
            )}
          </span>
        </div>
        <div className="drf-success-row">
          <span className="drf-success-label">By</span>
          <span className="drf-success-value">
            {newVersion.uploadedBy.name}
          </span>
        </div>
        {keepBoth && (
          <div className="drf-success-row">
            <span className="drf-success-label">Version history</span>
            <span className="drf-success-value">
              {oldVersion.versionLabel} & {newVersion.versionLabel} retained
            </span>
          </div>
        )}
      </div>

      <div className="drf-step-actions drf-step-actions--center">
        {onDone && (
          <Button variant="primary" onClick={onDone} type="button">
            Done
          </Button>
        )}
      </div>
    </section>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */

export const DocumentReplacementFlow: React.FC<DocumentReplacementFlowProps> = ({
  oldVersion,
  initialNewVersion = null,
  initialDiff = null,
  locale = 'en-US',
  documentName,
  onConfirm,
  onCancel,
  onFileSelected,
  onComputeDiff,
  className = '',
}) => {
  const [step, setStep] = useState<ReplacementStep>(
    initialNewVersion ? 'review' : 'upload',
  );
  const [newVersion, setNewVersion] = useState<DocumentVersion | null>(
    initialNewVersion ?? null,
  );
  const [diff, setDiff] = useState<DiffSummary | null>(initialDiff ?? null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [keepBoth, setKeepBoth] = useState(true);
  const [activeVersionId, setActiveVersionId] = useState<string>(
    initialNewVersion?.id ?? oldVersion.id,
  );
  const [confirming, setConfirming] = useState(false);

  const flowId = useId();

  const steps: Array<{ key: ReplacementStep; label: string }> = useMemo(
    () => [
      { key: 'upload', label: 'Upload' },
      { key: 'review', label: 'Review' },
      { key: 'confirm', label: 'Confirm' },
      { key: 'success', label: 'Done' },
    ],
    [],
  );

  // Compute the diff whenever we land on the review step without one
  useEffect(() => {
    if (step === 'review' && newVersion && !diff && !diffLoading) {
      setDiffLoading(true);
      void (async () => {
        try {
          const result = onComputeDiff
            ? await onComputeDiff(oldVersion, newVersion)
            : computeMockDiff(oldVersion, newVersion);
          setDiff(result);
        } catch (e) {
          setDiff(computeMockDiff(oldVersion, newVersion));
        } finally {
          setDiffLoading(false);
        }
      })();
    }
  }, [step, newVersion, diff, diffLoading, onComputeDiff, oldVersion]);

  const handleUploadNext = useCallback(
    (v: DocumentVersion) => {
      setNewVersion(v);
      setActiveVersionId(v.id);
      setDiff(null);
      setStep('review');
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    if (!newVersion) return;
    setConfirming(true);
    try {
      onConfirm?.({
        newVersion,
        oldVersion,
        keepBoth,
        activeVersionId,
      });
      setStep('success');
    } finally {
      setConfirming(false);
    }
  }, [newVersion, oldVersion, keepBoth, activeVersionId, onConfirm]);

  return (
    <div
      className={`drf-root ${className}`}
      id={flowId}
      aria-label="Document replacement flow"
    >
      <StepIndicator steps={steps} current={step} />

      <div className="drf-content" aria-live="polite">
        {step === 'upload' && (
          <UploadStep
            oldVersion={oldVersion}
            onFileSelected={onFileSelected}
            onNext={handleUploadNext}
            onCancel={onCancel}
            locale={locale}
            preselected={initialNewVersion}
          />
        )}

        {step === 'review' && newVersion && (
          diffLoading ? (
            <div className="drf-loading" role="status" aria-live="polite">
              <div className="drf-loading-spinner" aria-hidden="true" />
              <p>Computing changes between versions…</p>
            </div>
          ) : diff ? (
            <ReviewStep
              oldVersion={oldVersion}
              newVersion={newVersion}
              diff={diff}
              keepBoth={keepBoth}
              onToggleKeepBoth={() => setKeepBoth((k) => !k)}
              activeVersionId={activeVersionId}
              onSetActiveOld={() => setActiveVersionId(oldVersion.id)}
              onSetActiveNew={() => setActiveVersionId(newVersion.id)}
              onBack={() => setStep('upload')}
              onNext={() => setStep('confirm')}
              locale={locale}
            />
          ) : null
        )}

        {step === 'confirm' && newVersion && diff && (
          <ConfirmStep
            oldVersion={oldVersion}
            newVersion={newVersion}
            diff={diff}
            keepBoth={keepBoth}
            activeVersionId={activeVersionId}
            documentName={documentName}
            onBack={() => setStep('review')}
            onConfirm={handleConfirm}
            locale={locale}
            isConfirming={confirming}
          />
        )}

        {step === 'success' && newVersion && (
          <SuccessStep
            oldVersion={oldVersion}
            newVersion={newVersion}
            keepBoth={keepBoth}
            activeVersionId={activeVersionId}
            documentName={documentName}
            locale={locale}
            onDone={onCancel}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentReplacementFlow;
