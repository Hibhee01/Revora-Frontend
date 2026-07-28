/**
 * Revenue Reporting Calendar — Issue #153
 *
 * A responsive, accessible month-grid calendar that provides issuers
 * with a month-by-month overview of report due dates, submission
 * status, and acceptance status, with quick access to submit reports.
 *
 * Features:
 * - WAI-ARIA Grid pattern with full keyboard navigation
 * - Status indicators (Due, Submitted, Accepted, Overdue)
 * - Side panel with report details and Submit Report CTA
 * - Responsive: desktop (side-by-side), tablet (collapsible), mobile (stacked)
 * - Dark mode and RTL support
 * - Edge cases: loading, empty, error, overdue, multiple reports
 */

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  KeyboardEvent,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Menu,
} from 'lucide-react';
import {
  formatDate,
  formatCurrency,
  SupportedLocale,
  LOCALE_FORMAT_SETTINGS,
} from '../constants/i18n';
import { TERMINOLOGY } from '../constants/terminology';
import { Button } from './Button';
import {
  RevenueReportingCalendarProps,
  DayCellData,
  ReportStatus,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
} from './RevenueReportingCalendar.types';
import './RevenueReportingCalendar.css';

/* ─── Helpers ──────────────────────────────────────────────────────── */

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseISODate(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function isToday(iso: string): boolean {
  const today = new Date();
  const d = parseISODate(iso);
  return (
    d.year === today.getFullYear() &&
    d.month === today.getMonth() &&
    d.day === today.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number, weekStartsOn: number): number {
  const day = new Date(year, month, 1).getDay();
  return (day - weekStartsOn + 7) % 7;
}

function getPrimaryStatus(reports: RevenueReport[]): ReportStatus {
  if (reports.length === 0) return 'none';
  // Priority: overdue > due > submitted > accepted
  if (reports.some((r) => r.status === 'overdue')) return 'overdue';
  if (reports.some((r) => r.status === 'due')) return 'due';
  if (reports.some((r) => r.status === 'submitted')) return 'submitted';
  return 'accepted';
}

function isOverdue(report: RevenueReport): boolean {
  if (report.status === 'accepted' || report.status === 'submitted') return false;
  const due = new Date(report.dueDate);
  const now = new Date();
  return due < now;
}

function getMonthReports(
  reports: RevenueReport[],
  year: number,
  month: number,
): RevenueReport[] {
  return reports.filter((r) => {
    const d = parseISODate(r.date);
    return d.year === year && d.month === month;
  });
}

/* ─── Build Day Cells ──────────────────────────────────────────────── */

function buildDayCells(
  year: number,
  month: number,
  reports: RevenueReport[],
  selectedDate: string | undefined,
  weekStartsOn: number,
): DayCellData[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month, weekStartsOn);
  const cells: DayCellData[] = [];

  // Previous month padding
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = toISODate(prevYear, prevMonth, day);
    const dayReports = reports.filter((r) => r.date === date);
    cells.push({
      date,
      day,
      inMonth: false,
      isToday: isToday(date),
      isSelected: selectedDate === date,
      reports: dayReports,
      primaryStatus: getPrimaryStatus(dayReports),
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = toISODate(year, month, day);
    const dayReports = reports.filter((r) => r.date === date);
    cells.push({
      date,
      day,
      inMonth: true,
      isToday: isToday(date),
      isSelected: selectedDate === date,
      reports: dayReports,
      primaryStatus: getPrimaryStatus(dayReports),
    });
  }

  // Next month padding (fill to complete 6 rows × 7 = 42 cells, or just fill the last row)
  const remaining = 42 - cells.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let day = 1; day <= remaining; day++) {
    const date = toISODate(nextYear, nextMonth, day);
    const dayReports = reports.filter((r) => r.date === date);
    cells.push({
      date,
      day,
      inMonth: false,
      isToday: isToday(date),
      isSelected: selectedDate === date,
      reports: dayReports,
      primaryStatus: getPrimaryStatus(dayReports),
    });
  }

  return cells;
}

/* ─── Status Dot ───────────────────────────────────────────────────── */

function StatusDot({ status }: { status: ReportStatus }) {
  if (status === 'none') return null;
  const color = REPORT_STATUS_COLORS[status];
  return (
    <span
      className="rc-status-dot"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

/* ─── Calendar Day Cell ────────────────────────────────────────────── */

interface CalendarDayCellProps {
  cell: DayCellData;
  isFocused: boolean;
  weekStartsOn: number;
  onSelect: (date: string) => void;
  onFocus: (date: string) => void;
  locale: string;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  cell,
  isFocused,
  weekStartsOn,
  onSelect,
  onFocus,
  locale,
}) => {
  const handleClick = () => onSelect(cell.date);
  const handleFocus = () => onFocus(cell.date);

  const statusLabel = REPORT_STATUS_LABELS[cell.primaryStatus];
  const dateFormatted = formatDate(cell.date, locale as SupportedLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ariaLabel = `${dateFormatted}, ${statusLabel}${cell.reports.length > 1 ? `, ${cell.reports.length} reports` : ''}${cell.isSelected ? ', selected' : ''}`;

  const cellClass = [
    'rc-day-cell',
    !cell.inMonth && 'rc-day-cell--outside',
    cell.isToday && 'rc-day-cell--today',
    cell.isSelected && 'rc-day-cell--selected',
    cell.primaryStatus !== 'none' && `rc-day-cell--${cell.primaryStatus}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="gridcell"
      className={cellClass}
      tabIndex={isFocused ? 0 : -1}
      aria-selected={cell.isSelected}
      aria-label={ariaLabel}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(cell.date);
        }
      }}
    >
      <span className="rc-day-number">{cell.day}</span>
      <StatusDot status={cell.primaryStatus} />
      {cell.reports.length > 1 && (
        <span className="rc-day-count" aria-hidden="true">
          {cell.reports.length}
        </span>
      )}
    </div>
  );
};

/* ─── Calendar Grid (WAI-ARIA Grid) ────────────────────────────────── */

interface CalendarGridComponentProps {
  days: DayCellData[];
  selectedDate: string | undefined;
  focusedDate: string | undefined;
  weekStartsOn: number;
  onDateSelect: (date: string) => void;
  onFocusDate: (date: string) => void;
  locale: string;
  ariaLabel: string;
}

const CalendarGridComponent: React.FC<CalendarGridComponentProps> = ({
  days,
  selectedDate,
  focusedDate,
  weekStartsOn,
  onDateSelect,
  onFocusDate,
  locale,
  ariaLabel,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const dayNames = useMemo(() => {
    const names: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = (weekStartsOn + i) % 7;
      const date = new Date(2024, 0, day + 7); // Use a known Sunday
      names.push(
        date.toLocaleDateString(locale as SupportedLocale, { weekday: 'short' }),
      );
    }
    return names;
  }, [weekStartsOn, locale]);

  // Group days into rows of 7
  const rows: DayCellData[][] = useMemo(() => {
    const result: DayCellData[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Roving tabindex: only the focused/selected day is tabbable
  const getTabIndex = useCallback(
    (cell: DayCellData) => {
      if (cell.date === focusedDate || cell.date === selectedDate) return 0;
      return -1;
    },
    [focusedDate, selectedDate],
  );

  // Focus the active cell when focusedDate changes
  useEffect(() => {
    if (focusedDate && gridRef.current) {
      const activeCell = gridRef.current.querySelector(
        `[data-date="${focusedDate}"]`,
      ) as HTMLElement | null;
      if (activeCell) {
        activeCell.focus({ preventScroll: true });
      }
    }
  }, [focusedDate]);

  const handleGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!focusedDate) return;
    const currentIndex = days.findIndex((d) => d.date === focusedDate);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    const cols = 7;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, days.length - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + cols, days.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - cols, 0);
        break;
      case 'Home': {
        e.preventDefault();
        // Move to first day of current week row
        const rowStart = Math.floor(currentIndex / cols) * cols;
        newIndex = rowStart;
        break;
      }
      case 'End': {
        e.preventDefault();
        // Move to last day of current week row
        const rowEnd = Math.min(
          Math.floor(currentIndex / cols) * cols + cols - 1,
          days.length - 1,
        );
        newIndex = rowEnd;
        break;
      }
      case 'PageUp': {
        e.preventDefault();
        // Move to same day in previous month
        const currentDay = days[currentIndex].day;
        const currentMonth = parseISODate(days[currentIndex].date).month;
        const currentYear = parseISODate(days[currentIndex].date).year;
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) {
          prevMonth = 11;
          prevYear--;
        }
        const daysInPrev = getDaysInMonth(prevYear, prevMonth);
        const targetDay = Math.min(currentDay, daysInPrev);
        const targetDate = toISODate(prevYear, prevMonth, targetDay);
        const targetIndex = days.findIndex((d) => d.date === targetDate);
        if (targetIndex !== -1) {
          newIndex = targetIndex;
        }
        break;
      }
      case 'PageDown': {
        e.preventDefault();
        // Move to same day in next month
        const curDay = days[currentIndex].day;
        const curMonth = parseISODate(days[currentIndex].date).month;
        const curYear = parseISODate(days[currentIndex].date).year;
        let nextMonth = curMonth + 1;
        let nextYear = curYear;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }
        const daysInNext = getDaysInMonth(nextYear, nextMonth);
        const tDay = Math.min(curDay, daysInNext);
        const tDate = toISODate(nextYear, nextMonth, tDay);
        const tIndex = days.findIndex((d) => d.date === tDate);
        if (tIndex !== -1) {
          newIndex = tIndex;
        }
        break;
      }
      default:
        return;
    }

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < days.length) {
      onFocusDate(days[newIndex].date);
    }
  };

  return (
    <div
      ref={gridRef}
      className="rc-calendar-grid"
      role="grid"
      aria-label={ariaLabel}
      onKeyDown={handleGridKeyDown}
    >
      {/* Day name headers */}
      <div className="rc-grid-header" role="row">
        {dayNames.map((name, i) => (
          <div key={i} className="rc-grid-header-cell" role="columnheader" aria-hidden="true">
            {name}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="rc-grid-row" role="row">
          {row.map((cell) => (
            <CalendarDayCell
              key={cell.date}
              cell={cell}
              isFocused={cell.date === focusedDate}
              weekStartsOn={weekStartsOn}
              onSelect={onDateSelect}
              onFocus={onFocusDate}
              locale={locale}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/* ─── Details Panel ────────────────────────────────────────────────── */

const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedDate,
  reports,
  monthReports,
  viewMonth,
  locale,
  onSubmitReport,
  onReportAction,
  isOpen = true,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const selectedReports = selectedDate
    ? reports.filter((r) => r.date === selectedDate)
    : [];

  const monthDueReports = monthReports.filter((r) => r.status === 'due' || r.status === 'overdue');
  const monthSubmittedReports = monthReports.filter((r) => r.status === 'submitted');
  const monthAcceptedReports = monthReports.filter((r) => r.status === 'accepted');

  const formatReportDate = (iso: string) =>
    formatDate(iso, locale as SupportedLocale, { month: 'short', day: 'numeric' });

  const formatDueDate = (iso: string) =>
    formatDate(iso, locale as SupportedLocale, { month: 'short', day: 'numeric', year: 'numeric' });

  const renderReportItem = (report: RevenueReport) => {
    const overdue = isOverdue(report);
    const displayStatus = overdue ? 'overdue' : report.status;
    const statusColor = REPORT_STATUS_COLORS[displayStatus];
    const statusLabel = REPORT_STATUS_LABELS[displayStatus];

    return (
      <div key={report.id} className="rc-report-item">
        <div className="rc-report-item-header">
          <span
            className="rc-report-status-badge"
            style={{ backgroundColor: statusColor }}
            aria-label={statusLabel}
          />
          <span className="rc-report-status-label">{statusLabel}</span>
          <span className="rc-report-date">{formatReportDate(report.date)}</span>
        </div>
        <div className="rc-report-item-body">
          {report.grossRevenue !== undefined && (
            <p className="rc-report-revenue">
              {formatCurrency(report.grossRevenue, report.currency || 'USD', locale as SupportedLocale)}
            </p>
          )}
          {report.dueDate && (
            <p className="rc-report-due">
              <Clock size={12} aria-hidden="true" />
              Due: {formatDueDate(report.dueDate)}
            </p>
          )}
          {report.acceptedAt && (
            <p className="rc-report-accepted">
              <CheckCircle2 size={12} aria-hidden="true" />
              Accepted: {formatReportDate(report.acceptedAt)}
            </p>
          )}
          {report.notes && (
            <p className="rc-report-notes">{report.notes}</p>
          )}
        </div>
        <div className="rc-report-item-actions">
          {displayStatus === 'due' && onSubmitReport && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSubmitReport(report.date)}
              aria-label={`Submit report for ${formatReportDate(report.date)}`}
            >
              <Send size={14} aria-hidden="true" />
              Submit Report
            </Button>
          )}
          {displayStatus === 'submitted' && (
            <span className="rc-report-awaiting">Awaiting review</span>
          )}
          {displayStatus === 'accepted' && (
            <span className="rc-report-confirmed">Confirmed</span>
          )}
          {displayStatus === 'overdue' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSubmitReport?.(report.date)}
              aria-label={`Submit overdue report for ${formatReportDate(report.date)}`}
            >
              <AlertTriangle size={14} aria-hidden="true" />
              Submit Now
            </Button>
          )}
        </div>
      </div>
    );
  };

  const [monthLabel, yearStr] = viewMonth.split('-');
  const monthName = new Date(Number(yearStr), Number(monthLabel) - 1).toLocaleDateString(
    locale as SupportedLocale,
    { month: 'long', year: 'numeric' },
  );

  return (
    <aside
      className={`rc-details-panel ${isOpen ? 'rc-details-panel--open' : 'rc-details-panel--closed'}`}
      aria-label="Report details panel"
    >
      {/* Mobile close button */}
      {onClose && (
        <button
          type="button"
          className="rc-details-close"
          onClick={onClose}
          aria-label="Close details panel"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}

      <div className="rc-details-header">
        <Calendar size={18} aria-hidden="true" />
        <h2 className="rc-details-title">{monthName}</h2>
      </div>

      {/* View mode toggle */}
      <div className="rc-details-toggle" role="tablist" aria-label="View mode">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'day'}
          className={`rc-details-tab ${viewMode === 'day' ? 'rc-details-tab--active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          Day
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'month'}
          className={`rc-details-tab ${viewMode === 'month' ? 'rc-details-tab--active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          Month
        </button>
      </div>

      {viewMode === 'day' ? (
        <div className="rc-details-content" role="tabpanel">
          {selectedDate ? (
            <>
              <h3 className="rc-details-day-title">
                {formatDate(selectedDate, locale as SupportedLocale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>

              {selectedReports.length === 0 ? (
                <div className="rc-details-empty">
                  <p className="rc-details-empty-text">No reports for this date.</p>
                  {onSubmitReport && (
                    <Button
                      variant="primary"
                      onClick={() => onSubmitReport(selectedDate)}
                      className="rc-submit-cta"
                    >
                      <Send size={16} aria-hidden="true" />
                      Submit Report
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rc-details-reports">
                  {selectedReports.map(renderReportItem)}
                </div>
              )}
            </>
          ) : (
            <div className="rc-details-empty">
              <p className="rc-details-empty-text">Select a date to view report details.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rc-details-content" role="tabpanel">
          {/* Month summary */}
          <div className="rc-month-summary">
            <div className="rc-month-stat">
              <span className="rc-month-stat-value">{monthDueReports.length}</span>
              <span className="rc-month-stat-label">Due / Overdue</span>
            </div>
            <div className="rc-month-stat">
              <span className="rc-month-stat-value">{monthSubmittedReports.length}</span>
              <span className="rc-month-stat-label">Submitted</span>
            </div>
            <div className="rc-month-stat">
              <span className="rc-month-stat-value">{monthAcceptedReports.length}</span>
              <span className="rc-month-stat-label">Accepted</span>
            </div>
          </div>

          {/* Quick submit CTA for month */}
          {monthDueReports.length > 0 && onSubmitReport && (
            <Button
              variant="primary"
              className="rc-submit-cta rc-submit-cta--month"
              onClick={() => {
                // Submit for the first due/overdue report
                const firstDue = monthDueReports[0];
                if (firstDue) onSubmitReport(firstDue.date);
              }}
            >
              <Send size={16} aria-hidden="true" />
              Submit {monthDueReports.length} Pending Report{monthDueReports.length > 1 ? 's' : ''}
            </Button>
          )}

          {/* Month report list */}
          {monthReports.length === 0 ? (
            <p className="rc-details-empty-text">No reports scheduled for this month.</p>
          ) : (
            <div className="rc-month-reports">
              {monthReports.map(renderReportItem)}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

/* ─── Main Component ───────────────────────────────────────────────── */

export const RevenueReportingCalendar: React.FC<RevenueReportingCalendarProps> = ({
  reports,
  selectedDate: controlledSelectedDate,
  viewMonth: controlledViewMonth,
  isLoading = false,
  error = null,
  locale = 'en-US',
  weekStartsOn = 0, // Sunday by default
  onDateSelect,
  onMonthChange,
  onSubmitReport,
  onReportAction,
  className = '',
}) => {
  // Determine current month from reports or use today
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [internalViewMonth, setInternalViewMonth] = useState(defaultMonth);
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | undefined>(
    controlledSelectedDate,
  );
  const [focusedDate, setFocusedDate] = useState<string | undefined>(undefined);
  const [panelOpen, setPanelOpen] = useState(true);

  const viewMonth = controlledViewMonth ?? internalViewMonth;
  const selectedDate = controlledSelectedDate ?? internalSelectedDate;

  const [viewYear, viewMonthNum] = useMemo(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    return [y, m - 1];
  }, [viewMonth]);

  // Build day cells
  const dayCells = useMemo(
    () => buildDayCells(viewYear, viewMonthNum, reports, selectedDate, weekStartsOn),
    [viewYear, viewMonthNum, reports, selectedDate, weekStartsOn],
  );

  // Month reports
  const monthReports = useMemo(
    () => getMonthReports(reports, viewYear, viewMonthNum),
    [reports, viewYear, viewMonthNum],
  );

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    let newMonth = viewMonthNum - 1;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    const newMonthStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;
    setInternalViewMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  }, [viewMonthNum, viewYear, onMonthChange]);

  const goToNextMonth = useCallback(() => {
    let newMonth = viewMonthNum + 1;
    let newYear = viewYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    const newMonthStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;
    setInternalViewMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  }, [viewMonthNum, viewYear, onMonthChange]);

  const handleDateSelect = useCallback(
    (date: string) => {
      setInternalSelectedDate(date);
      onDateSelect?.(date);
      // Open panel on mobile when date is selected
      setPanelOpen(true);
    },
    [onDateSelect],
  );

  const handleFocusDate = useCallback((date: string) => {
    setFocusedDate(date);
  }, []);

  const handleSubmitReport = useCallback(
    (date: string) => {
      onSubmitReport?.(date);
    },
    [onSubmitReport],
  );

  const handleReportAction = useCallback(
    (reportId: string, action: string) => {
      onReportAction?.(reportId, action);
    },
    [onReportAction],
  );

  // Month label
  const monthName = new Date(viewYear, viewMonthNum).toLocaleDateString(
    locale as SupportedLocale,
    { month: 'long', year: 'numeric' },
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={`rc-container ${className}`} aria-busy="true" aria-label="Loading calendar">
        <div className="rc-loading">
          <div className="rc-loading-spinner" aria-hidden="true" />
          <p className="rc-loading-text">Loading reports…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`rc-container ${className}`} role="alert">
        <div className="rc-error">
          <AlertTriangle size={24} aria-hidden="true" />
          <p className="rc-error-text">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rc-container ${className}`}>
      {/* Mobile panel toggle */}
      <button
        type="button"
        className="rc-mobile-toggle"
        onClick={() => setPanelOpen((prev) => !prev)}
        aria-expanded={panelOpen}
        aria-controls="rc-details-panel"
        aria-label={panelOpen ? 'Hide details panel' : 'Show details panel'}
      >
        <Menu size={18} aria-hidden="true" />
        {panelOpen ? 'Hide Details' : 'Show Details'}
      </button>

      <div className="rc-layout">
        {/* Calendar section */}
        <section className="rc-calendar-section" aria-label="Revenue reporting calendar">
          {/* Month navigation */}
          <div className="rc-month-nav">
            <button
              type="button"
              className="rc-nav-btn"
              onClick={goToPrevMonth}
              aria-label={`Previous month: ${new Date(viewYear, viewMonthNum - 1).toLocaleDateString(locale as SupportedLocale, { month: 'long', year: 'numeric' })}`}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <h2 className="rc-month-title">{monthName}</h2>
            <button
              type="button"
              className="rc-nav-btn"
              onClick={goToNextMonth}
              aria-label={`Next month: ${new Date(viewYear, viewMonthNum + 1).toLocaleDateString(locale as SupportedLocale, { month: 'long', year: 'numeric' })}`}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Legend */}
          <div className="rc-legend" aria-label="Status legend">
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-status-due)' }} aria-hidden="true" />
              Due
            </span>
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-status-submitted)' }} aria-hidden="true" />
              Submitted
            </span>
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-status-accepted)' }} aria-hidden="true" />
              Accepted
            </span>
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-status-overdue)' }} aria-hidden="true" />
              Overdue
            </span>
          </div>

          {/* Calendar grid */}
          <CalendarGridComponent
            days={dayCells}
            selectedDate={selectedDate}
            focusedDate={focusedDate}
            weekStartsOn={weekStartsOn}
            onDateSelect={handleDateSelect}
            onFocusDate={handleFocusDate}
            locale={locale}
            ariaLabel={`Revenue reporting calendar for ${monthName}. Use arrow keys to navigate, Home and End for row edges, Page Up and Page Down for month navigation, Enter or Space to select.`}
          />
        </section>

        {/* Details panel */}
        <div id="rc-details-panel" className="rc-details-wrapper">
          <DetailsPanel
            selectedDate={selectedDate}
            reports={reports}
            monthReports={monthReports}
            viewMonth={viewMonth}
            locale={locale}
            onSubmitReport={handleSubmitReport}
            onReportAction={handleReportAction}
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueReportingCalendar;
