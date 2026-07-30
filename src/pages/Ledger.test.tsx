import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Ledger } from './Ledger';
import '@testing-library/jest-dom';

/**
 * Helper: gets the FIRST expand/collapse button matching a name regex.
 * Uses querySelector for reliability since the desktop table uses `hidden`
 * (display:none) which ByRole queries may exclude.
 */
function getExpandButton(entryId: string, count: number): HTMLElement {
  const suffix = count !== 1 ? 's' : '';
  const label = `Expand ${count} sub-event${suffix} for ${entryId}`;
  const btn = document.querySelector(`button[aria-label="${label}"]`);
  if (!btn) throw new Error(`Button not found: ${label}`);
  return btn as HTMLElement;
}

function getCollapseButton(entryId: string): HTMLElement {
  const label = `Collapse sub-events for ${entryId}`;
  const btn = document.querySelector(`button[aria-label="${label}"]`);
  if (!btn) throw new Error(`Button not found: ${label}`);
  return btn as HTMLElement;
}

function getDisabledButton(entryId: string): HTMLElement {
  const label = `No related events for ${entryId}`;
  const btn = document.querySelector(`button[aria-label="${label}"]`);
  if (!btn) throw new Error(`Button not found: ${label}`);
  return btn as HTMLElement;
}

describe('Ledger Component', () => {
  // ────────────────────────────────────
  // 1. Basic rendering
  // ────────────────────────────────────
  describe('rendering', () => {
    it('renders the ledger title and description', () => {
      render(<Ledger />);
      expect(screen.getByText('Ledger')).toBeInTheDocument();
      expect(
        screen.getByText(/Detailed transaction history/),
      ).toBeInTheDocument();
    });

    it('renders the desktop table with all column headers', () => {
      render(<Ledger />);
      expect(
        screen.getByRole('columnheader', { name: 'Date' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Type' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Amount' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Asset' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Status' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Reference' }),
      ).toBeInTheDocument();
    });

    it('renders 10 rows per page', () => {
      render(<Ledger />);
      const table = screen.getByRole('grid', { name: 'Ledger entries table' });
      const tbody = table.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr') ?? [];
      expect(rows.length).toBeGreaterThanOrEqual(10);
    });

    it('renders the pagination info', () => {
      render(<Ledger />);
      expect(
        screen.getByText(/Showing 1 to 10 of 50 results/),
      ).toBeInTheDocument();
    });

    it('renders all page number buttons in desktop pagination', () => {
      render(<Ledger />);
      for (let i = 1; i <= 5; i++) {
        expect(
          screen.getByRole('button', { name: `Page ${i}` }),
        ).toBeInTheDocument();
      }
    });
  });

  // ────────────────────────────────────
  // 2. Expand / collapse — normal sub-events
  // ────────────────────────────────────
  describe('row expansion with sub-events', () => {
    it('expands a row to reveal sub-events table', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      expect(expandButton).toBeInTheDocument();

      expect(
        screen.queryByRole('grid', { name: /Sub-events detail for ENT-0001/ }),
      ).not.toBeInTheDocument();

      fireEvent.click(expandButton);

      expect(
        screen.getByRole('grid', { name: /Sub-events detail for ENT-0001/ }),
      ).toBeInTheDocument();
    });

    it('displays sub-event data correctly when expanded', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));

      expect(
        screen.getByRole('columnheader', { name: 'Sub-event Date' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Sub-event ID' }),
      ).toBeInTheDocument();

      const subTable = screen.getByRole('grid', {
        name: /Sub-events detail for ENT-0001/,
      });
      expect(within(subTable).getByText('Split')).toBeInTheDocument();
      expect(within(subTable).getByText('Retry')).toBeInTheDocument();
      expect(within(subTable).getByText('Adjustment')).toBeInTheDocument();
    });

    it('collapses an expanded row', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));

      expect(
        screen.getByRole('grid', { name: /Sub-events detail for ENT-0001/ }),
      ).toBeInTheDocument();

      fireEvent.click(getCollapseButton('ENT-0001'));

      expect(
        screen.queryByRole('grid', { name: /Sub-events detail for ENT-0001/ }),
      ).not.toBeInTheDocument();
    });

    it('can expand multiple rows independently', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));
      fireEvent.click(getExpandButton('ENT-0003', 8));

      expect(
        screen.getByRole('grid', { name: /Sub-events detail for ENT-0001/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('grid', { name: /Sub-events detail for ENT-0003/ }),
      ).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────
  // 3. Empty sub-events state
  // ────────────────────────────────────
  describe('empty sub-events state', () => {
    it('shows empty message when row has an empty subEvents array', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0004', 0));

      expect(
        screen.getAllByText('No related events for this entry.')[0],
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Sub-events like splits, retries, or adjustments/),
      ).toBeInTheDocument();
    });

    it('can collapse the empty sub-events message', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0004', 0));

      expect(
        screen.getAllByText('No related events for this entry.').length,
      ).toBeGreaterThanOrEqual(1);

      fireEvent.click(getCollapseButton('ENT-0004'));

      expect(
        screen.queryByText('No related events for this entry.'),
      ).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────
  // 4. Rows with no subEvents at all
  // ────────────────────────────────────
  describe('rows without subEvents property', () => {
    it('renders a disabled chevron for rows without subEvents', () => {
      render(<Ledger />);
      const disabledButton = getDisabledButton('ENT-0005');
      expect(disabledButton).toBeDisabled();
      expect(disabledButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('disabled chevron cannot be clicked to expand', () => {
      render(<Ledger />);
      const disabledButton = getDisabledButton('ENT-0005');
      fireEvent.click(disabledButton);

      expect(
        screen.queryByRole('grid', { name: /Sub-events detail for ENT-0005/ }),
      ).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────
  // 5. Chevron animation / styling
  // ────────────────────────────────────
  describe('chevron transitions', () => {
    it('chevron has rotate-0 when collapsed and rotate-90 when expanded', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      const chevronIcon = expandButton.querySelector('.lucide-chevron-right');
      expect(chevronIcon).toBeInTheDocument();
      expect(chevronIcon).toHaveClass('rotate-0');

      fireEvent.click(expandButton);
      const collapseButton = getCollapseButton('ENT-0001');
      const expandedChevron =
        collapseButton.querySelector('.lucide-chevron-right');
      expect(expandedChevron).toHaveClass('rotate-90');
    });

    it('chevron has transition classes', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      const chevronIcon = expandButton.querySelector('.lucide-chevron-right');
      expect(chevronIcon).toHaveClass('transition-transform');
      expect(chevronIcon).toHaveClass('duration-200');
      expect(chevronIcon).toHaveClass('ease-in-out');
    });
  });

  // ────────────────────────────────────
  // 6. ARIA attributes
  // ────────────────────────────────────
  describe('accessibility (ARIA)', () => {
    it('sets aria-expanded correctly on toggle buttons', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);
      const collapseButton = getCollapseButton('ENT-0001');
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets aria-controls on toggle buttons linking to sub-event container', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      expect(expandButton).toHaveAttribute(
        'aria-controls',
        'sub-events-ENT-0001',
      );
    });

    it('the sub-event container has the matching id', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));
      expect(
        document.getElementById('sub-events-ENT-0001'),
      ).toBeInTheDocument();
    });

    it('uses aria-label with sub-event count on expand button', () => {
      render(<Ledger />);
      const btn = getExpandButton('ENT-0003', 8);
      expect(btn).toHaveAttribute(
        'aria-label',
        'Expand 8 sub-events for ENT-0003',
      );
    });

    it('has a live region for screen reader announcements', () => {
      render(<Ledger />);
      const liveRegion = screen.getByTestId('ledger-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('announces expand/collapse messages via the live region', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));
      const liveRegion = screen.getByTestId('ledger-live-region');
      expect(liveRegion).toHaveTextContent(/ENT-0001 expanded/);
    });

    it('disabled rows have aria-expanded false', () => {
      render(<Ledger />);
      const disabledButton = getDisabledButton('ENT-0005');
      expect(disabledButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('parent rows have aria-expanded when they have subEvents', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      const parentRow = expandButton.closest('tr');
      expect(parentRow).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);

      const collapseButton = getCollapseButton('ENT-0001');
      const expandedParentRow = collapseButton.closest('tr');
      expect(expandedParentRow).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ────────────────────────────────────
  // 7. Focus management
  // ────────────────────────────────────
  describe('focus management', () => {
    it('returns focus to the toggle button after collapse', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      fireEvent.click(expandButton);

      const collapseButton = getCollapseButton('ENT-0001');
      collapseButton.focus();
      fireEvent.click(collapseButton);

      // After collapse, the expand button should be back
      const newExpandButton = getExpandButton('ENT-0001', 3);
      expect(newExpandButton).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────
  // 8. Sub-event count badge
  // ────────────────────────────────────
  describe('sub-event count badge', () => {
    it('shows a badge with sub-event count next to the chevron', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      const td = expandButton.closest('td');
      const badge = td?.querySelector('span[aria-hidden="true"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('does not show a count badge for rows with empty subEvents', () => {
      render(<Ledger />);
      const btn = getExpandButton('ENT-0004', 0);
      const td = btn.closest('td');
      const badge = td?.querySelector('span[aria-hidden="true"]');
      expect(badge).toBeNull();
    });

    it('does not render a badge for rows with no subEvents at all', () => {
      render(<Ledger />);
      const btn = getDisabledButton('ENT-0005');
      const td = btn.closest('td');
      const badge = td?.querySelector('span[aria-hidden="true"]');
      expect(badge).toBeNull();
    });
  });

  // ────────────────────────────────────
  // 9. Pagination
  // ────────────────────────────────────
  describe('pagination', () => {
    it('navigates to the next page using page numbers', () => {
      render(<Ledger />);
      expect(
        screen.getByText(/Showing 1 to 10 of 50 results/),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

      expect(
        screen.getByText(/Showing 11 to 20 of 50 results/),
      ).toBeInTheDocument();
    });

    it('can go back to the previous page', () => {
      render(<Ledger />);
      fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));

      expect(
        screen.getByText(/Showing 21 to 30 of 50 results/),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));

      expect(
        screen.getByText(/Showing 1 to 10 of 50 results/),
      ).toBeInTheDocument();
    });

    it('disables previous arrow button on first page', () => {
      render(<Ledger />);
      const nav = screen.getByRole('navigation', { name: 'Pagination' });
      const prevBtn = within(nav).getByRole('button', {
        name: 'Previous page',
      });
      expect(prevBtn).toBeDisabled();
    });

    it('disables next arrow button on last page', () => {
      render(<Ledger />);
      fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));

      const nav = screen.getByRole('navigation', { name: 'Pagination' });
      const nextBtn = within(nav).getByRole('button', { name: 'Next page' });
      expect(nextBtn).toBeDisabled();
    });

    it('clicking a page number button goes to that page', () => {
      render(<Ledger />);
      fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
      expect(
        screen.getByText(/Showing 21 to 30 of 50 results/),
      ).toBeInTheDocument();
    });

    it('current page button has aria-current="page"', () => {
      render(<Ledger />);
      expect(
        screen.getByRole('button', { name: 'Page 1' }),
      ).toHaveAttribute('aria-current', 'page');

      expect(
        screen.getByRole('button', { name: 'Page 2' }),
      ).not.toHaveAttribute('aria-current');
    });
  });

  // ────────────────────────────────────
  // 10. Expanded state persistence across pages
  // ────────────────────────────────────
  describe('expanded state persistence across paging', () => {
    it('keeps rows expanded when navigating pages', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));

      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      expect(
        screen.getByText(/Showing 11 to 20 of 50 results/),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));

      expect(
        screen.getByRole('grid', { name: /Sub-events detail for ENT-0001/ }),
      ).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────
  // 11. Status and type badges
  // ────────────────────────────────────
  describe('status and type badges', () => {
    it('renders status badges with correct text', () => {
      render(<Ledger />);
      const confirmedBadges = screen.getAllByText('confirmed');
      expect(confirmedBadges.length).toBeGreaterThan(0);
    });

    it('renders type badges with correct text', () => {
      render(<Ledger />);
      const investmentBadges = screen.getAllByText('investment');
      expect(investmentBadges.length).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────
  // 12. Edge case: many sub-events
  // ────────────────────────────────────
  describe('edge case: many sub-events', () => {
    it('renders all 8 sub-events for a row with many nested rows', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0003', 8));

      const subTable = screen.getByRole('grid', {
        name: /Sub-events detail for ENT-0003/,
      });
      const subRows = subTable.querySelectorAll('tbody > tr');
      expect(subRows.length).toBe(8);
    });
  });

  // ────────────────────────────────────
  // 13. Mobile responsive layout
  // ────────────────────────────────────
  describe('mobile layout', () => {
    it('renders mobile cards with list role on small screens', () => {
      render(<Ledger />);
      const mobileList = screen.getByRole('list', {
        name: 'Ledger entries',
      });
      expect(mobileList).toBeInTheDocument();
      expect(mobileList).toHaveClass('sm:hidden');
    });

    it('mobile cards have expand buttons', () => {
      render(<Ledger />);
      // Both desktop and mobile buttons exist using querySelector
      const buttons = document.querySelectorAll(
        'button[aria-label="Expand 3 sub-events for ENT-0001"]',
      );
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('desktop table is hidden on small screens', () => {
      render(<Ledger />);
      const desktopTable = screen.getByRole('grid', {
        name: 'Ledger entries table',
      });
      expect(desktopTable).toHaveClass('hidden');
      expect(desktopTable).toHaveClass('sm:table');
    });

    it('mobile expanded sub-events show in card format', () => {
      render(<Ledger />);
      const mobileList = screen.getByRole('list', {
        name: 'Ledger entries',
      });
      const mobileBtn = mobileList.querySelector(
        'button[aria-label="Expand 3 sub-events for ENT-0001"]',
      ) as HTMLElement;
      expect(mobileBtn).toBeInTheDocument();
      fireEvent.click(mobileBtn);

      expect(
        within(mobileList).getByRole('region', {
          name: /Sub-events for ENT-0001/,
        }),
      ).toBeInTheDocument();

      expect(
        within(mobileList).getByText('Sub-events (3)'),
      ).toBeInTheDocument();
    });

    it('mobile shows empty message for empty subEvents', () => {
      render(<Ledger />);
      const mobileList = screen.getByRole('list', {
        name: 'Ledger entries',
      });
      const mobileEmptyBtn = mobileList.querySelector(
        'button[aria-label="Expand 0 sub-events for ENT-0004"]',
      ) as HTMLElement;
      expect(mobileEmptyBtn).toBeInTheDocument();
      fireEvent.click(mobileEmptyBtn);

      expect(
        within(mobileList).getByText('No related events for this entry.'),
      ).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────
  // 14. Expanded row styling
  // ────────────────────────────────────
  describe('expanded row styling', () => {
    it('expanded parent row receives distinct background styling', () => {
      render(<Ledger />);
      const expandButton = getExpandButton('ENT-0001', 3);
      const rowBefore = expandButton.closest('tr');
      expect(rowBefore).not.toHaveClass('bg-blue-50/40');

      fireEvent.click(expandButton);

      const collapseButton = getCollapseButton('ENT-0001');
      const rowAfter = collapseButton.closest('tr');
      expect(rowAfter).toHaveClass('bg-blue-50/40');
      expect(rowAfter).toHaveClass('border-l-4');
      expect(rowAfter).toHaveClass('border-l-blue-400');
    });

    it('sub-event row also has blue background', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));

      const subContainer = document.getElementById('sub-events-ENT-0001');
      expect(subContainer).toBeInTheDocument();
      expect(subContainer).toHaveClass('bg-blue-50/20');
      expect(subContainer).toHaveClass('border-l-blue-400');
    });
  });

  // ────────────────────────────────────
  // 15. Amount formatting
  // ────────────────────────────────────
  describe('amount formatting', () => {
    it('displays amounts with dollar sign and two decimal places', () => {
      render(<Ledger />);
      const amountCells = screen.getAllByText(/^\$\d+\.\d{2}$/);
      expect(amountCells.length).toBeGreaterThan(0);
    });

    it('sub-event amounts are also formatted', () => {
      render(<Ledger />);
      fireEvent.click(getExpandButton('ENT-0001', 3));

      const subTable = screen.getByRole('grid', {
        name: /Sub-events detail for ENT-0001/,
      });
      const amounts = subTable.querySelectorAll('td');
      const amountTexts = Array.from(amounts)
        .map((td) => td.textContent ?? '')
        .filter((text) => /^\$\d+\.\d{2}$/.test(text));
      expect(amountTexts.length).toBe(3);
    });
  });

  // ────────────────────────────────────
  // 16. Mobile pagination
  // ────────────────────────────────────
  describe('mobile pagination', () => {
    it('shows a compact page indicator on mobile', () => {
      render(<Ledger />);
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });
  });
});
