import React from 'react';
import { render, screen } from '@testing-library/react';
import { GovernanceResults } from './GovernanceResults';

describe('GovernanceResults', () => {
  const defaultProps = {
    results: { for: 1000, against: 500, abstain: 100 },
    participation: { turnout: 65.5, uniqueVoters: 42, delegates: 5 },
    status: 'passed' as const,
  };

  it('renders summary sentence and KPIs', () => {
    render(<GovernanceResults {...defaultProps} />);
    
    // Summary sentence
    expect(screen.getByText(/The proposal passed with 65.5% turnout, decided by 42 unique voters and 5 delegates./i)).toBeInTheDocument();
    
    // KPIs
    expect(screen.getByText('65.5%')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles single voter correctly', () => {
    render(
      <GovernanceResults
        {...defaultProps}
        participation={{ turnout: 10, uniqueVoters: 1, delegates: 0 }}
      />
    );
    expect(screen.getByText(/decided by a single voter./i)).toBeInTheDocument();
  });

  it('handles zero votes correctly', () => {
    render(
      <GovernanceResults
        {...defaultProps}
        results={{ for: 0, against: 0, abstain: 0 }}
      />
    );
    // Table should show 0%
    const tableCells = screen.getAllByText('0.0%');
    expect(tableCells.length).toBeGreaterThan(0);
    // Empty chart fallback
    expect(screen.getByText('No votes cast')).toBeInTheDocument();
  });

  it('provides an accessible table alternative', () => {
    render(<GovernanceResults {...defaultProps} />);
    
    // The table should have a caption
    expect(screen.getByText('Voting Results')).toBeInTheDocument();
    
    // Check if table cells exist for 'For'
    expect(screen.getByRole('row', { name: /For 1000 62.5%/i })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Against 500 31.3%/i })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Abstain 100 6.3%/i })).toBeInTheDocument();
  });

  it('handles different statuses', () => {
    const { rerender } = render(<GovernanceResults {...defaultProps} status="rejected" />);
    expect(screen.getByText(/The proposal was rejected/i)).toBeInTheDocument();

    rerender(<GovernanceResults {...defaultProps} status="quorum_failed" />);
    expect(screen.getByText(/The proposal failed quorum/i)).toBeInTheDocument();
  });
});
