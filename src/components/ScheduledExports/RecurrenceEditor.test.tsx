import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { RecurrenceEditor } from './RecurrenceEditor';
import { defaultRecurrenceRule } from './recurrence';

function renderEditor(props: Partial<React.ComponentProps<typeof RecurrenceEditor>> = {}) {
  const onChange = vi.fn();
  const value = props.value ?? defaultRecurrenceRule();
  const view = render(
    <RecurrenceEditor value={value} onChange={onChange} {...props} />
  );
  return { onChange, ...view };
}

describe('RecurrenceEditor', () => {
  it('renders frequency, time, and timezone controls', () => {
    renderEditor();
    expect(screen.getByRole('combobox', { name: /frequency/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /timezone/i })).toBeInTheDocument();
  });

  it('shows day-of-week selector for weekly frequency', () => {
    renderEditor({ value: { ...defaultRecurrenceRule(), frequency: 'weekly' } });
    expect(screen.getByRole('combobox', { name: /day of week/i })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /day of month/i })).not.toBeInTheDocument();
  });

  it('shows day-of-month selector for monthly frequency', () => {
    renderEditor({ value: { ...defaultRecurrenceRule(), frequency: 'monthly' } });
    expect(screen.getByRole('combobox', { name: /day of month/i })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /day of week/i })).not.toBeInTheDocument();
  });

  it('hides day selectors for daily frequency', () => {
    renderEditor({ value: { ...defaultRecurrenceRule(), frequency: 'daily' } });
    expect(screen.queryByRole('combobox', { name: /day of week/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /day of month/i })).not.toBeInTheDocument();
  });

  it('shows the plain-language summary', () => {
    renderEditor();
    expect(screen.getByText(/daily at/i)).toBeInTheDocument();
  });

  it('calls onChange when frequency changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();
    await user.selectOptions(screen.getByRole('combobox', { name: /frequency/i }), 'weekly');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'weekly' })
    );
  });

  it('calls onChange when time changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();
    const input = screen.getByLabelText('Time');
    await user.clear(input);
    await user.type(input, '14:30');
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange when timezone changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();
    await user.selectOptions(screen.getByRole('combobox', { name: /timezone/i }), 'America/Chicago');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: 'America/Chicago' })
    );
  });

  it('calls onChange when day of week changes', async () => {
    const user = userEvent.setup();
    const value = { ...defaultRecurrenceRule(), frequency: 'weekly' };
    const { onChange } = renderEditor({ value });
    await user.selectOptions(screen.getByRole('combobox', { name: /day of week/i }), '3');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayOfWeek: 3 }));
  });

  it('calls onChange when day of month changes', async () => {
    const user = userEvent.setup();
    const value = { ...defaultRecurrenceRule(), frequency: 'monthly' };
    const { onChange } = renderEditor({ value });
    await user.selectOptions(screen.getByRole('combobox', { name: /day of month/i }), '15');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dayOfMonth: 15 }));
  });

  it('displays error messages', () => {
    renderEditor({ errors: ['Time is required'] });
    expect(screen.getByRole('alert')).toHaveTextContent('Time is required');
  });

  it('displays the summary as a live region', () => {
    renderEditor();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderEditor();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in weekly mode', async () => {
    const { container } = renderEditor({ value: { ...defaultRecurrenceRule(), frequency: 'weekly' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in monthly mode', async () => {
    const { container } = renderEditor({ value: { ...defaultRecurrenceRule(), frequency: 'monthly' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations when errors are present', async () => {
    const { container } = renderEditor({ errors: ['Test error message'] });
    expect(await axe(container)).toHaveNoViolations();
  });
});
