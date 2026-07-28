/**
 * PinnedSearchSidebar — pinned saved-search rail for the Audit Trail
 * (Issue #235).
 *
 * Each row applies a saved filter combination on activation and exposes
 * reorder (move up / move down), unpin, and delete controls. States:
 *  - empty: guidance copy when nothing is pinned yet
 *  - overflow: rows beyond PINNED_VISIBLE_LIMIT collapse behind a
 *    "Show all" disclosure
 *
 * Accessibility (WCAG 2.1 AA):
 *  - <nav aria-label="Pinned searches"> + list semantics
 *  - every control is a real button with an accessible name that includes
 *    the filter name (icon-only controls get aria-labels)
 *  - reorder is keyboard-first (buttons, not drag-and-drop); order changes
 *    are announced through a polite live region
 *  - long names truncate visually (CSS ellipsis) but stay fully available
 *    to assistive tech via title + aria-label
 */

import React, { useId, useState } from 'react';
import { ArrowDown, ArrowUp, Pin, PinOff, Trash2 } from 'lucide-react';
import {
  type SavedFilter,
  PINNED_VISIBLE_LIMIT,
  describeFilters,
} from './savedFilters';

export interface PinnedSearchSidebarProps {
  /** All saved filters; the sidebar renders the pinned subset in order. */
  savedFilters: SavedFilter[];
  /** id of the saved filter currently applied, if any. */
  activeFilterId?: string | null;
  onApply: (filter: SavedFilter) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onUnpin: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PinnedSearchSidebar: React.FC<PinnedSearchSidebarProps> = ({
  savedFilters,
  activeFilterId,
  onApply,
  onMove,
  onUnpin,
  onDelete,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const headingId = useId();

  const pinned = savedFilters.filter((f) => f.pinned);
  const overflowCount = pinned.length - PINNED_VISIBLE_LIMIT;
  const visible = showAll ? pinned : pinned.slice(0, PINNED_VISIBLE_LIMIT);

  const handleMove = (filter: SavedFilter, direction: -1 | 1) => {
    onMove(filter.id, direction);
    const position = pinned.findIndex((f) => f.id === filter.id) + 1 + direction;
    setAnnouncement(
      `${filter.name} moved ${direction === -1 ? 'up' : 'down'} to position ${position} of ${pinned.length}.`
    );
  };

  return (
    <nav className="atf-sidebar" aria-labelledby={headingId}>
      <h2 id={headingId} className="atf-sidebar-heading">
        Pinned searches
      </h2>

      {/* Reorder announcements for screen readers */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {pinned.length === 0 ? (
        <p className="atf-sidebar-empty" data-testid="pinned-empty">
          No pinned searches yet. Set up filters and choose{' '}
          <strong>Save filter</strong> to pin your frequent searches here.
        </p>
      ) : (
        <>
          <ul className="atf-sidebar-list">
            {visible.map((filter) => {
              const isActive = filter.id === activeFilterId;
              const pinnedIndex = pinned.indexOf(filter);
              return (
                <li key={filter.id} className="atf-sidebar-row">
                  <button
                    type="button"
                    className={`atf-sidebar-apply ${isActive ? 'atf-sidebar-apply--active' : ''}`}
                    onClick={() => onApply(filter)}
                    title={filter.description || describeFilters(filter.filters)}
                    aria-label={`Apply saved search: ${filter.name}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <Pin size={14} aria-hidden="true" className="atf-sidebar-pin-icon" />
                    <span className="atf-sidebar-name">{filter.name}</span>
                  </button>

                  <div className="atf-sidebar-controls" role="group" aria-label={`Manage ${filter.name}`}>
                    <button
                      type="button"
                      className="btn btn--icon atf-icon-btn"
                      onClick={() => handleMove(filter, -1)}
                      disabled={pinnedIndex === 0}
                      aria-label={`Move ${filter.name} up`}
                    >
                      <ArrowUp size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn--icon atf-icon-btn"
                      onClick={() => handleMove(filter, 1)}
                      disabled={pinnedIndex === pinned.length - 1}
                      aria-label={`Move ${filter.name} down`}
                    >
                      <ArrowDown size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn--icon atf-icon-btn"
                      onClick={() => onUnpin(filter.id)}
                      aria-label={`Unpin ${filter.name}`}
                    >
                      <PinOff size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn--icon atf-icon-btn atf-icon-btn--danger"
                      onClick={() => onDelete(filter.id)}
                      aria-label={`Delete saved search ${filter.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {overflowCount > 0 && (
            <button
              type="button"
              className="btn btn--secondary btn--sm atf-sidebar-overflow"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
            >
              {showAll ? 'Show fewer' : `Show all (${overflowCount} more)`}
            </button>
          )}
        </>
      )}
    </nav>
  );
};

export default PinnedSearchSidebar;
