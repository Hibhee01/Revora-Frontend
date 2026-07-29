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
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Send,
  X,
  Menu,
  List,
  Upload,
  LayoutGrid,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  SupportedLocale,
  LOCALE_FORMAT_SETTINGS,
} from "../constants/i18n";
import { TERMINOLOGY } from "../constants/terminology";
import { Button } from "./Button";
import {
  RevenueReportingCalendarProps,
  DayCellData,
  ReportStatus,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  OverdueSeverity,
  OVERDUE_SEVERITY_LABELS,
  OVERDUE_SEVERITY_COLORS,
  getOverdueDays,
  getOverdueSeverity,
} from './RevenueReportingCalendar.types';
import RevenueCalendarCsvImport from './RevenueCalendarCsvImport';
import './RevenueReportingCalendar.css';

/* ─── Helpers ──────────────────────────────────────────────────────── */

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseISODate(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = iso.split("-").map(Number);
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

function getFirstDayOfMonth(
  year: number,
  month: number,
  weekStartsOn: number,
): number {
  const day = new Date(year, month, 1).getDay();
  return (day - weekStartsOn + 7) % 7;
}

function getPrimaryStatus(reports: RevenueReport[]): ReportStatus {
  if (reports.length === 0) return "none";
  // Priority: overdue > due > submitted > accepted
  if (reports.some((r) => r.status === "overdue")) return "overdue";
  if (reports.some((r) => r.status === "due")) return "due";
  if (reports.some((r) => r.status === "submitted")) return "submitted";
  return "accepted";
}

function isOverdue(report: RevenueReport): boolean {
  if (report.status === "accepted" || report.status === "submitted")
    return false;
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
  if (status === "none") return null;
  const color = REPORT_STATUS_COLORS[status];
  return (
    <span
      className="rc-status-dot"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

/* ─── Overdue Badge ────────────────────────────────────────────────── */

function OverdueBadge({ dueDate }: { dueDate: string }) {
  const days = getOverdueDays(dueDate);
  const severity = getOverdueSeverity(days);
  const color = OVERDUE_SEVERITY_COLORS[severity];

  return (
    <span
      className={`rc-overdue-badge rc-overdue-badge--${severity}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {severity === 'critical' ? (
        <AlertOctagon size={10} aria-hidden="true" />
      ) : (
        <AlertTriangle size={10} aria-hidden="true" />
      )}
      <span className="rc-overdue-badge-days">{days}</span>
    </span>
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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const overdueReport = cell.primaryStatus === 'overdue'
    ? cell.reports.find((r) => r.status === 'overdue')
    : undefined;
  const overdueDays = overdueReport ? getOverdueDays(overdueReport.dueDate) : 0;
  const overdueSeverity = overdueReport ? getOverdueSeverity(overdueDays) : null;
  const severityLabel = overdueSeverity ? OVERDUE_SEVERITY_LABELS[overdueSeverity] : '';

  const ariaLabel = [
    `${dateFormatted}.`,
    cell.primaryStatus === 'overdue'
      ? `Report overdue. ${severityLabel}. ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue.`
      : `${statusLabel}.`,
    cell.reports.length > 1 ? `${cell.reports.length} reports.` : '',
    cell.isSelected ? 'Selected.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const cellClass = [
    "rc-day-cell",
    !cell.inMonth && "rc-day-cell--outside",
    cell.isToday && "rc-day-cell--today",
    cell.isSelected && "rc-day-cell--selected",
    cell.primaryStatus !== "none" && `rc-day-cell--${cell.primaryStatus}`,
  ]
    .filter(Boolean)
    .join(" ");

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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(cell.date);
        }
      }}
    >
      <span className="rc-day-number">{cell.day}</span>
      <StatusDot status={cell.primaryStatus} />
      {cell.primaryStatus === 'overdue' && overdueReport && (
        <OverdueBadge dueDate={overdueReport.dueDate} />
      )}
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
        date.toLocaleDateString(locale as SupportedLocale, {
          weekday: "short",
        }),
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
      case "ArrowRight":
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, days.length - 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        newIndex = Math.min(currentIndex + cols, days.length - 1);
        break;
      case "ArrowUp":
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
      case "PageDown": {
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
          <div
            key={i}
            className="rc-grid-header-cell"
            role="columnheader"
            aria-hidden="true"
          >
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

/* ─── Year Grid View ───────────────────────────────────────────────── */

/** Returns aggregate status for all reports in a given year+month */
function getMonthStatus(
  reports: RevenueReport[],
  year: number,
  month: number,
): ReportStatus {
  const monthReports = reports.filter((r) => {
    const d = parseISODate(r.date);
    return d.year === year && d.month === month;
  });
  if (monthReports.length === 0) return 'none';
  // Re-use priority order: overdue > due > submitted > accepted
  if (monthReports.some((r) => r.status === 'overdue')) return 'overdue';
  if (monthReports.some((r) => r.status === 'due')) return 'due';
  if (monthReports.some((r) => r.status === 'submitted')) return 'submitted';
  return 'accepted';
}

interface MonthTileProps {
  year: number;
  month: number; // 0-based
  status: ReportStatus;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isFocused: boolean;
  locale: string;
  onClick: (year: number, month: number) => void;
  onFocus: (month: number) => void;
  reportCount: number;
}

const MonthTile: React.FC<MonthTileProps> = ({
  year,
  month,
  status,
  isCurrentMonth,
  isSelected,
  isFocused,
  locale,
  onClick,
  onFocus,
  reportCount,
}) => {
  const monthName = new Date(year, month).toLocaleDateString(
    locale as SupportedLocale,
    { month: 'short' },
  );
  const fullMonthName = new Date(year, month).toLocaleDateString(
    locale as SupportedLocale,
    { month: 'long', year: 'numeric' },
  );

  const statusColor = status !== 'none' ? REPORT_STATUS_COLORS[status] : undefined;
  const statusLabel = REPORT_STATUS_LABELS[status];

  const ariaLabel = [
    fullMonthName,
    statusLabel !== 'No report' ? `Status: ${statusLabel}.` : 'No reports.',
    reportCount > 0 ? `${reportCount} report${reportCount !== 1 ? 's' : ''}.` : '',
    isCurrentMonth ? 'Current month.' : '',
    isSelected ? 'Selected.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tileClass = [
    'rc-year-month-tile',
    isCurrentMonth && 'rc-year-month-tile--current',
    isSelected && 'rc-year-month-tile--selected',
    status !== 'none' && `rc-year-month-tile--${status}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={tileClass}
      tabIndex={isFocused ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      data-month={month}
      onClick={() => onClick(year, month)}
      onFocus={() => onFocus(month)}
    >
      <span className="rc-year-month-name">{monthName}</span>
      {status !== 'none' ? (
        <span
          className="rc-year-month-glyph"
          style={{ backgroundColor: statusColor }}
          aria-hidden="true"
        />
      ) : (
        <span className="rc-year-month-glyph rc-year-month-glyph--empty" aria-hidden="true" />
      )}
      {reportCount > 0 && (
        <span className="rc-year-month-count" aria-hidden="true">
          {reportCount}
        </span>
      )}
    </button>
  );
};

interface YearGridViewProps {
  year: number;
  reports: RevenueReport[];
  selectedDate: string | undefined;
  locale: string;
  /** Called when user drills down to a month */
  onMonthSelect: (year: number, month: number) => void;
}

const YearGridView: React.FC<YearGridViewProps> = ({
  year,
  reports,
  selectedDate,
  locale,
  onMonthSelect,
}) => {
  const today = new Date();
  const selectedMonth = selectedDate ? parseISODate(selectedDate).month : undefined;
  const selectedYear = selectedDate ? parseISODate(selectedDate).year : undefined;

  // Roving focus within the grid
  const [focusedMonth, setFocusedMonth] = useState<number>(() => {
    if (selectedYear === year && selectedMonth !== undefined) return selectedMonth;
    if (today.getFullYear() === year) return today.getMonth();
    return 0;
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // When focusedMonth changes, move DOM focus
  useEffect(() => {
    if (gridRef.current) {
      const tile = gridRef.current.querySelector(
        `[data-month="${focusedMonth}"]`,
      ) as HTMLElement | null;
      if (tile && document.activeElement !== tile) {
        tile.focus({ preventScroll: true });
      }
    }
  }, [focusedMonth]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cols = 3; // 3 columns × 4 rows
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedMonth((m) => Math.min(m + 1, 11));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedMonth((m) => Math.max(m - 1, 0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedMonth((m) => Math.min(m + cols, 11));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedMonth((m) => Math.max(m - cols, 0));
        break;
      case 'Home':
        e.preventDefault();
        // First month in current row
        setFocusedMonth((m) => Math.floor(m / cols) * cols);
        break;
      case 'End':
        e.preventDefault();
        // Last month in current row
        setFocusedMonth((m) => Math.min(Math.floor(m / cols) * cols + cols - 1, 11));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onMonthSelect(year, focusedMonth);
        break;
      default:
        break;
    }
  };

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const monthReports = reports.filter((r) => {
          const d = parseISODate(r.date);
          return d.year === year && d.month === i;
        });
        return {
          month: i,
          status: getMonthStatus(reports, year, i),
          reportCount: monthReports.length,
        };
      }),
    [reports, year],
  );

  return (
    <div
      ref={gridRef}
      className="rc-year-grid"
      role="grid"
      aria-label={`Year overview for ${year}. Use arrow keys to navigate months, Enter or Space to drill down.`}
      onKeyDown={handleKeyDown}
    >
      {/* 4 rows × 3 columns */}
      {[0, 1, 2, 3].map((rowIdx) => (
        <div key={rowIdx} className="rc-year-grid-row" role="row">
          {[0, 1, 2].map((colIdx) => {
            const m = rowIdx * 3 + colIdx;
            const item = months[m];
            const isCurrentMonth =
              today.getFullYear() === year && today.getMonth() === m;
            const isSelected =
              selectedYear === year && selectedMonth === m;
            return (
              <div key={m} role="gridcell">
                <MonthTile
                  year={year}
                  month={item.month}
                  status={item.status}
                  isCurrentMonth={isCurrentMonth}
                  isSelected={isSelected}
                  isFocused={focusedMonth === m}
                  locale={locale}
                  onClick={onMonthSelect}
                  onFocus={setFocusedMonth}
                  reportCount={item.reportCount}
                />
              </div>
            );
          })}
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
  const [viewMode, setViewMode] = useState<"day" | "month">("day");

  const selectedReports = selectedDate
    ? reports.filter((r) => r.date === selectedDate)
    : [];

  const monthDueReports = monthReports.filter(
    (r) => r.status === "due" || r.status === "overdue",
  );
  const monthSubmittedReports = monthReports.filter(
    (r) => r.status === "submitted",
  );
  const monthAcceptedReports = monthReports.filter(
    (r) => r.status === "accepted",
  );

  const formatReportDate = (iso: string) =>
    formatDate(iso, locale as SupportedLocale, {
      month: "short",
      day: "numeric",
    });

  const formatDueDate = (iso: string) =>
    formatDate(iso, locale as SupportedLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const renderReportItem = (report: RevenueReport) => {
    const overdue = isOverdue(report);
    const displayStatus = overdue ? "overdue" : report.status;
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
          <span className="rc-report-date">
            {formatReportDate(report.date)}
          </span>
        </div>
        <div className="rc-report-item-body">
          {report.grossRevenue !== undefined && (
            <p className="rc-report-revenue">
              {formatCurrency(
                report.grossRevenue,
                report.currency || "USD",
                locale as SupportedLocale,
              )}
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
          {report.notes && <p className="rc-report-notes">{report.notes}</p>}
        </div>
        <div className="rc-report-item-actions">
          {displayStatus === "due" && onSubmitReport && (
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
          {displayStatus === "submitted" && (
            <span className="rc-report-awaiting">Awaiting review</span>
          )}
          {displayStatus === "accepted" && (
            <span className="rc-report-confirmed">Confirmed</span>
          )}
          {displayStatus === "overdue" && (
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

  const [monthLabel, yearStr] = viewMonth.split("-");
  const monthName = new Date(
    Number(yearStr),
    Number(monthLabel) - 1,
  ).toLocaleDateString(locale as SupportedLocale, {
    month: "long",
    year: "numeric",
  });

  return (
    <aside
      className={`rc-details-panel ${isOpen ? "rc-details-panel--open" : "rc-details-panel--closed"}`}
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
          aria-selected={viewMode === "day"}
          className={`rc-details-tab ${viewMode === "day" ? "rc-details-tab--active" : ""}`}
          onClick={() => setViewMode("day")}
        >
          Day
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "month"}
          className={`rc-details-tab ${viewMode === "month" ? "rc-details-tab--active" : ""}`}
          onClick={() => setViewMode("month")}
        >
          Month
        </button>
      </div>

      {viewMode === "day" ? (
        <div className="rc-details-content" role="tabpanel">
          {selectedDate ? (
            <>
              <h3 className="rc-details-day-title">
                {formatDate(selectedDate, locale as SupportedLocale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {selectedReports.length === 0 ? (
                <div className="rc-details-empty">
                  <p className="rc-details-empty-text">
                    No reports for this date.
                  </p>
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
              <p className="rc-details-empty-text">
                Select a date to view report details.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rc-details-content" role="tabpanel">
          {/* Month summary */}
          <div className="rc-month-summary">
            <div className="rc-month-stat">
              <span className="rc-month-stat-value">
                {monthDueReports.length}
              </span>
              <span className="rc-month-stat-label">Due / Overdue</span>
            </div>
            <div className="rc-month-stat">
              <span className="rc-month-stat-value">
                {monthSubmittedReports.length}
              </span>
              <span className="rc-month-stat-label">Submitted</span>
            </div>
            <div className="rc-month-stat">
              <span className="rc-month-stat-value">
                {monthAcceptedReports.length}
              </span>
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
              Submit {monthDueReports.length} Pending Report
              {monthDueReports.length > 1 ? "s" : ""}
            </Button>
          )}

          {/* Month report list */}
          {monthReports.length === 0 ? (
            <p className="rc-details-empty-text">
              No reports scheduled for this month.
            </p>
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

export const RevenueReportingCalendar: React.FC<
  RevenueReportingCalendarProps
> = ({
  reports,
  selectedDate: controlledSelectedDate,
  viewMonth: controlledViewMonth,
  isLoading = false,
  error = null,
  locale = "en-US",
  weekStartsOn = 0, // Sunday by default
  onDateSelect,
  onMonthChange,
  onSubmitReport,
  onReportAction,
  className = "",
}) => {
  // Determine current month from reports or use today
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [internalViewMonth, setInternalViewMonth] = useState(defaultMonth);
  const [internalSelectedDate, setInternalSelectedDate] = useState<
    string | undefined
  >(controlledSelectedDate);
  const [focusedDate, setFocusedDate] = useState<string | undefined>(undefined);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileView, setMobileView] = useState<"calendar" | "agenda">("agenda");
  const [showImportWizard, setShowImportWizard] = useState(false);
  // Calendar view mode: month or year
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');

  const viewMonth = controlledViewMonth ?? internalViewMonth;
  const selectedDate = controlledSelectedDate ?? internalSelectedDate;

  const [viewYear, viewMonthNum] = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    return [y, m - 1];
  }, [viewMonth]);

  // Build day cells
  const dayCells = useMemo(
    () =>
      buildDayCells(
        viewYear,
        viewMonthNum,
        reports,
        selectedDate,
        weekStartsOn,
      ),
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
    const newMonthStr = `${newYear}-${String(newMonth + 1).padStart(2, "0")}`;
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
    const newMonthStr = `${newYear}-${String(newMonth + 1).padStart(2, "0")}`;
    setInternalViewMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  }, [viewMonthNum, viewYear, onMonthChange]);

  const goToPrevYear = useCallback(() => {
    const newMonthStr = `${viewYear - 1}-${String(viewMonthNum + 1).padStart(2, "0")}`;
    setInternalViewMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  }, [viewYear, viewMonthNum, onMonthChange]);

  const goToNextYear = useCallback(() => {
    const newMonthStr = `${viewYear + 1}-${String(viewMonthNum + 1).padStart(2, "0")}`;
    setInternalViewMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  }, [viewYear, viewMonthNum, onMonthChange]);

  /** Drill down from year grid: select the month and switch back to month view */
  const handleYearMonthSelect = useCallback(
    (year: number, month: number) => {
      const newMonthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
      setInternalViewMonth(newMonthStr);
      onMonthChange?.(newMonthStr);
      setCalendarView('month');
    },
    [onMonthChange],
  );

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
    { month: "long", year: "numeric" },
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`rc-container ${className}`}
        aria-busy="true"
        aria-label="Loading calendar"
      >
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
        aria-label={panelOpen ? "Hide details panel" : "Show details panel"}
      >
        <Menu size={18} aria-hidden="true" />
        {panelOpen ? "Hide Details" : "Show Details"}
      </button>

      <div className="rc-layout">
        {/* Calendar section */}
        <section
          className="rc-calendar-section"
          aria-label="Revenue reporting calendar"
        >
          {/* Month navigation */}
          <div className="rc-month-nav">
            <button
              type="button"
              className="rc-nav-btn"
              onClick={calendarView === 'year' ? goToPrevYear : goToPrevMonth}
              aria-label={
                calendarView === 'year'
                  ? `Previous year: ${viewYear - 1}`
                  : `Previous month: ${new Date(viewYear, viewMonthNum - 1).toLocaleDateString(locale as SupportedLocale, { month: "long", year: "numeric" })}`
              }
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <h2 className="rc-month-title">
              {calendarView === 'year' ? String(viewYear) : monthName}
            </h2>
            <button
              type="button"
              className="rc-nav-btn"
              onClick={calendarView === 'year' ? goToNextYear : goToNextMonth}
              aria-label={
                calendarView === 'year'
                  ? `Next year: ${viewYear + 1}`
                  : `Next month: ${new Date(viewYear, viewMonthNum + 1).toLocaleDateString(locale as SupportedLocale, { month: "long", year: "numeric" })}`
              }
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>

          {/* View switcher: Month / Year segmented control */}
          <div
            className="rc-view-switcher"
            role="tablist"
            aria-label="Calendar view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={calendarView === 'month'}
              className={`rc-view-switcher-btn${calendarView === 'month' ? ' rc-view-switcher-btn--active' : ''}`}
              onClick={() => setCalendarView('month')}
            >
              <Calendar size={14} aria-hidden="true" />
              Month
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={calendarView === 'year'}
              className={`rc-view-switcher-btn${calendarView === 'year' ? ' rc-view-switcher-btn--active' : ''}`}
              onClick={() => setCalendarView('year')}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              Year
            </button>
          </div>
          
          <div className="rc-actions" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 var(--spacing-6) var(--spacing-4)' }}>
            <Button variant="secondary" onClick={() => setShowImportWizard(true)} aria-label="Import historical revenue from CSV">
              <Upload size={16} aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          {/* Mobile view toggle (calendar/agenda) — only relevant in month view */}
          {calendarView === 'month' && (
          <div
            className="rc-view-toggle"
            role="tablist"
            aria-label="Calendar view mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "calendar"}
              className={`rc-view-toggle-btn ${mobileView === "calendar" ? "rc-view-toggle-btn--active" : ""}`}
              onClick={() => setMobileView("calendar")}
              aria-label="Calendar view"
            >
              <Calendar size={16} aria-hidden="true" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "agenda"}
              className={`rc-view-toggle-btn ${mobileView === "agenda" ? "rc-view-toggle-btn--active" : ""}`}
              onClick={() => setMobileView("agenda")}
              aria-label="Agenda view"
            >
              <List size={16} aria-hidden="true" />
              <span>Agenda</span>
            </button>
          </div>
          )}

          {/* Legend */}
          <div
            className={`rc-legend ${mobileView === "agenda" ? "rc-legend--hidden-on-agenda" : ""}`}
            aria-label="Status legend"
          >
            <span className="rc-legend-item">
              <span
                className="rc-legend-dot"
                style={{ backgroundColor: "var(--rc-status-due)" }}
                aria-hidden="true"
              />
              Due
            </span>
            <span className="rc-legend-item">
              <span
                className="rc-legend-dot"
                style={{ backgroundColor: "var(--rc-status-submitted)" }}
                aria-hidden="true"
              />
              Submitted
            </span>
            <span className="rc-legend-item">
              <span
                className="rc-legend-dot"
                style={{ backgroundColor: "var(--rc-status-accepted)" }}
                aria-hidden="true"
              />
              Accepted
            </span>
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-overdue-mild)' }} aria-hidden="true" />
              Overdue (1–3 days)
            </span>
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-overdue-moderate)' }} aria-hidden="true" />
              Overdue (4–29 days)
            </span>
            <span className="rc-legend-item">
              <span className="rc-legend-dot" style={{ backgroundColor: 'var(--rc-overdue-critical)' }} aria-hidden="true" />
              Overdue (30+ days)
            </span>
          </div>

          {/* Year overview grid */}
          {calendarView === 'year' && (
            <YearGridView
              year={viewYear}
              reports={reports}
              selectedDate={selectedDate}
              locale={locale}
              onMonthSelect={handleYearMonthSelect}
            />
          )}

          {/* Calendar grid (shown on desktop, or when mobile view is calendar — month view only */}
          {calendarView === 'month' && (
          <div
            className={`rc-calendar-wrapper ${mobileView === "agenda" ? "rc-calendar-wrapper--hidden-on-agenda" : ""}`}
          >
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
          </div>
          )}

          {/* Agenda view (shown when mobile view is agenda — month view only) */}
          {calendarView === 'month' && (
          <div
            className={`rc-agenda-wrapper ${mobileView === "calendar" ? "rc-agenda-wrapper--hidden-on-calendar" : ""}`}
          >
            <AgendaView
              reports={reports}
              selectedDate={selectedDate}
              locale={locale}
              onSelect={handleDateSelect}
              onSubmitReport={handleSubmitReport}
              viewMonth={viewMonth}
            />
          </div>
          )}
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
      
      {/* Import Wizard Modal */}
      {showImportWizard && (
        <div className="rc-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--color-overlay, rgba(0, 0, 0, 0.5))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 'var(--spacing-4)'
        }}>
          <RevenueCalendarCsvImport 
            onCancel={() => setShowImportWizard(false)}
            onImport={(rows) => {
              console.log('Imported rows:', rows);
              setShowImportWizard(false);
              // Handle import logic here
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RevenueReportingCalendar;
