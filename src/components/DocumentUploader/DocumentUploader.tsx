/**
 * DocumentUploader — Inline document uploader tile (Issue #199)
 *
 * A controlled, inline uploader for attaching legal/financial documents
 * within a multi-step wizard (e.g. the Offering Registration flow) without
 * leaving the current step. Renders a keyboard- and drag-and-drop-accessible
 * dropzone plus a list of file tiles that show upload progress, metadata,
 * and replace/remove controls.
 *
 * This component is presentational/controlled: it does not perform network
 * uploads itself. The consumer owns the `files` list and drives status
 * transitions (`uploading` → `completed` | `error`); this component only
 * performs synchronous client-side validation (size/type) before handing
 * accepted files to `onFilesAdded`.
 *
 * Design tokens consumed: --glass-bg, --glass-bg-accent, --glass-border,
 * --glass-border-bright, --primary, --error, --success, --text-main,
 * --text-muted, --spacing-*, --radius-*, --font-size-*, --font-weight-*.
 * Progress is rendered via the shared <ProgressBar> (shimmer/indeterminate
 * tokens live there).
 *
 * Accessibility (WCAG 2.1 AA):
 * - The dropzone is a native <label>/<input type="file"> pair, so it is
 *   reachable and operable by keyboard (Tab + Enter/Space) with no custom
 *   key handling required, and exposes a visible focus ring via
 *   `:focus-within`.
 * - File tiles announce upload completion and failures through a polite
 *   live region (`role="status" aria-live="polite"`); client-side
 *   validation rejections are announced through the same region.
 * - Per-file error text is additionally exposed via `role="alert"` so
 *   assistive tech reading the tile directly still gets the failure reason.
 * - Respects `prefers-reduced-motion` (delegated to ProgressBar's shimmer
 *   animation, which already honors the media query).
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FileText, UploadCloud, X, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import { ProgressBar } from '../ProgressBar';
import './DocumentUploader.css';

export type UploadStatus = 'uploading' | 'completed' | 'error';

export interface UploadableFile {
  /** Stable unique identifier for the file entry. */
  id: string;
  /** Display file name. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** Current upload status. */
  status: UploadStatus;
  /** Upload percentage (0-100). Omit for an indeterminate progress bar. */
  progress?: number;
  /** Human-readable failure reason, shown when status is 'error'. */
  errorMessage?: string;
}

export interface DocumentUploaderProps {
  /** Files currently attached (any status). */
  files: UploadableFile[];
  /** Called with newly-selected/dropped files that passed client-side validation. */
  onFilesAdded: (files: File[]) => void;
  /** Remove a file from the list (also used to cancel an in-progress upload). */
  onRemove: (id: string) => void;
  /** Retry a failed upload. Omit to hide the Retry control. */
  onRetry?: (id: string) => void;
  /** Accessible name for the dropzone. */
  label?: string;
  /** Helper copy shown under the dropzone label. */
  description?: string;
  /** Comma-separated accept string, e.g. ".pdf,.png,image/*". */
  accept?: string;
  /** Maximum size per file, in bytes. Files over this are rejected client-side. */
  maxSizeBytes?: number;
  /** Allow selecting/dropping more than one file at a time. Defaults to true. */
  multiple?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

function matchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return fileName.endsWith(pattern);
    if (pattern.endsWith('/*')) return fileType.startsWith(pattern.slice(0, -1));
    return fileType === pattern;
  });
}

function validateFile(
  file: File,
  accept: string | undefined,
  maxSizeBytes: number | undefined,
): string | null {
  if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
    return `"${file.name}" exceeds the ${formatBytes(maxSizeBytes)} size limit and was not added.`;
  }
  if (accept && !matchesAccept(file, accept)) {
    return `"${file.name}" isn't a supported file type and was not added.`;
  }
  return null;
}

interface FileTileProps {
  file: UploadableFile;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}

const FileTile: React.FC<FileTileProps> = ({ file, onRemove, onRetry }) => {
  const errorId = `doc-uploader-error-${file.id}`;

  return (
    <li className={`doc-uploader-tile doc-uploader-tile--${file.status}`} data-testid="doc-uploader-tile">
      <span className="doc-uploader-tile-icon" aria-hidden="true">
        {file.status === 'completed' ? (
          <CheckCircle2 size={20} />
        ) : file.status === 'error' ? (
          <AlertCircle size={20} />
        ) : (
          <FileText size={20} />
        )}
      </span>

      <div className="doc-uploader-tile-body">
        <span className="doc-uploader-tile-name" title={file.name}>
          {file.name}
        </span>
        <span className="doc-uploader-tile-meta">
          {formatBytes(file.size)}
          {file.status === 'completed' && ' · Uploaded'}
        </span>

        {file.status === 'uploading' && (
          <ProgressBar
            value={file.progress}
            label={`Uploading ${file.name}`}
            className="doc-uploader-tile-progress"
          />
        )}

        {file.status === 'error' && (
          <p id={errorId} role="alert" className="doc-uploader-tile-error">
            {file.errorMessage ?? 'Upload failed. Please try again.'}
          </p>
        )}
      </div>

      <div className="doc-uploader-tile-actions">
        {file.status === 'error' && onRetry && (
          <button
            type="button"
            className="doc-uploader-icon-button"
            onClick={() => onRetry(file.id)}
            aria-label={`Retry upload of ${file.name}`}
          >
            <RotateCw size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="doc-uploader-icon-button"
          onClick={() => onRemove(file.id)}
          aria-label={
            file.status === 'uploading'
              ? `Cancel upload of ${file.name}`
              : `Remove ${file.name}`
          }
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
};

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  files,
  onFilesAdded,
  onRemove,
  onRetry,
  label = 'Upload documents',
  description,
  accept,
  maxSizeBytes,
  multiple = true,
  disabled = false,
  id,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const prevStatusesRef = useRef<Map<string, UploadStatus>>(new Map());
  const inputId = useId();
  const rootId = id ?? inputId;
  const liveRegionId = `${rootId}-live`;
  const dragCounterRef = useRef(0);

  // Announce status transitions the consumer drives via the `files` prop
  // (e.g. a network upload completing or failing).
  useEffect(() => {
    const prevStatuses = prevStatusesRef.current;
    for (const file of files) {
      const prevStatus = prevStatuses.get(file.id);
      if (prevStatus === file.status) continue;
      if (file.status === 'completed') {
        setAnnouncement(`${file.name} uploaded successfully.`);
      } else if (file.status === 'error') {
        setAnnouncement(`${file.name} failed to upload. ${file.errorMessage ?? ''}`.trim());
      }
    }
    prevStatusesRef.current = new Map(files.map((file) => [file.id, file.status]));
  }, [files]);

  const acceptFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const accepted: File[] = [];
      const rejections: string[] = [];

      for (const file of incoming) {
        const rejection = validateFile(file, accept, maxSizeBytes);
        if (rejection) {
          rejections.push(rejection);
        } else {
          accepted.push(file);
        }
      }

      if (rejections.length > 0) {
        setAnnouncement(rejections.join(' '));
      }
      if (accepted.length > 0) {
        onFilesAdded(multiple ? accepted : accepted.slice(0, 1));
      }
    },
    [accept, maxSizeBytes, multiple, onFilesAdded],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    acceptFiles(event.target.files ?? []);
    event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files) acceptFiles(event.dataTransfer.files);
  };

  const helperParts: string[] = [];
  if (description) helperParts.push(description);
  if (accept) helperParts.push(`Accepted formats: ${accept}.`);
  if (maxSizeBytes) helperParts.push(`Max ${formatBytes(maxSizeBytes)} per file.`);

  return (
    <div className={`doc-uploader ${className}`}>
      <div
        className={`doc-uploader-dropzone ${isDragging ? 'doc-uploader-dropzone--dragging' : ''} ${
          disabled ? 'doc-uploader-dropzone--disabled' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor={rootId} className="doc-uploader-dropzone-label">
          <UploadCloud size={28} aria-hidden="true" className="doc-uploader-dropzone-icon" />
          <span className="doc-uploader-dropzone-title">{label}</span>
          {helperParts.length > 0 && (
            <span className="doc-uploader-dropzone-helper">{helperParts.join(' ')}</span>
          )}
          <input
            id={rootId}
            type="file"
            data-testid="doc-uploader-input"
            className="doc-uploader-input"
            multiple={multiple}
            accept={accept}
            disabled={disabled}
            onChange={handleInputChange}
            aria-describedby={helperParts.length > 0 ? `${rootId}-helper` : undefined}
          />
        </label>
      </div>

      <div id={liveRegionId} role="status" aria-live="polite" className="doc-uploader-sr-only">
        {announcement}
      </div>

      {files.length > 0 && (
        <ul className="doc-uploader-list" aria-label="Attached documents">
          {files.map((file) => (
            <FileTile key={file.id} file={file} onRemove={onRemove} onRetry={onRetry} />
          ))}
        </ul>
      )}
    </div>
  );
};

DocumentUploader.displayName = 'DocumentUploader';
