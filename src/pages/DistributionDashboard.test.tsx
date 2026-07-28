import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DistributionDashboard } from './DistributionDashboard';

expect.extend(toHaveNoViolations);

describe('DistributionDashboard', () => {
  const renderWithRouter = (initialEntries = ['/distribution-dashboard']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/distribution-dashboard" element={<DistributionDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders distribution dashboard header and KPI summary cards', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { level: 1, name: /distribution dashboard/i })).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-distributed')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-active-payouts')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gas-spent')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-pending-retries')).toBeInTheDocument();
  });

  it('renders payout table with mock rows', () => {
    renderWithRouter();

    expect(screen.getByTestId('payout-table')).toBeInTheDocument();
    expect(screen.getByText('PO-2026-004')).toBeInTheDocument();
    expect(screen.getByText('Nexus Cloud Series A')).toBeInTheDocument();
    expect(screen.getByText('PO-2026-003')).toBeInTheDocument();
    expect(screen.getByText('AeroDynamics AI')).toBeInTheDocument();
  });

  it('filters payout rows when typing into search input', () => {
    renderWithRouter();

    const searchInput = screen.getByTestId('payout-dashboard-search');
    fireEvent.change(searchInput, { target: { value: 'AeroDynamics' } });

    expect(screen.getByText('PO-2026-003')).toBeInTheDocument();
    expect(screen.queryByText('PO-2026-004')).not.toBeInTheDocument();
  });

  it('filters payout rows when selecting status from dropdown', () => {
    renderWithRouter();

    const statusFilter = screen.getByTestId('payout-status-filter');
    fireEvent.change(statusFilter, { target: { value: 'failed' } });

    expect(screen.getByText('PO-2026-003')).toBeInTheDocument();
    expect(screen.queryByText('PO-2026-004')).not.toBeInTheDocument();
  });

  it('clears filters when clicking clear filters button in empty filter state', () => {
    renderWithRouter();

    const searchInput = screen.getByTestId('payout-dashboard-search');
    fireEvent.change(searchInput, { target: { value: 'NonExistentPayout' } });

    expect(screen.getByText('No payouts match your search or filter criteria.')).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect(screen.getByTestId('payout-table')).toBeInTheDocument();
  });

  it('opens drill-down side panel when clicking inspect details button on a payout row', () => {
    renderWithRouter();

    expect(screen.queryByTestId('payout-panel')).not.toBeInTheDocument();

    const inspectBtn = screen.getByTestId('inspect-payout-btn-PO-2026-004');
    fireEvent.click(inspectBtn);

    expect(screen.getByTestId('payout-panel')).toBeInTheDocument();
    expect(screen.getByText('Payout #PO-2026-004')).toBeInTheDocument();
  });

  it('opens drill-down side panel when URL contains payoutId query param', () => {
    renderWithRouter(['/distribution-dashboard?payoutId=PO-2026-004']);

    expect(screen.getByTestId('payout-panel')).toBeInTheDocument();
    expect(screen.getByText('Payout #PO-2026-004')).toBeInTheDocument();
  });

  it('closes drill-down panel when close button inside panel is clicked', () => {
    renderWithRouter(['/distribution-dashboard?payoutId=PO-2026-004']);

    expect(screen.getByTestId('payout-panel')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('payout-panel-close-btn');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('payout-panel')).not.toBeInTheDocument();
  });

  it('triggers batch retry from panel for a failed payout', async () => {
    renderWithRouter(['/distribution-dashboard?payoutId=PO-2026-003']);

    fireEvent.click(screen.getByRole('tab', { name: /retry history/i }));
    const retryBtn = screen.getByTestId('payout-retry-batch-btn');

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    expect(screen.getByText(/Ops staff triggered retry dispatch/i)).toBeInTheDocument();
  });

  it('triggers CSV export from panel for a payout', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    renderWithRouter(['/distribution-dashboard?payoutId=PO-2026-004']);

    const exportBtn = screen.getByTestId('payout-export-csv-btn');
    fireEvent.click(exportBtn);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    createElementSpy.mockRestore();
  });

  it('passes axe accessibility checks with 0 violations', async () => {
    const { container } = renderWithRouter();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
