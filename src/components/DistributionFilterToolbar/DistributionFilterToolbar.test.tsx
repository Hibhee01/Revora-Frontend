import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DistributionFilterToolbar } from './DistributionFilterToolbar';
import { DistributionFilterState } from './DistributionFilterToolbar.types';

expect.extend(toHaveNoViolations);

const defaultFilterState: DistributionFilterState = {
  searchQuery: '',
  dateRange: 'all',
  issuer: 'all',
  region: 'all',
  status: 'all',
  segmentBy: 'none',
  compareMode: false,
};

describe('DistributionFilterToolbar', () => {
  const defaultProps = {
    filters: defaultFilterState,
    onFilterChange: vi.fn(),
    onResetFilters: vi.fn(),
    onSavePreset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders toolbar elements correctly', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    expect(screen.getByTestId('distribution-filter-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('filter-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('filter-trigger-date')).toBeInTheDocument();
    expect(screen.getByTestId('filter-trigger-issuer')).toBeInTheDocument();
    expect(screen.getByTestId('filter-trigger-region')).toBeInTheDocument();
    expect(screen.getByTestId('filter-trigger-status')).toBeInTheDocument();
    expect(screen.getByTestId('filter-segment-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-compare-toggle')).toBeInTheDocument();
  });

  it('calls onFilterChange when typing into search input', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const searchInput = screen.getByTestId('filter-search-input');
    fireEvent.change(searchInput, { target: { value: 'Nexus' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      searchQuery: 'Nexus',
    });
  });

  it('opens date range popover and selects custom range with start and end dates', () => {
    const customState: DistributionFilterState = {
      ...defaultFilterState,
      dateRange: 'custom',
    };

    render(<DistributionFilterToolbar {...defaultProps} filters={customState} />);

    const dateTrigger = screen.getByTestId('filter-trigger-date');
    fireEvent.click(dateTrigger);

    const startDateInput = screen.getByLabelText('Start date');
    fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...customState,
      customStartDate: '2026-01-01',
    });

    const endDateInput = screen.getByLabelText('End date');
    fireEvent.change(endDateInput, { target: { value: '2026-06-30' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...customState,
      customEndDate: '2026-06-30',
    });
  });

  it('opens issuer popover and selects issuer option', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const issuerTrigger = screen.getByTestId('filter-trigger-issuer');
    fireEvent.click(issuerTrigger);

    const nexusOption = screen.getByRole('button', { name: /nexus cloud series a/i });
    fireEvent.click(nexusOption);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      issuer: 'Nexus Cloud Series A',
    });
  });

  it('opens region popover and selects region option', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const regionTrigger = screen.getByTestId('filter-trigger-region');
    fireEvent.click(regionTrigger);

    const naOption = screen.getByRole('button', { name: /north america/i });
    fireEvent.click(naOption);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      region: 'North America',
    });
  });

  it('opens status popover and selects status option', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const statusTrigger = screen.getByTestId('filter-trigger-status');
    fireEvent.click(statusTrigger);

    const failedOption = screen.getByRole('button', { name: /failed/i });
    fireEvent.click(failedOption);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      status: 'failed',
    });
  });

  it('changes segmentation group selection', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const segmentSelect = screen.getByTestId('filter-segment-select');
    fireEvent.change(segmentSelect, { target: { value: 'region' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      segmentBy: 'region',
    });
  });

  it('toggles compare mode checkbox', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const compareToggle = screen.getByTestId('filter-compare-toggle');
    fireEvent.click(compareToggle);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      compareMode: true,
    });
  });

  it('renders active filter pills and removes individual filters on close click', () => {
    const activeState: DistributionFilterState = {
      searchQuery: 'Nexus',
      dateRange: '90d',
      issuer: 'Nexus Cloud Series A',
      region: 'North America',
      status: 'failed',
      segmentBy: 'region',
      compareMode: true,
    };

    render(<DistributionFilterToolbar {...defaultProps} filters={activeState} />);

    expect(screen.getByTestId('active-filter-pills-row')).toBeInTheDocument();

    // Remove search pill
    fireEvent.click(screen.getByRole('button', { name: /remove search filter/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, searchQuery: '' });

    // Remove date pill
    fireEvent.click(screen.getByRole('button', { name: /remove date range filter/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, dateRange: 'all' });

    // Remove issuer pill
    fireEvent.click(screen.getByRole('button', { name: /remove issuer filter/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, issuer: 'all' });

    // Remove region pill
    fireEvent.click(screen.getByRole('button', { name: /remove region filter/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, region: 'all' });

    // Remove status pill
    fireEvent.click(screen.getByRole('button', { name: /remove status filter/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, status: 'all' });

    // Remove segment pill
    fireEvent.click(screen.getByRole('button', { name: /remove segmentation/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, segmentBy: 'none' });

    // Remove compare pill
    fireEvent.click(screen.getByRole('button', { name: /turn off compare mode/i }));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ ...activeState, compareMode: false });
  });

  it('calls onResetFilters when Clear All button is clicked', () => {
    const activeState: DistributionFilterState = {
      ...defaultFilterState,
      status: 'failed',
    };

    render(<DistributionFilterToolbar {...defaultProps} filters={activeState} />);

    const clearAllBtn = screen.getByTestId('filter-clear-all-btn');
    fireEvent.click(clearAllBtn);

    expect(defaultProps.onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('saves current filter preset and applies a preset from dropdown', () => {
    const activeState: DistributionFilterState = {
      ...defaultFilterState,
      region: 'Europe',
    };

    render(<DistributionFilterToolbar {...defaultProps} filters={activeState} />);

    const presetsBtn = screen.getByTestId('filter-presets-trigger');
    fireEvent.click(presetsBtn);

    // Apply default preset Q3 Failed Batches
    const presetOption = screen.getByTestId('preset-option-preset-q3-failed');
    fireEvent.click(presetOption);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      ...activeState,
      status: 'failed',
      dateRange: '90d',
    });

    // Save new preset
    fireEvent.click(presetsBtn);
    const presetInput = screen.getByTestId('preset-name-input');
    fireEvent.change(presetInput, { target: { value: 'Europe Region Preset' } });

    const saveBtn = screen.getByTestId('save-preset-btn');
    fireEvent.click(saveBtn);

    expect(defaultProps.onSavePreset).toHaveBeenCalledWith('Europe Region Preset', activeState);
  });

  it('interacts with mobile filter sheet drawer inputs and actions', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const mobileTrigger = screen.getByTestId('mobile-filter-trigger');
    fireEvent.click(mobileTrigger);

    expect(screen.getByTestId('mobile-filter-sheet')).toBeInTheDocument();

    const mobileSheet = screen.getByTestId('mobile-filter-sheet');
    const searchInput = mobileSheet.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'MobileQuery' } });

    const selects = mobileSheet.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: '30d' } }); // dateRange
    fireEvent.change(selects[1], { target: { value: 'Nexus Cloud Series A' } }); // issuer
    fireEvent.change(selects[2], { target: { value: 'Europe' } }); // region
    fireEvent.change(selects[3], { target: { value: 'failed' } }); // status
    fireEvent.change(selects[4], { target: { value: 'tier' } }); // segmentBy

    const compareCheckbox = mobileSheet.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(compareCheckbox);

    // Reset button inside mobile sheet
    const resetBtn = screen.getByRole('button', { name: /reset all/i });
    fireEvent.click(resetBtn);

    expect(defaultProps.onResetFilters).toHaveBeenCalled();
  });

  it('closes mobile sheet when overlay backdrop is clicked', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const mobileTrigger = screen.getByTestId('mobile-filter-trigger');
    fireEvent.click(mobileTrigger);

    const overlay = screen.getByTestId('mobile-sheet-overlay');
    fireEvent.click(overlay);

    expect(screen.queryByTestId('mobile-filter-sheet')).not.toBeInTheDocument();
  });

  it('closes popovers when clicking outside', () => {
    render(<DistributionFilterToolbar {...defaultProps} />);

    const dateTrigger = screen.getByTestId('filter-trigger-date');
    fireEvent.click(dateTrigger);

    expect(screen.getByRole('dialog', { name: /date range options/i })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('dialog', { name: /date range options/i })).not.toBeInTheDocument();
  });

  it('passes axe accessibility audit with 0 violations', async () => {
    const { container } = render(<DistributionFilterToolbar {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
