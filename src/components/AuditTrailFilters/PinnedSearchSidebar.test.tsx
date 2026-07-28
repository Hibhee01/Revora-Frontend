/**
 * Tests for PinnedSearchSidebar (Issue #235).
 * Covers apply/unpin/delete/reorder, empty and overflow states, very long
 * names, RTL rendering, and axe accessibility checks.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { PinnedSearchSidebar } from './PinnedSearchSidebar';
import {
  EMPTY_FILTERS,
  PINNED_VISIBLE_LIMIT,
  type SavedFilter,
  createSavedFilter,
} from './savedFilters';

expect.extend(toHaveNoViolations);

function saved(name: string, overrides: Partial<SavedFilter> = {}): SavedFilter {
  return {
    ...createSavedFilter(name, `${name} description`, { ...EMPTY_FILTERS, query: name }, { id: `id-${name}` }),
    ...overrides,
  };
}

function renderSidebar(savedFilters: SavedFilter[], props: Partial<React.ComponentProps<typeof PinnedSearchSidebar>> = {}) {
  const onApply = vi.fn();
  const onMove = vi.fn();
  const onUnpin = vi.fn();
  const onDelete = vi.fn();
  const view = render(
    <PinnedSearchSidebar
      savedFilters={savedFilters}
      onApply={onApply}
      onMove={onMove}
      onUnpin={onUnpin}
      onDelete={onDelete}
      {...props}
    />
  );
  return { onApply, onMove, onUnpin, onDelete, ...view };
}

describe('PinnedSearchSidebar', () => {
  it('renders as a labelled navigation landmark', () => {
    renderSidebar([saved('Quarterly payouts')]);
    expect(screen.getByRole('navigation', { name: /pinned searches/i })).toBeInTheDocument();
  });

  it('shows guidance copy when nothing is pinned (empty state)', () => {
    renderSidebar([saved('Unpinned only', { pinned: false })]);
    expect(screen.getByTestId('pinned-empty')).toHaveTextContent(/no pinned searches yet/i);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists only pinned filters, in order', () => {
    renderSidebar([saved('First'), saved('Hidden', { pinned: false }), saved('Second')]);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole('button', { name: /apply saved search: First/i })).toBeInTheDocument();
    expect(within(items[1]).getByRole('button', { name: /apply saved search: Second/i })).toBeInTheDocument();
  });

  it('applies a filter on row activation', async () => {
    const user = userEvent.setup();
    const filters = [saved('Mine')];
    const { onApply } = renderSidebar(filters);

    await user.click(screen.getByRole('button', { name: /apply saved search: Mine/i }));
    expect(onApply).toHaveBeenCalledWith(filters[0]);
  });

  it('marks the active row with aria-current', () => {
    renderSidebar([saved('Active'), saved('Other')], { activeFilterId: 'id-Active' });
    expect(screen.getByRole('button', { name: /apply saved search: Active/i })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /apply saved search: Other/i })).not.toHaveAttribute('aria-current');
  });

  it('reorders with move up/down and announces the change politely', async () => {
    const user = userEvent.setup();
    const { onMove, container } = renderSidebar([saved('a'), saved('b'), saved('c')]);

    await user.click(screen.getByRole('button', { name: /move b up/i }));
    expect(onMove).toHaveBeenCalledWith('id-b', -1);

    await user.click(screen.getByRole('button', { name: /move b down/i }));
    expect(onMove).toHaveBeenCalledWith('id-b', 1);

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent(/b moved down to position 3 of 3/i);
  });

  it('disables move up on the first row and move down on the last', () => {
    renderSidebar([saved('first'), saved('last')]);
    expect(screen.getByRole('button', { name: /move first up/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /move first down/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /move last up/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /move last down/i })).toBeDisabled();
  });

  it('unpins and deletes via the row controls', async () => {
    const user = userEvent.setup();
    const { onUnpin, onDelete } = renderSidebar([saved('Row')]);

    await user.click(screen.getByRole('button', { name: /unpin Row/i }));
    expect(onUnpin).toHaveBeenCalledWith('id-Row');

    await user.click(screen.getByRole('button', { name: /delete saved search Row/i }));
    expect(onDelete).toHaveBeenCalledWith('id-Row');
  });

  it('collapses rows beyond the limit behind a Show all disclosure (overflow state)', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: PINNED_VISIBLE_LIMIT + 3 }, (_, i) => saved(`f${i}`));
    renderSidebar(many);

    expect(screen.getAllByRole('listitem')).toHaveLength(PINNED_VISIBLE_LIMIT);
    const toggle = screen.getByRole('button', { name: /show all \(3 more\)/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getAllByRole('listitem')).toHaveLength(PINNED_VISIBLE_LIMIT + 3);
    expect(screen.getByRole('button', { name: /show fewer/i })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: /show fewer/i }));
    expect(screen.getAllByRole('listitem')).toHaveLength(PINNED_VISIBLE_LIMIT);
  });

  it('shows no overflow toggle at or below the limit', () => {
    renderSidebar(Array.from({ length: PINNED_VISIBLE_LIMIT }, (_, i) => saved(`f${i}`)));
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
  });

  it('keeps very long names fully available to assistive tech', () => {
    const longName = 'Extremely long saved filter name that will certainly not fit in the sidebar column '.repeat(2).trim();
    renderSidebar([saved('x', { name: longName })]);

    const row = screen.getByRole('button', { name: `Apply saved search: ${longName}` });
    expect(row).toBeInTheDocument();
    // Visual truncation is handled by CSS ellipsis on the name span
    expect(row.querySelector('.atf-sidebar-name')).toHaveTextContent(longName);
  });

  it('uses the description as the row title (tooltip) when present', () => {
    renderSidebar([saved('Named')]);
    expect(screen.getByRole('button', { name: /apply saved search: Named/i }))
      .toHaveAttribute('title', 'Named description');
  });

  it('renders correctly under RTL direction', () => {
    const { container } = render(
      <div dir="rtl">
        <PinnedSearchSidebar
          savedFilters={[saved('عمليات الدفع الفاشلة')]}
          onApply={vi.fn()}
          onMove={vi.fn()}
          onUnpin={vi.fn()}
          onDelete={vi.fn()}
        />
      </div>
    );
    expect(
      screen.getByRole('button', { name: 'Apply saved search: عمليات الدفع الفاشلة' })
    ).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"] .atf-sidebar')).not.toBeNull();
  });

  it('has no axe violations in populated, empty, and overflow states', async () => {
    const populated = renderSidebar([saved('a'), saved('b')]);
    expect(await axe(populated.container)).toHaveNoViolations();
    populated.unmount();

    const empty = renderSidebar([]);
    expect(await axe(empty.container)).toHaveNoViolations();
    empty.unmount();

    const overflow = renderSidebar(
      Array.from({ length: PINNED_VISIBLE_LIMIT + 2 }, (_, i) => saved(`f${i}`))
    );
    expect(await axe(overflow.container)).toHaveNoViolations();
  });
});
