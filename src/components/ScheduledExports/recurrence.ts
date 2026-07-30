import type { RecurrenceRule } from './types';
import { DAY_LABELS } from './types';

export function describeSchedule(rule: RecurrenceRule): string {
  const time = formatTime(rule.time);
  const tz = rule.timezone;
  switch (rule.frequency) {
    case 'daily':
      return `Daily at ${time} (${tz})`;
    case 'weekly': {
      const day = rule.dayOfWeek !== undefined ? DAY_LABELS[rule.dayOfWeek] : 'Monday';
      return `Weekly on ${day} at ${time} (${tz})`;
    }
    case 'monthly': {
      const day = rule.dayOfMonth ?? 1;
      const suffix = ordinalSuffix(day);
      return `Monthly on the ${day}${suffix} at ${time} (${tz})`;
    }
  }
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function ordinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Returns the timezone offset (in ms) between UTC and `timezone` at the
 * given UTC `date`.  Positive means the target timezone is behind UTC.
 */
function getTzOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const getInt = (type: string): number =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  return (
    Date.UTC(
      getInt('year'),
      getInt('month') - 1,
      getInt('day'),
      getInt('hour'),
      getInt('minute'),
      getInt('second'),
    ) - date.getTime()
  );
}

/**
 * Converts a local-time-in-timezone (expressed as Date.UTC components) to
 * the equivalent UTC `Date`, using the timezone offset at `refDate`.
 *
 * @param localComponents  Year, month (0-indexed), day, hours, minutes
 *                         expressing the desired *local* time in `timezone`.
 * @param timezone       IANA timezone string.
 * @param refDate        Date whose timezone offset is used for conversion.
 */
function localToUtc(
  localComponents: [number, number, number, number, number],
  timezone: string,
  refDate: Date,
): Date {
  const [y, m, d, h, min] = localComponents;
  const localTs = Date.UTC(y, m, d, h, min, 0, 0);
  return new Date(localTs - getTzOffsetMs(refDate, timezone));
}

/**
 * Computes the next run time for a recurring schedule.
 *
 * Algorithm:
 * 1. Resolve the current date in the target timezone via Intl.DateTimeFormat.
 * 2. For weekly / monthly schedules, FIRST snap to the correct day-of-week
 *    or day-of-month (clamped to month length).
 * 3. THEN check whether that time is still in the future; if not, advance
 *    by the appropriate period and snap again.
 *
 * The timezone offset is re-computed at each relevant date so DST transitions
 * (spring-forward / fall-back) are handled correctly.
 *
 * @returns ISO-8601 string of the next occurrence.
 */
export function computeNextRun(rule: RecurrenceRule, after?: Date): string {
  const now = after ?? new Date();
  const [hours, minutes] = rule.time.split(':').map(Number);

  // ── Step 1: Get the current date in the target timezone ─────────────
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: rule.timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const getInt = (type: string): number =>
    parseInt(tzParts.find((p) => p.type === type)?.value ?? '0', 10);

  const tzYear = getInt('year');
  const tzMonth = getInt('month');
  const tzDay = getInt('day');

  // ── Step 2: Build initial candidate ─────────────────────────────────
  let candidate = localToUtc(
    [tzYear, tzMonth - 1, tzDay, hours, minutes],
    rule.timezone,
    now,
  );

  // ── Step 3: Snap to the correct day-of-week / day-of-month ──────────
  if (rule.frequency === 'weekly' && rule.dayOfWeek !== undefined) {
    const targetDay = rule.dayOfWeek;
    let currentDay = candidate.getUTCDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    if (diff > 0) {
      candidate = new Date(candidate.getTime() + diff * 24 * 60 * 60 * 1000);
    }
  }

  if (rule.frequency === 'monthly' && rule.dayOfMonth !== undefined) {
    const cY = candidate.getUTCFullYear();
    const cM = candidate.getUTCMonth();
    const lastDay = new Date(Date.UTC(cY, cM + 1, 0)).getUTCDate();
    const clampedDay = Math.min(rule.dayOfMonth, lastDay);
    const dayDiff = clampedDay - candidate.getUTCDate();
    if (dayDiff !== 0) {
      candidate = new Date(candidate.getTime() + dayDiff * 24 * 60 * 60 * 1000);
    }
  }

  // ── Step 4: If candidate is in the past, advance ────────────────────
  if (candidate <= now) {
    switch (rule.frequency) {
      case 'daily':
        candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
        break;

      case 'weekly': {
        candidate = new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const targetDay = rule.dayOfWeek!;
        let currentDay = candidate.getUTCDay();
        let diff = targetDay - currentDay;
        if (diff < 0) diff += 7;
        if (diff > 0) {
          candidate = new Date(candidate.getTime() + diff * 24 * 60 * 60 * 1000);
        }
        break;
      }

      case 'monthly': {
        // Advance the month, then reconstruct using the rule's local
        // time and the timezone offset at the advanced date.  This
        // handles DST transitions correctly (e.g. EST → EDT).
        const cY = candidate.getUTCFullYear();
        const cM = candidate.getUTCMonth();
        const nextMonth = cM + 1;
        const nextYear = nextMonth > 11 ? cY + 1 : cY;
        const nextMonthIdx = nextMonth > 11 ? 0 : nextMonth;
        const tDay = rule.dayOfMonth ?? 1;
        const lastDay = new Date(Date.UTC(nextYear, nextMonthIdx + 1, 0)).getUTCDate();
        const clampedDay = Math.min(tDay, lastDay);
        // Use the rule's local hours+minutes with the future date's offset.
        candidate = localToUtc(
          [nextYear, nextMonthIdx, clampedDay, hours, minutes],
          rule.timezone,
          new Date(Date.UTC(nextYear, nextMonthIdx, clampedDay, 12, 0, 0, 0)),
        );
        break;
      }
    }
  }

  return candidate.toISOString();
}

export function validateRecurrenceRule(rule: RecurrenceRule): string | null {
  if (!rule.time || !/^\d{2}:\d{2}$/.test(rule.time)) {
    return 'Time must be in HH:mm format';
  }
  if (!rule.timezone) {
    return 'Timezone is required';
  }
  if (rule.frequency === 'weekly' && (rule.dayOfWeek === undefined || rule.dayOfWeek < 0 || rule.dayOfWeek > 6)) {
    return 'Day of week is required for weekly schedules';
  }
  if (rule.frequency === 'monthly' && (rule.dayOfMonth === undefined || rule.dayOfMonth < 1 || rule.dayOfMonth > 31)) {
    return 'Day of month must be between 1 and 31';
  }
  return null;
}

export function validateScheduleForm(data: {
  name: string;
  format: string;
  schedule: RecurrenceRule;
}): string | null {
  if (!data.name.trim()) return 'Name is required';
  if (!['csv', 'json', 'pdf'].includes(data.format)) return 'Format is required';
  return validateRecurrenceRule(data.schedule);
}

export function defaultRecurrenceRule(): RecurrenceRule {
  return {
    frequency: 'daily',
    time: '09:00',
    timezone: 'UTC',
    dayOfWeek: 1,
    dayOfMonth: 1,
  };
}
