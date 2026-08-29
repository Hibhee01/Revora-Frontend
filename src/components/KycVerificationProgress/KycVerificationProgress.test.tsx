/**
 * Tests for KycVerificationProgress (Issue #624).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { KycVerificationProgress } from './KycVerificationProgress';
import type { KycStep } from './KycVerificationProgress';

function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const allStateSteps: KycStep[] = [
  { id: 'id-upload', label: 'ID Upload', description: 'Upload government ID', state: 'completed', timestamp: '2026-08-25T10:00:00Z' },
  { id: 'liveness-check', label: 'Liveness Check', description: 'Video selfie verification', state: 'in-progress' },
  { id: 'address-proof', label: 'Address Proof', description: 'Utility bill or bank statement', state: 'blocked', action: { label: 'Re-upload document', onClick: vi.fn() } },
  { id: 'aml-screening', label: 'AML Screening', description: 'Anti-money laundering check', state: 'pending' },
  { id: 'approved', label: 'Approved', description: 'KYC verification complete', state: 'pending' },
];

const completedSteps: KycStep[] = [
  { id: 'id-upload', label: 'ID Upload', state: 'completed' },
  { id: 'liveness-check', label: 'Liveness Check', state: 'completed' },
  { id: 'address-proof', label: 'Address Proof', state: 'completed' },
  { id: 'aml-screening', label: 'AML Screening', state: 'completed' },
  { id: 'approved', label: 'Approved', state: 'completed' },
];

describe('KycVerificationProgress', () => {
  beforeEach(() => {
    mockMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all step labels', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    expect(screen.getByText('ID Upload')).toBeInTheDocument();
    expect(screen.getByText('Liveness Check')).toBeInTheDocument();
    expect(screen.getByText('Address Proof')).toBeInTheDocument();
    expect(screen.getByText('AML Screening')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    expect(screen.getByText('Upload government ID')).toBeInTheDocument();
    expect(screen.getByText('Video selfie verification')).toBeInTheDocument();
    expect(screen.getByText('Utility bill or bank statement')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(
      <KycVerificationProgress
        steps={allStateSteps}
        title="Your KYC Status"
      />,
    );
    expect(screen.getByText('Your KYC Status')).toBeInTheDocument();
  });

  it('renders a status badge', () => {
    render(<KycVerificationProgress steps={allStateSteps} status="Under Review" />);
    expect(screen.getByTestId('kyc-progress-status')).toHaveTextContent('Under Review');
  });

  it('renders no status badge when status is not provided', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    expect(screen.queryByTestId('kyc-progress-status')).not.toBeInTheDocument();
  });

  it('calculates correct progress percentage', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '20'); // 1 of 5
  });

  it('shows 100% when all steps are completed', () => {
    render(<KycVerificationProgress steps={completedSteps} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders progress bar with step count label', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    expect(screen.getByText('1/5 steps')).toBeInTheDocument();
  });

  it('applies blocked status class to status badge when a step is blocked', () => {
    render(<KycVerificationProgress steps={allStateSteps} status="Under Review" />);
    const statusBadge = screen.getByTestId('kyc-progress-status');
    expect(statusBadge).toHaveClass('kyc-progress__status--blocked');
  });

  it('does not apply blocked class when no steps are blocked', () => {
    render(
      <KycVerificationProgress
        steps={completedSteps}
        status="All Clear"
      />,
    );
    const statusBadge = screen.getByTestId('kyc-progress-status');
    expect(statusBadge).not.toHaveClass('kyc-progress__status--blocked');
  });

  it('renders action buttons for blocked steps', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const steps: KycStep[] = [
      { id: 'addr', label: 'Address', state: 'blocked', action: { label: 'Re-upload', onClick } },
    ];
    render(<KycVerificationProgress steps={steps} />);
    const btn = screen.getByTestId('kyc-action-addr');
    expect(btn).toHaveTextContent('Re-upload');
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders action buttons for failed steps', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const steps: KycStep[] = [
      { id: 'liveness', label: 'Liveness', state: 'failed', action: { label: 'Retry', onClick } },
    ];
    render(<KycVerificationProgress steps={steps} />);
    const btn = screen.getByTestId('kyc-action-liveness');
    expect(btn).toHaveTextContent('Retry');
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action buttons for non-blocked steps', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    expect(screen.queryByTestId('kyc-action-id-upload')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kyc-action-liveness-check')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kyc-action-aml-screening')).not.toBeInTheDocument();
  });

  it('renders timestamps for steps with timestamp', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    const time = screen.getByText(/Aug 25/);
    expect(time).toBeInTheDocument();
  });

  it('does not render timestamps for steps without timestamp', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    const timeElements = screen.getAllByRole('time');
    expect(timeElements.length).toBe(1); // only id-upload has a timestamp
  });

  it('renders badges for steps with badge text', () => {
    const steps: KycStep[] = [
      { id: 'doc', label: 'Documents', state: 'in-progress', badge: '1 of 2 uploaded' },
    ];
    render(<KycVerificationProgress steps={steps} />);
    expect(screen.getByTestId('kyc-badge-doc')).toHaveTextContent('1 of 2 uploaded');
  });

  it('renders custom icons when provided', () => {
    const steps: KycStep[] = [
      { id: 'custom', label: 'Custom', state: 'completed', icon: <span data-testid="custom-icon">★</span> },
    ];
    render(<KycVerificationProgress steps={steps} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders detail link when onStepDetail callback is provided', () => {
    const onDetail = vi.fn();
    render(<KycVerificationProgress steps={allStateSteps} onStepDetail={onDetail} />);
    // Should show for non-pending, non-skipped steps
    expect(screen.getByTestId('kyc-detail-id-upload')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-detail-liveness-check')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-detail-address-proof')).toBeInTheDocument();
  });

  it('does not render detail link for pending or skipped steps', () => {
    const onDetail = vi.fn();
    const steps: KycStep[] = [
      { id: 'done', label: 'Done', state: 'completed' },
      { id: 'skip', label: 'Skip', state: 'skipped' },
      { id: 'wait', label: 'Wait', state: 'pending' },
    ];
    render(<KycVerificationProgress steps={steps} onStepDetail={onDetail} />);
    expect(screen.queryByTestId('kyc-detail-done')).toBeInTheDocument();
    expect(screen.queryByTestId('kyc-detail-skip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kyc-detail-wait')).not.toBeInTheDocument();
  });

  it('invokes onStepDetail with correct step id', async () => {
    const user = userEvent.setup();
    const onDetail = vi.fn();
    const steps: KycStep[] = [
      { id: 'upload', label: 'Upload', state: 'completed' },
    ];
    render(<KycVerificationProgress steps={steps} onStepDetail={onDetail} />);
    await user.click(screen.getByTestId('kyc-detail-upload'));
    expect(onDetail).toHaveBeenCalledWith('upload');
  });

  it('applies custom className', () => {
    const { container } = render(
      <KycVerificationProgress steps={[]} className="my-custom" />,
    );
    expect(container.firstChild).toHaveClass('kyc-progress');
    expect(container.firstChild).toHaveClass('my-custom');
  });

  it('defaults to "KYC Verification Progress" title', () => {
    render(<KycVerificationProgress steps={[]} />);
    expect(screen.getByText('KYC Verification Progress')).toBeInTheDocument();
  });

  it('renders as a region landmark with accessible name', () => {
    render(
      <KycVerificationProgress
        steps={[]}
        ariaLabel="My KYC Progress"
      />,
    );
    // aria-labelledby overrides aria-label for the accessible name
    expect(
      screen.getByRole('region', { name: 'KYC Verification Progress' }),
    ).toBeInTheDocument();
  });

  it('renders an empty step list without crashing', () => {
    render(<KycVerificationProgress steps={[]} />);
    expect(screen.getByTestId('kyc-verification-progress')).toBeInTheDocument();
    expect(screen.getByText('0/0 steps')).toBeInTheDocument();
  });

  it('marks the current step with aria-current="step"', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    const livenessStep = screen.getByTestId('kyc-step-liveness-check');
    expect(livenessStep).toHaveAttribute('aria-current', 'step');
  });

  it('does not set aria-current on non-in-progress steps', () => {
    render(<KycVerificationProgress steps={allStateSteps} />);
    const idStep = screen.getByTestId('kyc-step-id-upload');
    expect(idStep).not.toHaveAttribute('aria-current');
  });

  it('applies skipped visual treatment', () => {
    const steps: KycStep[] = [
      { id: 'skip', label: 'Skipped step', state: 'skipped' },
    ];
    render(<KycVerificationProgress steps={steps} />);
    const li = screen.getByTestId('kyc-step-skip');
    expect(li).toHaveClass('kyc-progress__step--skipped');
    const label = screen.getByText('Skipped step');
    expect(label).toHaveClass('kyc-progress__step-label--skipped');
  });

  it('has no axe violations for a fully-featured progress indicator', async () => {
    const { container } = render(
      <KycVerificationProgress
        steps={allStateSteps}
        status="In Review"
        ariaLabel="KYC progress"
        onStepDetail={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations for empty steps', async () => {
    const { container } = render(
      <KycVerificationProgress steps={[]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations for all-completed steps', async () => {
    const { container } = render(
      <KycVerificationProgress
        steps={completedSteps}
        status="Complete"
        onStepDetail={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders connector lines between steps', () => {
    const { container } = render(<KycVerificationProgress steps={allStateSteps} />);
    const connectors = container.querySelectorAll('.kyc-progress__connector');
    expect(connectors.length).toBe(4); // n-1 connectors for 5 steps
  });

  it('does not render connectors for a single step', () => {
    const { container } = render(
      <KycVerificationProgress steps={[{ id: 'only', label: 'Only', state: 'pending' }]} />,
    );
    expect(container.querySelector('.kyc-progress__connector')).not.toBeInTheDocument();
  });

  it.each([
    ['completed', 'completed', 'kyc-progress__connector--completed'],
    ['completed', 'in-progress', 'kyc-progress__connector--in-progress'],
    ['completed', 'blocked', 'kyc-progress__connector--blocked'],
    ['pending', 'blocked', 'kyc-progress__connector--blocked'],
    ['completed', 'pending', 'kyc-progress__connector--pending'],
  ] as const)(
    'derives connector state for %s → %s',
    (from, to, expectedClass) => {
      const { container } = render(
        <KycVerificationProgress
          steps={[
            { id: 'a', label: 'A', state: from },
            { id: 'b', label: 'B', state: to },
          ]}
        />,
      );
      const connector = container.querySelector('.kyc-progress__connector');
      expect(connector).toHaveClass(expectedClass);
    },
  );

  it('shows warning style progress bar when a step is blocked', () => {
    const { container } = render(<KycVerificationProgress steps={allStateSteps} />);
    const fill = container.querySelector('.kyc-progress__bar-fill');
    expect(fill).toHaveClass('kyc-progress__bar-fill--warning');
  });

  it('does not show warning style when no steps are blocked', () => {
    const { container } = render(<KycVerificationProgress steps={completedSteps} />);
    const fill = container.querySelector('.kyc-progress__bar-fill');
    expect(fill).not.toHaveClass('kyc-progress__bar-fill--warning');
  });
});
