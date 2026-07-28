import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusTimeline } from './StatusTimeline';
import { getOnchainRejectionMilestones, getRevenueReportMilestones } from './presets';
import { axe } from 'jest-axe';

describe('StatusTimeline — On-Chain Rejection Integration', () => {
  it('renders a timeline with milestone statuses', () => {
    const milestones = getRevenueReportMilestones('under-review');
    render(<StatusTimeline milestones={milestones} />);
    expect(screen.getByRole('navigation', { name: /Status timeline/i })).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('renders blocked milestone with OnchainRejectionCard when onchainRejection is provided', () => {
    const onRetry = vi.fn();
    const onAdjustGas = vi.fn();
    const onCancel = vi.fn();

    const milestones = getOnchainRejectionMilestones('insufficient-gas', {
      onRetry,
      onAdjustGas,
      onCancel,
    });

    render(<StatusTimeline milestones={milestones} />);

    expect(screen.getByText('Payout Prepared')).toBeInTheDocument();
    expect(screen.getByText('On-Chain Execution')).toBeInTheDocument();
    expect(screen.getByTestId('onchain-rejection-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry with adjusted gas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adjust gas settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel transaction/i })).toBeInTheDocument();
  });

  it('passes jest-axe accessibility checks for on-chain rejection timeline', async () => {
    const milestones = getOnchainRejectionMilestones('slippage-exceeded', {
      onRetry: () => {},
      onAdjustGas: () => {},
    });

    const { container } = render(<StatusTimeline milestones={milestones} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
