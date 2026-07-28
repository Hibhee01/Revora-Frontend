import { describe, it, expect } from 'vitest';
import { MOCK_SCHEDULED_EXPORTS, FREQUENCY_LABELS, FORMAT_LABELS, DAY_LABELS, COMMON_TIMEZONES } from './types';

describe('MOCK_SCHEDULED_EXPORTS', () => {
  it('contains all status variants', () => {
    const statuses = MOCK_SCHEDULED_EXPORTS.map((s) => s.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('paused');
    expect(statuses).toContain('error');
  });

  it('contains all export formats', () => {
    const formats = MOCK_SCHEDULED_EXPORTS.map((s) => s.format);
    expect(formats).toContain('csv');
    expect(formats).toContain('json');
    expect(formats).toContain('pdf');
  });

  it('contains all frequency types', () => {
    const freqs = MOCK_SCHEDULED_EXPORTS.map((s) => s.schedule.frequency);
    expect(freqs).toContain('daily');
    expect(freqs).toContain('weekly');
    expect(freqs).toContain('monthly');
  });

  it('has unique ids', () => {
    const ids = MOCK_SCHEDULED_EXPORTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct date strings', () => {
    for (const s of MOCK_SCHEDULED_EXPORTS) {
      expect(s.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(s.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

describe('constants', () => {
  it('FREQUENCY_LABELS covers all frequencies', () => {
    expect(FREQUENCY_LABELS).toEqual({ daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' });
  });

  it('FORMAT_LABELS covers all formats', () => {
    expect(FORMAT_LABELS).toEqual({ csv: 'CSV', json: 'JSON', pdf: 'PDF' });
  });

  it('DAY_LABELS has 7 days', () => {
    expect(DAY_LABELS).toHaveLength(7);
    expect(DAY_LABELS[0]).toBe('Sunday');
    expect(DAY_LABELS[6]).toBe('Saturday');
  });

  it('COMMON_TIMEZONES includes major zones', () => {
    expect(COMMON_TIMEZONES).toContain('UTC');
    expect(COMMON_TIMEZONES).toContain('America/New_York');
    expect(COMMON_TIMEZONES).toContain('Asia/Tokyo');
  });
});
