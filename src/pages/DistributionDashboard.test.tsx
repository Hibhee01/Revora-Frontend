import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders distribution dashboard header, filter toolbar, and KPI summary cards', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { level: 1, name: /distribution dashboard/i })).toBeInTheDocument();
    expect(screen.getByTestId('distribution-filter-toolbar')).toBeInTheDocument();
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
    expect(screen.getByText('North America')).toBeInTheDocument();
    expect(screen.getByText('PO-2026-003')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
  });

  it('filters payout rows when typing into toolbar search input', () => {
    renderWithRouter();

    const searchInput = screen.getByTestId('filter-search-input');
    fireEvent.change(searchInput, { target: { value: 'AeroDynamics' } });

    expect(screen.getByText('PO-2026-003')).toBeInTheDocument();
    expect(screen.queryByText('PO-2026-004')).not.toBeInTheDocument();
  });

  it('renders segmented comparison view when Compare Mode toggle is activated', () => {
    renderWithRouter();

    expect(screen.queryByTestId('segmented-compare-container')).not.toBeInTheDocument();

    const compareToggle = screen.getByTestId('filter-compare-toggle');
    fireEvent.click(compareToggle);

    expect(screen.getByTestId('segmented-compare-container')).toBeInTheDocument();
  });

  it('renders segmented comparison cards when segmentBy is selected', () => {
    renderWithRouter();

    const segmentSelect = screen.getByTestId('filter-segment-select');
    fireEvent.change(segmentSelect, { target: { value: 'region' } });

    expect(screen.getByTestId('segmented-compare-container')).toBeInTheDocument();
    expect(screen.getByTestId('segmented-card-North America')).toBeInTheDocument();
    expect(screen.getByTestId('segmented-card-Europe')).toBeInTheDocument();
  });

  it('clears filters when clicking clear all filters button in empty results view', () => {
    renderWithRouter();

    const searchInput = screen.getByTestId('filter-search-input');
    fireEvent.change(searchInput, { target: { value: 'NonExistentPayout' } });

    expect(screen.getByText('No payouts match your search or active filter criteria.')).toBeInTheDocument();

    const resetBtn = screen.getByTestId('empty-reset-filters-btn');
    fireEvent.click(resetBtn);

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
