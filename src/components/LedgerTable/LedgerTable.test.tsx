import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import LedgerTable from './LedgerTable';
import type { Column } from './LedgerTable';

interface TestRow {
  id: number;
  name: string;
  value: number;
}

const columns: Column<TestRow>[] = [
  { key: 'id', label: 'ID', render: (r) => r.id },
  { key: 'name', label: 'Name', render: (r) => r.name },
  { key: 'value', label: 'Value', render: (r) => r.value },
];

const data: TestRow[] = [
  { id: 1, name: 'Alpha', value: 100 },
  { id: 2, name: 'Beta', value: 200 },
  { id: 3, name: 'Gamma', value: 300 },
];

describe('LedgerTable', () => {
  it('renders table with data', () => {
    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        ariaLabel="Test table"
      />,
    );

    expect(screen.getByRole('grid', { name: 'Test table' })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument();
  });

  it('shows row count', () => {
    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );

    expect(screen.getByText('3 rows')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <LedgerTable
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );

    expect(screen.getByText('No data to display.')).toBeInTheDocument();
  });

  it('shows empty state when no columns', () => {
    render(
      <LedgerTable
        data={data}
        columns={[]}
        rowKey={(r) => r.id}
      />,
    );

    expect(screen.getByText('No columns defined.')).toBeInTheDocument();
  });

  it('toggles column visibility', async () => {
    const user = userEvent.setup();
    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );

    const columnsBtn = screen.getByLabelText('Column visibility');
    await user.click(columnsBtn);

    // The column menu items are <label role="menuitemcheckbox"> containing <input>
    const menuItems = screen.getAllByRole('menuitemcheckbox');
    const idItem = menuItems.find((el) => el.textContent?.includes('ID'))!;
    await user.click(idItem);

    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();
  });

  it('does not allow hiding the last column', async () => {
    const user = userEvent.setup();
    render(
      <LedgerTable
        data={data}
        columns={[{ key: 'id', label: 'ID', render: (r) => r.id }]}
        rowKey={(r) => r.id}
      />,
    );

    const columnsBtn = screen.getByLabelText('Column visibility');
    await user.click(columnsBtn);

    // The disabled state lives on the <input> inside the menuitemcheckbox label
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('cycles density on button click', async () => {
    const user = userEvent.setup();
    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        defaultDensity="cozy"
      />,
    );

    const densityBtn = screen.getByLabelText(/Density/);
    expect(densityBtn).toHaveTextContent('cozy');

    await user.click(densityBtn);
    // cozy → compact
    expect(densityBtn).toHaveTextContent('compact');
  });

  it('handles keyboard navigation', () => {
    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
      />,
    );

    const grid = screen.getByRole('grid');
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'ArrowUp' });

    expect(grid).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const manyRows = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1,
      name: `Row ${i + 1}`,
      value: (i + 1) * 10,
    }));

    render(
      <LedgerTable
        data={manyRows}
        columns={columns}
        rowKey={(r) => r.id}
        pageSize={50}
      />,
    );

    expect(screen.getByText('60 rows')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    const nextBtn = screen.getByLabelText('Next page');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('opens and closes row detail', async () => {
    const user = userEvent.setup();
    const DetailComponent = ({ row }: { row: TestRow }) => (
      <div data-testid="detail-content">{row.name} detail</div>
    );

    render(
      <LedgerTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        rowDetail={(row) => <DetailComponent row={row} />}
      />,
    );

    const toggleButtons = screen.getAllByLabelText('Open detail');
    await user.click(toggleButtons[0]);

    expect(screen.getByTestId('detail-content')).toBeInTheDocument();
    expect(screen.getByText('Alpha detail')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close detail');
    await user.click(closeButton);

    expect(screen.queryByTestId('detail-content')).not.toBeInTheDocument();
  });

  describe('Virtualized Cell Focus Outlines', () => {
    it('renders floating focus ring overlay on row navigation', () => {
      render(
        <LedgerTable
          data={data}
          columns={columns}
          rowKey={(r) => r.id}
        />,
      );

      const grid = screen.getByRole('grid');
      expect(screen.queryByTestId('focus-ring-overlay')).not.toBeInTheDocument();

      fireEvent.keyDown(grid, { key: 'ArrowDown' });

      const focusOverlay = screen.getByTestId('focus-ring-overlay');
      expect(focusOverlay).toBeInTheDocument();
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--row');
      expect(focusOverlay).toHaveAttribute('aria-hidden', 'true');
      expect(focusOverlay).toHaveAttribute('role', 'presentation');
    });

    it('navigates cell focus with ArrowRight and ArrowLeft keys', () => {
      render(
        <LedgerTable
          data={data}
          columns={columns}
          rowKey={(r) => r.id}
        />,
      );

      const grid = screen.getByRole('grid');
      fireEvent.keyDown(grid, { key: 'ArrowDown' });
      fireEvent.keyDown(grid, { key: 'ArrowRight' });

      const focusOverlay = screen.getByTestId('focus-ring-overlay');
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--cell');

      fireEvent.keyDown(grid, { key: 'ArrowLeft' });
      fireEvent.keyDown(grid, { key: 'ArrowLeft' }); // back to row focus (-1)
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--row');
    });

    it('supports Home and End key navigation for cells', () => {
      render(
        <LedgerTable
          data={data}
          columns={columns}
          rowKey={(r) => r.id}
        />,
      );

      const grid = screen.getByRole('grid');
      fireEvent.keyDown(grid, { key: 'ArrowDown' });
      fireEvent.keyDown(grid, { key: 'End' });

      const focusOverlay = screen.getByTestId('focus-ring-overlay');
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--cell');

      fireEvent.keyDown(grid, { key: 'Home' });
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--cell');
    });

    it('focuses cell on cell click', async () => {
      render(
        <LedgerTable
          data={data}
          columns={columns}
          rowKey={(r) => r.id}
        />,
      );

      const cell = screen.getByText('Beta');
      fireEvent.click(cell);

      const focusOverlay = screen.getByTestId('focus-ring-overlay');
      expect(focusOverlay).toBeInTheDocument();
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--cell');
    });

    it('maintains focus overlay positioning during container scroll', () => {
      const manyRows = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: i * 5,
      }));

      render(
        <LedgerTable
          data={manyRows}
          columns={columns}
          rowKey={(r) => r.id}
          pageSize={100}
        />,
      );

      const grid = screen.getByRole('grid');
      fireEvent.keyDown(grid, { key: 'ArrowDown' }); // focus row 0
      fireEvent.keyDown(grid, { key: 'ArrowDown' }); // focus row 1

      const focusOverlay = screen.getByTestId('focus-ring-overlay');
      expect(focusOverlay).toBeInTheDocument();

      // Trigger scroll event on container wrapper
      fireEvent.scroll(grid, { target: { scrollTop: 120 } });
      expect(screen.getByTestId('focus-ring-overlay')).toBeInTheDocument();
    });

    it('handles RTL direction key navigation', () => {
      // Mock RTL direction on container
      const { container } = render(
        <div dir="rtl">
          <LedgerTable
            data={data}
            columns={columns}
            rowKey={(r) => r.id}
          />
        </div>,
      );

      const grid = screen.getByRole('grid');
      fireEvent.keyDown(grid, { key: 'ArrowDown' });
      
      // In RTL, ArrowLeft increases column index (moves right to next column)
      fireEvent.keyDown(grid, { key: 'ArrowLeft' });
      const focusOverlay = screen.getByTestId('focus-ring-overlay');
      expect(focusOverlay).toHaveClass('lt-focus-ring-overlay--cell');
    });
  });
});
