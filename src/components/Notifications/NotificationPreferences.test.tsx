/**
 * Tests for NotificationPreferences with quiet-hours preview and per-category overrides (Issue #290).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import NotificationPreferences, {
  NotificationPreferencesValue,
} from './NotificationPreferences';

expect.extend(toHaveNoViolations);

const CATEGORIES = [
  { key: 'distribution' as const, label: 'Distribution' },
  { key: 'report' as const, label: 'Report' },
  { key: 'compliance' as const, label: 'Compliance' },
  { key: 'governance' as const, label: 'Governance' },
];

const DEFAULT_VALUE: NotificationPreferencesValue = {
  matrix: {
    distribution: { inApp: true, email: false, sms: false },
    report: { inApp: false, email: true, sms: false },
    compliance: { inApp: true, email: true, sms: true },
    governance: { inApp: false, email: false, sms: false },
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
    timeZone: 'America/New_York',
  },
  quietHoursOverride: {
    distribution: false,
    report: false,
    compliance: true,
    governance: false,
  },
};

function renderComponent(props: React.ComponentProps<typeof NotificationPreferences> = {}) {
  return render(<NotificationPreferences {...props} />);
}

describe('NotificationPreferences', () => {
  it('renders the section heading and description', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /notification preferences/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/choose how you receive updates/i)).toBeInTheDocument();
  });

  it('renders all category rows and channel columns on desktop', () => {
    renderComponent({ value: DEFAULT_VALUE });
    // Categories appear in both desktop and mobile views, so use getAllByText
    expect(screen.getAllByText('Distribution').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Report').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Compliance').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Governance').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In-App').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Email').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SMS').length).toBeGreaterThanOrEqual(1);
  });

  /* ─── Quiet Hours Section ────────────────────────────────────────── */

  it('renders the quiet hours scheduler', () => {
    renderComponent({ value: DEFAULT_VALUE });
    expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable quiet hours')).toBeChecked();
    expect(screen.getByLabelText('Quiet hours start time')).toHaveValue('22:00');
    expect(screen.getByLabelText('Quiet hours end time')).toHaveValue('07:00');
  });

  it('shows the timezone label', () => {
    renderComponent({ value: DEFAULT_VALUE });
    expect(screen.getByText(/America\/New_York/)).toBeInTheDocument();
  });

  it('disables time inputs when quiet hours are disabled', () => {
    const disabledValue: NotificationPreferencesValue = {
      ...DEFAULT_VALUE,
      quietHours: { enabled: false, startTime: '22:00', endTime: '07:00', timeZone: 'UTC' },
    };
    renderComponent({ value: disabledValue });
    expect(screen.getByLabelText('Quiet hours start time')).toBeDisabled();
    expect(screen.getByLabelText('Quiet hours end time')).toBeDisabled();
  });

  /* ─── Quiet Hours Preview Timeline ───────────────────────────────── */

  it('shows the timeline preview when quiet hours are enabled', () => {
    renderComponent({ value: DEFAULT_VALUE });
    expect(screen.getByText(/Next 24 Hours/i)).toBeInTheDocument();
  });

  it('shows a placeholder when quiet hours are disabled', () => {
    const disabledValue: NotificationPreferencesValue = {
      ...DEFAULT_VALUE,
      quietHours: { ...DEFAULT_VALUE.quietHours, enabled: false },
    };
    renderComponent({ value: disabledValue });
    // The placeholder text contains "delivery preview" but "Next 24 Hours" heading should not appear
    expect(screen.getByText(/Enable quiet hours to see/i)).toBeInTheDocument();
    expect(screen.queryByText(/Next 24 Hours/i)).not.toBeInTheDocument();
  });

  it('shows the quiet hours time range in the timeline legend', () => {
    renderComponent({ value: DEFAULT_VALUE });
    expect(screen.getByText(/22:00–07:00/)).toBeInTheDocument();
  });

  it('shows override count in the timeline when overrides are active', () => {
    renderComponent({ value: DEFAULT_VALUE });
    expect(screen.getByText(/1 override active/i)).toBeInTheDocument();
  });

  /* ─── Per-Category Override Toggles ───────────────────────────────── */

  it('renders override toggles for each category on desktop', () => {
    renderComponent({ value: DEFAULT_VALUE });
    // Each category has an override toggle in both desktop and mobile
    const toggleLabels = CATEGORIES.map(
      (cat) => `Override quiet hours for ${cat.label}`,
    );
    toggleLabels.forEach((label) => {
      expect(screen.getAllByLabelText(label).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('reflects the override state from the value prop', () => {
    renderComponent({ value: DEFAULT_VALUE });
    const complianceToggles = screen.getAllByLabelText('Override quiet hours for Compliance');
    // At least one of them should be checked
    expect(complianceToggles.some((el) => (el as HTMLInputElement).checked)).toBe(true);

    const distributionToggles = screen.getAllByLabelText('Override quiet hours for Distribution');
    expect(distributionToggles.some((el) => !(el as HTMLInputElement).checked)).toBe(true);
  });

  it('calls onChange when an override toggle is changed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: DEFAULT_VALUE, onChange });

    const complianceToggle = screen.getAllByLabelText('Override quiet hours for Compliance')[0];
    await user.click(complianceToggle);

    expect(onChange).toHaveBeenCalledTimes(1);
    const newValue = onChange.mock.calls[0][0] as NotificationPreferencesValue;
    expect(newValue.quietHoursOverride.compliance).toBe(false);
  });

  it('provides override info popovers for each category', () => {
    renderComponent({ value: DEFAULT_VALUE });
    const infoButtons = screen.getAllByRole('button', { name: /about override/i });
    expect(infoButtons.length).toBeGreaterThanOrEqual(4);
  });

  /* ─── Accessibility ───────────────────────────────────────────────── */

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderComponent({ value: DEFAULT_VALUE });
    expect(await axe(container)).toHaveNoViolations();
  });

  /* ─── Controlled Value Updates ────────────────────────────────────── */

  it('calls onChange when a matrix cell is toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: DEFAULT_VALUE, onChange });

    const reportEmailCheckbox = screen.getByLabelText('Report: Email');
    await user.click(reportEmailCheckbox);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('calls onChange when quiet hours enabled is toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: DEFAULT_VALUE, onChange });

    const enableCheckbox = screen.getByLabelText('Enable quiet hours');
    await user.click(enableCheckbox);

    expect(onChange).toHaveBeenCalledTimes(1);
    const newValue = onChange.mock.calls[0][0] as NotificationPreferencesValue;
    expect(newValue.quietHours.enabled).toBe(false);
  });
});
