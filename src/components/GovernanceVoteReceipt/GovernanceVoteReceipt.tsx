/**
 * GovernanceVoteReceipt — Issue #472
 *
 * A focus-managed dialog shown after a voter casts a vote, providing
 * proof of their action and a link to verify on-chain.
 *
 * Features
 * ─────────
 * - Proposal title, vote choice badge, timestamp, voter address
 * - Transaction hash: truncated display + copy-to-clipboard action
 * - "View on explorer" link to the block explorer
 * - Pending → Confirming → Confirmed state transitions (via OnchainBadge)
 * - Failed tx state with retry affordance
 * - Share-receipt panel: copy shareable link + copy plain-text summary
 * - WCAG 2.1 AA: role="dialog", focus trap, Escape closes, visible focus rings
 * - Responsive: full-width on mobile, max-width card on desktop
 * - RTL: logical CSS properties throughout
 * - Reduced-motion: no CSS animations added beyond what the OS allows
 * - Forced-colors: explicit borders preserved
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
} from 'lucide-react';
import { OnchainBadge } from '../OnchainBadge/OnchainBadge';
import type { OnchainBadgeVariant } from '../OnchainBadge/OnchainBadge';
import { Button } from '../Button';
import './GovernanceVoteReceipt.css';

/* ─── Types ────────────────────────────────────────────────────── */

export type VoteChoice = 'for' | 'against' | 'abstain';

export type TxStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

export interface GovernanceVoteReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  /** The proposal being voted on */
  proposalTitle: string;
  proposalId: string;
  /** The voter's choice */
  voteChoice: VoteChoice;
  /** ISO timestamp when the vote was cast */
  votedAt: string;
  /** Voter's wallet address */
  voterAddress: string;
  /** On-chain tx hash */
  txHash: string;
  /** Current on-chain confirmation status */
  txStatus: TxStatus;
  /** Confirmations received so far (for confirming state) */
  currentConfirmations?: number;
  /** Target confirmations needed */
  targetConfirmations?: number;
  /** Block explorer base URL, e.g. "https://stellar.expert/explorer/public/tx/" */
  explorerBaseUrl?: string;
  /** Shareable link for this vote receipt */
  shareUrl?: string;
  /** Called when user clicks Retry on a failed tx */
  onRetry?: () => void;
}

/* ─── Helpers ──────────────────────────────────────────────────── */

const VOTE_LABELS: Record<VoteChoice, string> = {
  for: 'For',
  against: 'Against',
  abstain: 'Abstain',
};

function truncateHash(hash: string, head = 10, tail = 8): string {
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildShareText(
  proposalTitle: string,
  voteChoice: VoteChoice,
  txHash: string,
  votedAt: string,
): string {
  return [
    `🗳 I voted ${VOTE_LABELS[voteChoice]} on "${proposalTitle}"`,
    `📅 ${formatTimestamp(votedAt)}`,
    `🔗 TX: ${txHash}`,
  ].join('\n');
}

function txStatusToBadgeVariant(status: TxStatus): OnchainBadgeVariant {
  switch (status) {
    case 'pending':     return 'pending';
    case 'confirming':  return 'confirming';
    case 'confirmed':   return 'confirmed';
    case 'failed':      return 'retrying'; // closest visual for failed
  }
}

/* ─── VoteChoiceBadge ──────────────────────────────────────────── */

const VoteChoiceBadge: React.FC<{ choice: VoteChoice }> = ({ choice }) => {
  const Icon = choice === 'for' ? ThumbsUp : choice === 'against' ? ThumbsDown : Minus;
  return (
    <span className={`gvr-choice-badge gvr-choice-badge--${choice}`} aria-label={`Vote: ${VOTE_LABELS[choice]}`}>
      <Icon size={14} aria-hidden="true" />
      {VOTE_LABELS[choice]}
    </span>
  );
};

/* ─── CopyButton ───────────────────────────────────────────────── */

interface CopyButtonProps {
  value: string;
  label: string;
  compact?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, label, compact }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — silent fail
    }
  }, [value]);

  return (
    <button
      type="button"
      className={`gvr-copy-btn ${copied ? 'gvr-copy-btn--copied' : ''} ${compact ? 'gvr-copy-btn--compact' : ''}`}
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      aria-pressed={copied}
      data-testid={`copy-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {copied ? (
        <><CheckCircle2 size={13} aria-hidden="true" />{!compact && ' Copied'}</>
      ) : (
        <><Copy size={13} aria-hidden="true" />{!compact && ' Copy'}</>
      )}
    </button>
  );
};

/* ─── SharePanel ───────────────────────────────────────────────── */

interface SharePanelProps {
  proposalTitle: string;
  voteChoice: VoteChoice;
  txHash: string;
  votedAt: string;
  shareUrl?: string;
}

const SharePanel: React.FC<SharePanelProps> = ({
  proposalTitle,
  voteChoice,
  txHash,
  votedAt,
  shareUrl,
}) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const plainText = buildShareText(proposalTitle, voteChoice, txHash, votedAt);

  return (
    <div className="gvr-share">
      <button
        type="button"
        className="gvr-share-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="share-toggle"
      >
        <Share2 size={15} aria-hidden="true" />
        Share receipt
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </button>

      {open && (
        <div id={panelId} className="gvr-share-panel" data-testid="share-panel">
          {shareUrl && (
            <div className="gvr-share-row">
              <span className="gvr-share-label">Share link</span>
              <div className="gvr-share-value-row">
                <code className="gvr-share-url" title={shareUrl}>
                  {shareUrl.length > 60 ? `${shareUrl.slice(0, 60)}…` : shareUrl}
                </code>
                <CopyButton value={shareUrl} label="share link" compact />
              </div>
            </div>
          )}
          <div className="gvr-share-row">
            <span className="gvr-share-label">Plain text summary</span>
            <div className="gvr-share-value-row">
              <pre className="gvr-share-text">{plainText}</pre>
              <CopyButton value={plainText} label="text summary" compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Dialog ──────────────────────────────────────────────── */

export const GovernanceVoteReceipt: React.FC<GovernanceVoteReceiptProps> = ({
  isOpen,
  onClose,
  proposalTitle,
  proposalId,
  voteChoice,
  votedAt,
  voterAddress,
  txHash,
  txStatus,
  currentConfirmations = 0,
  targetConfirmations = 12,
  explorerBaseUrl = 'https://stellar.expert/explorer/public/tx/',
  shareUrl,
  onRetry,
}) => {
  const dialogRef  = useRef<HTMLDivElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);
  const prevFocus  = useRef<HTMLElement | null>(null);
  const titleId    = useId();
  const descId     = useId();

  /* Focus management */
  useEffect(() => {
    if (isOpen) {
      prevFocus.current = document.activeElement as HTMLElement;
      closeRef.current?.focus();
    } else {
      prevFocus.current?.focus();
    }
  }, [isOpen]);

  /* Escape + focus trap */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const explorerUrl = `${explorerBaseUrl}${txHash}`;
  const isFailed    = txStatus === 'failed';
  const isConfirmed = txStatus === 'confirmed';

  return (
    <div
      className="gvr-overlay"
      onClick={onClose}
      role="presentation"
      data-testid="gvr-overlay"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="gvr-dialog"
        onClick={(e) => e.stopPropagation()}
        data-testid="gvr-dialog"
      >
        {/* ── Header ── */}
        <div className="gvr-header">
          <div className="gvr-header-left">
            <div className={`gvr-icon ${isConfirmed ? 'gvr-icon--confirmed' : isFailed ? 'gvr-icon--failed' : 'gvr-icon--pending'}`} aria-hidden="true">
              {isFailed ? <AlertTriangle size={22} /> : isConfirmed ? <CheckCircle2 size={22} /> : <Clock size={22} />}
            </div>
            <div>
              <p className="gvr-eyebrow">Vote receipt</p>
              <h2 id={titleId} className="gvr-title">
                {isConfirmed ? 'Vote confirmed on-chain' : isFailed ? 'Transaction failed' : 'Vote submitted'}
              </h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="gvr-close"
            onClick={onClose}
            aria-label="Close vote receipt"
            data-testid="gvr-close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* ── Status badge ── */}
        <div className="gvr-status-row">
          <OnchainBadge
            variant={txStatusToBadgeVariant(txStatus)}
            currentConfirmations={currentConfirmations}
            targetConfirmations={targetConfirmations}
          />
          {isFailed && (
            <span className="gvr-failed-label" role="alert">
              Transaction failed. Check network conditions and retry.
            </span>
          )}
        </div>

        {/* ── Receipt body ── */}
        <dl className="gvr-receipt" aria-label="Vote receipt details" id={descId}>
          <div className="gvr-receipt-row">
            <dt>Proposal</dt>
            <dd className="gvr-proposal-title" title={proposalTitle}>
              {proposalTitle}
            </dd>
          </div>

          <div className="gvr-receipt-row">
            <dt>Your vote</dt>
            <dd><VoteChoiceBadge choice={voteChoice} /></dd>
          </div>

          <div className="gvr-receipt-row">
            <dt>Timestamp</dt>
            <dd>
              <time dateTime={votedAt}>{formatTimestamp(votedAt)}</time>
            </dd>
          </div>

          <div className="gvr-receipt-row">
            <dt>Voter</dt>
            <dd className="gvr-address" title={voterAddress}>
              {truncateHash(voterAddress, 8, 6)}
              <CopyButton value={voterAddress} label="voter address" compact />
            </dd>
          </div>

          <div className="gvr-receipt-row gvr-receipt-row--hash">
            <dt>Transaction hash</dt>
            <dd className="gvr-hash-row">
              <code className="gvr-hash" title={txHash} data-testid="tx-hash-display">
                {truncateHash(txHash)}
              </code>
              <div className="gvr-hash-actions">
                <CopyButton value={txHash} label="transaction hash" compact />
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gvr-explorer-link"
                  aria-label="View transaction on block explorer (opens in new tab)"
                  data-testid="explorer-link"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  Explorer
                </a>
              </div>
            </dd>
          </div>
        </dl>

        {/* ── Failed state retry ── */}
        {isFailed && onRetry && (
          <div className="gvr-retry-section">
            <Button
              variant="primary"
              onClick={onRetry}
              type="button"
              data-testid="retry-btn"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Retry transaction
            </Button>
          </div>
        )}

        {/* ── Share panel ── */}
        <SharePanel
          proposalTitle={proposalTitle}
          voteChoice={voteChoice}
          txHash={txHash}
          votedAt={votedAt}
          shareUrl={shareUrl}
        />

        {/* ── Footer ── */}
        <div className="gvr-footer">
          <Button variant="secondary" onClick={onClose} type="button" data-testid="done-btn">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

GovernanceVoteReceipt.displayName = 'GovernanceVoteReceipt';
export default GovernanceVoteReceipt;
