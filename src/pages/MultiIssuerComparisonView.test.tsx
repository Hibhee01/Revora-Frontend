import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MultiIssuerComparisonView } from './MultiIssuerComparisonView';
import { IssuerComparisonData } from './DistributionDashboard.types';

expect.extend(toHaveNoViolations);

const MOCK_ISSUERS: IssuerComparisonData[] = [
  {
    issuerId: 'iss-1',
    issuerName: 'Nexus Cloud Series A',
    color: '#3b82f6',
    kpis: { totalDistributed: 125000, activePayouts: 3, gasSpent: 245.5, pendingRetries: 0 },
    chartData: [
      { label: 'Jan', value: 12000 },
      { label: 'Feb', value: 15000 },
      { label: 'Mar', value: 18000 },
      { label: 'Apr', value: 22000 },
      { label: 'May', value: 28000 },
      { label: 'Jun', value: 30000 },
    ],
    complianceStatus: 'compliant',
    complianceNote: 'All documentation up to date.',
  },
  {
    issuerId: 'iss-2',
    issuerName: 'AeroDynamics AI',
    color: '#10b981',
    kpis: { totalDistributed: 98000, activePayouts: 2, gasSpent: 189.0, pendingRetries: 1 },
    chartData: [
      { label: 'Jan', value: 8000 },
      { label: 'Feb', value: 12000 },
      { label: 'Mar', value: 16000 },
      { label: 'Apr', value: 19000 },
      { label: 'May', value: 21000 },
      { label: 'Jun', value: 22000 },
    ],
    complianceStatus: 'review',
    complianceNote: 'Annual audit pending.',
  },
  {
    issuerId: 'iss-3',
    issuerName: 'BioHealth Tech',
    color: '#f59e0b',
    kpis: { totalDistributed: 156000, activePayouts: 4, gasSpent: 312.8, pendingRetries: 0 },
    chartData: [
      { label: 'Jan', value: 18000 },
      { label: 'Feb', value: 22000 },
      { label: 'Mar', value: 26000 },
      { label: 'Apr', value: 30000 },
      { label: 'May', value: 28000 },
      { label: 'Jun', value: 32000 },
    ],
    complianceStatus: 'compliant',
    complianceNote: 'Quarterly review passed.',
  },
  {
    issuerId: 'iss-4',
    issuerName: 'Quantum Ledger',
    color: '#8b5cf6',
    kpis: { totalDistributed: 67000, activePayouts: 1, gasSpent: 98.4, pendingRetries: 2 },
    chartData: [
      { label: 'Jan', value: 5000 },
      { label: 'Feb', value: 8000 },
      { label: 'Mar', value: 12000 },
      { label: 'Apr', value: 14000 },
      { label: 'May', value: 11000 },
      { label: 'Jun', value: 17000 },
    ],
    complianceStatus: 'hold',
    complianceNote: 'KYC documentation under review.',
  },
];

describe('MultiIssuerComparisonView', () => {
  it('renders the comparison section with heading', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    expect(screen.getByText('Multi-Issuer Comparison')).toBeInTheDocument();
    expect(screen.getByTestId('multi-issuer-comparison')).toBeInTheDocument();
  });

  it('renders picker chips for all available issuers', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    expect(screen.getByTestId('mic-picker-row')).toBeInTheDocument();
    MOCK_ISSUERS.forEach((issuer) => {
      expect(screen.getByTestId(`mic-chip-${issuer.issuerId}`)).toBeInTheDocument();
    });
  });

  it('shows empty state when no issuers are selected', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    expect(screen.getByTestId('mic-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Pick issuers above to see a side-by-side comparison/i)).toBeInTheDocument();
  });

  it('selects up to 4 issuers when chips are clicked', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-2'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-3'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-4'));

    expect(screen.getByTestId('mic-grid')).toBeInTheDocument();
    expect(screen.getByTestId('mic-column-iss-1')).toBeInTheDocument();
    expect(screen.getByTestId('mic-column-iss-2')).toBeInTheDocument();
    expect(screen.getByTestId('mic-column-iss-3')).toBeInTheDocument();
    expect(screen.getByTestId('mic-column-iss-4')).toBeInTheDocument();
  });

  it('does not select more than maxColumns issuers', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} maxColumns={2} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-2'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-3'));

    const grid = screen.getByTestId('mic-grid');
    expect(grid.children.length).toBe(2);
  });

  it('deselects an issuer when its chip is clicked again', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    expect(screen.getByTestId('mic-column-iss-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    expect(screen.queryByTestId('mic-column-iss-1')).not.toBeInTheDocument();
  });

  it('renders KPI tiles inside each selected column', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));

    const column = screen.getByTestId('mic-column-iss-1');
    expect(within(column).getByText('Total Distributed')).toBeInTheDocument();
    expect(within(column).getByText('Active Payouts')).toBeInTheDocument();
    expect(within(column).getByText('Gas Spent')).toBeInTheDocument();
    expect(within(column).getByText('Pending Retries')).toBeInTheDocument();
  });

  it('renders chart snippet with bars for each selected issuer', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));

    expect(screen.getByTestId('mic-chart-iss-1')).toBeInTheDocument();
    expect(within(screen.getByTestId('mic-chart-iss-1')).getByText('Jan')).toBeInTheDocument();
    expect(within(screen.getByTestId('mic-chart-iss-1')).getByText('Jun')).toBeInTheDocument();
  });

  it('renders compliance status with correct label', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-2'));

    expect(screen.getByTestId('mic-compliance-iss-1')).toHaveTextContent('Compliant');
    expect(screen.getByTestId('mic-compliance-iss-2')).toHaveTextContent('In Review');
  });

  it('renders compliance note when present', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));

    expect(screen.getByText('All documentation up to date.')).toBeInTheDocument();
  });

  it('clear all button removes all selected issuers', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-2'));
    expect(screen.getByTestId('mic-grid')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mic-clear-all'));
    expect(screen.queryByTestId('mic-grid')).not.toBeInTheDocument();
    expect(screen.getByTestId('mic-empty-state')).toBeInTheDocument();
  });

  it('passes axe accessibility checks with 0 violations', async () => {
    const { container } = render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('synchronizes hover state across columns', () => {
    render(<MultiIssuerComparisonView availableIssuers={MOCK_ISSUERS} />);

    fireEvent.click(screen.getByTestId('mic-chip-iss-1'));
    fireEvent.click(screen.getByTestId('mic-chip-iss-2'));

    const col1 = screen.getByTestId('mic-column-iss-1');
    const col2 = screen.getByTestId('mic-column-iss-2');

    fireEvent.mouseEnter(col1);
    expect(col1).toHaveClass('mic-column--hover');
    expect(col2).toHaveClass('mic-column--dim');

    fireEvent.mouseLeave(col1);
    expect(col1).not.toHaveClass('mic-column--hover');
    expect(col2).not.toHaveClass('mic-column--dim');
  });
});
