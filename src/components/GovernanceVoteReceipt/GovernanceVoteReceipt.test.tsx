/**
 * GovernanceVoteReceipt.test.tsx — Issue #472
 * vitest + @testing-library/react + jest-axe
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { GovernanceVoteReceipt } from './GovernanceVoteReceipt';
import type { GovernanceVoteReceiptProps } from './GovernanceVoteReceipt';

/* ─── Fixtures ──────────────────────────────────────────────────── */
const BASE_PROPS: GovernanceVoteReceiptProps = {
  isOpen: true,
  onClose: vi.fn(),
  proposalTitle: 'Increase Protocol Treasury Allocation by 15%',
  proposalId: 'prop-001',
  voteChoice: 'for',
  votedAt: '2026-07-28T14:15:00Z',
  voterAddress: '0xabc123def456abc123def456abc123def456abc1',
  txHash: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  txStatus: 'confirmed',
  currentConfirmations: 12,
  targetConfirmations: 12,
  explorerBaseUrl: 'https://stellar.expert/explorer/public/tx/',
  shareUrl: 'https://app.revora.io/governance/prop-001/receipt?voter=0xabc',
};

function renderReceipt(overrides: Partial<GovernanceVoteReceiptProps> = {}) {
  const onClose = vi.fn();
  const onRetry = vi.fn();
  const utils = render(
    <GovernanceVoteReceipt {...BASE_PROPS} onClose={onClose} onRetry={onRetry} {...overrides} />,
  );
  return { ...utils, onClose, onRetry };
}

/* ─── Rendering ─────────────────────────────────────────────────── */
describe('Rendering', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderReceipt({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog when isOpen is true', () => {
    renderReceipt();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the proposal title', () => {
    renderReceipt();
    expect(screen.getByText(/increase protocol treasury/i)).toBeInTheDocument();
  });

  it('shows the vote choice badge — For', () => {
    renderReceipt({ voteChoice: 'for' });
    expect(screen.getByLabelText(/vote: for/i)).toBeInTheDocument();
  });

  it('shows the vote choice badge — Against', () => {
    renderReceipt({ voteChoice: 'against' });
    expect(screen.getByLabelText(/vote: against/i)).toBeInTheDocument();
  });

  it('shows the vote choice badge — Abstain', () => {
    renderReceipt({ voteChoice: 'abstain' });
    expect(screen.getByLabelText(/vote: abstain/i)).toBeInTheDocument();
  });

  it('shows the truncated tx hash', () => {
    renderReceipt();
    const hashEl = screen.getByTestId('tx-hash-display');
    expect(hashEl.textContent).toContain('0xdeadbeef');
    expect(hashEl.textContent).toContain('…');
    expect(hashEl.textContent!.length).toBeLessThan(BASE_PROPS.txHash.length);
  });

  it('shows full tx hash in title attribute', () => {
    renderReceipt();
    expect(screen.getByTitle(BASE_PROPS.txHash)).toBeInTheDocument();
  });

  it('shows the formatted timestamp', () => {
    renderReceipt();
    // Should render a <time> element
    expect(screen.getByRole('time')).toBeInTheDocument();
  });

  it('shows the truncated voter address', () => {
    renderReceipt();
    expect(screen.getByTitle(BASE_PROPS.voterAddress)).toBeInTheDocument();
  });
});

/* ─── States ────────────────────────────────────────────────────── */
describe('Transaction states', () => {
  it('shows "Vote confirmed on-chain" heading when confirmed', () => {
    renderReceipt({ txStatus: 'confirmed' });
    expect(screen.getByRole('heading', { name: /vote confirmed on-chain/i })).toBeInTheDocument();
  });

  it('shows "Vote submitted" heading when pending', () => {
    renderReceipt({ txStatus: 'pending' });
    expect(screen.getByRole('heading', { name: /vote submitted/i })).toBeInTheDocument();
  });

  it('shows "Transaction failed" heading when failed', () => {
    renderReceipt({ txStatus: 'failed' });
    expect(screen.getByRole('heading', { name: /transaction failed/i })).toBeInTheDocument();
  });

  it('shows failed alert message when txStatus is failed', () => {
    renderReceipt({ txStatus: 'failed' });
    expect(screen.getByRole('alert')).toHaveTextContent(/transaction failed/i);
  });

  it('shows retry button when failed and onRetry provided', () => {
    renderReceipt({ txStatus: 'failed' });
    expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
  });

  it('does NOT show retry button when txStatus is confirmed', () => {
    renderReceipt({ txStatus: 'confirmed' });
    expect(screen.queryByTestId('retry-btn')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', async () => {
    const { onRetry } = renderReceipt({ txStatus: 'failed' });
    await userEvent.click(screen.getByTestId('retry-btn'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders OnchainBadge in confirming state', () => {
    renderReceipt({ txStatus: 'confirming', currentConfirmations: 6, targetConfirmations: 12 });
    expect(screen.getByTestId('onchain-badge-confirming')).toBeInTheDocument();
  });
});

/* ─── Copy actions ──────────────────────────────────────────────── */
describe('Copy actions', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('copy tx hash button calls clipboard.writeText with full hash', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('copy-transaction-hash'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(BASE_PROPS.txHash);
  });

  it('copy button shows "Copied" state after click', async () => {
    renderReceipt();
    const btn = screen.getByTestId('copy-transaction-hash');
    await userEvent.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-label', 'transaction hash copied'));
  });

  it('copy voter address button calls clipboard.writeText with full address', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('copy-voter-address'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(BASE_PROPS.voterAddress);
  });
});

/* ─── Explorer link ─────────────────────────────────────────────── */
describe('Explorer link', () => {
  it('renders an external link to the block explorer', () => {
    renderReceipt();
    const link = screen.getByTestId('explorer-link');
    expect(link).toHaveAttribute('href', `${BASE_PROPS.explorerBaseUrl}${BASE_PROPS.txHash}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('explorer link has descriptive aria-label', () => {
    renderReceipt();
    expect(screen.getByLabelText(/view transaction on block explorer/i)).toBeInTheDocument();
  });
});

/* ─── Share panel ───────────────────────────────────────────────── */
describe('Share panel', () => {
  it('share panel is collapsed by default', () => {
    renderReceipt();
    expect(screen.queryByTestId('share-panel')).not.toBeInTheDocument();
  });

  it('expands share panel on toggle click', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    expect(screen.getByTestId('share-panel')).toBeInTheDocument();
  });

  it('toggle has aria-expanded=false when closed', () => {
    renderReceipt();
    expect(screen.getByTestId('share-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggle has aria-expanded=true when open', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    expect(screen.getByTestId('share-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows share link when shareUrl provided', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    expect(screen.getByText(/app\.revora\.io/i)).toBeInTheDocument();
  });

  it('copy share link button copies the shareUrl', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    await userEvent.click(screen.getByTestId('copy-share-link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(BASE_PROPS.shareUrl);
  });

  it('shows plain-text summary containing vote choice', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    const panel = screen.getByTestId('share-panel');
    expect(within(panel).getByText(/voted For/)).toBeInTheDocument();
  });

  it('collapses share panel on second toggle click', async () => {
    renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    await userEvent.click(screen.getByTestId('share-toggle'));
    expect(screen.queryByTestId('share-panel')).not.toBeInTheDocument();
  });
});

/* ─── Close / keyboard ──────────────────────────────────────────── */
describe('Close and keyboard', () => {
  it('calls onClose when close button clicked', async () => {
    const { onClose } = renderReceipt();
    await userEvent.click(screen.getByTestId('gvr-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Done button clicked', async () => {
    const { onClose } = renderReceipt();
    await userEvent.click(screen.getByTestId('done-btn'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay backdrop clicked', async () => {
    const { onClose } = renderReceipt();
    await userEvent.click(screen.getByTestId('gvr-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when dialog card clicked', async () => {
    const { onClose } = renderReceipt();
    await userEvent.click(screen.getByTestId('gvr-dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const { onClose } = renderReceipt();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('focuses the close button on open', () => {
    renderReceipt();
    expect(document.activeElement).toBe(screen.getByTestId('gvr-close'));
  });
});

/* ─── Accessibility — axe ───────────────────────────────────────── */
describe('Accessibility — axe', () => {
  it('confirmed state has no violations', async () => {
    const { container } = renderReceipt({ txStatus: 'confirmed' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('pending state has no violations', async () => {
    const { container } = renderReceipt({ txStatus: 'pending' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('failed state has no violations', async () => {
    const { container } = renderReceipt({ txStatus: 'failed' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('share panel open has no violations', async () => {
    const { container } = renderReceipt();
    await userEvent.click(screen.getByTestId('share-toggle'));
    expect(await axe(container)).toHaveNoViolations();
  });
});

/* ─── ARIA semantics ────────────────────────────────────────────── */
describe('ARIA semantics', () => {
  it('dialog has role="dialog" and aria-modal="true"', () => {
    renderReceipt();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('dialog is labelled by its heading', () => {
    renderReceipt();
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(document.getElementById(labelId!)).toBeTruthy();
  });

  it('dialog has aria-describedby pointing to the receipt dl', () => {
    renderReceipt();
    const dialog = screen.getByRole('dialog');
    const descId = dialog.getAttribute('aria-describedby');
    expect(document.getElementById(descId!)).toBeTruthy();
  });

  it('receipt details use a <dl> with aria-label', () => {
    renderReceipt();
    expect(screen.getByRole('definition', { hidden: true }) || document.querySelector('dl[aria-label]')).toBeTruthy();
  });

  it('share toggle has aria-controls pointing to panel', async () => {
    renderReceipt();
    const toggle = screen.getByTestId('share-toggle');
    const controlsId = toggle.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    // Open it to confirm the panel gets that id
    await userEvent.click(toggle);
    expect(document.getElementById(controlsId!)).toBeTruthy();
  });
});

/* ─── Edge cases ────────────────────────────────────────────────── */
describe('Edge cases', () => {
  it('handles missing shareUrl gracefully (no share-link row)', async () => {
    renderReceipt({ shareUrl: undefined });
    await userEvent.click(screen.getByTestId('share-toggle'));
    expect(screen.queryByText(/share link/i)).not.toBeInTheDocument();
  });

  it('handles missing onRetry gracefully (no retry button when failed)', () => {
    render(<GovernanceVoteReceipt {...BASE_PROPS} txStatus="failed" onRetry={undefined} />);
    expect(screen.queryByTestId('retry-btn')).not.toBeInTheDocument();
  });

  it('handles very long proposal titles without overflow errors', () => {
    const longTitle = 'A'.repeat(200);
    expect(() => renderReceipt({ proposalTitle: longTitle })).not.toThrow();
  });

  it('handles confirming state with slow chain (0 of 12 confirmations)', () => {
    renderReceipt({ txStatus: 'confirming', currentConfirmations: 0, targetConfirmations: 12 });
    expect(screen.getByTestId('onchain-badge-confirming')).toBeInTheDocument();
  });

  it('RTL: dialog renders without errors when dir=rtl', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    expect(() => renderReceipt()).not.toThrow();
    document.documentElement.removeAttribute('dir');
  });
});
