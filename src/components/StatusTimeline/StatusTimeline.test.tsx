import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { StatusTimeline } from './StatusTimeline';
import type { Milestone } from './StatusTimeline';

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

const allStates: Milestone[] = [
  {
    id: 'done',
    label: 'Completed step',
    status: 'completed',
    timestamp: '2026-07-27T08:00:00.000Z',
  },
  { id: 'running', label: 'In progress step', status: 'in-progress' },
  { id: 'stuck', label: 'Blocked step', status: 'blocked' },
  { id: 'skipped', label: 'Skipped step', status: 'skipped' },
  { id: 'queued', label: 'Pending step', status: 'pending' },
];

describe('StatusTimeline', () => {
  beforeEach(() => {
    mockMatchMedia();
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders every milestone label and description', () => {
    const milestones: Milestone[] = [
      { id: 'a', label: 'Draft', description: 'Prepare figures', status: 'completed' },
      { id: 'b', label: 'Submitted', description: 'Sent for review', status: 'in-progress' },
    ];
    render(<StatusTimeline milestones={milestones} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Prepare figures')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Sent for review')).toBeInTheDocument();
  });

  it('defaults to horizontal orientation and supports vertical', () => {
    const { container, rerender } = render(<StatusTimeline milestones={allStates} />);
    expect(container.querySelector('.status-timeline--horizontal')).toBeInTheDocument();

    rerender(<StatusTimeline milestones={allStates} orientation="vertical" />);
    expect(container.querySelector('.status-timeline--vertical')).toBeInTheDocument();
    expect(container.querySelector('.status-timeline--horizontal')).not.toBeInTheDocument();
  });

  it('applies a custom accessible label to the navigation region', () => {
    render(<StatusTimeline milestones={allStates} ariaLabel="Revenue report progress" />);
    expect(
      screen.getByRole('navigation', { name: 'Revenue report progress' }),
    ).toBeInTheDocument();
  });

  it('marks each milestone with a status-specific marker and aria-label', () => {
    const { container } = render(<StatusTimeline milestones={allStates} />);

    const humanized: Record<string, string> = {
      completed: 'Completed',
      'in-progress': 'In progress',
      blocked: 'Blocked',
      skipped: 'Skipped',
      pending: 'Pending',
    };

    for (const milestone of allStates) {
      const marker = container.querySelector(`.st-marker--${milestone.status}`);
      expect(marker).toBeInTheDocument();
      expect(marker).toHaveAttribute(
        'aria-label',
        `${milestone.label}: ${humanized[milestone.status]}`,
      );
    }
  });

  it('renders a default icon for each status state', () => {
    const { container } = render(<StatusTimeline milestones={allStates} />);

    for (const milestone of allStates) {
      const marker = container.querySelector(`.st-marker--${milestone.status}`);
      expect(marker?.querySelector('svg')).toBeInTheDocument();
    }
  });

  it('uses a custom icon override when provided', () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(
      <StatusTimeline
        milestones={[
          { id: 'x', label: 'Custom', status: 'completed', icon: customIcon },
        ]}
      />,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders a timestamp tooltip linked to the marker', () => {
    const { container } = render(
      <StatusTimeline
        milestones={[
          {
            id: 'settled',
            label: 'Settled',
            status: 'completed',
            timestamp: '2026-07-27T08:00:00.000Z',
          },
        ]}
      />,
    );

    const trigger = container.querySelector('.st-timestamp-trigger');
    const tooltip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip.textContent).toContain('2026');
  });

  it('falls back to the raw string for an invalid timestamp', () => {
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'weird',
            label: 'Weird',
            status: 'completed',
            timestamp: 'not-a-date',
          },
        ]}
      />,
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('not-a-date');
  });

  it('renders no tooltip when a milestone has no timestamp', () => {
    render(
      <StatusTimeline milestones={[{ id: 'plain', label: 'Plain', status: 'pending' }]} />,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('expands and collapses the sub-step disclosure', async () => {
    const user = userEvent.setup();
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'review',
            label: 'Under Review',
            status: 'in-progress',
            subSteps: [
              { id: 's1', label: 'Verify figures', status: 'completed' },
              { id: 's2', label: 'Manager approval', status: 'pending' },
            ],
          },
        ]}
      />,
    );

    const toggle = screen.getByRole('button', { name: 'Show 2 sub-steps' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('list', { name: 'Sub-steps for Under Review' });
    expect(within(list).getByText('Verify figures')).toBeInTheDocument();
    expect(within(list).getByText('Manager approval')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide 2 sub-steps' }));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('uses singular wording for a single sub-step', () => {
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'm',
            label: 'Single',
            status: 'in-progress',
            subSteps: [{ id: 'only', label: 'Only step', status: 'pending' }],
          },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Show 1 sub-step' })).toBeInTheDocument();
  });

  it('renders a blocked action badge and invokes its callback', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'kyc',
            label: 'KYC Check',
            status: 'blocked',
            blockedAction: { label: 'Upload documents', onClick: onAction },
          },
        ]}
      />,
    );

    const button = screen.getByRole('button', { name: 'Action required: Upload documents' });
    await user.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render a blocked action badge for non-blocked milestones', () => {
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'ok',
            label: 'Fine',
            status: 'in-progress',
            blockedAction: { label: 'Nope', onClick: vi.fn() },
          },
        ]}
      />,
    );
    expect(screen.queryByRole('button', { name: /Action required/i })).not.toBeInTheDocument();
  });

  it('renders OnChainStatusBadge when a milestone includes onChain metadata', () => {
    const milestones: Milestone[] = [
      {
        id: 'settled',
        label: 'Settled on ledger',
        status: 'completed',
        onChain: {
          blockNumber: 55001234,
          transactionHash: 'abc123def4567890abc123def4567890abc123def4567890',
          confirmations: 10,
          confirmedAt: '2026-07-27T08:00:00.000Z',
        },
      },
    ];

    render(<StatusTimeline milestones={milestones} orientation="vertical" />);

    expect(screen.getByText('Settled on ledger')).toBeInTheDocument();
    expect(screen.getByTestId('onchain-status-badge')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /on-chain details for settled on ledger/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders an OnchainRejectionCard for a blocked milestone with onchainRejection', () => {
    const onRetry = vi.fn();
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'tx-execution',
            label: 'On-Chain Execution',
            status: 'blocked',
            onchainRejection: { reason: 'insufficient-gas', onRetry },
          },
        ]}
      />,
    );
    expect(screen.getByTestId('onchain-rejection-card')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /retry with adjusted gas/i }),
    ).toBeInTheDocument();
  });

  it('renders an empty nav without crashing for an empty milestone array', () => {
    const { container } = render(<StatusTimeline milestones={[]} />);
    const nav = container.querySelector('.status-timeline');
    expect(nav).toBeInTheDocument();
    expect(nav?.querySelectorAll('.st-milestone').length).toBe(0);
  });

  it('renders no connectors for a single milestone', () => {
    const { container } = render(
      <StatusTimeline milestones={[{ id: 'only', label: 'Only', status: 'completed' }]} />,
    );
    expect(container.querySelector('.st-connector')).not.toBeInTheDocument();
  });

  it.each([
    ['completed', 'completed', 'st-connector--completed'],
    ['completed', 'in-progress', 'st-connector--in-progress'],
    ['completed', 'blocked', 'st-connector--blocked'],
    ['pending', 'blocked', 'st-connector--blocked'],
    ['completed', 'pending', 'st-connector--pending'],
  ] as const)(
    'derives connector state for %s → %s',
    (from, to, expectedClass) => {
      const { container } = render(
        <StatusTimeline
          milestones={[
            { id: 'a', label: 'A', status: from },
            { id: 'b', label: 'B', status: to },
          ]}
        />,
      );
      const connector = container.querySelector('.st-connector');
      expect(connector).toHaveClass(expectedClass);
    },
  );

  it('supports keyboard interaction on the sub-step toggle', async () => {
    const user = userEvent.setup();
    render(
      <StatusTimeline
        milestones={[
          {
            id: 'm',
            label: 'Review',
            status: 'in-progress',
            subSteps: [{ id: 's', label: 'Check', status: 'pending' }],
          },
        ]}
      />,
    );

    const toggle = screen.getByRole('button', { name: 'Show 1 sub-step' });
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no axe violations for a fully-featured horizontal timeline', async () => {
    const { container } = render(
      <StatusTimeline
        milestones={[
          {
            id: 'a',
            label: 'Completed',
            status: 'completed',
            timestamp: '2026-07-27T08:00:00.000Z',
            subSteps: [
              { id: 'a1', label: 'Sub one', status: 'completed' },
              { id: 'a2', label: 'Sub two', status: 'pending' },
            ],
          },
          { id: 'b', label: 'Running', status: 'in-progress' },
          {
            id: 'c',
            label: 'Blocked',
            status: 'blocked',
            blockedAction: { label: 'Fix it', onClick: vi.fn() },
          },
          { id: 'd', label: 'Skipped', status: 'skipped' },
          { id: 'e', label: 'Pending', status: 'pending' },
        ]}
        ariaLabel="All states timeline"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations for a vertical timeline', async () => {
    const { container } = render(
      <StatusTimeline
        milestones={[
          { id: 'a', label: 'One', status: 'completed' },
          { id: 'b', label: 'Two', status: 'in-progress' },
          {
            id: 'c',
            label: 'Three',
            status: 'blocked',
            blockedAction: { label: 'Retry', onClick: vi.fn() },
          },
        ]}
        orientation="vertical"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
