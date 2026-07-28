/**
 * GovernanceProposalDetail — Full proposal detail page component (Issue #245).
 *
 * Features:
 * - Hero band with proposal state pill (Active, Passed, Rejected, Quorum Failed)
 * - Quorum progress bar with numeric aria labels
 * - Support (For) progress bar with threshold indicator
 * - Vote breakdown chart (For / Against / Abstain stacked bar)
 * - Vote CTA with three states: open (active), voted (already voted), closed (ended)
 * - Participation KPIs (turnout, voters, delegates)
 * - Full accessibility: aria-valuenow on progress bars, keyboard nav, sr-only table
 */

import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Clock, Vote, ChevronRight, Users, BarChart3 } from 'lucide-react';
import './GovernanceProposalDetail.css';

/* ─── Types ────────────────────────────────────────────────────────── */

export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'quorum_failed';
export type VoteChoice = 'for' | 'against' | 'abstain';

export interface ProposalData {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  /** Unix timestamp (ms) for end time */
  endTime: number;
  /** Quorum required (e.g. 4000000 tokens) */
  quorumRequired: number;
  /** Total voting power that has voted */
  quorumReached: number;
  results: {
    for: number;
    against: number;
    abstain: number;
  };
  participation: {
    turnout: number;
    uniqueVoters: number;
    delegates: number;
  };
  /** User's vote choice, or null if not voted */
  userVote: VoteChoice | null;
}

export interface GovernanceProposalDetailProps {
  proposal: ProposalData;
  /** Called when user clicks Vote CTA */
  onVote?: (choice: VoteChoice) => void;
  className?: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function formatTokenAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return formatNumber(n);
}

function formatTimeRemaining(endTime: number): string {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/* ─── Proposal State Pill ──────────────────────────────────────────── */

function StatePill({ status }: { status: ProposalStatus }) {
  const config: Record<ProposalStatus, { icon: React.ReactNode; label: string; className: string }> = {
    active: { icon: <Clock size={12} aria-hidden="true" />, label: 'Active', className: 'gpd-pill--active' },
    passed: { icon: <CheckCircle2 size={12} aria-hidden="true" />, label: 'Passed', className: 'gpd-pill--passed' },
    rejected: { icon: <XCircle size={12} aria-hidden="true" />, label: 'Rejected', className: 'gpd-pill--rejected' },
    quorum_failed: { icon: <MinusCircle size={12} aria-hidden="true" />, label: 'Quorum Failed', className: 'gpd-pill--quorum' },
  };
  const c = config[status];

  return (
    <span className={`gpd-pill ${c.className}`} data-testid={`proposal-pill-${status}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

/* ─── Progress Bar ─────────────────────────────────────────────────── */

function ProgressBar({
  value,
  max,
  label,
  threshold,
  color,
  testId,
}: {
  value: number;
  max: number;
  label: string;
  threshold?: number;
  color: string;
  testId: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="gpd-progress-section" data-testid={testId}>
      <div className="gpd-progress-header">
        <span className="gpd-progress-label">{label}</span>
        <span className="gpd-progress-values">
          <span className="gpd-progress-current">{formatTokenAmount(value)}</span>
          {max > 0 && <span className="gpd-progress-max"> / {formatTokenAmount(max)}</span>}
        </span>
      </div>
      <div
        className="gpd-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-label={`${label}: ${formatTokenAmount(value)} of ${formatTokenAmount(max)}`}
      >
        <div
          className="gpd-progress-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        {threshold !== undefined && (
          <div
            className="gpd-progress-threshold"
            style={{ left: `${Math.min((threshold / max) * 100, 100)}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

/* ─── Vote CTA ─────────────────────────────────────────────────────── */

function VoteCTA({
  status,
  userVote,
  onVote,
}: {
  status: ProposalStatus;
  userVote: VoteChoice | null;
  onVote?: (choice: VoteChoice) => void;
}) {
  if (status !== 'active') {
    return (
      <div className="gpd-vote-cta gpd-vote-cta--closed" data-testid="vote-cta-closed">
        <BarChart3 size={18} aria-hidden="true" />
        <span>Voting has {status === 'passed' ? 'closed — proposal passed' : status === 'rejected' ? 'closed — proposal rejected' : 'ended — quorum was not reached'}</span>
      </div>
    );
  }

  if (userVote) {
    const voteLabels: Record<VoteChoice, string> = { for: 'For', against: 'Against', abstain: 'Abstain' };
    return (
      <div className="gpd-vote-cta gpd-vote-cta--voted" data-testid="vote-cta-voted">
        <CheckCircle2 size={18} aria-hidden="true" />
        <span>You voted <strong>{voteLabels[userVote]}</strong></span>
      </div>
    );
  }

  return (
    <div className="gpd-vote-cta gpd-vote-cta--open" data-testid="vote-cta-open">
      <span className="gpd-vote-heading">Cast your vote</span>
      <div className="gpd-vote-actions">
        <button
          className="gpd-vote-btn gpd-vote-btn--for"
          onClick={() => onVote?.('for')}
          type="button"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          For
        </button>
        <button
          className="gpd-vote-btn gpd-vote-btn--against"
          onClick={() => onVote?.('against')}
          type="button"
        >
          <XCircle size={16} aria-hidden="true" />
          Against
        </button>
        <button
          className="gpd-vote-btn gpd-vote-btn--abstain"
          onClick={() => onVote?.('abstain')}
          type="button"
        >
          <MinusCircle size={16} aria-hidden="true" />
          Abstain
        </button>
      </div>
    </div>
  );
}

/* ─── Vote Breakdown Chart ─────────────────────────────────────────── */

function VoteBreakdown({
  results,
}: {
  results: ProposalData['results'];
}) {
  const total = results.for + results.against + results.abstain;
  const forPct = total > 0 ? (results.for / total) * 100 : 0;
  const againstPct = total > 0 ? (results.against / total) * 100 : 0;
  const abstainPct = total > 0 ? (results.abstain / total) * 100 : 0;

  return (
    <div className="gpd-breakdown" data-testid="vote-breakdown">
      <div className="gpd-breakdown-title">Vote Breakdown</div>

      {/* Screen reader table */}
      <div className="sr-only">
        <table>
          <caption>Voting results</caption>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Votes</th>
              <th scope="col">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>For</td><td>{formatNumber(results.for)}</td><td>{forPct.toFixed(1)}%</td></tr>
            <tr><td>Against</td><td>{formatNumber(results.against)}</td><td>{againstPct.toFixed(1)}%</td></tr>
            <tr><td>Abstain</td><td>{formatNumber(results.abstain)}</td><td>{abstainPct.toFixed(1)}%</td></tr>
          </tbody>
        </table>
      </div>

      {/* Visual stacked bar */}
      <div className="gpd-breakdown-bar" aria-hidden="true">
        {total > 0 ? (
          <>
            <div className="gpd-bar-segment gpd-bar--for" style={{ width: `${forPct}%` }} />
            <div className="gpd-bar-segment gpd-bar--against" style={{ width: `${againstPct}%` }} />
            <div className="gpd-bar-segment gpd-bar--abstain" style={{ width: `${abstainPct}%` }} />
          </>
        ) : (
          <div className="gpd-bar-empty">No votes cast</div>
        )}
      </div>

      {/* Legend */}
      <div className="gpd-breakdown-legend" aria-hidden="true">
        <LegendItem color="var(--success)" label="For" pct={forPct} value={results.for} />
        <LegendItem color="var(--error)" label="Against" pct={againstPct} value={results.against} />
        <LegendItem color="var(--text-muted)" label="Abstain" pct={abstainPct} value={results.abstain} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, pct, value }: { color: string; label: string; pct: number; value: number }) {
  return (
    <div className="gpd-legend-item">
      <span className="gpd-legend-swatch" style={{ backgroundColor: color }} />
      <span className="gpd-legend-label">{label}</span>
      <span className="gpd-legend-pct">{pct.toFixed(1)}%</span>
      <span className="gpd-legend-value">{formatNumber(value)}</span>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */

export const GovernanceProposalDetail: React.FC<GovernanceProposalDetailProps> = ({
  proposal,
  onVote,
  className = '',
}) => {
  const {
    title,
    description,
    proposer,
    status,
    endTime,
    quorumRequired,
    quorumReached,
    results,
    participation,
    userVote,
  } = proposal;

  const totalSupport = results.for;
  const endLabel = formatTimeRemaining(endTime);

  return (
    <div className={`gpd-container ${className}`} data-testid="governance-proposal-detail">
      {/* Hero Band */}
      <div className="gpd-hero">
        <div className="gpd-hero-top">
          <StatePill status={status} />
          {status === 'active' && (
            <span className="gpd-time-remaining" data-testid="time-remaining">
              <Clock size={14} aria-hidden="true" />
              {endLabel}
            </span>
          )}
        </div>
        <h1 className="gpd-title">{title}</h1>
        <p className="gpd-description">{description}</p>
        <div className="gpd-proposer">
          <Users size={14} aria-hidden="true" />
          Proposed by <strong>{proposer}</strong>
        </div>
      </div>

      {/* Progress Bars — Quorum vs Support */}
      <div className="gpd-bars">
        <ProgressBar
          value={quorumReached}
          max={quorumRequired}
          label="Quorum"
          threshold={quorumRequired}
          color="var(--primary)"
          testId="progress-quorum"
        />
        <ProgressBar
          value={totalSupport}
          max={quorumReached}
          label="Support (For)"
          color="var(--success)"
          testId="progress-support"
        />
      </div>

      {/* Vote CTA */}
      <VoteCTA status={status} userVote={userVote} onVote={onVote} />

      {/* Vote Breakdown */}
      <VoteBreakdown results={results} />

      {/* Participation KPIs */}
      <div className="gpd-participation">
        <div className="gpd-participation-header">Participation</div>
        <div className="gpd-participation-grid">
          <div className="gpd-kpi-card">
            <span className="gpd-kpi-label">Turnout</span>
            <span className="gpd-kpi-value">{participation.turnout.toFixed(1)}%</span>
          </div>
          <div className="gpd-kpi-card">
            <span className="gpd-kpi-label">Voters</span>
            <span className="gpd-kpi-value">{formatNumber(participation.uniqueVoters)}</span>
          </div>
          <div className="gpd-kpi-card">
            <span className="gpd-kpi-label">Delegates</span>
            <span className="gpd-kpi-value">{formatNumber(participation.delegates)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
