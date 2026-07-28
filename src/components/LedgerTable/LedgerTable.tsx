import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Columns,
  SlidersHorizontal,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import './LedgerTable.css';

// Global density modes (matches DensityProvider)
export type DensityMode = 'comfortable' | 'cozy' | 'compact';
// Legacy alias kept for backward compat
export type Density = DensityMode;

export interface Column<T> {
  key: string;
  label: string;
  defaultVisible?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
}

export interface LedgerTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  rowDetail?: (row: T) => React.ReactNode;
  pageSize?: number;
  defaultDensity?: DensityMode;
  stickyHeader?: boolean;
  ariaLabel?: string;
  groupableColumns?: { key: keyof T; label: string }[];
  renderGroupHeader?: (groupValue: any, items: T[]) => React.ReactNode;
}

const DENSITY_CLASS: Record<DensityMode, string> = {
  comfortable: 'lt-density--comfortable',
  cozy:        'lt-density--cozy',
  compact:     'lt-density--compact',
};

const ROW_HEIGHTS: Record<DensityMode, number> = {
  comfortable: 56,
  cozy:        48,
  compact:     36,
};

const OVERSCAN = 5;

type FlattenedRow<T> = 
  | { isGroup: true; key: string; value: any; items: T[] }
  | { isGroup: false; row: T };

function LedgerTable<T>({
  data,
  columns,
  rowKey,
  rowDetail,
  pageSize = 50,
  defaultDensity = 'cozy',
  stickyHeader = true,
  ariaLabel = 'Ledger table',
  groupableColumns,
  renderGroupHeader,
}: LedgerTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() =>
    new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key)),
  );
  const [density, setDensity] = useState<DensityMode>(defaultDensity);
  const [currentPage, setCurrentPage] = useState(0);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showDensityMenu, setShowDensityMenu] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | number | null>(null);
  const [detailRow, setDetailRow] = useState<string | number | null>(null);
  
  const [groupBy, setGroupBy] = useState<keyof T | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const columnMenuRef = useRef<HTMLDivElement>(null);
  const densityMenuRef = useRef<HTMLDivElement>(null);

  const flattenedData = useMemo(() => {
    if (!groupBy) {
      return data.map(row => ({ isGroup: false, row } as FlattenedRow<T>));
    }

    const groups = new Map<any, T[]>();
    data.forEach(row => {
      const val = row[groupBy];
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(row);
    });

    const flat: FlattenedRow<T>[] = [];
    groups.forEach((items, value) => {
      const groupKey = String(value);
      flat.push({ isGroup: true, key: groupKey, value, items });
      if (!collapsedGroups.has(groupKey)) {
        items.forEach(row => flat.push({ isGroup: false, row }));
      }
    });
    return flat;
  }, [data, groupBy, collapsedGroups]);

  const totalPages = Math.max(1, Math.ceil(flattenedData.length / pageSize));
  
  // reset to page 0 if grouping changes
  useEffect(() => {
    setCurrentPage(0);
  }, [groupBy]);

  const pageData = useMemo(
    () => flattenedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [flattenedData, currentPage, pageSize],
  );

  const filteredColumns = useMemo(
    () => columns.filter((c) => visibleColumns.has(c.key)),
    [columns, visibleColumns],
  );

  const rowHeight = ROW_HEIGHTS[density];

  const [containerHeight, setContainerHeight] = useState(400);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalHeight = pageData.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(
    pageData.length,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + OVERSCAN,
  );
  const visibleRows = useMemo(
    () => pageData.slice(startIndex, endIndex),
    [pageData, startIndex, endIndex],
  );

  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    const current = scrollRef.current;
    if (current) {
      observer.observe(current);
    }
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
      if (densityMenuRef.current && !densityMenuRef.current.contains(e.target as Node)) {
        setShowDensityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const cycleDensity = useCallback(() => {
    setDensity((prev) => {
      const order: DensityMode[] = ['comfortable', 'cozy', 'compact'];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  const handleRowClick = useCallback(
    (row: T, index: number) => {
      const key = rowKey(row);
      if (rowDetail) {
        setDetailRow((prev) => (prev === key ? null : key));
      }
      setSelectedRow(key);
      setSelectedRowIndex(index);
    },
    [rowKey, rowDetail],
  );

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const maxIndex = pageData.length - 1;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedRowIndex((prev) => {
            const next = Math.min(prev + 1, maxIndex);
            if (next >= 0) {
              const item = pageData[next];
              if (!item.isGroup) {
                setSelectedRow(rowKey(item.row));
                if (rowDetail) setDetailRow(rowKey(item.row));
              }
            }
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedRowIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            if (next >= 0) {
              const item = pageData[next];
              if (!item.isGroup) {
                setSelectedRow(rowKey(item.row));
                if (rowDetail) setDetailRow(rowKey(item.row));
              }
            }
            return next;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedRowIndex >= 0 && selectedRowIndex <= maxIndex) {
            const item = pageData[selectedRowIndex];
            if (item.isGroup) {
              toggleGroup(item.key);
            } else {
              handleRowClick(item.row, selectedRowIndex);
            }
          }
          break;
        case 'Escape':
          setDetailRow(null);
          break;
      }
    },
    [pageData, selectedRowIndex, rowKey, rowDetail, handleRowClick, toggleGroup],
  );

  if (columns.length === 0) {
    return (
      <div className="lt-empty" role="status">
        <p>No columns defined.</p>
      </div>
    );
  }

  return (
    <div className="lt-root" role="region" aria-label={ariaLabel}>
      <div className="lt-toolbar">
        <div className="lt-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="lt-row-count">
            {data.length} row{data.length !== 1 ? 's' : ''}
          </span>
          {totalPages > 1 && (
            <span className="lt-page-info">
              Page {currentPage + 1} of {totalPages}
            </span>
          )}
          {groupableColumns && groupableColumns.length > 0 && (
            <select
              value={groupBy as string || ''}
              onChange={(e) => setGroupBy((e.target.value as keyof T) || null)}
              className="lt-group-select"
              aria-label="Group by"
            >
              <option value="">No Grouping</option>
              {groupableColumns.map(c => (
                <option key={String(c.key)} value={String(c.key)}>Group by {c.label}</option>
              ))}
            </select>
          )}
        </div>
        <div className="lt-toolbar-right">
          <div className="lt-control-group" ref={densityMenuRef}>
            <button
              type="button"
              className="lt-control-btn"
              onClick={cycleDensity}
              onMouseDown={() => setShowDensityMenu(!showDensityMenu)}
              aria-label={`Density: ${density}. Click to change.`}
              aria-expanded={showDensityMenu}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span className="lt-control-label">{density}</span>
            </button>
          </div>
          <div className="lt-control-group" ref={columnMenuRef}>
            <button
              type="button"
              className="lt-control-btn"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              aria-label="Column visibility"
              aria-expanded={showColumnMenu}
              aria-haspopup="menu"
            >
              <Columns size={14} aria-hidden="true" />
              <span className="lt-control-label">Columns</span>
            </button>
            {showColumnMenu && (
              <div
                className="lt-column-menu lt-dropdown"
                role="menu"
                aria-label="Toggle column visibility"
              >
                {columns.map((col) => {
                  const isVisible = visibleColumns.has(col.key);
                  const isDisabled = isVisible && visibleColumns.size <= 1;
                  return (
                    <label
                      key={col.key}
                      className={`lt-column-menu-item ${isDisabled ? 'lt-column-menu-item--disabled' : ''}`}
                      role="menuitemcheckbox"
                      aria-checked={isVisible}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(col.key)}
                        disabled={isDisabled}
                        className="lt-column-menu-checkbox"
                      />
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="lt-pagination" role="navigation" aria-label="Table pagination">
          <button
            type="button"
            className="lt-page-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="lt-page-indicator" aria-current="page">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="lt-page-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`lt-table-wrap ${DENSITY_CLASS[density]}`}
        tabIndex={0}
        role="grid"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        aria-rowcount={pageData.length}
      >
        {stickyHeader && (
          <div className="lt-header" role="row" aria-rowindex={0}>
            {rowDetail && <div className="lt-cell lt-cell--detail" role="columnheader" aria-label="Detail" />}
            {filteredColumns.map((col) => (
              <div
                key={col.key}
                className="lt-cell lt-cell--header"
                role="columnheader"
                aria-label={col.label}
                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
              >
                {col.label}
              </div>
            ))}
          </div>
        )}

        <div
          className="lt-body"
          role="rowgroup"
          style={{ height: totalHeight, position: 'relative' }}
        >
          {visibleRows.map((item, i) => {
            const globalIndex = startIndex + i;
            
            if (item.isGroup) {
              const isCollapsed = collapsedGroups.has(item.key);
              return (
                <div
                  key={`group-${item.key}`}
                  className={`lt-row lt-row--group ${selectedRowIndex === globalIndex ? 'lt-row--selected' : ''}`}
                  role="row"
                  aria-rowindex={globalIndex + 1}
                  aria-expanded={!isCollapsed}
                  style={{
                    position: 'absolute',
                    top: globalIndex * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                  }}
                  onClick={() => toggleGroup(item.key)}
                  tabIndex={-1}
                >
                  <div className="lt-cell lt-cell--group-header" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="lt-group-toggle"
                      aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                      tabIndex={-1} // Handled by row focus
                    >
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {renderGroupHeader ? renderGroupHeader(item.value, item.items) : (
                      <span className="font-medium">{String(item.value)} <span className="text-muted">({item.items.length})</span></span>
                    )}
                  </div>
                </div>
              );
            }

            const row = item.row;
            const key = rowKey(row);
            const isSelected = selectedRow === key;
            const isDetailOpen = detailRow === key;
            
            return (
              <React.Fragment key={key}>
                <div
                  className={`lt-row ${isSelected ? 'lt-row--selected' : ''} ${selectedRowIndex === globalIndex ? 'lt-row--focused' : ''}`}
                  role="row"
                  aria-rowindex={globalIndex + 1}
                  aria-selected={isSelected}
                  style={{
                    position: 'absolute',
                    top: globalIndex * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                  }}
                  onClick={() => handleRowClick(row, globalIndex)}
                  tabIndex={-1}
                >
                  {rowDetail && (
                    <div className="lt-cell lt-cell--detail">
                      <button
                        type="button"
                        className="lt-detail-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailRow((prev) => (prev === key ? null : key));
                        }}
                        aria-label={isDetailOpen ? 'Close detail' : 'Open detail'}
                        aria-expanded={isDetailOpen}
                        tabIndex={-1}
                      >
                        <ChevronRight
                          size={14}
                          className={`lt-detail-icon ${isDetailOpen ? 'lt-detail-icon--open' : ''} icon-rtl`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  )}
                  {filteredColumns.map((col) => (
                    <div
                      key={col.key}
                      className="lt-cell"
                      role="gridcell"
                      style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    >
                      {col.render(row)}
                    </div>
                  ))}
                </div>
                {isDetailOpen && rowDetail && (
                  <div
                    className="lt-detail-panel"
                    role="region"
                    aria-label={`Detail for row ${key}`}
                    style={{
                      position: 'absolute',
                      top: (globalIndex + 1) * rowHeight,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <div className="lt-detail-content">
                      {rowDetail(row)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {data.length === 0 && (
        <div className="lt-empty" role="status">
          <p>No data to display.</p>
        </div>
      )}
    </div>
  );
}

LedgerTable.displayName = 'LedgerTable';

export default LedgerTable;
