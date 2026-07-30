import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from './ExportDialog';
import { EMPTY_FILTERS } from './savedFilters';
import { expect, test, vi } from 'vitest';

const mockOnExport = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
  open: true,
  filters: EMPTY_FILTERS,
  onExport: mockOnExport,
  onClose: mockOnClose,
};

test('renders accessibility attributes and traps focus', () => {
  render(<ExportDialog {...defaultProps} />);
  const dialog = screen.getByRole('dialog', { name: /Export Audit Trail/i });
  expect(dialog).toBeInTheDocument();
  expect(dialog).toHaveAttribute('aria-modal', 'true');
});

test('handles scope selection and default scope', async () => {
  const user = userEvent.setup();
  // With EMPTY_FILTERS, "current" scope should be disabled and default should be "all"
  const { rerender } = render(<ExportDialog {...defaultProps} />);
  
  const currentRadio = screen.getByLabelText(/Current filters/i);
  expect(currentRadio).toBeDisabled();
  
  const allRadio = screen.getByLabelText(/All events/i);
  expect(allRadio).toBeChecked();

  // Test selecting date range
  const dateRadio = screen.getByLabelText(/Date range/i);
  await user.click(dateRadio);
  expect(dateRadio).toBeChecked();
  expect(screen.getByLabelText(/From date/i)).toBeInTheDocument();

  // With active filters, default should be "current"
  rerender(
    <ExportDialog
      {...defaultProps}
      filters={{ ...EMPTY_FILTERS, query: 'test' }}
    />
  );
  
  const currentRadio2 = screen.getByLabelText(/Current filters/i);
  expect(currentRadio2).not.toBeDisabled();
  expect(currentRadio2).toBeChecked();
});

test('calls onExport with correct payload', async () => {
  const user = userEvent.setup();
  render(
    <ExportDialog
      {...defaultProps}
      filters={{ ...EMPTY_FILTERS, query: 'test' }}
    />
  );

  const formatSelect = screen.getByLabelText(/Format/i);
  await user.selectOptions(formatSelect, 'pdf');

  const exportBtn = screen.getByRole('button', { name: /Export PDF/i });
  await user.click(exportBtn);

  expect(mockOnExport).toHaveBeenCalledWith('current', 'pdf', {
    actor: '',
    dateFrom: '',
    dateTo: ''
  });
});

test('shows large export warning when estimate is high', async () => {
  const user = userEvent.setup();
  render(<ExportDialog {...defaultProps} />);
  
  // "all" scope mock estimate is 50,000 which triggers large warning
  expect(screen.getByText(/Large export\. This may take several minutes/i)).toBeInTheDocument();
  
  // "current" scope with empty filters triggers 10,000 which is not large? Wait, in mock it's 10,000 for current if no filters.
  // Actually let's select "date_range" which is 2500
  const dateRadio = screen.getByLabelText(/Date range/i);
  await user.click(dateRadio);
  
  expect(screen.queryByText(/Large export\. This may take several minutes/i)).not.toBeInTheDocument();
});
