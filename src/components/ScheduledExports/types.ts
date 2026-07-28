export type ScheduleStatus = 'active' | 'paused' | 'error';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface ScheduledExport {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  schedule: RecurrenceRule;
  status: ScheduleStatus;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  errorMessage?: string;
}

export interface ScheduleFormData {
  name: string;
  description: string;
  format: ExportFormat;
  schedule: RecurrenceRule;
}

export const EXPORT_FORMATS: ExportFormat[] = ['csv', 'json', 'pdf'];

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  json: 'JSON',
  pdf: 'PDF',
};

export const DAY_LABELS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const MOCK_SCHEDULED_EXPORTS: ScheduledExport[] = [
  {
    id: 'se-1',
    name: 'Daily Payout Summary',
    description: 'Daily CSV export of all payout transactions',
    format: 'csv',
    schedule: { frequency: 'daily', time: '09:00', timezone: 'UTC' },
    status: 'active',
    lastRunAt: '2026-07-27T09:00:00Z',
    nextRunAt: '2026-07-28T09:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    entryCount: 1240,
  },
  {
    id: 'se-2',
    name: 'Weekly Compliance Report',
    description: 'Full compliance audit log every Monday',
    format: 'json',
    schedule: { frequency: 'weekly', time: '14:00', timezone: 'America/New_York', dayOfWeek: 1 },
    status: 'active',
    lastRunAt: '2026-07-27T14:00:00Z',
    nextRunAt: '2026-08-03T14:00:00Z',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-07-15T00:00:00Z',
    entryCount: 890,
  },
  {
    id: 'se-3',
    name: 'Monthly Investor Statement',
    description: 'PDF statement for all active investors',
    format: 'pdf',
    schedule: { frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 1 },
    status: 'paused',
    lastRunAt: '2026-07-01T02:00:00Z',
    nextRunAt: '2026-08-01T02:00:00Z',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-07-20T00:00:00Z',
    entryCount: 3400,
  },
  {
    id: 'se-4',
    name: 'Revenue Report Backfill',
    description: 'Hourly revenue data aggregation',
    format: 'csv',
    schedule: { frequency: 'daily', time: '23:45', timezone: 'America/Los_Angeles' },
    status: 'error',
    lastRunAt: '2026-07-27T23:45:00Z',
    nextRunAt: '2026-07-28T23:45:00Z',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-07-28T00:00:00Z',
    entryCount: 560,
    errorMessage: 'Database connection timeout — retrying on next schedule',
  },
];