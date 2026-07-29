/**
 * Revenue Reporting Calendar — Issue #153
 *
 * Types for the calendar component, report data model,
 * and status indicators.
 */

/* ─── Report Status ─────────────────────────────────────────────────── */

export type ReportStatus = 'due' | 'submitted' | 'accepted' | 'overdue' | 'none';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  due: 'Due',
  submitted: 'Submitted',
  accepted: 'Accepted',
  overdue: 'Overdue',
  none: 'No report',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  due: 'var(--rc-status-due)',
  submitted: 'var(--rc-status-submitted)',
  accepted: 'var(--rc-status-accepted)',
  overdue: 'var(--rc-status-overdue)',
  none: 'transparent',
};

/* ─── Overdue Severity ─────────────────────────────────────────────── */

export type OverdueSeverity = 'mild' | 'moderate' | 'critical';

export const OVERDUE_SEVERITY_LABELS: Record<OverdueSeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  critical: 'Critical',
};

export const OVERDUE_SEVERITY_COLORS: Record<OverdueSeverity, string> = {
  mild: 'var(--rc-overdue-mild)',
  moderate: 'var(--rc-overdue-moderate)',
  critical: 'var(--rc-overdue-critical)',
};

export function getOverdueDays(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getOverdueSeverity(days: number): OverdueSeverity {
  if (days <= 3) return 'mild';
  if (days >= 30) return 'critical';
  return 'moderate';
}

/* ─── Revenue Report Data Model ─────────────────────────────────────── */

export interface RevenueReport {
  /** Unique identifier */
  id: string;
  /** ISO date string (YYYY-MM-DD) for the report period */
  date: string;
  /** Due date ISO string */
  dueDate: string;
  /** When the report was submitted (ISO string) */
  submittedAt?: string;
  /** When the report was accepted (ISO string) */
  acceptedAt?: string;
  /** Current status */
  status: ReportStatus;
  /** Gross revenue amount (optional, shown in details) */
  grossRevenue?: number;
  /** Currency code (e.g. USD, EUR) */
  currency?: string;
  /** Locale for formatting */
  locale?: string;
  /** Optional notes */
  notes?: string;
}

/* ─── Calendar Props ────────────────────────────────────────────────── */

export interface RevenueReportingCalendarProps {
  /** Array of revenue reports keyed by date */
  reports: RevenueReport[];
  /** Currently selected date (ISO string YYYY-MM-DD) */
  selectedDate?: string;
  /** Currently selected dates for bulk selection (ISO strings) */
  selectedDates?: string[];
  /** Currently viewed month (YYYY-MM) */
  viewMonth?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state with optional message */
  error?: string | null;
  /** Locale for date formatting */
  locale?: string;
  /** First day of week: 0 = Sunday, 1 = Monday, etc. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Callback when a date is selected */
  onDateSelect?: (date: string) => void;
  /** Callback when multiple dates are selected */
  onDatesSelect?: (dates: string[]) => void;
  /** Callback when month changes (via navigation) */
  onMonthChange?: (month: string) => void;
  /** Callback when "Submit Report" is clicked for a date */
  onSubmitReport?: (date: string) => void;
  /** Callback when a report action is triggered */
  onReportAction?: (reportId: string, action: string) => void;
  /** Callback to open keyboard shortcuts overlay */
  onOpenShortcuts?: () => void;
  /** Additional CSS class on root */
  className?: string;
}

/* ─── Day Cell Data ─────────────────────────────────────────────────── */

export interface DayCellData {
  /** ISO date string */
  date: string;
  /** Day of month (1-31) */
  day: number;
  /** Whether this day is in the current viewed month */
  inMonth: boolean;
  /** Whether this is today */
  isToday: boolean;
  /** Whether this day is selected */
  isSelected: boolean;
  /** Whether this day is the start of a selection range */
  isRangeStart?: boolean;
  /** Whether this day is the end of a selection range */
  isRangeEnd?: boolean;
  /** Whether this day is within a selection range */
  isInRange?: boolean;
  /** Reports for this day */
  reports: RevenueReport[];
  /** Primary status for the day */
  primaryStatus: ReportStatus;
}

/* ─── Details Panel Props ───────────────────────────────────────────── */

export interface DetailsPanelProps {
  /** Selected date (ISO string) */
  selectedDate: string | undefined;
  /** Reports for the selected date */
  reports: RevenueReport[];
  /** Reports for the entire viewed month */
  monthReports: RevenueReport[];
  /** Viewed month (YYYY-MM) */
  viewMonth: string;
  /** Locale for formatting */
  locale: string;
  /** Callback when Submit Report is clicked */
  onSubmitReport?: (date: string) => void;
  /** Callback when a report action is triggered */
  onReportAction?: (reportId: string, action: string) => void;
  /** Whether the panel is open (for mobile/tablet) */
  isOpen?: boolean;
  /** Callback to close the panel */
  onClose?: () => void;
}

/* ─── Calendar Grid Props ───────────────────────────────────────────── */

export interface CalendarGridProps {
  /** Days to render in the grid */
  days: DayCellData[];
  /** Currently selected date */
  selectedDate: string | undefined;
  /** Currently focused date (for keyboard nav) */
  focusedDate: string | undefined;
  /** Week start day */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Callback when a date is clicked */
  onDateSelect: (date: string) => void;
  /** Callback when keyboard navigation occurs */
  onKeyboardNavigate: (direction: string) => void;
  /** Grid aria-label */
  ariaLabel: string;
  /** Callback when user presses T to jump to today */
  onJumpToToday?: () => void;
}
