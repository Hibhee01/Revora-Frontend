import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFinancialTermsForm } from './useFinancialTermsForm';
import type { FinancialTermsField } from '../utils/financialTermsValidation';

const VALID_VALUES: Record<FinancialTermsField, string> = {
  revenueShareRate: '8',
  revenueCap: '500000',
  paymentFrequency: '3',
  minInvestment: '1000',
  maxInvestment: '50000',
  offeringDuration: '24',
};

describe('useFinancialTermsForm', () => {
  it('initialises with empty values and no touched fields', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    expect(result.current.values.revenueShareRate).toBe('');
    expect(result.current.touched.revenueShareRate).toBe(false);
    expect(result.current.submitAttempted).toBe(false);
  });

  it('handleChange updates the correct field value', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => { result.current.handleChange('revenueShareRate', '10'); });
    expect(result.current.values.revenueShareRate).toBe('10');
    expect(result.current.values.revenueCap).toBe('');
  });

  it('handleBlur marks the field as touched', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    expect(result.current.touched.revenueCap).toBe(false);
    act(() => { result.current.handleBlur('revenueCap'); });
    expect(result.current.touched.revenueCap).toBe(true);
  });

  it('getFieldValidation returns null for untouched field before submit', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    expect(result.current.getFieldValidation('revenueShareRate')).toBeNull();
  });

  it('getFieldValidation returns result after field is touched', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => { result.current.handleBlur('revenueShareRate'); });
    const v = result.current.getFieldValidation('revenueShareRate');
    expect(v).not.toBeNull();
    expect(v?.severity).toBe('error');
  });

  it('getFieldValidation returns ok after valid value entered and touched', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      result.current.handleChange('revenueShareRate', '8');
      result.current.handleBlur('revenueShareRate');
    });
    expect(result.current.getFieldValidation('revenueShareRate')?.severity).toBe('ok');
  });

  it('getFieldValidation returns warning for guardrail-triggering value', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      result.current.handleChange('revenueShareRate', '0.5');
      result.current.handleBlur('revenueShareRate');
    });
    expect(result.current.getFieldValidation('revenueShareRate')?.severity).toBe('warning');
  });

  it('handleSubmit marks all fields as touched and sets submitAttempted', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => { result.current.handleSubmit(); });
    expect(Object.values(result.current.touched).every(Boolean)).toBe(true);
    expect(result.current.submitAttempted).toBe(true);
  });

  it('getFieldValidation returns result for all fields after submit attempt', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => { result.current.handleSubmit(); });
    const fields: FinancialTermsField[] = [
      'revenueShareRate', 'revenueCap', 'paymentFrequency',
      'minInvestment', 'maxInvestment', 'offeringDuration',
    ];
    fields.forEach((f) => {
      expect(result.current.getFieldValidation(f)).not.toBeNull();
    });
  });

  it('handleSubmit returns isValid=false when fields are empty', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    let summary: ReturnType<typeof result.current.handleSubmit>;
    act(() => { summary = result.current.handleSubmit(); });
    expect(summary!.isValid).toBe(false);
  });

  it('handleSubmit returns isValid=true when all fields are valid', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      Object.entries(VALID_VALUES).forEach(([f, v]) => {
        result.current.handleChange(f as FinancialTermsField, v);
      });
    });
    let summary: ReturnType<typeof result.current.handleSubmit>;
    act(() => { summary = result.current.handleSubmit(); });
    expect(summary!.isValid).toBe(true);
  });

  it('formSummary reflects current values without requiring touched', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    expect(result.current.formSummary.isValid).toBe(false);
    act(() => {
      Object.entries(VALID_VALUES).forEach(([f, v]) => {
        result.current.handleChange(f as FinancialTermsField, v);
      });
    });
    expect(result.current.formSummary.isValid).toBe(true);
  });

  it('formSummary.crossFieldError is set when min >= max investment', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      result.current.handleChange('minInvestment', '50000');
      result.current.handleChange('maxInvestment', '1000');
    });
    expect(result.current.formSummary.crossFieldError).not.toBeNull();
  });

  it('formSummary.crossFieldError is null when min < max investment', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      result.current.handleChange('minInvestment', '1000');
      result.current.handleChange('maxInvestment', '50000');
    });
    expect(result.current.formSummary.crossFieldError).toBeNull();
  });

  it('reset clears all values, touched, and submitAttempted', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      result.current.handleChange('revenueShareRate', '8');
      result.current.handleBlur('revenueShareRate');
      result.current.handleSubmit();
    });
    act(() => { result.current.reset(); });
    expect(result.current.values.revenueShareRate).toBe('');
    expect(result.current.touched.revenueShareRate).toBe(false);
    expect(result.current.submitAttempted).toBe(false);
  });

  it('handleChange does not affect touched state', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => { result.current.handleChange('revenueCap', '100000'); });
    expect(result.current.touched.revenueCap).toBe(false);
  });

  it('multiple handleChange calls keep the last value', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => {
      result.current.handleChange('revenueShareRate', '5');
      result.current.handleChange('revenueShareRate', '8');
      result.current.handleChange('revenueShareRate', '10');
    });
    expect(result.current.values.revenueShareRate).toBe('10');
  });

  it('touching one field does not affect other fields', () => {
    const { result } = renderHook(() => useFinancialTermsForm());
    act(() => { result.current.handleBlur('revenueShareRate'); });
    expect(result.current.touched.revenueCap).toBe(false);
    expect(result.current.touched.paymentFrequency).toBe(false);
  });
});
