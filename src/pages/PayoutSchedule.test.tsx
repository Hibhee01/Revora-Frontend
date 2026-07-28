import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { buildDemoPayoutEvents, PayoutSchedule } from './PayoutSchedule';

expect.extend(toHaveNoViolations);

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderPage(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('buildDemoPayoutEvents', () => {
  it('returns chronological demo payouts around today', () => {
    const events = buildDemoPayoutEvents('2026-07-27');
    expect(events.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i].date >= events[i - 1].date).toBe(true);
    }
  });
});

describe('PayoutSchedule page', () => {
  it('renders the timeline with demo events by default', () => {
    renderPage(<PayoutSchedule today="2026-07-27" />);
    expect(screen.getByRole('heading', { name: /payout schedule/i })).toBeInTheDocument();
    expect(screen.getByTestId('payout-timeline')).toBeInTheDocument();
  });

  it('shows empty state when empty', () => {
    renderPage(<PayoutSchedule empty />);
    expect(screen.getByText(/no payouts scheduled/i)).toBeInTheDocument();
    expect(screen.queryByTestId('payout-timeline')).not.toBeInTheDocument();
  });

  it('accepts injected events', () => {
    renderPage(
      <PayoutSchedule
        today="2026-01-15"
        events={[
          { id: '1', date: '2026-01-01', label: 'Custom', status: 'paid', amount: '$9' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: /Custom, Jan 1, 2026, Paid, \$9/i })).toBeInTheDocument();
  });

  it('has no axe violations with timeline', async () => {
    const { container } = renderPage(<PayoutSchedule today="2026-07-27" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
