export type WizardStep = 'upload' | 'map' | 'preview' | 'confirm';

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  upload: 'Upload File',
  map: 'Map Columns',
  preview: 'Preview Data',
  confirm: 'Confirm Import',
};

export interface CsvRow {
  [key: string]: string;
}

export interface ColumnMapping {
  date: string;
  revenue: string;
  currency?: string;
}

export type ConflictReason = 'invalid_date' | 'invalid_revenue' | 'missing_fields' | 'duplicate_row';

export const CONFLICT_REASON_LABELS: Record<ConflictReason, string> = {
  invalid_date: 'Invalid Date Format',
  invalid_revenue: 'Invalid Revenue Amount',
  missing_fields: 'Missing Required Fields',
  duplicate_row: 'Duplicate Row',
};

export interface PreviewRow {
  date: string;
  revenue: string;
  currency?: string;
  conflictReason?: ConflictReason;
  conflictDetail?: string;
  rowNumber: number;
}

export interface RevenueCalendarCsvImportProps {
  onImport?: (rows: PreviewRow[]) => void;
  onCancel?: () => void;
  className?: string;
}
