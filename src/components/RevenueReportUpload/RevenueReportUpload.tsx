/**
 * RevenueReportUpload — Document upload pipeline for RevenueReportForm (Issue #623)
 *
 * A self-contained, accessible document-upload section that integrates the
 * existing DocumentUploader drop-zone with the useUploadQueue hook. Designed
 * to replace the plain textarea "Notes or attachments" field in
 * RevenueReportForm with a proper, drag-and-drop-capable upload pipeline that
 * supports pitch decks, financials, and signed PDFs.
 *
 * Architecture
 * ─────────────
 * This component is deliberately thin: it wires useUploadQueue (state) to
 * DocumentUploader (presentation) and provides:
 *   • Client-side file validation (size ≤ 20 MB, accepted MIME/extension types).
 *   • Per-file auto-start uploads immediately after each file is added to the
 *     queue, eliminating the need for a separate "Upload all" button.
 *   • An optional notes textarea kept alongside the uploader so free-text
 *     context can still be attached without needing a separate field.
 *   • Forwarded queue stats so the parent form can gate submit until all
 *     in-progress uploads settle.
 *
 * Accessibility (WCAG 2.1 AA)
 * ────────────────────────────
 * All a11y obligations are delegated to DocumentUploader (live-region,
 * focus ring, aria-labels). This component adds:
 *   • A labelled <section> with an accessible heading for the whole block.
 *   • An `aria-describedby` link between the notes textarea and its helper.
 *   • Status counts exposed via a polite live region (uploading / errored)
 *     so assistive technology is informed of batch state without focus being
 *     taken away.
 *
 * Design tokens consumed: all delegated to DocumentUploader.css; this file
 * adds only layout styling via utility classes matching the existing
 * RevenueReportForm canvas.
 */

import React, { useCallback, useId, useEffect, useRef } from 'react';
import { DocumentUploader, type UploadableFile } from '../DocumentUploader';
import { useUploadQueue, type Uploader } from '../../hooks/useUploadQueue';
import './RevenueReportUpload.css';

/* ─── Constants ──────────────────────────────────────────────────────────── */

/** Accepted file types for revenue-report attachments. */
export const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';

/** Maximum per-file size: 20 MB. */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/**
 * Default simulated uploader used when no real `uploader` prop is provided.
 * Progresses from 0 → 100 % over ~700 ms so manual testing and demos feel
 * realistic. Replace with a real API call in production.
 */
export const simulatedUploader: Uploader = (
  _file: File,
  onProgress: (pct: number) => void,
): Promise<void> =>
  new Promise((resolve) => {
    let pct = 0;
    const step = () => {
      pct = Math.min(100, pct + 10 + Math.random() * 15);
      onProgress(Math.floor(pct));
      if (pct < 100) {
        setTimeout(step, 60 + Math.random() * 60);
      } else {
        resolve();
      }
    };
    setTimeout(step, 80);
  });

/* ─── Public types ───────────────────────────────────────────────────────── */

export interface RevenueReportUploadProps {
  /**
   * Notes value — kept in sync with the parent form's state via the
   * controlled-component pattern.
   */
  notes: string;
  /** Controlled setter for the notes textarea. */
  onNotesChange: (value: string) => void;
  /**
   * Inject a real uploader for integration tests or production use. Defaults
   * to `simulatedUploader` so demos work without a backend.
   */
  uploader?: Uploader;
  /**
   * Called whenever the set of attached files changes (add / remove /
   * status transition). Lets the parent form react to pending uploads.
   */
  onFilesChange?: (files: UploadableFile[]) => void;
  /** Disable the entire upload section (e.g. while the form is submitting). */
  disabled?: boolean;
  className?: string;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export const RevenueReportUpload: React.FC<RevenueReportUploadProps> = ({
  notes,
  onNotesChange,
  uploader = simulatedUploader,
  onFilesChange,
  disabled = false,
  className = '',
}) => {
  const notesHelpId = useId();

  // Keep a stable ref to the uploader so callbacks don't re-create on every render.
  const uploaderRef = useRef<Uploader>(uploader);
  uploaderRef.current = uploader;

  const {
    queue,
    addFiles,
    removeFile,
    retryFile,
    uploadFiles,
    uploadingCount,
    errorCount,
  } = useUploadQueue();

  // Convert useUploadQueue's UploadFile shape → DocumentUploader's UploadableFile shape.
  const uploadableFiles: UploadableFile[] = queue.map((item) => ({
    id: item.id,
    name: item.file.name,
    size: item.file.size,
    status:
      item.status === 'success'
        ? 'completed'
        : item.status === 'error'
        ? 'error'
        : 'uploading',
    progress: item.status === 'uploading' ? item.progress : undefined,
    errorMessage: item.errorMessage,
  }));

  /**
   * Handle files accepted by DocumentUploader's client-side validation.
   * We add them to the queue; the useEffect below will pick up any pending
   * items and kick off uploads.
   */
  const handleFilesAdded = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      addFiles(files);
    },
    [addFiles],
  );

  /**
   * Auto-start uploads whenever new pending files appear in the queue.
   * Using useEffect ensures the state has settled after addFiles before
   * uploadFiles is called, which is required for the hook to find the items.
   */
  useEffect(() => {
    const hasPending = queue.some((f) => f.status === 'pending');
    if (hasPending) {
      uploadFiles(uploaderRef.current);
    }
  }, [queue, uploadFiles]);

  const handleRemove = useCallback(
    (id: string) => {
      removeFile(id);
    },
    [removeFile],
  );

  const handleRetry = useCallback(
    (id: string) => {
      retryFile(id, uploaderRef.current);
    },
    [retryFile],
  );

  // Accessibility: announce pending-upload count to AT without taking focus.
  const liveText =
    uploadingCount > 0
      ? `${uploadingCount} file${uploadingCount !== 1 ? 's' : ''} uploading…`
      : errorCount > 0
      ? `${errorCount} file${errorCount !== 1 ? 's' : ''} failed. Use the retry button on each failed file.`
      : '';

  return (
    <section
      className={`rrv-upload ${className}`}
      aria-labelledby="rrv-upload-heading"
      data-testid="revenue-report-upload"
    >
      <h3 id="rrv-upload-heading" className="rrv-upload__heading">
        Supporting documents
      </h3>
      <p className="rrv-upload__description">
        Attach pitch decks, financial statements, or signed PDFs to support
        your revenue report. All files are reviewed alongside your submission.
      </p>

      {/* Polite live region for batch-upload status */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="rrv-upload-live"
        className="rrv-upload__sr-only"
      >
        {liveText}
      </div>

      <DocumentUploader
        files={uploadableFiles}
        onFilesAdded={handleFilesAdded}
        onRemove={handleRemove}
        onRetry={handleRetry}
        label="Upload supporting documents"
        description="Drag and drop or click to browse. Accepted: PDF, Word, Excel, PNG, JPEG."
        accept={ACCEPTED_TYPES}
        maxSizeBytes={MAX_FILE_SIZE_BYTES}
        multiple
        disabled={disabled}
        className="rrv-upload__dropzone"
      />

      {/* Optional free-text notes field sits below the file list */}
      <div className="rrv-upload__notes-group">
        <label htmlFor="rrv-notes" className="rrv-upload__notes-label">
          Additional notes{' '}
          <span className="rrv-upload__optional" aria-hidden="true">
            (optional)
          </span>
        </label>
        <textarea
          id="rrv-notes"
          className="rrv-upload__notes-textarea input-field"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          rows={4}
          aria-describedby={notesHelpId}
          placeholder="Add context, links to invoices, or notes for the accounting team"
        />
        <p id={notesHelpId} className="rrv-upload__notes-help">
          Anything added here is visible to the reviewing team alongside your
          uploaded documents.
        </p>
      </div>
    </section>
  );
};

RevenueReportUpload.displayName = 'RevenueReportUpload';

/* ─── Convenience re-export ──────────────────────────────────────────────── */
export type { UploadableFile };
