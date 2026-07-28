import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('StatusTimeline on-chain badge', () => {
  beforeEach(() => {
    mockMatchMedia();
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders OnChainStatusBadge when milestone includes onChain metadata', () => {
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
});
