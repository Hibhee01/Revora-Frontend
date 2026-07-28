import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ScheduleFormDialog } from './ScheduleFormDialog';
import type { ScheduleFormData, RecurrenceRule } from './types';

function renderDialog(props: Partial<React.ComponentProps<typeof ScheduleFormDialog>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <ScheduleFormDialog
      open={props.open ?? true}
      onSave={onSave}
      onClose={onClose}
      {...props}
    />
  );
  return { onSave, onClose, ...view };
}

const validFormData: ScheduleFormData = {
  name: 'Test Export',
  description: 'A test export',
  format: 'csv',
  schedule: { frequency: 'daily', time: '09:00', timezone: 'UTC' },
};

describe('ScheduleFormDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog when open', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /new schedule/i })).toBeInTheDocument();
  });

  it('shows edit title when initial data is provided', () => {
    renderDialog({ initial: { name: 'Edit Me' } });
    expect(screen.getByRole('heading', { name: /edit schedule/i })).toBeInTheDocument();
  });

  it('pre-fills fields when editing', () => {
    renderDialog({
      initial: {
        name: 'Existing',
        description: 'Existing desc',
        format: 'json',
        schedule: { frequency: 'weekly', time: '14:00', timezone: 'America/New_York', dayOfWeek: 3 },
      },
    });
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Existing');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing desc');
    expect(screen.getByLabelText(/format/i)).toHaveValue('json');
  });

  it('focuses the name input on open', async () => {
    renderDialog();
    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveFocus();
    });
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();
    await user.click(screen.getByTestId('schedule-form-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when clicking inside the dialog', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();
    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();
    await user.clear(screen.getByLabelText(/^name/i));
    await user.click(screen.getByRole('button', { name: /create schedule/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with valid form data', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();
    await user.type(screen.getByLabelText(/^name/i), 'My Export');
    await user.type(screen.getByLabelText(/description/i), 'Desc');
    await user.selectOptions(screen.getByLabelText(/format/i), 'json');
    await user.click(screen.getByRole('button', { name: /create schedule/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Export',
        description: 'Desc',
        format: 'json',
      })
    );
  });

  it('cancels without saving', async () => {
    const user = userEvent.setup();
    const { onClose, onSave } = renderDialog();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('has aria-modal and aria-labelledby for focus management', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('has no axe violations when open', async () => {
    const { container } = renderDialog();
    expect(await axe(container)).toHaveNoViolations();
  });
});
