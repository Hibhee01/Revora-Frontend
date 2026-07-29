import { describe, it, expect } from 'vitest';
import {
  parseLocaleNumber,
  validateField,
  validateInvestmentRange,
  validateFinancialTermsForm,
  FIELD_CONSTRAINTS,
  type FinancialTermsField,
  type FinancialTermsValues,
} from './financialTermsValidation';

/* ─── parseLocaleNumber ─────────────────────────────────────────────────── */

describe('parseLocaleNumber', () => {
  it('parses a plain integer', () => {
    expect(parseLocaleNumber('100')).toBe(100);
  });

  it('parses a plain decimal', () => {
    expect(parseLocaleNumber('12.5')).toBe(12.5);
  });

  it('parses US thousands separator (1,000)', () => {
    expect(parseLocaleNumber('1,000')).toBe(1000);
  });

  it('parses US thousands + decimal (1,234.56)', () => {
    expect(parseLocaleNumber('1,234.56')).toBe(1234.56);
  });

  it('parses European decimal comma (1,5)', () => {
    expect(parseLocaleNumber('1,5')).toBe(1.5);
  });

  it('parses European format with dot thousands and comma decimal (1.234,56)', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56);
  });

  it('parses multiple dot thousands separators (1.000.000)', () => {
    expect(parseLocaleNumber('1.000.000')).toBe(1000000);
  });

  it('strips leading/trailing whitespace', () => {
    expect(parseLocaleNumber('  42  ')).toBe(42);
  });

  it('returns null for empty string', () => {
    expect(parseLocaleNumber('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseLocaleNumber('   ')).toBeNull();
  });

  it('returns null for negative values', () => {
    expect(parseLocaleNumber('-5')).toBeNull();
  });

  it('returns null for alphabetic input', () => {
    expect(parseLocaleNumber('abc')).toBeNull();
  });

  it('returns null for mixed alpha-numeric', () => {
    expect(parseLocaleNumber('12abc')).toBeNull();
  });

  it('returns null for lone decimal point', () => {
    expect(parseLocaleNumber('.')).toBeNull();
  });

  it('parses zero', () => {
    expect(parseLocaleNumber('0')).toBe(0);
  });

  it('parses large number with comma thousands (1,000,000)', () => {
    expect(parseLocaleNumber('1,000,000')).toBe(1000000);
  });

  it('parses number with trailing decimal (5.)', () => {
    expect(parseLocaleNumber('5.')).toBe(5);
  });
});

/* ─── validateField – revenueShareRate ─────────────────────────────────── */

describe('validateField – revenueShareRate', () => {
  const field: FinancialTermsField = 'revenueShareRate';

  it('returns error for empty string', () => {
    const r = validateField(field, '');
    expect(r.severity).toBe('error');
    expect(r.message).toContain('Revenue share rate is required');
    expect(r.numericValue).toBeNull();
  });

  it('returns error for non-numeric input', () => {
    const r = validateField(field, 'abc');
    expect(r.severity).toBe('error');
    expect(r.message).toContain('must be a positive number');
  });

  it('returns error for value below minimum (0.1)', () => {
    const r = validateField(field, '0.05');
    expect(r.severity).toBe('error');
    expect(r.message).toContain('at least');
    expect(r.numericValue).toBe(0.05);
  });

  it('returns error for value above maximum (50)', () => {
    const r = validateField(field, '51');
    expect(r.severity).toBe('error');
    expect(r.message).toContain('cannot exceed');
    expect(r.numericValue).toBe(51);
  });

  it('returns warning for value below guardrail low (1%)', () => {
    const r = validateField(field, '0.5');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('below 1%');
    expect(r.numericValue).toBe(0.5);
  });

  it('returns warning for value above guardrail high (30%)', () => {
    const r = validateField(field, '35');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('above 30%');
    expect(r.numericValue).toBe(35);
  });

  it('returns ok for a valid mid-range value', () => {
    const r = validateField(field, '8');
    expect(r.severity).toBe('ok');
    expect(r.message).toBe('');
    expect(r.numericValue).toBe(8);
  });

  it('returns ok for the minimum boundary value', () => {
    expect(validateField(field, '0.1').severity).toBe('ok');
  });

  it('returns ok for the maximum boundary value', () => {
    expect(validateField(field, '50').severity).toBe('ok');
  });

  it('returns ok for guardrail boundary values (exactly 1 and 30)', () => {
    expect(validateField(field, '1').severity).toBe('ok');
    expect(validateField(field, '30').severity).toBe('ok');
  });
});

/* ─── validateField – revenueCap ───────────────────────────────────────── */

describe('validateField – revenueCap', () => {
  const field: FinancialTermsField = 'revenueCap';

  it('returns error for empty string', () => {
    expect(validateField(field, '').severity).toBe('error');
  });

  it('returns error for value below minimum (1)', () => {
    const r = validateField(field, '0');
    expect(r.severity).toBe('error');
    expect(r.message).toContain('at least');
  });

  it('returns error for value above maximum (100,000,000)', () => {
    const r = validateField(field, '100000001');
    expect(r.severity).toBe('error');
    expect(r.message).toContain('cannot exceed');
  });

  it('returns warning for value below guardrail low ($10,000)', () => {
    const r = validateField(field, '5000');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('below $10,000');
  });

  it('returns warning for value above guardrail high ($50,000,000)', () => {
    const r = validateField(field, '60000000');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('above $50,000,000');
  });

  it('returns ok for a valid value', () => {
    expect(validateField(field, '500000').severity).toBe('ok');
  });

  it('parses locale-formatted value (1,000,000)', () => {
    const r = validateField(field, '1,000,000');
    expect(r.severity).toBe('ok');
    expect(r.numericValue).toBe(1000000);
  });
});

/* ─── validateField – paymentFrequency ─────────────────────────────────── */

describe('validateField – paymentFrequency', () => {
  const field: FinancialTermsField = 'paymentFrequency';

  it('returns error for empty string', () => {
    expect(validateField(field, '').severity).toBe('error');
  });

  it('returns error for value below minimum (1)', () => {
    expect(validateField(field, '0').severity).toBe('error');
  });

  it('returns error for value above maximum (12)', () => {
    expect(validateField(field, '13').severity).toBe('error');
  });

  it('returns warning for value above guardrail high (6)', () => {
    const r = validateField(field, '9');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('greater than 6 months');
  });

  it('returns ok for monthly (1)', () => {
    expect(validateField(field, '1').severity).toBe('ok');
  });

  it('returns ok for quarterly (3)', () => {
    expect(validateField(field, '3').severity).toBe('ok');
  });

  it('returns ok for annual (12)', () => {
    expect(validateField(field, '12').severity).toBe('ok');
  });
});

/* ─── validateField – minInvestment ────────────────────────────────────── */

describe('validateField – minInvestment', () => {
  const field: FinancialTermsField = 'minInvestment';

  it('returns error for empty string', () => {
    expect(validateField(field, '').severity).toBe('error');
  });

  it('returns error for value below minimum (1)', () => {
    expect(validateField(field, '0').severity).toBe('error');
  });

  it('returns error for value above maximum (1,000,000)', () => {
    expect(validateField(field, '1000001').severity).toBe('error');
  });

  it('returns warning for value above guardrail high ($50,000)', () => {
    const r = validateField(field, '75000');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('above $50,000');
  });

  it('returns ok for $1,000', () => {
    expect(validateField(field, '1000').severity).toBe('ok');
  });
});

/* ─── validateField – maxInvestment ────────────────────────────────────── */

describe('validateField – maxInvestment', () => {
  const field: FinancialTermsField = 'maxInvestment';

  it('returns error for empty string', () => {
    expect(validateField(field, '').severity).toBe('error');
  });

  it('returns error for value above maximum (10,000,000)', () => {
    expect(validateField(field, '10000001').severity).toBe('error');
  });

  it('returns ok for a valid value with no guardrails', () => {
    expect(validateField(field, '500000').severity).toBe('ok');
  });
});

/* ─── validateField – offeringDuration ─────────────────────────────────── */

describe('validateField – offeringDuration', () => {
  const field: FinancialTermsField = 'offeringDuration';

  it('returns error for empty string', () => {
    expect(validateField(field, '').severity).toBe('error');
  });

  it('returns error for value below minimum (1)', () => {
    expect(validateField(field, '0').severity).toBe('error');
  });

  it('returns error for value above maximum (120)', () => {
    expect(validateField(field, '121').severity).toBe('error');
  });

  it('returns warning for value below guardrail low (3 months)', () => {
    const r = validateField(field, '2');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('under 3 months');
  });

  it('returns warning for value above guardrail high (60 months)', () => {
    const r = validateField(field, '72');
    expect(r.severity).toBe('warning');
    expect(r.message).toContain('over 60 months');
  });

  it('returns ok for 12 months', () => {
    expect(validateField(field, '12').severity).toBe('ok');
  });

  it('returns ok for guardrail boundary values (exactly 3 and 60)', () => {
    expect(validateField(field, '3').severity).toBe('ok');
    expect(validateField(field, '60').severity).toBe('ok');
  });
});

/* ─── validateInvestmentRange ───────────────────────────────────────────── */

describe('validateInvestmentRange', () => {
  it('returns null when min < max', () => {
    expect(validateInvestmentRange('1000', '50000')).toBeNull();
  });

  it('returns error message when min === max', () => {
    const msg = validateInvestmentRange('5000', '5000');
    expect(msg).not.toBeNull();
    expect(msg).toContain('must be greater than minimum');
  });

  it('returns error message when min > max', () => {
    const msg = validateInvestmentRange('50000', '1000');
    expect(msg).not.toBeNull();
    expect(msg).toContain('must be greater than minimum');
  });

  it('returns null when either value is unparseable (individual errors handle it)', () => {
    expect(validateInvestmentRange('', '5000')).toBeNull();
    expect(validateInvestmentRange('1000', '')).toBeNull();
    expect(validateInvestmentRange('abc', '5000')).toBeNull();
  });

  it('includes both values in the error message', () => {
    const msg = validateInvestmentRange('10000', '5000');
    expect(msg).toContain('5,000');
    expect(msg).toContain('10,000');
  });
});

/* ─── validateFinancialTermsForm ────────────────────────────────────────── */

describe('validateFinancialTermsForm', () => {
  const validValues: FinancialTermsValues = {
    revenueShareRate: '8',
    revenueCap: '500000',
    paymentFrequency: '3',
    minInvestment: '1000',
    maxInvestment: '50000',
    offeringDuration: '24',
  };

  it('returns isValid=true for all-valid values', () => {
    const result = validateFinancialTermsForm(validValues);
    expect(result.isValid).toBe(true);
    expect(result.crossFieldError).toBeNull();
  });

  it('returns isValid=false when any field has an error', () => {
    const result = validateFinancialTermsForm({ ...validValues, revenueShareRate: '' });
    expect(result.isValid).toBe(false);
  });

  it('returns isValid=false when cross-field constraint is violated', () => {
    const result = validateFinancialTermsForm({
      ...validValues,
      minInvestment: '50000',
      maxInvestment: '1000',
    });
    expect(result.isValid).toBe(false);
    expect(result.crossFieldError).not.toBeNull();
  });

  it('returns isValid=true when all fields have warnings but no errors', () => {
    const warningValues: FinancialTermsValues = {
      revenueShareRate: '0.5',  // warning: below 1%
      revenueCap: '5000',       // warning: below $10,000
      paymentFrequency: '9',    // warning: > 6 months
      minInvestment: '75000',   // warning: > $50,000
      maxInvestment: '500000',  // ok
      offeringDuration: '72',   // warning: > 60 months
    };
    const result = validateFinancialTermsForm(warningValues);
    expect(result.isValid).toBe(true);
  });

  it('includes per-field results for all 6 fields', () => {
    const result = validateFinancialTermsForm(validValues);
    const fields = Object.keys(result.fields) as FinancialTermsField[];
    expect(fields).toHaveLength(6);
    expect(fields).toContain('revenueShareRate');
    expect(fields).toContain('revenueCap');
    expect(fields).toContain('paymentFrequency');
    expect(fields).toContain('minInvestment');
    expect(fields).toContain('maxInvestment');
    expect(fields).toContain('offeringDuration');
  });

  it('returns isValid=false when all fields are empty', () => {
    const empty: FinancialTermsValues = {
      revenueShareRate: '',
      revenueCap: '',
      paymentFrequency: '',
      minInvestment: '',
      maxInvestment: '',
      offeringDuration: '',
    };
    expect(validateFinancialTermsForm(empty).isValid).toBe(false);
  });
});

/* ─── FIELD_CONSTRAINTS completeness ───────────────────────────────────── */

describe('FIELD_CONSTRAINTS', () => {
  const fields: FinancialTermsField[] = [
    'revenueShareRate',
    'revenueCap',
    'paymentFrequency',
    'minInvestment',
    'maxInvestment',
    'offeringDuration',
  ];

  fields.forEach((field) => {
    it(`${field} has min < max`, () => {
      expect(FIELD_CONSTRAINTS[field].min).toBeLessThan(FIELD_CONSTRAINTS[field].max);
    });

    it(`${field} has a non-empty label and helpText`, () => {
      expect(FIELD_CONSTRAINTS[field].label.length).toBeGreaterThan(0);
      expect(FIELD_CONSTRAINTS[field].helpText.length).toBeGreaterThan(0);
    });
  });
});
