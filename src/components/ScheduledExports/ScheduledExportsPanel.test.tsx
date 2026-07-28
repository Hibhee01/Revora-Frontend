import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ScheduledExportsPanel } from './ScheduledExportsPanel';
import type { ScheduledExport } from './types';

const MOCK: ScheduledExport[] = [
  {
    id: 'se-1',
    name: 'Daily Payout Summary',
    description: 'Daily CSV export',
    format: 'csv',
    schedule: { frequency: 'daily', time: '09:00', timezone: 'UTC' },
    status: 'active',
    lastRunAt: '2026-07-27T09:00:00Z',
    nextRunAt: '2026-07-28T09:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    entryCount: 1240,
  },
  {
    id: 'se-2',
    name: 'Weekly Compliance Report',
    description: 'Full compliance audit log every Monday',
    format: 'json',
    schedule: { frequency: 'weekly', time: '14:00', timezone: 'America/New_York', dayOfWeek: 1 },
    status: 'paused',
    lastRunAt: '2026-07-27T14:00:00Z',
    nextRunAt: '2026-08-03T14:00:00Z',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-07-15T00:00:00Z',
    entryCount: 890,
  },
  {
    id: 'se-3',
    name: 'Revenue Backfill',
    description: '',
    format: 'csv',
    schedule: { frequency: 'daily', time: '23:45', timezone: 'America/Los_Angeles' },
    status: 'error',
    lastRunAt: '2026-07-27T23:45:00Z',
    nextRunAt: '2026-07-28T23:45:00Z',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-07-28T00:00:00Z',
    entryCount: 560,
    errorMessage: 'Database connection timeout',
  },
];

function renderPanel(props: Partial<React.ComponentProps<typeof ScheduledExportsPanel>> = {}) {
  return render(<ScheduledExportsPanel schedules={props.schedules ?? MOCK} />);
}

describe('ScheduledExportsPanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the header', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: /scheduled exports/i, level: 1 })).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    renderPanel();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Paused').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Errors').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the schedule table with all rows', () => {
    renderPanel();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(MOCK.length + 1);
  });

  it('opens the create dialog when New schedule is clicked', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /new schedule/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /new schedule/i })).toBeInTheDocument();
  });

  it('opens the edit dialog with pre-filled data', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /edit schedule/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Daily Payout Summary');
  });

  it('creates a new schedule via dialog', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /new schedule/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await user.clear(screen.getByLabelText(/^name/i));
    await user.type(screen.getByLabelText(/^name/i), 'New Export');
    await user.click(screen.getByRole('button', { name: /create schedule/i }));
    await waitFor(() => {
      expect(screen.getByText('New Export')).toBeInTheDocument();
    });
  });

  it('updates an existing schedule via edit dialog', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const nameInput = screen.getByLabelText(/^name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Export');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText('Updated Export')).toBeInTheDocument();
    });
    expect(screen.queryByText('Daily Payout Summary')).not.toBeInTheDocument();
  });

  it('toggles a schedule from active to paused', async () => {
    const user = userEvent.setup();
    renderPanel({ schedules: [MOCK[0]] });
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /pause/i }));
    await waitFor(() => {
      const pausedBadges = screen.getAllByText('Paused');
      expect(pausedBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('toggles a schedule from paused to active', async () => {
    const user = userEvent.setup();
    renderPanel({ schedules: [MOCK[1]] });
    await user.click(screen.getByRole('button', { name: /actions for Weekly Compliance Report/i }));
    await user.click(screen.getByRole('menuitem', { name: /resume/i }));
    await waitFor(() => {
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('cancels delete confirmation', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Daily Payout Summary')).toBeInTheDocument();
  });

  it('completes delete after confirmation', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(screen.queryByText('Daily Payout Summary')).not.toBeInTheDocument();
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderPanel();
    await waitFor(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
