import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Ledger } from './Ledger';
import '@testing-library/jest-dom';

describe('Ledger Component', () => {
  it('renders the ledger title and description', () => {
    render(<Ledger />);
    expect(screen.getByText('Ledger')).toBeInTheDocument();
    expect(screen.getByText(/Detailed transaction history/)).toBeInTheDocument();
  });

  it('renders the table with headers', () => {
    render(<Ledger />);
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });

  it('expands and collapses a row with sub-events', () => {
    render(<Ledger />);
    
    // Find the first expand button
    const expandButtons = screen.getAllByRole('button', { name: 'Expand row' });
    expect(expandButtons.length).toBeGreaterThan(0);
    
    // Initially sub-events table should not be visible
    expect(screen.queryByRole('columnheader', { name: 'Sub-event Date' })).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(expandButtons[0]);
    
    // Now sub-events table should be visible
    expect(screen.getByRole('columnheader', { name: 'Sub-event Date' })).toBeInTheDocument();
    
    // Click to collapse
    const collapseButton = screen.getByRole('button', { name: 'Collapse row' });
    fireEvent.click(collapseButton);
    
    // Sub-events table should be hidden again
    expect(screen.queryByRole('columnheader', { name: 'Sub-event Date' })).not.toBeInTheDocument();
  });

  it('handles pagination', () => {
    render(<Ledger />);
    
    expect(screen.getByText(/Showing 1 to 10 of 50 results/)).toBeInTheDocument();
    
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);
    
    expect(screen.getByText(/Showing 11 to 20 of 50 results/)).toBeInTheDocument();
    
    const prevButton = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevButton);
    
    expect(screen.getByText(/Showing 1 to 10 of 50 results/)).toBeInTheDocument();
  });
});
