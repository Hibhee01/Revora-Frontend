import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './DistributionFilterToolbar.css';
import {
  DistributionFilterState,
  DateRangeOption,
  SegmentOption,
  FilterPreset,
  DistributionFilterToolbarProps,
} from './DistributionFilterToolbar.types';

const STORAGE_KEY_PRESETS = 'revora_distribution_saved_filters';

const DEFAULT_ISSUERS = ['All Issuers', 'Nexus Cloud Series A', 'AeroDynamics AI', 'BioHealth Tech'];
const DEFAULT_REGIONS = ['All Regions', 'Global', 'North America', 'Europe', 'Asia Pacific', 'LATAM'];
const DEFAULT_STATUSES = ['All Statuses', 'completed', 'processing', 'failed', 'scheduled'];

const PRESET_DEFAULTS: FilterPreset[] = [
  {
    id: 'preset-q3-failed',
    name: 'Q3 Failed Batches',
    filterState: {
      status: 'failed',
      dateRange: '90d',
    },
  },
  {
    id: 'preset-na-inst',
    name: 'North America Institutional',
    filterState: {
      region: 'North America',
      segmentBy: 'tier',
    },
  },
];

export const DistributionFilterToolbar: React.FC<DistributionFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  issuerOptions = DEFAULT_ISSUERS,
  regionOptions = DEFAULT_REGIONS,
  statusOptions = DEFAULT_STATUSES,
  savedPresets,
  onSavePreset,
}) => {
  const [openPopover, setOpenPopover] = useState<'date' | 'issuer' | 'region' | 'status' | 'presets' | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [presetInputName, setPresetInputName] = useState('');
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>(() => {
    if (savedPresets) return savedPresets;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore storage errors
    }
    return PRESET_DEFAULTS;
  });

  const toolbarRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPopover(null);
        setIsMobileSheetOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update a single filter field
  const updateFilter = useCallback(
    <K extends keyof DistributionFilterState>(key: K, value: DistributionFilterState[K]) => {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFilterChange]
  );

  // Count active filters (excluding default values)
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.issuer !== 'all' && filters.issuer !== 'All Issuers') count++;
    if (filters.region !== 'all' && filters.region !== 'All Regions') count++;
    if (filters.status !== 'all' && filters.status !== 'All Statuses') count++;
    if (filters.segmentBy !== 'none') count++;
    if (filters.compareMode) count++;
    return count;
  }, [filters]);

  // Handle saving a preset
  const handleSavePreset = () => {
    if (!presetInputName.trim()) return;
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetInputName.trim(),
      filterState: { ...filters },
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
    } catch {
      // Ignore write error
    }
    if (onSavePreset) {
      onSavePreset(presetInputName.trim(), filters);
    }
    setPresetInputName('');
    setOpenPopover(null);
  };

  // Load a preset
  const handleApplyPreset = (preset: FilterPreset) => {
    onFilterChange({
      ...filters,
      ...preset.filterState,
    });
    setOpenPopover(null);
    setIsMobileSheetOpen(false);
  };

  return (
    <div
      ref={toolbarRef}
      className="distribution-filter-toolbar"
      role="toolbar"
      aria-label="Distribution filters and segmentation"
      data-testid="distribution-filter-toolbar"
    >
      {/* Mobile Collapsible Button (< 768px) */}
      <button
        type="button"
        className="mobile-filter-trigger"
        onClick={() => setIsMobileSheetOpen(true)}
        aria-expanded={isMobileSheetOpen}
        aria-controls="mobile-filter-sheet"
        data-testid="mobile-filter-trigger"
      >
        <span>🔍 Filters & Segmentation</span>
        {activeCount > 0 && (
          <span className="mobile-filter-badge" data-testid="mobile-filter-badge">
            {activeCount} active
          </span>
        )}
      </button>

      {/* Desktop Toolbar Row (>= 768px) */}
      <div className="desktop-filter-toolbar flex flex-col gap-4">
        <div className="filter-toolbar-main-row">
          <div className="filter-controls-group">
            {/* Search Bar */}
            <div className="filter-search-input-wrap">
              <span className="filter-search-icon">🔍</span>
              <input
                type="search"
                className="filter-search-input"
                placeholder="Search ID, offering, address..."
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                aria-label="Search distribution history"
                data-testid="filter-search-input"
              />
            </div>

            {/* Date Range Popover */}
            <div className="filter-popover-wrap">
              <button
                type="button"
                className={`filter-popover-trigger ${filters.dateRange !== 'all' ? 'is-active' : ''} ${
                  openPopover === 'date' ? 'is-open' : ''
                }`}
                onClick={() => setOpenPopover(openPopover === 'date' ? null : 'date')}
                aria-expanded={openPopover === 'date'}
                aria-haspopup="dialog"
                data-testid="filter-trigger-date"
              >
                📅 Date: {filters.dateRange.toUpperCase()}
                <span className="text-xs">▼</span>
              </button>

              {openPopover === 'date' && (
                <div className="filter-popover-panel" role="dialog" aria-label="Date range options">
                  {(['all', '30d', '90d', 'ytd', 'custom'] as DateRangeOption[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`filter-popover-option ${filters.dateRange === opt ? 'is-selected' : ''}`}
                      onClick={() => {
                        updateFilter('dateRange', opt);
                        if (opt !== 'custom') setOpenPopover(null);
                      }}
                    >
                      <span>
                        {opt === 'all'
                          ? 'All Time'
                          : opt === '30d'
                          ? 'Last 30 Days'
                          : opt === '90d'
                          ? 'Last 90 Days'
                          : opt === 'ytd'
                          ? 'Year to Date'
                          : 'Custom Range'}
                      </span>
                      {filters.dateRange === opt && <span>✓</span>}
                    </button>
                  ))}

                  {filters.dateRange === 'custom' && (
                    <div className="filter-date-custom-group">
                      <input
                        type="date"
                        className="filter-date-input"
                        value={filters.customStartDate || ''}
                        onChange={(e) => updateFilter('customStartDate', e.target.value)}
                        aria-label="Start date"
                      />
                      <input
                        type="date"
                        className="filter-date-input"
                        value={filters.customEndDate || ''}
                        onChange={(e) => updateFilter('customEndDate', e.target.value)}
                        aria-label="End date"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Issuer Popover */}
            <div className="filter-popover-wrap">
              <button
                type="button"
                className={`filter-popover-trigger ${
                  filters.issuer !== 'all' && filters.issuer !== 'All Issuers' ? 'is-active' : ''
                } ${openPopover === 'issuer' ? 'is-open' : ''}`}
                onClick={() => setOpenPopover(openPopover === 'issuer' ? null : 'issuer')}
                aria-expanded={openPopover === 'issuer'}
                aria-haspopup="dialog"
                data-testid="filter-trigger-issuer"
              >
                🏢 Issuer: {filters.issuer === 'all' ? 'All' : filters.issuer}
                <span className="text-xs">▼</span>
              </button>

              {openPopover === 'issuer' && (
                <div className="filter-popover-panel" role="dialog" aria-label="Issuer options">
                  {issuerOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`filter-popover-option ${
                        filters.issuer === opt || (opt === 'All Issuers' && filters.issuer === 'all')
                          ? 'is-selected'
                          : ''
                      }`}
                      onClick={() => {
                        updateFilter('issuer', opt === 'All Issuers' ? 'all' : opt);
                        setOpenPopover(null);
                      }}
                    >
                      <span>{opt}</span>
                      {(filters.issuer === opt || (opt === 'All Issuers' && filters.issuer === 'all')) && (
                        <span>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Region Popover */}
            <div className="filter-popover-wrap">
              <button
                type="button"
                className={`filter-popover-trigger ${
                  filters.region !== 'all' && filters.region !== 'All Regions' ? 'is-active' : ''
                } ${openPopover === 'region' ? 'is-open' : ''}`}
                onClick={() => setOpenPopover(openPopover === 'region' ? null : 'region')}
                aria-expanded={openPopover === 'region'}
                aria-haspopup="dialog"
                data-testid="filter-trigger-region"
              >
                🌍 Region: {filters.region === 'all' ? 'All' : filters.region}
                <span className="text-xs">▼</span>
              </button>

              {openPopover === 'region' && (
                <div className="filter-popover-panel" role="dialog" aria-label="Region options">
                  {regionOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`filter-popover-option ${
                        filters.region === opt || (opt === 'All Regions' && filters.region === 'all')
                          ? 'is-selected'
                          : ''
                      }`}
                      onClick={() => {
                        updateFilter('region', opt === 'All Regions' ? 'all' : opt);
                        setOpenPopover(null);
                      }}
                    >
                      <span>{opt}</span>
                      {(filters.region === opt || (opt === 'All Regions' && filters.region === 'all')) && (
                        <span>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Popover */}
            <div className="filter-popover-wrap">
              <button
                type="button"
                className={`filter-popover-trigger ${
                  filters.status !== 'all' && filters.status !== 'All Statuses' ? 'is-active' : ''
                } ${openPopover === 'status' ? 'is-open' : ''}`}
                onClick={() => setOpenPopover(openPopover === 'status' ? null : 'status')}
                aria-expanded={openPopover === 'status'}
                aria-haspopup="dialog"
                data-testid="filter-trigger-status"
              >
                ⚡ Status: {filters.status === 'all' ? 'All' : filters.status}
                <span className="text-xs">▼</span>
              </button>

              {openPopover === 'status' && (
                <div className="filter-popover-panel" role="dialog" aria-label="Status options">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`filter-popover-option ${
                        filters.status === opt || (opt === 'All Statuses' && filters.status === 'all')
                          ? 'is-selected'
                          : ''
                      }`}
                      onClick={() => {
                        updateFilter('status', opt === 'All Statuses' ? 'all' : opt);
                        setOpenPopover(null);
                      }}
                    >
                      <span>{opt}</span>
                      {(filters.status === opt || (opt === 'All Statuses' && filters.status === 'all')) && (
                        <span>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Segmentation & Compare Mode Section */}
          <div className="filter-segment-group">
            <div className="flex items-center gap-2">
              <label htmlFor="segment-by-select" className="text-xs text-muted font-medium">
                Segment:
              </label>
              <select
                id="segment-by-select"
                className="filter-select"
                value={filters.segmentBy}
                onChange={(e) => updateFilter('segmentBy', e.target.value as SegmentOption)}
                aria-label="Segment metrics by group"
                data-testid="filter-segment-select"
              >
                <option value="none">None</option>
                <option value="region">By Region</option>
                <option value="offering">By Issuer / Offering</option>
                <option value="status">By Execution Status</option>
                <option value="tier">By Investor Tier</option>
              </select>
            </div>

            <label className="compare-toggle-label" data-testid="compare-toggle-label">
              <input
                type="checkbox"
                className="compare-toggle-checkbox"
                checked={filters.compareMode}
                onChange={(e) => updateFilter('compareMode', e.target.checked)}
                aria-label="Toggle compare mode"
                data-testid="filter-compare-toggle"
              />
              <span>Compare</span>
            </label>
          </div>
        </div>

        {/* Row 2: Active Filter Pills & Preset Shortcuts */}
        {activeCount > 0 && (
          <div className="filter-active-pills-row" data-testid="active-filter-pills-row">
            <div className="active-pills-list">
              <span className="text-xs text-muted font-semibold">Active:</span>

              {filters.searchQuery.trim() && (
                <span className="filter-pill" data-testid="pill-search">
                  Search: "{filters.searchQuery}"
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('searchQuery', '')}
                    aria-label="Remove search filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.dateRange !== 'all' && (
                <span className="filter-pill" data-testid="pill-date">
                  Date: {filters.dateRange}
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('dateRange', 'all')}
                    aria-label="Remove date range filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.issuer !== 'all' && filters.issuer !== 'All Issuers' && (
                <span className="filter-pill" data-testid="pill-issuer">
                  Issuer: {filters.issuer}
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('issuer', 'all')}
                    aria-label="Remove issuer filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.region !== 'all' && filters.region !== 'All Regions' && (
                <span className="filter-pill" data-testid="pill-region">
                  Region: {filters.region}
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('region', 'all')}
                    aria-label="Remove region filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.status !== 'all' && filters.status !== 'All Statuses' && (
                <span className="filter-pill" data-testid="pill-status">
                  Status: {filters.status}
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('status', 'all')}
                    aria-label="Remove status filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.segmentBy !== 'none' && (
                <span className="filter-pill" data-testid="pill-segment">
                  Segment: {filters.segmentBy}
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('segmentBy', 'none')}
                    aria-label="Remove segmentation"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.compareMode && (
                <span className="filter-pill" data-testid="pill-compare">
                  Compare: On
                  <button
                    type="button"
                    className="filter-pill-close"
                    onClick={() => updateFilter('compareMode', false)}
                    aria-label="Turn off compare mode"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                className="filter-clear-all-btn"
                onClick={onResetFilters}
                data-testid="filter-clear-all-btn"
              >
                Clear All
              </button>
            </div>

            {/* Presets Shortcuts */}
            <div className="filter-presets-group">
              <div className="filter-popover-wrap">
                <button
                  type="button"
                  className="filter-save-preset-btn"
                  onClick={() => setOpenPopover(openPopover === 'presets' ? null : 'presets')}
                  data-testid="filter-presets-trigger"
                >
                  ⭐ Presets ({customPresets.length})
                </button>

                {openPopover === 'presets' && (
                  <div
                    className="filter-popover-panel"
                    style={{ right: 0, left: 'auto', width: '280px' }}
                    role="dialog"
                    aria-label="Filter presets"
                  >
                    <div className="text-xs text-muted font-semibold p-1">Saved Presets</div>
                    {customPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="filter-popover-option"
                        onClick={() => handleApplyPreset(preset)}
                        data-testid={`preset-option-${preset.id}`}
                      >
                        <span>{preset.name}</span>
                        <span className="text-xs text-primary">Apply ↗</span>
                      </button>
                    ))}

                    <div className="border-t border-slate-800 pt-2 mt-1 flex flex-col gap-2 p-1">
                      <input
                        type="text"
                        className="filter-search-input"
                        placeholder="New preset name..."
                        value={presetInputName}
                        onChange={(e) => setPresetInputName(e.target.value)}
                        data-testid="preset-name-input"
                      />
                      <button
                        type="button"
                        className="payout-btn-primary text-xs py-1"
                        onClick={handleSavePreset}
                        data-testid="save-preset-btn"
                      >
                        Save Current Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filter Sheet Drawer (< 768px) */}
      {isMobileSheetOpen && (
        <>
          <div
            className="mobile-filter-sheet-overlay"
            onClick={() => setIsMobileSheetOpen(false)}
            aria-hidden="true"
            data-testid="mobile-sheet-overlay"
          />
          <div
            ref={mobileSheetRef}
            id="mobile-filter-sheet"
            className="mobile-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile filter options"
            data-testid="mobile-filter-sheet"
          >
            <div className="mobile-sheet-header">
              <h3>Filters & Segmentation</h3>
              <button
                type="button"
                className="payout-icon-btn"
                onClick={() => setIsMobileSheetOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className="mobile-sheet-section">
              <label>Search Query</label>
              <input
                type="search"
                className="filter-search-input"
                placeholder="Search ID or offering..."
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
              />
            </div>

            <div className="mobile-sheet-section">
              <label>Date Range</label>
              <select
                className="filter-select"
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value as DateRangeOption)}
              >
                <option value="all">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="mobile-sheet-section">
              <label>Issuer</label>
              <select
                className="filter-select"
                value={filters.issuer}
                onChange={(e) => updateFilter('issuer', e.target.value)}
              >
                {issuerOptions.map((opt) => (
                  <option key={opt} value={opt === 'All Issuers' ? 'all' : opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="mobile-sheet-section">
              <label>Region</label>
              <select
                className="filter-select"
                value={filters.region}
                onChange={(e) => updateFilter('region', e.target.value)}
              >
                {regionOptions.map((opt) => (
                  <option key={opt} value={opt === 'All Regions' ? 'all' : opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="mobile-sheet-section">
              <label>Status</label>
              <select
                className="filter-select"
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt === 'All Statuses' ? 'all' : opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="mobile-sheet-section">
              <label>Segment By</label>
              <select
                className="filter-select"
                value={filters.segmentBy}
                onChange={(e) => updateFilter('segmentBy', e.target.value as SegmentOption)}
              >
                <option value="none">None</option>
                <option value="region">By Region</option>
                <option value="offering">By Issuer / Offering</option>
                <option value="status">By Execution Status</option>
                <option value="tier">By Investor Tier</option>
              </select>
            </div>

            <div className="mobile-sheet-section">
              <label className="compare-toggle-label">
                <input
                  type="checkbox"
                  className="compare-toggle-checkbox"
                  checked={filters.compareMode}
                  onChange={(e) => updateFilter('compareMode', e.target.checked)}
                />
                <span>Enable Compare Mode</span>
              </label>
            </div>

            <div className="mobile-sheet-actions">
              <button
                type="button"
                className="payout-btn-primary flex-1 justify-center"
                onClick={() => setIsMobileSheetOpen(false)}
                data-testid="mobile-apply-btn"
              >
                Apply Filters ({activeCount})
              </button>
              <button
                type="button"
                className="payout-btn-secondary"
                onClick={() => {
                  onResetFilters();
                  setIsMobileSheetOpen(false);
                }}
              >
                Reset All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
