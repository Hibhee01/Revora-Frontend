export type DateRangeOption = 'all' | '30d' | '90d' | 'ytd' | 'custom';
export type SegmentOption = 'none' | 'region' | 'offering' | 'status' | 'tier';

export interface DistributionFilterState {
  searchQuery: string;
  dateRange: DateRangeOption;
  customStartDate?: string;
  customEndDate?: string;
  issuer: string;
  region: string;
  status: string;
  segmentBy: SegmentOption;
  compareMode: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filterState: Partial<DistributionFilterState>;
}

export interface DistributionFilterToolbarProps {
  filters: DistributionFilterState;
  onFilterChange: (filters: DistributionFilterState) => void;
  onResetFilters: () => void;
  issuerOptions?: string[];
  regionOptions?: string[];
  statusOptions?: string[];
  savedPresets?: FilterPreset[];
  onSavePreset?: (presetName: string, state: DistributionFilterState) => void;
}
