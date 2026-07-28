import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardHero, KPIData } from './DashboardHero';
import { BrowserRouter } from 'react-router-dom';

describe('DashboardHero', () => {
  const defaultKPIs = {
    totalValue: { label: 'Total Value', value: 100000, type: 'currency', status: 'success', trend: 5 } as KPIData,
    realizedGains: { label: 'Realized Gains', value: 5000, type: 'currency', status: 'success' } as KPIData,
    upcomingPayouts: { label: 'Upcoming Payouts', value: 2, type: 'number', status: 'success' } as KPIData,
    pendingActions: { label: 'Pending Actions', value: 1, type: 'number', status: 'success' } as KPIData,
  };

  it('renders correctly for existing investor', () => {
    render(
      <BrowserRouter>
        <DashboardHero {...defaultKPIs} sparklineData={[100, 200, 300]} />
      </BrowserRouter>
    );
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('5.0%')).toBeInTheDocument();
    expect(screen.getByText('Explore Offerings')).toBeInTheDocument();
  });

  it('renders correctly for new investor', () => {
    const emptyKPIs = {
      totalValue: { label: 'Total Value', value: 0, type: 'currency', status: 'empty' } as KPIData,
      realizedGains: { label: 'Realized Gains', value: 0, type: 'currency', status: 'empty' } as KPIData,
      upcomingPayouts: { label: 'Upcoming Payouts', value: 0, type: 'number', status: 'empty' } as KPIData,
      pendingActions: { label: 'Pending Actions', value: 1, type: 'number', status: 'success' } as KPIData,
    };

    render(
      <BrowserRouter>
        <DashboardHero {...emptyKPIs} isNewInvestor={true} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Welcome to Revora')).toBeInTheDocument();
    expect(screen.getAllByText('No data yet').length).toBeGreaterThan(0);
  });

  it('renders error state correctly', () => {
    const errorKPIs = {
      ...defaultKPIs,
      totalValue: { ...defaultKPIs.totalValue, status: 'error' } as KPIData,
    };

    render(
      <BrowserRouter>
        <DashboardHero {...errorKPIs} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    const loadingKPIs = {
      ...defaultKPIs,
      totalValue: { ...defaultKPIs.totalValue, status: 'loading' } as KPIData,
    };

    render(
      <BrowserRouter>
        <DashboardHero {...loadingKPIs} />
      </BrowserRouter>
    );
    
    // The skeleton does not have text, we just verify it renders without crashing
    expect(screen.getByText('Realized Gains')).toBeInTheDocument();
    expect(screen.queryByText('Total Value')).not.toBeInTheDocument(); // Loading state doesn't show label
  });

  it('renders negative trend correctly', () => {
    const negativeKPIs = {
      ...defaultKPIs,
      totalValue: { ...defaultKPIs.totalValue, trend: -3.5 } as KPIData,
    };

    render(
      <BrowserRouter>
        <DashboardHero {...negativeKPIs} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('3.5%')).toBeInTheDocument();
    expect(screen.getByText('3.5%').parentElement).toHaveClass('text-red-400');
  });
});
