/**
 * Tests for the payout status taxonomy (Issue #221).
 */

import { describe, it, expect } from 'vitest';
import {
  PAYOUT_STATUS_ORDER,
  PAYOUT_STATUS_TAXONOMY,
  getPayoutStatusDefinition,
  isPayoutStatus,
  normalizePayoutStatus,
} from './payoutStatuses';

describe('payout status taxonomy', () => {
  it('defines all seven canonical statuses in a stable order', () => {
    expect(PAYOUT_STATUS_ORDER).toEqual([
      'scheduled',
      'preparing',
      'sending',
      'confirmed',
      'retrying',
      'failed',
      'canceled',
    ]);
    expect(Object.keys(PAYOUT_STATUS_TAXONOMY).sort()).toEqual(
      [...PAYOUT_STATUS_ORDER].sort()
    );
  });

  it('provides label, description, tone, and icon for every status', () => {
    for (const status of PAYOUT_STATUS_ORDER) {
      const def = getPayoutStatusDefinition(status);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(20);
      expect(def.tone).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.status).toBe(status);
    }
  });

  it('recognises canonical statuses and rejects unknowns', () => {
    expect(isPayoutStatus('confirmed')).toBe(true);
    expect(isPayoutStatus('not-a-status')).toBe(false);
  });

  it('normalizes casing, separators, aliases, and unknowns', () => {
    expect(normalizePayoutStatus('Confirmed')).toBe('confirmed');
    expect(normalizePayoutStatus('  RETRYING  ')).toBe('retrying');
    expect(normalizePayoutStatus('in_progress')).toBe('scheduled'); // unknown → scheduled
    expect(normalizePayoutStatus('cancelled')).toBe('canceled');
    expect(normalizePayoutStatus('')).toBe('scheduled');
    expect(normalizePayoutStatus(null)).toBe('scheduled');
    expect(normalizePayoutStatus(undefined)).toBe('scheduled');
  });
});
