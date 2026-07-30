/**
 * GovernanceVoteReceiptDemo — Issue #472
 * Route: /startup/governance/vote-receipt
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Vote } from 'lucide-react';
import { GovernanceVoteReceipt } from '../components/GovernanceVoteReceipt';
import type { VoteChoice, TxStatus } from '../components/GovernanceVoteReceipt';
import { Button } from '../components/Button';

const TX_HASH = '0xdeadbeefcafe1234deadbeefcafe1234deadbeefcafe1234deadbeefcafe1234';
const VOTER   = '0xabc123def456abc123def456abc123def456abc1';
const SHARE_URL = 'https://app.revora.io/governance/prop-001/receipt?voter=0xabc';

type Scenario = 'confirmed' | 'pending' | 'confirming' | 'failed';

const SCENARIOS: { key: Scenario; label: string; desc: string }[] = [
  { key: 'confirmed',  label: 'Confirmed',  desc: 'Fully confirmed on-chain (12/12)' },
  { key: 'pending',    label: 'Pending',    desc: 'Awaiting network pick-up' },
  { key: 'confirming', label: 'Confirming', desc: 'Slow chain — 6 of 12 confirmations' },
  { key: 'failed',     label: 'Failed tx',  desc: 'Transaction reverted on-chain' },
];

const CHOICES: { key: VoteChoice; label: string }[] = [
  { key: 'for',     label: 'For'     },
  { key: 'against', label: 'Against' },
  { key: 'abstain', label: 'Abstain' },
];

export const GovernanceVoteReceiptDemo: React.FC = () => {
  const [open,     setOpen]     = useState(false);
  const [scenario, setScenario] = useState<Scenario>('confirmed');
  const [choice,   setChoice]   = useState<VoteChoice>('for');
  const [retried,  setRetried]  = useState(false);

  const txStatus: TxStatus = scenario;
  const confirmations = scenario === 'confirming' ? 6 : scenario === 'confirmed' ? 12 : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--spacing-xl) var(--spacing-lg)', color: 'var(--text-main)', fontFamily: 'inherit' }}>

      {/* Nav */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xl)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft size={14} aria-hidden="true" /> Home
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-muted)' }} aria-current="page">Governance Vote Receipt Demo</span>
      </nav>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: 'var(--radius-xl)', background: 'rgba(59,130,246,.12)', color: 'var(--primary)', flexShrink: 0 }}>
          <Vote size={24} aria-hidden="true" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Governance Vote Receipt
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Issue #472 · Proof-of-vote dialog with on-chain link, copy-hash, and share-receipt
          </p>
        </div>
      </div>

      {/* Controls */}
      <section aria-labelledby="controls-heading" style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 id="controls-heading" style={{ margin: '0 0 var(--spacing-md)', fontSize: 'var(--font-size-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Scenario
        </h2>
        <div role="group" aria-label="Transaction status scenario" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-lg)' }}>
          {SCENARIOS.map(s => (
            <button
              key={s.key}
              type="button"
              aria-pressed={scenario === s.key}
              onClick={() => { setScenario(s.key); setRetried(false); }}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${scenario === s.key ? 'var(--primary)' : 'var(--glass-border-bright)'}`,
                background: scenario === s.key ? 'var(--primary)' : 'var(--glass-bg)',
                color: scenario === s.key ? '#fff' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
              <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.75, fontWeight: 400 }}>{s.desc}</span>
            </button>
          ))}
        </div>

        <h2 style={{ margin: '0 0 var(--spacing-sm)', fontSize: 'var(--font-size-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Vote choice
        </h2>
        <div role="group" aria-label="Vote choice" style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xl)' }}>
          {CHOICES.map(c => (
            <button
              key={c.key}
              type="button"
              aria-pressed={choice === c.key}
              onClick={() => setChoice(c.key)}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${choice === c.key ? 'var(--primary)' : 'var(--glass-border-bright)'}`,
                background: choice === c.key ? 'var(--primary)' : 'var(--glass-bg)',
                color: choice === c.key ? '#fff' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {retried && (
          <div role="status" style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 'var(--radius-md)', color: '#10b981', fontSize: 'var(--font-size-sm)' }}>
            ✓ Retry triggered — switching to confirming state
          </div>
        )}

        <Button variant="primary" type="button" onClick={() => setOpen(true)}>
          Open vote receipt dialog
        </Button>
      </section>

      {/* Dialog */}
      <GovernanceVoteReceipt
        isOpen={open}
        onClose={() => setOpen(false)}
        proposalTitle="Increase Protocol Treasury Allocation by 15%"
        proposalId="prop-001"
        voteChoice={choice}
        votedAt="2026-07-28T14:15:00Z"
        voterAddress={VOTER}
        txHash={TX_HASH}
        txStatus={txStatus}
        currentConfirmations={confirmations}
        targetConfirmations={12}
        explorerBaseUrl="https://stellar.expert/explorer/public/tx/"
        shareUrl={SHARE_URL}
        onRetry={() => { setRetried(true); setScenario('confirming'); }}
      />
    </div>
  );
};

export default GovernanceVoteReceiptDemo;
