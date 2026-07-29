import React from 'react';
import { render, screen, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import { FinancialTermsForm } from './FinancialTermsForm';
import { useFinancialTermsForm } from '../../hooks/useFinancialTermsForm';
import type { FinancialTermsField } from '../../utils/financialTermsValidation';

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function renderForm(props: Partial<React.ComponentProps<typeof FinancialTermsForm>> = {}) {
  return render(<FinancialTermsForm {...props} />);
}

const VALID_INPUTS: Record<FinancialTermsField, string> = {
  revenueShareRate: '8',
  revenueCap: '500000',
  paymentFrequency: '3',
  minInvestment: '1000',
  maxInvestment: '50000',
  offeringDuration: '24',
};

async function fillAllFields(user: ReturnType<typeof userEvent.setup>) {
  for (const [field, value] of Object.entries(VALID_INPUTS)) {
    const input = screen.getByTestId(`ftf-input-${field}`);
    await user.clear(input);
    await user.type(input, value);
    await user.tab();
  }
}

/* ─── Rendering ─────────────────────────────────────────────────────────── */

describe('FinancialTermsForm – rendering', () => {
  it('renders the form with title and subtitle', () => {
    renderForm();
    expect(screen.getByText('Financial terms')).toBeInTheDocument();
    expect(screen.getByText(/Set the economic parameters/i)).toBeInTheDocument();
  });

  it('renders all 6 field inputs', () => {
    renderForm();
    const fields: FinancialTermsField[] = [
      'revenueShareRate', 'revenueCap', 'paymentFrequency',
      'minInvestment', 'maxInvestment', 'offeringDuration',
    ];
    fields.forEach((f) => {
      expect(screen.getByTestId(`ftf-input-${f}`)).toBeInTheDocument();
    });
  });

  it('renders labels for all fields', () => {
    renderForm();
    expect(screen.getByText('Revenue share rate')).toBeInTheDocument();
    expect(screen.getByText('Revenue cap')).toBeInTheDocument();
    expect(screen.getByText('Payment frequency')).toBeInTheDocument();
    expect(screen.getByText('Minimum investment')).toBeInTheDocument();
    expect(screen.getByText('Maximum investment')).toBeInTheDocument();
    expect(screen.getByText('Offering duration')).toBeInTheDocument();
  });

  it('renders help text for each field', () => {
    renderForm();
    expect(screen.getByText(/Percentage of monthly gross revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum cumulative revenue distributed/i)).toBeInTheDocument();
    expect(screen.getByText(/How often distributions are made/i)).toBeInTheDocument();
    expect(screen.getByText(/Smallest amount a single investor/i)).toBeInTheDocument();
    expect(screen.getByText(/Largest amount a single investor/i)).toBeInTheDocument();
    expect(screen.getByText(/How long the offering remains open/i)).toBeInTheDocument();
  });

  it('renders unit badges for each field', () => {
    renderForm();
    const units = screen.getAllByText('%');
    expect(units.length).toBeGreaterThanOrEqual(1);
  });

  it('renders constraint hints beside each label', () => {
    renderForm();
    expect(screen.getByText('0.1–50%')).toBeInTheDocument();
  });

  it('renders submit and reset buttons', () => {
    renderForm();
    expect(screen.getByTestId('ftf-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('ftf-reset-btn')).toBeInTheDocument();
  });

  it('does not render error summary initially', () => {
    renderForm();
    expect(screen.queryByTestId('ftf-error-summary')).not.toBeInTheDocument();
  });

  it('does not render feedback for untouched fields', () => {
    renderForm();
    expect(screen.queryByTestId('ftf-feedback-revenueShareRate')).not.toBeInTheDocument();
  });

  it('accepts custom className', () => {
    renderForm({ className: 'my-class' });
    expect(screen.getByTestId('ftf-container').className).toContain('my-class');
  });
});

/* ─── Inline validation – error on blur ────────────────────────────────── */

describe('FinancialTermsForm – inline validation on blur', () => {
  it('shows error feedback after blurring an empty field', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.click(input);
    await user.tab();
    const feedback = screen.getByTestId('ftf-feedback-revenueShareRate');
    expect(feedback).toBeInTheDocument();
    expect(feedback.textContent).toContain('required');
  });

  it('shows error for non-numeric input after blur', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, 'abc');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('positive number');
  });

  it('shows error for value below minimum after blur', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, '0.05');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('at least');
  });

  it('shows error for value above maximum after blur', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, '99');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('cannot exceed');
  });

  it('shows ok feedback for valid value after blur', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, '8');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('looks good');
  });

  it('sets aria-invalid on input when error', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.click(input);
    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when value is valid', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, '8');
    await user.tab();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('applies error CSS class to input on error', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.click(input);
    await user.tab();
    expect(input.className).toContain('ftf__input--error');
  });

  it('applies ok CSS class to input on valid value', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, '8');
    await user.tab();
    expect(input.className).toContain('ftf__input--ok');
  });
});

/* ─── Guardrail warnings ────────────────────────────────────────────────── */

describe('FinancialTermsForm – guardrail warnings', () => {
  it('shows warning for revenue share rate below 1%', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueShareRate'), '0.5');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('below 1%');
  });

  it('shows warning for revenue share rate above 30%', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueShareRate'), '35');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('above 30%');
  });

  it('applies warning CSS class to input on guardrail warning', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueShareRate'), '0.5');
    await user.tab();
    expect(screen.getByTestId('ftf-input-revenueShareRate').className).toContain('ftf__input--warning');
  });

  it('shows warning for revenue cap below $10,000', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueCap'), '5000');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueCap').textContent).toContain('below $10,000');
  });

  it('shows warning for payment frequency above 6 months', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-paymentFrequency'), '9');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-paymentFrequency').textContent).toContain('greater than 6 months');
  });

  it('shows warning for offering duration below 3 months', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-offeringDuration'), '2');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-offeringDuration').textContent).toContain('under 3 months');
  });

  it('warning feedback uses role=status (polite)', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueShareRate'), '0.5');
    await user.tab();
    const feedback = screen.getByTestId('ftf-feedback-revenueShareRate');
    expect(feedback).toHaveAttribute('role', 'status');
    expect(feedback).toHaveAttribute('aria-live', 'polite');
  });

  it('error feedback uses role=alert (assertive)', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('ftf-input-revenueShareRate'));
    await user.tab();
    const feedback = screen.getByTestId('ftf-feedback-revenueShareRate');
    expect(feedback).toHaveAttribute('role', 'alert');
    expect(feedback).toHaveAttribute('aria-live', 'assertive');
  });
});

/* ─── Cross-field validation ────────────────────────────────────────────── */

describe('FinancialTermsForm – cross-field validation', () => {
  it('shows cross-field error when min investment >= max investment', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-minInvestment'), '50000');
    await user.tab();
    await user.type(screen.getByTestId('ftf-input-maxInvestment'), '1000');
    await user.tab();
    expect(screen.getByTestId('ftf-cross-error')).toBeInTheDocument();
    expect(screen.getByTestId('ftf-cross-error').textContent).toContain('must be greater than minimum');
  });

  it('does not show cross-field error when min < max', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-minInvestment'), '1000');
    await user.tab();
    await user.type(screen.getByTestId('ftf-input-maxInvestment'), '50000');
    await user.tab();
    expect(screen.queryByTestId('ftf-cross-error')).not.toBeInTheDocument();
  });

  it('cross-field error has role=alert', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-minInvestment'), '50000');
    await user.tab();
    await user.type(screen.getByTestId('ftf-input-maxInvestment'), '1000');
    await user.tab();
    expect(screen.getByTestId('ftf-cross-error')).toHaveAttribute('role', 'alert');
  });
});

/* ─── Submit behaviour ──────────────────────────────────────────────────── */

describe('FinancialTermsForm – submit', () => {
  it('shows error summary after submit with empty fields', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(screen.getByTestId('ftf-error-summary')).toBeInTheDocument();
    expect(screen.getByTestId('ftf-error-summary').textContent).toContain('need');
  });

  it('shows feedback for all fields after submit attempt', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('ftf-submit-btn'));
    const fields: FinancialTermsField[] = [
      'revenueShareRate', 'revenueCap', 'paymentFrequency',
      'minInvestment', 'maxInvestment', 'offeringDuration',
    ];
    fields.forEach((f) => {
      expect(screen.getByTestId(`ftf-feedback-${f}`)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with numeric values when all fields are valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await fillAllFields(user);
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(onSubmit).toHaveBeenCalledOnce();
    const arg = onSubmit.mock.calls[0][0] as Record<FinancialTermsField, number>;
    expect(arg.revenueShareRate).toBe(8);
    expect(arg.revenueCap).toBe(500000);
    expect(arg.paymentFrequency).toBe(3);
    expect(arg.minInvestment).toBe(1000);
    expect(arg.maxInvestment).toBe(50000);
    expect(arg.offeringDuration).toBe(24);
  });

  it('does not call onSubmit when form has errors', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows success state after valid submit', async () => {
    const user = userEvent.setup();
    renderForm();
    await fillAllFields(user);
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(screen.getByTestId('ftf-success')).toBeInTheDocument();
    expect(screen.getByText('Financial terms saved')).toBeInTheDocument();
  });

  it('returns to form after clicking "Edit terms"', async () => {
    const user = userEvent.setup();
    renderForm();
    await fillAllFields(user);
    await user.click(screen.getByTestId('ftf-submit-btn'));
    await user.click(screen.getByTestId('ftf-edit-btn'));
    expect(screen.getByTestId('ftf-container')).toBeInTheDocument();
    expect(screen.queryByTestId('ftf-success')).not.toBeInTheDocument();
  });

  it('error summary uses singular "field needs" for one error', async () => {
    const user = userEvent.setup();
    renderForm();
    const fields: FinancialTermsField[] = [
      'revenueCap', 'paymentFrequency', 'minInvestment', 'maxInvestment', 'offeringDuration',
    ];
    for (const f of fields) {
      await user.type(screen.getByTestId(`ftf-input-${f}`), VALID_INPUTS[f]);
      await user.tab();
    }
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(screen.getByTestId('ftf-error-summary').textContent).toContain('1 field needs');
  });
});

/* ─── Reset ─────────────────────────────────────────────────────────────── */

describe('FinancialTermsForm – reset', () => {
  it('clears all inputs on reset', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueShareRate'), '8');
    await user.click(screen.getByTestId('ftf-reset-btn'));
    expect(screen.getByTestId('ftf-input-revenueShareRate')).toHaveValue('');
  });

  it('hides all feedback after reset', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('ftf-submit-btn'));
    await user.click(screen.getByTestId('ftf-reset-btn'));
    expect(screen.queryByTestId('ftf-feedback-revenueShareRate')).not.toBeInTheDocument();
  });

  it('hides error summary after reset', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('ftf-submit-btn'));
    await user.click(screen.getByTestId('ftf-reset-btn'));
    expect(screen.queryByTestId('ftf-error-summary')).not.toBeInTheDocument();
  });
});

/* ─── aria-describedby wiring ───────────────────────────────────────────── */

describe('FinancialTermsForm – aria-describedby', () => {
  it('each input has aria-describedby pointing to its constraint, help text, and feedback', () => {
    renderForm();
    const fields: FinancialTermsField[] = [
      'revenueShareRate', 'revenueCap', 'paymentFrequency',
      'minInvestment', 'maxInvestment', 'offeringDuration',
    ];
    fields.forEach((f) => {
      const input = screen.getByTestId(`ftf-input-${f}`);
      const describedBy = input.getAttribute('aria-describedby') ?? '';
      const ids = describedBy.split(' ');
      
      // Should have at least constraint and helpId
      expect(ids.length).toBeGreaterThanOrEqual(2);
      
      // Verify all IDs exist in the document
      ids.forEach(id => {
        expect(document.getElementById(id)).not.toBeNull();
      });
    });
  });

  it('aria-describedby includes feedback id after field is touched', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.click(input);
    await user.tab();
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    // constraintId + helpId + feedbackId = 3 IDs
    expect(describedBy.split(' ').length).toBe(3);
  });

  it('each input has aria-required=true', () => {
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    expect(input).toHaveAttribute('aria-required', 'true');
  });
});

/* ─── Locale number input ───────────────────────────────────────────────── */

describe('FinancialTermsForm – locale number input', () => {
  it('accepts comma-formatted thousands (1,000,000) for revenue cap', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    for (const [field, value] of Object.entries(VALID_INPUTS)) {
      const v = field === 'revenueCap' ? '1,000,000' : value;
      await user.type(screen.getByTestId(`ftf-input-${field}`), v);
      await user.tab();
    }
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0].revenueCap).toBe(1000000);
  });

  it('shows error for negative value input', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-revenueShareRate'), '-5');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueShareRate').textContent).toContain('positive number');
  });
});

/* ─── Accessibility ─────────────────────────────────────────────────────── */

describe('FinancialTermsForm – accessibility', () => {
  it('has no axe violations on initial render', async () => {
    const { container } = renderForm();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations after submit with errors', async () => {
    const user = userEvent.setup();
    const { container } = renderForm();
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations on success state', async () => {
    const user = userEvent.setup();
    const { container } = renderForm();
    await fillAllFields(user);
    await user.click(screen.getByTestId('ftf-submit-btn'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('form has accessible label', () => {
    renderForm();
    expect(screen.getByRole('form', { name: /offering financial terms/i })).toBeInTheDocument();
  });

  it('all inputs are associated with their labels via htmlFor/id', () => {
    renderForm();
    const fields: FinancialTermsField[] = [
      'revenueShareRate', 'revenueCap', 'paymentFrequency',
      'minInvestment', 'maxInvestment', 'offeringDuration',
    ];
    fields.forEach((f) => {
      const input = screen.getByTestId(`ftf-input-${f}`);
      const id = input.getAttribute('id');
      expect(id).toBeTruthy();
      expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
    });
  });
});

/* ─── Edge cases ────────────────────────────────────────────────────────── */

describe('FinancialTermsForm – edge cases', () => {
  it('handles rapid typing without crashing', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueShareRate');
    await user.type(input, '1234567890');
    expect(input).toHaveValue('1234567890');
  });

  it('handles pasting a locale-formatted number', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('ftf-input-revenueCap');
    await user.click(input);
    await user.paste('1,000,000');
    await user.tab();
    expect(screen.getByTestId('ftf-feedback-revenueCap').textContent).toContain('looks good');
  });

  it('does not show cross-field error when either investment field is empty', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('ftf-input-minInvestment'), '50000');
    await user.tab();
    expect(screen.queryByTestId('ftf-cross-error')).not.toBeInTheDocument();
  });

  it('formHook prop allows injecting a controlled hook instance', () => {
    const hook = renderHook(() => useFinancialTermsForm());
    render(<FinancialTermsForm formHook={hook.result.current} />);
    expect(screen.getByTestId('ftf-container')).toBeInTheDocument();
  });
});
