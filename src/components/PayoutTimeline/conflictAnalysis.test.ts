import { describe, it, expect } from 'vitest';
import { analyzeConflicts } from './conflictAnalysis';
import { PayoutEvent } from './PayoutTimeline';

describe('analyzeConflicts', () => {
  const mockPayouts: PayoutEvent[] = [
    { id: 'p1', date: '2026-07-01', label: 'Payout 1', status: 'scheduled' },
    { id: 'p2', date: '2026-07-10', label: 'Processing Payout', status: 'processing' },
  ];

  it('returns no conflicts for valid date', () => {
    const conflicts = analyzeConflicts('p1', '2026-07-20', mockPayouts);
    expect(conflicts).toHaveLength(0);
  });

  it('returns hard conflict for same date', () => {
    const conflicts = analyzeConflicts('p1', '2026-07-10', mockPayouts);
    expect(conflicts.some(c => c.severity === 'hard')).toBe(true);
  });

  it('returns soft conflict for within 7 days of processing payout', () => {
    const conflicts = analyzeConflicts('p1', '2026-07-15', mockPayouts);
    expect(conflicts.some(c => c.severity === 'soft')).toBe(true);
  });
});
