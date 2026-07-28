import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RedemptionBanner } from './RedemptionBanner';

describe('RedemptionBanner', () => {
  it('renders correctly with 0% subscription', () => {
    render(<RedemptionBanner totalCapacity={10000} currentSubscription={0} />);
    expect(screen.getByText('Redemption Window In Progress')).toBeInTheDocument();
    expect(screen.getByText('0 of 10,000 tokens subscribed')).toBeInTheDocument();
    
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    expect(progressbar.style.width).toBe('0%');
  });

  it('renders correctly with partial subscription', () => {
    render(<RedemptionBanner totalCapacity={10000} currentSubscription={5000} />);
    expect(screen.getByText('5,000 of 10,000 tokens subscribed')).toBeInTheDocument();
    
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar.style.width).toBe('50%');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders warning state when oversubscribed', () => {
    render(<RedemptionBanner totalCapacity={10000} currentSubscription={15000} />);
    expect(screen.getByText('15,000 of 10,000 tokens subscribed')).toBeInTheDocument();
    
    // Check for the oversubscribed alert
    expect(screen.getByText('Oversubscribed')).toBeInTheDocument();
    
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '150');
    expect(progressbar.style.width).toBe('100%'); // Capped at 100% width
    expect(progressbar).toHaveClass('oversubscribed');
    expect(progressbar).toHaveClass('pattern-warning');
  });

  it('toggles pro-rata explainer popover', () => {
    render(<RedemptionBanner totalCapacity={10000} currentSubscription={15000} />);
    
    const trigger = screen.getByText('How does pro-rata allocation work?');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Pro-rata explainer' })).not.toBeInTheDocument();
    
    // Open popover
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Pro-rata explainer' })).toBeInTheDocument();
    expect(screen.getByText(/When a redemption window is oversubscribed/)).toBeInTheDocument();
    
    // Close popover
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('region', { name: 'Pro-rata explainer' })).not.toBeInTheDocument();
  });
});
