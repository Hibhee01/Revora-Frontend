/**
 * Integration tests for PayoutSchedule + status pills (Issue #221).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { PayoutSchedule, DEMO_PAYOUTS } from './PayoutSchedule';
import { PAYOUT_STATUS_ORDER } from '../components/PayoutStatusPill';

expect.extend(toHaveNoViolations);

function renderPage(props: React.ComponentProps<typeof PayoutSchedule> = {}) {
  return render(
    <MemoryRouter>
      <PayoutSchedule {...props} />
    </MemoryRouter>
  );
}

describe('PayoutSchedule', () => {
  it('renders the schedule table with a compact pill per payout', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /payout schedule/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('payout-schedule-table')).toBeInTheDocument();
    // Two legends (top + bottom) × PAYOUT_STATUS_ORDER.length + DEMO_PAYOUTS.length table pills
    expect(screen.getAllByTestId('payout-status-pill')).toHaveLength(
      DEMO_PAYOUTS.length + PAYOUT_STATUS_ORDER.length * 2
    );
  });

  it('documents the canonical status set in the legend (full variant)', () => {
    renderPage();
    const legend = screen.getByTestId('payout-status-legend');
    const pills = within(legend).getAllByTestId('payout-status-pill');
    expect(pills.map((p) => p.getAttribute('data-status'))).toEqual(PAYOUT_STATUS_ORDER);
    expect(pills.every((p) => p.getAttribute('data-variant') === 'full')).toBe(true);
  });

  it('shows the empty state when requested', () => {
    renderPage({ empty: true });
    expect(screen.getByText(/no payouts scheduled/i)).toBeInTheDocument();
    expect(screen.queryByTestId('payout-schedule-table')).not.toBeInTheDocument();
  });

  it('lets keyboard users focus a row pill and read its tooltip', async () => {
    const user = userEvent.setup();
    renderPage({
      payouts: [
        {
          id: 'only',
          recipient: 'a@b.co',
          amount: 'USDC 1',
          scheduledFor: '2026-08-01',
          status: 'failed',
        },
      ],
    });

    const row = screen.getByTestId('payout-row-only');
    const rowPill = within(row).getByTestId('payout-status-pill');

    await user.click(rowPill);
    expect(rowPill).toHaveFocus();
    expect(within(rowPill).getByTestId('payout-status-tooltip')).toHaveClass('psp-tooltip--open');

    await user.keyboard('{Escape}');
    expect(within(rowPill).getByTestId('payout-status-tooltip')).not.toHaveClass('psp-tooltip--open');
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
