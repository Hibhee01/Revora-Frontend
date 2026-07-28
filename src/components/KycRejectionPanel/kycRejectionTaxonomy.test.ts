/**
 * Tests for the KYC rejection taxonomy (Issue #229).
 * Covers canonical copy templates, unknown/empty → UNCLEAR fallback,
 * severity mapping, and multi-reason resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  KYC_REJECTION_TAXONOMY,
  countBlockingReasons,
  isCanonicalRejectionCode,
  normalizeRejectionCode,
  resolveRejectionReason,
  resolveRejectionReasons,
} from './kycRejectionTaxonomy';

describe('KYC rejection taxonomy', () => {
  it('defines a template for every canonical code', () => {
    const codes = Object.keys(KYC_REJECTION_TAXONOMY);
    expect(codes.length).toBeGreaterThanOrEqual(10);
    for (const code of codes) {
      const template = KYC_REJECTION_TAXONOMY[code as keyof typeof KYC_REJECTION_TAXONOMY];
      expect(template.chipLabel.length).toBeGreaterThan(0);
      expect(template.explanation.length).toBeGreaterThan(20);
      expect(template.actionLabel.length).toBeGreaterThan(0);
      expect(['blocking', 'warning', 'info']).toContain(template.severity);
    }
  });

  it('recognises canonical codes and rejects unknowns', () => {
    expect(isCanonicalRejectionCode('ID_BLURRY')).toBe(true);
    expect(isCanonicalRejectionCode('UNCLEAR')).toBe(true);
    expect(isCanonicalRejectionCode('NOT_A_REAL_CODE')).toBe(false);
  });

  it('normalizes casing / separators and maps unknowns to UNCLEAR', () => {
    expect(normalizeRejectionCode('id-blurry')).toBe('ID_BLURRY');
    expect(normalizeRejectionCode('  address expired  ')).toBe('ADDRESS_EXPIRED');
    expect(normalizeRejectionCode('vendor_mystery')).toBe('UNCLEAR');
    expect(normalizeRejectionCode('')).toBe('UNCLEAR');
    expect(normalizeRejectionCode(null)).toBe('UNCLEAR');
    expect(normalizeRejectionCode(undefined)).toBe('UNCLEAR');
  });

  it('resolves a reason with template copy and optional reviewer detail', () => {
    const resolved = resolveRejectionReason({
      id: '1',
      code: 'ID_BLURRY',
      detail: 'Corners cropped.',
    });
    expect(resolved.chipLabel).toBe('ID photo unclear');
    expect(resolved.stepId).toBe('id-upload');
    expect(resolved.actionLabel).toBe('Re-upload ID');
    expect(resolved.displayExplanation).toContain('sharp, well-lit');
    expect(resolved.displayExplanation).toContain('Reviewer note: Corners cropped.');
  });

  it('maps unclear / unknown codes to the contact-support fallback', () => {
    const unclear = resolveRejectionReason({ id: 'u', code: 'UNCLEAR' });
    expect(unclear.contactSupport).toBe(true);
    expect(unclear.actionLabel).toMatch(/contact support/i);
    expect(unclear.stepId).toBe('support');

    const unknown = resolveRejectionReason({
      id: 'x',
      code: 'WEIRD_VENDOR_CODE',
    });
    expect(unknown.code).toBe('UNCLEAR');
    expect(unknown.contactSupport).toBe(true);
  });

  it('resolves multiple reasons and counts blocking ones', () => {
    const resolved = resolveRejectionReasons([
      { id: 'a', code: 'ID_BLURRY' },
      { id: 'b', code: 'ADDRESS_EXPIRED' },
      { id: 'c', code: 'AML_HIT_REQUIRES_REVIEW' },
    ]);
    expect(resolved).toHaveLength(3);
    expect(countBlockingReasons(resolved)).toBe(1);
    expect(resolved.map((r) => r.severity)).toEqual(['blocking', 'warning', 'info']);
  });

  it('marks AML hits as contact-support (manual review)', () => {
    const aml = resolveRejectionReason({ id: 'aml', code: 'AML_HIT_REQUIRES_REVIEW' });
    expect(aml.contactSupport).toBe(true);
    expect(aml.severity).toBe('info');
  });
});
