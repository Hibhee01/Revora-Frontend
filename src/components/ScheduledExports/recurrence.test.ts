import { describe, it, expect } from 'vitest';
import {
  describeSchedule,
  formatTime,
  computeNextRun,
  validateRecurrenceRule,
  validateScheduleForm,
  defaultRecurrenceRule,
} from './recurrence';
import type { RecurrenceRule } from './types';

describe('formatTime', () => {
  it('formats midnight as 12:00 AM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('formats morning hours correctly', () => {
    expect(formatTime('09:15')).toBe('9:15 AM');
  });

  it('formats afternoon hours correctly', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
  });

  it('pads minutes to two digits', () => {
    expect(formatTime('07:05')).toBe('7:05 AM');
  });

  it('returns the input unchanged for non-standard format', () => {
    expect(formatTime('invalid')).toBe('invalid');
  });
});

describe('describeSchedule', () => {
  it('describes a daily schedule', () => {
    const rule: RecurrenceRule = { frequency: 'daily', time: '09:00', timezone: 'UTC' };
    expect(describeSchedule(rule)).toBe('Daily at 9:00 AM (UTC)');
  });

  it('describes a weekly schedule', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', time: '14:00', timezone: 'America/New_York', dayOfWeek: 1 };
    expect(describeSchedule(rule)).toBe('Weekly on Monday at 2:00 PM (America/New_York)');
  });

  it('describes a monthly schedule with ordinal suffix', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 1 };
    expect(describeSchedule(rule)).toBe('Monthly on the 1st at 2:00 AM (UTC)');
  });

  it('uses ordinal suffix 2nd for day 2', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 2 };
    expect(describeSchedule(rule)).toContain('2nd');
  });

  it('uses ordinal suffix 3rd for day 3', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 3 };
    expect(describeSchedule(rule)).toContain('3rd');
  });

  it('uses ordinal suffix th for day 11-13', () => {
    expect(describeSchedule({ frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 11 })).toContain('11th');
    expect(describeSchedule({ frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 12 })).toContain('12th');
    expect(describeSchedule({ frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 13 })).toContain('13th');
  });

  it('falls back to Monday for weekly when dayOfWeek is undefined', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', time: '10:00', timezone: 'UTC' };
    expect(describeSchedule(rule)).toBe('Weekly on Monday at 10:00 AM (UTC)');
  });

  it('falls back to day 1 for monthly when dayOfMonth is undefined', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', time: '10:00', timezone: 'UTC' };
    expect(describeSchedule(rule)).toContain('1st');
  });
});

describe('computeNextRun', () => {
  it('returns the same-day run if the time has not passed yet (daily)', () => {
    const base = new Date('2026-07-28T12:00:00Z');
    const rule: RecurrenceRule = { frequency: 'daily', time: '14:00', timezone: 'UTC' };
    const result = computeNextRun(rule, base);
    expect(new Date(result).toISOString()).toBe('2026-07-28T14:00:00.000Z');
  });

  it('returns the next day for daily when the time has passed', () => {
    const base = new Date('2026-07-28T12:00:00Z');
    const rule: RecurrenceRule = { frequency: 'daily', time: '08:00', timezone: 'UTC' };
    const result = computeNextRun(rule, base);
    expect(new Date(result).toISOString()).toBe('2026-07-29T08:00:00.000Z');
  });

  it('computes next weekly run on Monday when today is Tuesday', () => {
    const base = new Date('2026-07-28T12:00:00Z');
    const rule: RecurrenceRule = { frequency: 'weekly', time: '10:00', timezone: 'UTC', dayOfWeek: 1 };
    const result = computeNextRun(rule, base);
    const d = new Date(result);
    expect(d.getUTCDay()).toBe(1);
    expect(d.getUTCHours()).toBe(10);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it('computes next monthly run on the correct day', () => {
    const base = new Date('2026-07-28T12:00:00Z');
    const rule: RecurrenceRule = { frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 1 };
    const result = computeNextRun(rule, base);
    const d = new Date(result);
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCMonth()).toBe(7);
  });

  it('handles daily schedule across timezone boundaries', () => {
    const rule: RecurrenceRule = { frequency: 'daily', time: '09:00', timezone: 'America/New_York' };
    const base = new Date('2026-11-01T12:00:00Z');
    const result = computeNextRun(rule, base);
    const next = new Date(result);
    expect(next.getTime()).toBeGreaterThan(base.getTime());
    expect(next.getUTCDate()).toBeGreaterThanOrEqual(1);
  });
});

describe('defaultRecurrenceRule', () => {
  it('returns a daily rule at 09:00 UTC with defaults', () => {
    expect(defaultRecurrenceRule()).toEqual({
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC',
      dayOfWeek: 1,
      dayOfMonth: 1,
    });
  });
});

describe('validateRecurrenceRule', () => {
  it('returns null for a valid daily rule', () => {
    expect(validateRecurrenceRule({ frequency: 'daily', time: '09:00', timezone: 'UTC' })).toBeNull();
  });

  it('returns null for a valid weekly rule with dayOfWeek', () => {
    expect(validateRecurrenceRule({ frequency: 'weekly', time: '10:00', timezone: 'America/New_York', dayOfWeek: 3 })).toBeNull();
  });

  it('returns null for a valid monthly rule with dayOfMonth', () => {
    expect(validateRecurrenceRule({ frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 15 })).toBeNull();
  });

  it('fails when time is missing', () => {
    expect(validateRecurrenceRule({ frequency: 'daily', time: '', timezone: 'UTC' })).toBe('Time must be in HH:mm format');
  });

  it('fails when time is not HH:mm format', () => {
    expect(validateRecurrenceRule({ frequency: 'daily', time: '9:00', timezone: 'UTC' })).toBe('Time must be in HH:mm format');
  });

  it('fails when timezone is empty', () => {
    expect(validateRecurrenceRule({ frequency: 'daily', time: '09:00', timezone: '' })).toBe('Timezone is required');
  });

  it('fails when weekly rule has no dayOfWeek', () => {
    expect(validateRecurrenceRule({ frequency: 'weekly', time: '10:00', timezone: 'UTC' })).toBe('Day of week is required for weekly schedules');
  });

  it('fails when monthly rule dayOfMonth is out of range', () => {
    expect(validateRecurrenceRule({ frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 0 })).toBe('Day of month must be between 1 and 31');
    expect(validateRecurrenceRule({ frequency: 'monthly', time: '02:00', timezone: 'UTC', dayOfMonth: 32 })).toBe('Day of month must be between 1 and 31');
  });
});

describe('validateScheduleForm', () => {
  it('returns null for a complete valid form', () => {
    expect(validateScheduleForm({ name: 'Test', format: 'csv', schedule: { frequency: 'daily', time: '09:00', timezone: 'UTC' } })).toBeNull();
  });

  it('fails when name is empty', () => {
    expect(validateScheduleForm({ name: '  ', format: 'csv', schedule: { frequency: 'daily', time: '09:00', timezone: 'UTC' } })).toBe('Name is required');
  });

  it('fails when format is unknown', () => {
    expect(validateScheduleForm({ name: 'Test', format: 'xls' as 'csv', schedule: { frequency: 'daily', time: '09:00', timezone: 'UTC' } })).toBe('Format is required');
  });
});
