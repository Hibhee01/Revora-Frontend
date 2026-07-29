import React from 'react';
import { Button } from '../Button';
import './GovernanceDelegation.css';

export interface DelegateData {
  id: string;
  name: string;
  address: string;
  participationRate: number;
  voteAlignment: number;
  totalDelegated: number;
}

interface DelegateProfileCardProps {
  delegate: DelegateData;
  isDelegated: boolean;
  onDelegateClick: () => void;
  onRevokeClick: () => void;
}

export const DelegateProfileCard: React.FC<DelegateProfileCardProps> = ({
  delegate,
  isDelegated,
  onDelegateClick,
  onRevokeClick,
}) => {
  return (
    <div className="delegate-profile-card glass-card" data-testid={`delegate-card-${delegate.id}`}>
      <div className="delegate-header">
        <h3 className="text-xl font-bold">{delegate.name}</h3>
        <span className="text-sm text-muted">{delegate.address}</span>
      </div>
      
      <div className="delegate-metrics">
        <div className="metric">
          <span className="metric-label">Participation Rate</span>
          <span className="metric-value">{delegate.participationRate}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Vote Alignment</span>
          <span className="metric-value">{delegate.voteAlignment}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Total Delegated</span>
          <span className="metric-value">{delegate.totalDelegated.toLocaleString()} VP</span>
        </div>
      </div>

      <div className="delegate-actions">
        {isDelegated ? (
          <Button
            variant="danger"
            onClick={onRevokeClick}
            aria-label={`Revoke delegation from ${delegate.name}`}
          >
            Revoke Delegation
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onDelegateClick}
            aria-label={`Delegate to ${delegate.name}`}
          >
            Delegate Power
          </Button>
        )}
      </div>
    </div>
  );
};
