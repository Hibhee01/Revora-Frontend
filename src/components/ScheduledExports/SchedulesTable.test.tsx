import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { SchedulesTable } from './SchedulesTable';
import type { ScheduledExport } from './types';

const mockSchedules: ScheduledExport[] = [
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

function renderTable(props: Partial<React.ComponentProps<typeof SchedulesTable>> = {}) {
  const onAction = vi.fn();
  const view = render(
    <SchedulesTable schedules={props.schedules ?? mockSchedules} onAction={onAction} />
  );
  return { onAction, ...view };
}

describe('SchedulesTable', () => {
  it('renders all schedules in rows', () => {
    renderTable();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(mockSchedules.length + 1);
  });

  it('renders schedule names and descriptions', () => {
    renderTable();
    expect(screen.getByText('Daily Payout Summary')).toBeInTheDocument();
    expect(screen.getByText('Weekly Compliance Report')).toBeInTheDocument();
    expect(screen.getByText('Revenue Backfill')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    renderTable();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders format labels', () => {
    renderTable();
    const csvLabels = screen.getAllByText('CSV');
    expect(csvLabels.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('renders entry counts', () => {
    renderTable();
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(screen.getByText('890')).toBeInTheDocument();
  });

  it('shows the error tooltip trigger for error status', () => {
    renderTable();
    const errorRow = screen.getByText('Revenue Backfill').closest('tr')!;
    expect(within(errorRow).getByRole('tooltip')).toBeInTheDocument();
  });

  it('shows the empty state when there are no schedules', () => {
    renderTable({ schedules: [] });
    expect(screen.getByText('No scheduled exports')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no scheduled exports/i })).toBeInTheDocument();
  });

  it('has action buttons for each row', () => {
    renderTable();
    const buttons = screen.getAllByRole('button', { name: /actions for/i });
    expect(buttons).toHaveLength(mockSchedules.length);
  });

  it('opens action menu on click', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows Resume instead of Pause for paused schedules', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Weekly Compliance Report/i }));
    expect(screen.getByRole('menuitem', { name: /resume/i })).toBeInTheDocument();
  });

  it('calls onAction with edit when Edit is clicked', async () => {
    const user = userEvent.setup();
    const { onAction } = renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit/i }));
    expect(onAction).toHaveBeenCalledWith('se-1', 'edit');
  });

  it('calls onAction with toggle when Pause/Resume is clicked', async () => {
    const user = userEvent.setup();
    const { onAction } = renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /pause/i }));
    expect(onAction).toHaveBeenCalledWith('se-1', 'toggle');
  });

  it('calls onAction with delete when Delete is clicked', async () => {
    const user = userEvent.setup();
    const { onAction } = renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(onAction).toHaveBeenCalledWith('se-1', 'delete');
  });

  it('closes the action menu on Escape key', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the action menu on click outside', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the existing menu when a different action button is clicked', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /actions for Weekly Compliance Report/i }));
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });

  it('has an accessible caption', () => {
    renderTable();
    expect(screen.getByText('Scheduled exports list')).toBeInTheDocument();
  });

  it('has no axe violations in filled state', async () => {
    const { container } = renderTable();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in empty state', async () => {
    const { container } = renderTable({ schedules: [] });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations with action menu open', async () => {
    const user = userEvent.setup();
    const { container } = renderTable();
    await user.click(screen.getByRole('button', { name: /actions for Daily Payout Summary/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
