/**
 * Tests for SaveFilterDialog (Issue #235).
 * Covers save flow, validation (blank / duplicate / very long names), focus
 * management, Escape/backdrop close, and axe accessibility checks.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { SaveFilterDialog } from './SaveFilterDialog';
import {
  EMPTY_FILTERS,
  NAME_MAX_LENGTH,
  createSavedFilter,
} from './savedFilters';

expect.extend(toHaveNoViolations);

const FILTERS = { ...EMPTY_FILTERS, query: 'payout', action: 'payout' };

function renderDialog(props: Partial<React.ComponentProps<typeof SaveFilterDialog>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <SaveFilterDialog
      open
      filters={FILTERS}
      existing={[]}
      onSave={onSave}
      onClose={onClose}
      {...props}
    />
  );
  return { onSave, onClose, ...view };
}

describe('SaveFilterDialog', () => {
  it('renders nothing when closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes dialog semantics and echoes the filter summary', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: /save filter/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/action: payout/)).toBeInTheDocument();
  });

  it('moves focus to the name field on open', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveFocus());
  });

  it('saves trimmed name and description', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();

    await user.type(screen.getByLabelText(/name/i), '  Failed payouts  ');
    await user.type(screen.getByLabelText(/description/i), ' Q3 audit ');
    await user.click(screen.getByRole('button', { name: /save and pin/i }));

    expect(onSave).toHaveBeenCalledWith('Failed payouts', 'Q3 audit');
  });

  it('shows an inline error for a blank name and does not save', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();

    await user.click(screen.getByRole('button', { name: /save and pin/i }));

    expect(onSave).not.toHaveBeenCalled();
    const input = screen.getByLabelText(/name/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent(/enter a name/i);
    expect(input).toHaveAttribute('aria-describedby', error.id);
  });

  it('rejects duplicate names (case-insensitive) with clear copy', async () => {
    const user = userEvent.setup();
    const existing = [createSavedFilter('Failed Payouts', '', EMPTY_FILTERS)];
    const { onSave } = renderDialog({ existing });

    await user.type(screen.getByLabelText(/name/i), 'failed payouts');
    await user.click(screen.getByRole('button', { name: /save and pin/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i);
  });

  it('rejects very long names', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();

    await user.click(screen.getByLabelText(/name/i));
    await user.paste('x'.repeat(NAME_MAX_LENGTH + 5));
    await user.click(screen.getByRole('button', { name: /save and pin/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/limited to/i);
  });

  it('clears the error once the user edits the name', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /save and pin/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), 'a');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('closes on Escape and on Cancel', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes when the backdrop is clicked, but not when the dialog body is', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole('dialog', { name: /save filter/i }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('save-filter-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus inside the dialog (wraps from last to first and back)', async () => {
    const user = userEvent.setup();
    renderDialog();

    const name = screen.getByLabelText(/name/i);
    await waitFor(() => expect(name).toHaveFocus());

    // Shift+Tab from the first focusable wraps to the last (Save button)
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: /save and pin/i })).toHaveFocus();

    // Tab from the last wraps back to the first
    await user.keyboard('{Tab}');
    expect(name).toHaveFocus();
  });

  it('lets Tab move normally between fields inside the dialog', async () => {
    const user = userEvent.setup();
    renderDialog();

    const name = screen.getByLabelText(/name/i);
    await waitFor(() => expect(name).toHaveFocus());

    // Tab from a middle element proceeds naturally (no wrap)
    await user.keyboard('{Tab}');
    expect(screen.getByLabelText(/description/i)).toHaveFocus();

    // Shift+Tab from a middle element also proceeds naturally
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(name).toHaveFocus();
  });

  it('returns focus to the previously focused element on close', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <button type="button">Save filter trigger</button>
        <SaveFilterDialog
          open={false}
          filters={FILTERS}
          existing={[]}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      </>
    );

    const trigger = screen.getByRole('button', { name: /trigger/i });
    await user.click(trigger);

    rerender(
      <>
        <button type="button">Save filter trigger</button>
        <SaveFilterDialog open filters={FILTERS} existing={[]} onSave={vi.fn()} onClose={vi.fn()} />
      </>
    );
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveFocus());

    rerender(
      <>
        <button type="button">Save filter trigger</button>
        <SaveFilterDialog
          open={false}
          filters={FILTERS}
          existing={[]}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      </>
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('has no axe-detectable accessibility violations (default and error states)', async () => {
    const user = userEvent.setup();
    const { container } = renderDialog();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole('button', { name: /save and pin/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
