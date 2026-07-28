import type { RecurrenceRule, RecurrenceFrequency } from './types';
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

export function computeNextRun(rule: RecurrenceRule, after?: Date): string {
  const now = after ?? new Date();
  const [hours, minutes] = rule.time.split(':').map(Number);
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: rule.timezone }));
  tzDate.setHours(hours, minutes, 0, 0);
  const candidate = new Date(tzDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  if (candidate <= now) {
    switch (rule.frequency) {
      case 'daily':
        candidate.setDate(candidate.getDate() + 1);
        break;
      case 'weekly':
        candidate.setDate(candidate.getDate() + 7);
        break;
      case 'monthly':
        candidate.setMonth(candidate.getMonth() + 1);
        break;
    }
  }
  if (rule.frequency === 'weekly' && rule.dayOfWeek !== undefined) {
    const targetDay = rule.dayOfWeek;
    const currentDay = candidate.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    candidate.setDate(candidate.getDate() + diff);
  }
  if (rule.frequency === 'monthly' && rule.dayOfMonth !== undefined) {
    candidate.setDate(rule.dayOfMonth);
    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + 1);
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