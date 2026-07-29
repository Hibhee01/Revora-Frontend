import React, { useState } from 'react';
import { DelegateSearch } from './DelegateSearch';
import { DelegateProfileCard, DelegateData } from './DelegateProfileCard';
import { DelegationConfirmDialog, RevokeConfirmDialog } from './DelegationDialogs';
import './GovernanceDelegation.css';

const MOCK_DELEGATES: Record<string, DelegateData> = {
  'del-1': { id: 'del-1', name: 'Alice Voter', address: '0x1234...5678', participationRate: 98, voteAlignment: 85, totalDelegated: 1500000 },
  'del-2': { id: 'del-2', name: 'Bob Stake', address: '0x8765...4321', participationRate: 92, voteAlignment: 70, totalDelegated: 800000 },
  'del-3': { id: 'del-3', name: 'Charlie Node', address: '0xABCD...EF01', participationRate: 100, voteAlignment: 95, totalDelegated: 3200000 },
};

export const GovernanceDelegation: React.FC = () => {
  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(null);
  const [currentDelegatedId, setCurrentDelegatedId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  const selectedDelegate = selectedDelegateId ? MOCK_DELEGATES[selectedDelegateId] : null;

  const handleDelegateConfirm = () => {
    setCurrentDelegatedId(selectedDelegateId);
    setIsConfirmOpen(false);
  };

  const handleRevokeConfirm = () => {
    setCurrentDelegatedId(null);
    setSelectedDelegateId(null);
    setIsRevokeOpen(false);
  };

  return (
    <section className="governance-delegation" aria-labelledby="delegation-heading">
      <h2 id="delegation-heading" className="text-2xl font-semibold mb-4">Governance Delegation</h2>
      <p className="text-muted mb-6">Search for a delegate to review their track record and assign your voting power.</p>

      <div className="delegation-grid">
        <div className="delegation-search-col">
          <DelegateSearch onSelectDelegate={setSelectedDelegateId} />
        </div>
        
        <div className="delegation-profile-col">
          {selectedDelegate ? (
            <DelegateProfileCard
              delegate={selectedDelegate}
              isDelegated={currentDelegatedId === selectedDelegate.id}
              onDelegateClick={() => setIsConfirmOpen(true)}
              onRevokeClick={() => setIsRevokeOpen(true)}
            />
          ) : currentDelegatedId ? (
            <DelegateProfileCard
              delegate={MOCK_DELEGATES[currentDelegatedId]}
              isDelegated={true}
              onDelegateClick={() => {}}
              onRevokeClick={() => setIsRevokeOpen(true)}
            />
          ) : (
            <div className="empty-profile-state glass-card text-muted">
              Select a delegate to view their profile.
            </div>
          )}
        </div>
      </div>

      {selectedDelegate && (
        <DelegationConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelegateConfirm}
          delegateName={selectedDelegate.name}
        />
      )}

      <RevokeConfirmDialog
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        onConfirm={handleRevokeConfirm}
      />
    </section>
  );
};
