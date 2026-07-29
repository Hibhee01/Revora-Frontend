/**
 * GovernanceProposalCreatePage — Issue #247
 *
 * Page wrapper for the multi-step governance proposal creation form.
 * Provides a full-page layout with the form component.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GovernanceProposalForm, ProposalDraft } from '../components/GovernanceProposalForm/GovernanceProposalForm';

export const GovernanceProposalCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (draft: ProposalDraft) => {
    console.log('Proposal submitted:', draft);
    // In a real app, this would submit the proposal to the blockchain
    // and navigate to the proposal detail page
    navigate('/startup/dashboard');
  };

  const handleCancel = () => {
    navigate('/startup/dashboard');
  };

  return (
    <GovernanceProposalForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

export default GovernanceProposalCreatePage;
