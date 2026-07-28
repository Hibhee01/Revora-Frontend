/**
 * Blacklist CSV Import — Issue #207
 *
 * Types for the CSV import wizard: Upload, Map, Preview, Confirm.
 */

/* ─── Conflict Reason ─────────────────────────────────────────────── */

export type ConflictReason = 'existing_entry' | 'invalid_checksum' | 'duplicate_row';

export const CONFLICT_REASON_LABELS: Record<ConflictReason, string> = {
  existing_entry: 'Existing entry',
  invalid_checksum: 'Invalid checksum',
  duplicate_row: 'Duplicate in file',
};

export const CONFLICT_REASON_COLORS: Record<ConflictReason, string> = {
  existing_entry: 'var(--bci-conflict-existing)',
  invalid_checksum: 'var(--bci-conflict-checksum)',
  duplicate_row: 'var(--bci-conflict-duplicate)',
};

/* ─── CSV Row ─────────────────────────────────────────────────────── */

export interface CsvRow {
  address: string;
  checksum?: string;
  [key: string]: string | undefined;
}

/* ─── Preview Row ─────────────────────────────────────────────────── */

export interface PreviewRow {
  address: string;
  checksum?: string;
  conflictReason?: ConflictReason;
  conflictDetail?: string;
  rowNumber: number;
}

/* ─── Wizard Step ─────────────────────────────────────────────────── */

export type WizardStep = 'upload' | 'map' | 'preview' | 'confirm';

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  upload: 'Upload',
  map: 'Map Columns',
  preview: 'Preview',
  confirm: 'Confirm Import',
};

/* ─── Column Mapping ──────────────────────────────────────────────── */

export interface ColumnMapping {
  address: string;
  checksum?: string;
}

/* ─── Component Props ─────────────────────────────────────────────── */

export interface BlacklistCsvImportProps {
  /** Callback when import is confirmed */
  onImport?: (rows: PreviewRow[]) => void;
  /** Callback when import is cancelled */
  onCancel?: () => void;
  /** Existing blacklist addresses for dedupe */
  existingAddresses?: string[];
  /** Additional CSS class on root */
  className?: string;
}
