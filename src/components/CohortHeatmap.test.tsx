import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CohortHeatmap, CohortData } from './CohortHeatmap';

expect.extend(toHaveNoViolations);

describe('CohortHeatmap', () => {
  const mockData: CohortData[] = [
    {
      cohortName: '2023 Q1',
      cohortSize: 50,
      payouts: [
        { monthIndex: 0, payoutAmount: 5000, payoutPercentage: 10 },
        { monthIndex: 1, payoutAmount: 10000, payoutPercentage: 20 },
        { monthIndex: 2, payoutAmount: 15000, payoutPercentage: 30 },
      ],
    },
    {
      cohortName: '2023 Q2',
      cohortSize: 30,
      payouts: [
        { monthIndex: 0, payoutAmount: 2000, payoutPercentage: 5 },
      ],
    },
  ];

  it('renders without crashing and displays the title', () => {
    render(<CohortHeatmap data={mockData} maxMonths={3} />);
    expect(screen.getByText('Cohort Payout Heatmap')).toBeInTheDocument();
  });

  it('renders cohort names and sizes', () => {
    render(<CohortHeatmap data={mockData} maxMonths={3} />);
    expect(screen.getByText('2023 Q1')).toBeInTheDocument();
    expect(screen.getByText('(50)')).toBeInTheDocument();
    expect(screen.getByText('2023 Q2')).toBeInTheDocument();
    expect(screen.getByText('(30)')).toBeInTheDocument();
  });

  it('renders correct number of months based on maxMonths', () => {
    render(<CohortHeatmap data={mockData} maxMonths={5} />);
    expect(screen.getByLabelText('Month 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Month 5')).toBeInTheDocument();
  });

  it('renders heatmap cells with correct aria-labels', () => {
    render(<CohortHeatmap data={mockData} maxMonths={3} />);
    const cell = screen.getByLabelText('2023 Q1 Month 1: $5,000 payout, 10.0%');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveTextContent('10%');

    const emptyCell = screen.getByLabelText('2023 Q2 Month 2: No data');
    expect(emptyCell).toBeInTheDocument();
    expect(emptyCell).toHaveTextContent('-');
  });

  it('toggles color-blind safe mode', () => {
    render(<CohortHeatmap data={mockData} maxMonths={3} />);
    const container = screen.getByText('Cohort Payout Heatmap').closest('.cohort-heatmap-container');
    expect(container).not.toHaveClass('heatmap-cb-safe');

    const toggle = screen.getByLabelText('Enable color-blind safe mode and patterns');
    fireEvent.click(toggle);

    expect(container).toHaveClass('heatmap-cb-safe');
  });

  it('handles zero percentages properly', () => {
    const zeroData: CohortData[] = [
      {
        cohortName: '2024',
        cohortSize: 10,
        payouts: [{ monthIndex: 0, payoutAmount: 0, payoutPercentage: 0 }],
      },
    ];
    render(<CohortHeatmap data={zeroData} maxMonths={1} />);
    const cell = screen.getByLabelText('2024 Month 1: $0 payout, 0.0%');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('heatmap-val-0');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CohortHeatmap data={mockData} maxMonths={3} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
