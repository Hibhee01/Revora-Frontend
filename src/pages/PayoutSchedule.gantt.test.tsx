/**
 * Tests for PayoutSchedule Gantt-style timeline view (Issue #219).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { PayoutSchedule, DEMO_PAYOUTS } from './PayoutSchedule';

expect.extend(toHaveNoViolations);

function renderPage(props: React.ComponentProps<typeof PayoutSchedule> = {}) {
  return render(
    <MemoryRouter>
      <PayoutSchedule {...props} />
    </MemoryRouter>
  );
}

describe('PayoutSchedule Gantt View', () => {
  it('renders view toggle buttons (Gantt and Table)', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: /gantt/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /table/i })).toBeInTheDocument();
  });

  it('switches to Gantt view when Gantt tab is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    const ganttTab = screen.getByRole('tab', { name: /gantt/i });
    await user.click(ganttTab);

    // Gantt view should show issuer labels
    expect(screen.getByText('Issuer A')).toBeInTheDocument();
    expect(screen.getByText('Issuer B')).toBeInTheDocument();
    expect(screen.getByText('Issuer C')).toBeInTheDocument();
    expect(screen.getByText('Issuer D')).toBeInTheDocument();

    // Zoom controls should be visible
    expect(screen.getByRole('group', { name: /zoom controls/i })).toBeInTheDocument();
  });

  it('shows the range label with dates in Gantt view', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /gantt/i }));

    // Month view for July-August 2026 should show a date range
    const rangeLabel = screen.getByText(/2026/);
    expect(rangeLabel).toBeInTheDocument();
  });

  it('renders zoom level buttons', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /gantt/i }));

    expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quarter/i })).toBeInTheDocument();
  });

  it('switches zoom level when a zoom button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /gantt/i }));

    const weekBtn = screen.getByRole('button', { name: /week/i });
    await user.click(weekBtn);
    expect(weekBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows tooltips on gantt bars on hover', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /gantt/i }));

    // Hover over a bar with the title attribute
    const bar = screen.getByTitle(/Issuer A.*USDC 12,500.*2026-07-15/);
    expect(bar).toBeInTheDocument();
  });

  it('shows pattern key legend in Gantt view', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /gantt/i }));

    expect(screen.getByText(/Pattern key/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed \/ Canceled/i)).toBeInTheDocument();
    expect(screen.getByText(/Today marker/i)).toBeInTheDocument();
  });

  it('has no axe violations in table mode (default)', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations when switching to Gantt view', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.click(screen.getByRole('tab', { name: /gantt/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
