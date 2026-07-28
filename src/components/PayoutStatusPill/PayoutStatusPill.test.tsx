/**
 * Tests for PayoutStatusPill (Issue #221).
 * Covers compact/full variants, keyboard focus tooltips, ESC dismiss,
 * high-contrast class hooks, dense-row markup, and axe checks.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { PayoutStatusPill } from './PayoutStatusPill';
import { PAYOUT_STATUS_ORDER } from './payoutStatuses';

expect.extend(toHaveNoViolations);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PayoutStatusPill', () => {
  it('renders icon + label for every canonical status (not colour alone)', () => {
    for (const status of PAYOUT_STATUS_ORDER) {
      const { unmount } = render(<PayoutStatusPill status={status} />);
      const pill = screen.getByTestId('payout-status-pill');
      expect(pill).toHaveAttribute('data-status', status);
      expect(within(pill).getByTestId('payout-status-face').querySelector('svg')).not.toBeNull();
      expect(pill).toHaveTextContent(new RegExp(status === 'canceled' ? 'Canceled' : status, 'i'));
      unmount();
    }
  });

  it('normalises raw status strings onto the taxonomy', () => {
    render(<PayoutStatusPill status="FAILED" />);
    expect(screen.getByTestId('payout-status-pill')).toHaveAttribute('data-status', 'failed');
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows detail only in the full variant', () => {
    const { rerender } = render(
      <PayoutStatusPill status="confirmed" variant="compact" detail="Ledger #1" />
    );
    expect(screen.queryByText('Ledger #1')).not.toBeInTheDocument();

    rerender(<PayoutStatusPill status="confirmed" variant="full" detail="Ledger #1" />);
    expect(screen.getByText('Ledger #1')).toBeInTheDocument();
    expect(screen.getByTestId('payout-status-pill')).toHaveAttribute('data-variant', 'full');
  });

  it('associates a role=tooltip description via aria-describedby', () => {
    render(<PayoutStatusPill status="sending" />);
    const pill = screen.getByTestId('payout-status-pill');
    const tipId = pill.getAttribute('aria-describedby');
    expect(tipId).toBeTruthy();
    const tip = document.getElementById(tipId!);
    expect(tip).toHaveAttribute('role', 'tooltip');
    expect(tip).toHaveTextContent(/Stellar network/i);
  });

  it('opens the tooltip on keyboard focus and closes on blur', async () => {
    const user = userEvent.setup();
    render(
      <>
        <PayoutStatusPill status="retrying" />
        <button type="button">Away</button>
      </>
    );

    const pill = screen.getByTestId('payout-status-pill');
    await user.tab();
    expect(pill).toHaveFocus();
    expect(screen.getByTestId('payout-status-tooltip')).toHaveClass('psp-tooltip--open');

    await user.tab();
    expect(screen.getByRole('button', { name: /away/i })).toHaveFocus();
    expect(screen.getByTestId('payout-status-tooltip')).not.toHaveClass('psp-tooltip--open');
  });

  it('opens the tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<PayoutStatusPill status="preparing" />);
    const pill = screen.getByTestId('payout-status-pill');

    await user.hover(pill);
    expect(screen.getByTestId('payout-status-tooltip')).toHaveClass('psp-tooltip--open');

    await user.unhover(pill);
    expect(screen.getByTestId('payout-status-tooltip')).not.toHaveClass('psp-tooltip--open');
  });

  it('dismisses the tooltip via Escape and keeps it closed until re-entry', async () => {
    const user = userEvent.setup();
    render(
      <>
        <PayoutStatusPill status="failed" />
        <button type="button">Away</button>
      </>
    );
    const pill = screen.getByTestId('payout-status-pill');

    await user.click(pill);
    expect(screen.getByTestId('payout-status-tooltip')).toHaveClass('psp-tooltip--open');

    await user.keyboard('{Escape}');
    expect(screen.getByTestId('payout-status-tooltip')).not.toHaveClass('psp-tooltip--open');

    // Still focused — ESC dismissal must stick until blur clears it
    expect(pill).toHaveFocus();
    expect(screen.getByTestId('payout-status-tooltip')).not.toHaveClass('psp-tooltip--open');

    // Hover while still dismissed (no blur yet) must not reopen the tip
    await user.hover(pill);
    expect(screen.getByTestId('payout-status-tooltip')).not.toHaveClass('psp-tooltip--open');

    // Leave and re-enter → tooltip can open again
    await user.click(screen.getByRole('button', { name: /away/i }));
    await user.hover(pill);
    expect(screen.getByTestId('payout-status-tooltip')).toHaveClass('psp-tooltip--open');
  });

  it('allows disabling the tooltip while keeping the labeled pill', () => {
    render(<PayoutStatusPill status="confirmed" showTooltip={false} />);
    const pill = screen.getByTestId('payout-status-pill');
    expect(pill).not.toHaveAttribute('aria-describedby');
    expect(pill).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('honours a custom tooltip override', () => {
    render(<PayoutStatusPill status="scheduled" tooltip="Custom schedule note." />);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Custom schedule note.');
  });

  it('exposes density-friendly compact markup for dense rows', () => {
    document.documentElement.setAttribute('data-density', 'compact');
    render(<PayoutStatusPill status="sending" variant="compact" />);
    expect(screen.getByTestId('payout-status-pill')).toHaveClass('psp-pill--compact');
    document.documentElement.removeAttribute('data-density');
  });

  it('renders under RTL without losing the label', () => {
    render(
      <div dir="rtl">
        <PayoutStatusPill status="canceled" />
      </div>
    );
    expect(screen.getByText('Canceled')).toBeInTheDocument();
    expect(screen.getByTestId('payout-status-pill').closest('[dir="rtl"]')).not.toBeNull();
  });

  it('has no axe-detectable accessibility violations across statuses', async () => {
    const { container } = render(
      <div>
        {PAYOUT_STATUS_ORDER.map((status) => (
          <PayoutStatusPill key={status} status={status} variant="full" />
        ))}
      </div>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
