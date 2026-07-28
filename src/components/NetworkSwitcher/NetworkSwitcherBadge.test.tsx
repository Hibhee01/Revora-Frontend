import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { NetworkSwitcherBadge } from './NetworkSwitcherBadge';
import { NetworkSwitcherProvider } from './NetworkSwitcherContext';
import { axe } from 'jest-axe';

describe('NetworkSwitcherBadge', () => {
  it('renders normal active network label when no mismatch exists', () => {
    render(
      <NetworkSwitcherProvider initialConnectedChainId={137} initialAppChainId={137}>
        <NetworkSwitcherBadge />
      </NetworkSwitcherProvider>,
    );

    const badge = screen.getByTestId('network-switcher-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });

  it('renders "Wrong Network" mismatch indicator when chain mismatch exists', () => {
    render(
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        <NetworkSwitcherBadge />
      </NetworkSwitcherProvider>,
    );

    expect(screen.getByText('Wrong Network')).toBeInTheDocument();
    expect(screen.getByTestId('network-switcher-badge')).toHaveClass('ns-badge--mismatch');
  });

  it('triggers modal open on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        <NetworkSwitcherBadge onClick={onClick} />
      </NetworkSwitcherProvider>,
    );

    const badge = screen.getByTestId('network-switcher-badge');
    await user.click(badge);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders offline wallet state when isWalletConnected is false', () => {
    render(
      <NetworkSwitcherProvider
        initialConnectedChainId={1}
        initialAppChainId={137}
        initialIsWalletConnected={false}
      >
        <NetworkSwitcherBadge />
      </NetworkSwitcherProvider>,
    );

    const badge = screen.getByTestId('network-switcher-badge');
    expect(badge).toHaveClass('ns-badge--offline');
    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });

  it('passes jest-axe accessibility checks', async () => {
    const { container } = render(
      <NetworkSwitcherProvider initialConnectedChainId={1} initialAppChainId={137}>
        <NetworkSwitcherBadge />
      </NetworkSwitcherProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
