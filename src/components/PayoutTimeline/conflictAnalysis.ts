/**
 * Payout Reschedule Conflict Analysis (Issue #220)
 *
 * Analyzes potential rescheduling conflicts between payout events.
 */

import { PayoutEvent } from './PayoutTimeline';

export type ConflictSeverity = 'hard' | 'soft';

export interface Conflict {
  id: string;
  severity: ConflictSeverity;
  message: string;
}

/**
 * Analyzes conflicts for a payout being rescheduled.
 *
 * - Hard conflict: Another payout scheduled on the exact same date.
 * - Soft conflict: Payout rescheduled to be within 7 days of a 'processing' payout.
 */
export function analyzeConflicts(
  payoutId: string,
  newDateIso: string,
  allPayouts: PayoutEvent[],
): Conflict[] {
  const conflicts: Conflict[] = [];
  const otherPayouts = allPayouts.filter((p) => p.id !== payoutId);

  // Check for Hard Conflicts (Same Date)
  const exactMatch = otherPayouts.find((p) => p.date === newDateIso);
  if (exactMatch) {
    conflicts.push({
      id: `hard-${exactMatch.id}`,
      severity: 'hard',
      message: `Conflict: Another payout ("${exactMatch.label}") is already scheduled for ${newDateIso}.`,
    });
  }

  // Check for Soft Conflicts (Within 7 days of 'processing')
  const newDate = new Date(newDateIso).getTime();
  const MS_PER_DAY = 86_400_000;
  const SEVEN_DAYS = 7 * MS_PER_DAY;

  otherPayouts.forEach((p) => {
    if (p.status === 'processing') {
      const pDate = new Date(p.date).getTime();
      if (Math.abs(newDate - pDate) <= SEVEN_DAYS) {
        conflicts.push({
          id: `soft-${p.id}`,
          severity: 'soft',
          message: `Warning: Payout is scheduled within 7 days of a processing event ("${p.label}").`,
        });
      }
    }
  });

  return conflicts;
}
