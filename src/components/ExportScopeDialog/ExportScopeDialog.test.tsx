import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { ExportScopeDialog, formatBytes, type ExportParams, type ExportScope, type ExportFormat } from './ExportScopeDialog';
import { EMPTY_FILTERS } from '../AuditTrailFilters/savedFilters';

expect.extend(toHaveNoViolations);

const DEFAULT_FILTERS = { ...EMPTY_FILTERS, action: 'payout' };
const DEFAULT_PROPS = {
  open: true,
  filters: DEFAULT_FILTERS,
  totalEntries: 1000,
  filteredEntries: 42,
  onExport: vi.fn(),
  onClose: vi.fn(),
};

function renderDialog(props: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(
    <ExportScopeDialog {...DEFAULT_PROPS} {...props} />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ─── formatBytes (pure) ──────────────────────────────────────────── */

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 2.4)).toBe('2.4 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
  });
});

/* ─── dialog rendering ────────────────────────────────────────────── */

describe('ExportScopeDialog rendering', () => {
  it('renders when open', () => {
    renderDialog();
    expect(screen.getByRole('dialog', { name: /export audit trail/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders all scope options', () => {
    renderDialog();
    expect(screen.getByLabelText(/current filter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/custom date range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/all events/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/per actor/i)).toBeInTheDocument();
  });

  it('renders all format options', () => {
    renderDialog();
    const formatGroup = screen.getByRole('radiogroup', { name: /format/i });
    expect(within(formatGroup).getByText('CSV')).toBeInTheDocument();
    expect(within(formatGroup).getByText('PDF')).toBeInTheDocument();
    expect(within(formatGroup).getByText('JSON')).toBeInTheDocument();
  });

  it('shows the estimate with correct values', () => {
    renderDialog({ filteredEntries: 42 });
    expect(screen.getByTestId('export-estimate')).toHaveTextContent(/42/);
    expect(screen.getByTestId('export-estimate')).toHaveTextContent(/rows/);
  });

  it('shows "Current filter" scope selected by default with filtered count', () => {
    renderDialog({ filteredEntries: 42 });
    expect(screen.getByTestId('export-estimate')).toHaveTextContent(/42/);
  });

  it('shows the large export warning when >10k rows', () => {
    renderDialog({ totalEntries: 50000, filteredEntries: 50000 });
    expect(screen.getByTestId('export-large-warning')).toBeInTheDocument();
  });

  it('shows the large export warning when >5MB', () => {
    renderDialog({ totalEntries: 11000, filteredEntries: 11000 });
    expect(screen.getByTestId('export-large-warning')).toBeInTheDocument();
  });

  it('hides the large export warning for small exports', () => {
    renderDialog({ totalEntries: 100, filteredEntries: 100 });
    expect(screen.queryByTestId('export-large-warning')).not.toBeInTheDocument();
  });
});

/* ─── scope selection ─────────────────────────────────────────────── */

describe('scope selection', () => {
  it('shows date range inputs when "Custom date range" is selected', async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.queryByTestId('esd-date-range')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/custom date range/i));
    expect(screen.getByTestId('esd-date-range')).toBeInTheDocument();
    expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^to$/i)).toBeInTheDocument();
  });

  it('shows actor input when "Per actor" is selected', async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.queryByTestId('esd-actor-field')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/per actor/i));
    expect(screen.getByTestId('esd-actor-field')).toBeInTheDocument();
    expect(screen.getByLabelText(/^actor$/i)).toBeInTheDocument();
  });

  it('hides conditional inputs when switching scope', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByLabelText(/custom date range/i));
    expect(screen.getByTestId('esd-date-range')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/current filter/i));
    expect(screen.queryByTestId('esd-date-range')).not.toBeInTheDocument();
  });

  it('pre-fills actor field from current filter actor', async () => {
    const user = userEvent.setup();
    renderDialog({
      filters: { ...EMPTY_FILTERS, actor: 'maria.chen' },
    });

    await user.click(screen.getByLabelText(/per actor/i));
    expect(screen.getByLabelText(/^actor$/i)).toHaveValue('maria.chen');
  });

  it('updates estimate when scope changes', async () => {
    const user = userEvent.setup();
    renderDialog({ totalEntries: 1000, filteredEntries: 42 });

    // Default: current-filter -> 42 rows
    expect(screen.getByTestId('export-estimate')).toHaveTextContent(/42/);

    // Switch to all-events -> 1000 rows
    await user.click(screen.getByLabelText(/all events/i));
    expect(screen.getByTestId('export-estimate')).toHaveTextContent(/1,000/);
  });
});

/* ─── format selection ────────────────────────────────────────────── */

describe('format selection', () => {
  it('defaults to CSV', () => {
    renderDialog();
    const csvLabel = screen.getByText('CSV').closest('.esd-format-label');
    expect(csvLabel).toHaveClass('esd-format-label--active');
  });

  it('switches to PDF on click', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByText('PDF'));
    const pdfLabel = screen.getByText('PDF').closest('.esd-format-label');
    expect(pdfLabel).toHaveClass('esd-format-label--active');
    const csvLabel = screen.getByText('CSV').closest('.esd-format-label');
    expect(csvLabel).not.toHaveClass('esd-format-label--active');
  });
});

/* ─── export action ───────────────────────────────────────────────── */

describe('export action', () => {
  it('calls onExport with current params when Export is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderDialog({ onExport, filteredEntries: 42 });

    await user.click(screen.getByRole('button', { name: /^export$/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
    const params: ExportParams = onExport.mock.calls[0][0];
    expect(params.scope).toBe('current-filter');
    expect(params.format).toBe('CSV');
    expect(params.dateFrom).toBe('');
    expect(params.dateTo).toBe('');
    expect(params.actor).toBe('');
  });

  it('calls onExport with date range when scope is date-range', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderDialog({ onExport });

    await user.click(screen.getByLabelText(/custom date range/i));
    await user.type(screen.getByLabelText(/^from$/i), '2026-07-01');
    await user.type(screen.getByLabelText(/^to$/i), '2026-07-31');
    await user.click(screen.getByRole('button', { name: /^export$/i }));

    const params: ExportParams = onExport.mock.calls[0][0];
    expect(params.scope).toBe('date-range');
    expect(params.dateFrom).toBe('2026-07-01');
    expect(params.dateTo).toBe('2026-07-31');
  });

  it('calls onExport with actor when scope is per-actor', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderDialog({ onExport });

    await user.click(screen.getByLabelText(/per actor/i));
    await user.type(screen.getByLabelText(/^actor$/i), 'j.okafor');
    await user.click(screen.getByRole('button', { name: /^export$/i }));

    const params: ExportParams = onExport.mock.calls[0][0];
    expect(params.scope).toBe('per-actor');
    expect(params.actor).toBe('j.okafor');
  });

  it('shows progress state after clicking Export', async () => {
    const user = userEvent.setup();
    renderDialog({ filteredEntries: 42 });

    await user.click(screen.getByRole('button', { name: /^export$/i }));

    expect(screen.getByTestId('export-progress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('disables Export button while exporting', async () => {
    const user = userEvent.setup();
    renderDialog();

    const exportBtn = screen.getByRole('button', { name: /^export$/i });
    await user.click(exportBtn);

    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled();
  });
});

/* ─── close behavior ──────────────────────────────────────────────── */

describe('close behavior', () => {
  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.click(screen.getByTestId('export-scope-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on backdrop click when the dialog child is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

/* ─── keyboard / focus management ─────────────────────────────────── */

describe('keyboard and focus', () => {
  it('traps focus with Tab and Shift+Tab', async () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([aria-hidden="true"]), button:not([disabled]):not([aria-hidden="true"])'
      )
    );

    expect(focusables.length).toBeGreaterThan(1);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // Tab from the last element wraps to the first
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    // Shift+Tab from the first element wraps to the last
    first.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});

/* ─── accessibility ───────────────────────────────────────────────── */

describe('accessibility', () => {
  it('has no axe-detectable violations', async () => {
    const { container } = renderDialog();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('uses aria-live for estimate updates', () => {
    renderDialog();
    expect(screen.getByTestId('export-estimate')).toHaveAttribute('aria-live', 'polite');
  });

  it('uses role="alert" for large export warning', () => {
    renderDialog({ totalEntries: 50000, filteredEntries: 50000 });
    expect(screen.getByTestId('export-large-warning')).toHaveAttribute('role', 'alert');
  });

  it('marks Export button as busy while exporting', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /^export$/i }));

    expect(screen.getByRole('button', { name: /exporting/i })).toHaveAttribute('aria-busy', 'true');
  });

  it('has accessible name on the dialog', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/export audit trail/i);
  });

  it('has accessible name on scope radiogroup', () => {
    renderDialog();
    expect(screen.getByRole('radiogroup', { name: /scope/i })).toBeInTheDocument();
  });

  it('has accessible name on format radiogroup', () => {
    renderDialog();
    expect(screen.getByRole('radiogroup', { name: /format/i })).toBeInTheDocument();
  });
});
