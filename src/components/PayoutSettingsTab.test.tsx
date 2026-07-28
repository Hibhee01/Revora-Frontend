import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PayoutSettingsTab } from './PayoutSettingsTab';

describe('PayoutSettingsTab', () => {
  it('renders schedule editor correctly', () => {
    render(<PayoutSettingsTab />);
    expect(screen.getByText('Payout Schedule')).toBeInTheDocument();
    
    // Check cadence options
    const cadenceSelect = screen.getByLabelText('Distribution Cadence');
    expect(cadenceSelect).toBeInTheDocument();
    
    // Change cadence
    fireEvent.change(cadenceSelect, { target: { value: 'quarterly' } });
    expect(screen.getByText(/Revenue will be distributed/)).toHaveTextContent('quarterly');
  });

  it('renders fee splits and handles percentage changes', () => {
    render(<PayoutSettingsTab />);
    expect(screen.getByText('Fee Splits')).toBeInTheDocument();
    
    const issuerInput = screen.getByLabelText('Issuer (Operations) percentage');
    expect(issuerInput).toBeInTheDocument();
    
    // Change value
    fireEvent.change(issuerInput, { target: { value: '10' } });
    expect(issuerInput).toHaveValue(10);
    
    // Total should be 95% now, which is invalid
    expect(screen.getByText('Invalid Allocation')).toBeInTheDocument();
    expect(screen.getByText(/Current total is 95%/)).toBeInTheDocument();
  });

  it('does not allow editing locked splits', () => {
    render(<PayoutSettingsTab />);
    
    const platformFeeInput = screen.getByLabelText('Platform Fee percentage');
    expect(platformFeeInput).toBeDisabled();
    
    const proRataInput = screen.getByLabelText('Investors (Pro-rata) percentage');
    expect(proRataInput).toBeDisabled();
  });
  
  it('validates successful sum', () => {
    render(<PayoutSettingsTab />);
    // Initially 80 + 15 + 5 = 100
    expect(screen.queryByText('Invalid Allocation')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Valid allocation')).toBeInTheDocument();
  });
});
