import React from 'react';

export type GovernanceResultsProps = {
  results: {
    for: number;
    against: number;
    abstain: number;
  };
  participation: {
    turnout: number; // percentage (0-100)
    uniqueVoters: number;
    delegates: number;
  };
  status: 'passed' | 'rejected' | 'quorum_failed';
  className?: string;
};

export const GovernanceResults: React.FC<GovernanceResultsProps> = ({
  results,
  participation,
  status,
  className = '',
}) => {
  const totalVotes = results.for + results.against + results.abstain;
  
  // Guard against division by zero
  const forPct = totalVotes > 0 ? (results.for / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (results.against / totalVotes) * 100 : 0;
  const abstainPct = totalVotes > 0 ? (results.abstain / totalVotes) * 100 : 0;

  // Single-voter proposal formatting
  const voterText =
    participation.uniqueVoters === 1
      ? 'a single voter'
      : `${participation.uniqueVoters} unique voters`;

  const delegateText =
    participation.delegates > 0
      ? ` and ${participation.delegates} delegate${participation.delegates === 1 ? '' : 's'}`
      : '';

  const statusText = status === 'passed' ? 'passed' : status === 'rejected' ? 'was rejected' : 'failed quorum';

  const summarySentence = `The proposal ${statusText} with ${participation.turnout.toFixed(
    1
  )}% turnout, decided by ${voterText}${delegateText}.`;

  const formatVote = (value: number) => new Intl.NumberFormat('en-US').format(value);
  const formatPct = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className={`glass-card p-6 space-y-6 ${className}`}>
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Results Breakdown</h2>
        <p className="text-muted text-sm">{summarySentence}</p>
      </div>

      {/* Screen Reader Only Table */}
      <div className="sr-only">
        <table>
          <caption>Voting Results</caption>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Votes</th>
              <th scope="col">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">For</th>
              <td>{results.for}</td>
              <td>{forPct.toFixed(1)}%</td>
            </tr>
            <tr>
              <th scope="row">Against</th>
              <td>{results.against}</td>
              <td>{againstPct.toFixed(1)}%</td>
            </tr>
            <tr>
              <th scope="row">Abstain</th>
              <td>{results.abstain}</td>
              <td>{abstainPct.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stacked Chart with Pattern Fills */}
      <div className="space-y-3" aria-hidden="true">
        <div className="flex h-6 w-full rounded-full overflow-hidden shadow-inner bg-slate-800">
          {totalVotes > 0 ? (
            <>
              <div
                style={{
                  width: `${forPct}%`,
                  backgroundColor: 'var(--success)',
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 12px)',
                }}
                title="For"
              />
              <div
                style={{
                  width: `${againstPct}%`,
                  backgroundColor: 'var(--error)',
                  backgroundImage:
                    'repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 12px)',
                }}
                title="Against"
              />
              <div
                style={{
                  width: `${abstainPct}%`,
                  backgroundColor: 'var(--text-muted)',
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2.5px)',
                  backgroundSize: '8px 8px',
                }}
                title="Abstain"
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-muted">
              No votes cast
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--success)', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)' }}></div>
            <span className="font-medium text-main">For: {formatPct(forPct)}</span>
            <span className="text-muted">({formatVote(results.for)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--error)', backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)' }}></div>
            <span className="font-medium text-main">Against: {formatPct(againstPct)}</span>
            <span className="text-muted">({formatVote(results.against)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--text-muted)', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2.5px)', backgroundSize: '8px 8px' }}></div>
            <span className="font-medium text-main">Abstain: {formatPct(abstainPct)}</span>
            <span className="text-muted">({formatVote(results.abstain)})</span>
          </div>
        </div>
      </div>

      {/* Participation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--glass-border)]">
        <div className="p-3 bg-[rgba(15,23,42,0.4)] rounded-xl border border-[var(--glass-border)]">
          <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Turnout</div>
          <div className="text-xl font-semibold text-main">{participation.turnout.toFixed(1)}%</div>
        </div>
        <div className="p-3 bg-[rgba(15,23,42,0.4)] rounded-xl border border-[var(--glass-border)]">
          <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Unique Voters</div>
          <div className="text-xl font-semibold text-main">{formatVote(participation.uniqueVoters)}</div>
        </div>
        <div className="p-3 bg-[rgba(15,23,42,0.4)] rounded-xl border border-[var(--glass-border)]">
          <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Delegates</div>
          <div className="text-xl font-semibold text-main">{formatVote(participation.delegates)}</div>
        </div>
      </div>
    </div>
  );
};
