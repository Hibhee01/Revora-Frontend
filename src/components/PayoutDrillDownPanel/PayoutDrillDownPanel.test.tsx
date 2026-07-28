import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PayoutDrillDownPanel } from './PayoutDrillDownPanel';
import { PayoutDetail } from './PayoutDrillDownPanel.types';

expect.extend(toHaveNoViolations);

const samplePayoutData: PayoutDetail = {
  id: 'PO-2026-004',
  payoutNumber: 'Payout #PO-2026-004',
  date: 'Jul 24, 2026',
  time: '14:32:00 UTC',
  status: 'failed',
  grossAmount: 124500.0,
  netAmount: 121387.5,
  protocolFeeUsd: 3112.5,
  currency: 'USD',
  offeringName: 'Nexus Cloud Series A',
  offeringId: 'OFF-NX-001',
  gasFeeUsd: 42.15,
  gasFeeEth: 0.0125,
  gasPriceGwei: 24.5,
  estimatedGasUsd: 45.0,
  estimatedGasPriceGwei: 26.0,
  executionNetwork: 'Ethereum Mainnet',
  blockNumber: 20485912,
  contractAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  transactionHash: '0x3a91b8d8f92147e8c1b3f94017e849204b1239840291487214981d2938174092',
  recipientsCount: 2,
  recipients: [
    {
      id: 'rec-1',
      walletAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      name: 'Apex Growth Fund',
      tier: 'Institutional',
      sharePercentage: 18.5,
      amount: 22456.68,
      status: 'success',
      gasAllocatedGwei: 24.5,
    },
    {
      id: 'rec-2',
      walletAddress: '0x388C815CA8B9251b393131C08a7369585673b212',
      name: 'Vanguard Capital',
      tier: 'Series A Lead',
      sharePercentage: 12.0,
      amount: 14566.5,
      status: 'failed',
      gasAllocatedGwei: 24.5,
    },
  ],
  retries: [
    {
      id: 'ret-1',
      timestamp: 'Jul 24, 2026 14:32:00 UTC',
      attemptNumber: 1,
      status: 'failed',
      reason: 'Out of gas error during execution.',
      errorDetails: 'VM Exception: OUT_OF_GAS',
      gasUsedGwei: 24.5,
    },
  ],
  nextPayoutDate: 'Aug 24, 2026',
  nextPayoutEstimateUsd: 130000.0,
  nextPayoutLink: '/startup/report-revenue',
};

describe('PayoutDrillDownPanel', () => {
  const defaultProps = {
    isOpen: true,
    payoutId: 'PO-2026-004',
    payoutData: samplePayoutData,
    onClose: vi.fn(),
    onRetryBatch: vi.fn().mockResolvedValue(undefined),
    onExportCsv: vi.fn(),
    onRetryLoad: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PayoutDrillDownPanel {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders panel dialog with header, tabs, and content when isOpen is true', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    expect(screen.getByTestId('payout-panel')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Payout #PO-2026-004')).toBeInTheDocument();
    expect(screen.getByText('Nexus Cloud Series A')).toBeInTheDocument();
    expect(screen.getByTestId('payout-status-badge')).toHaveTextContent('failed');
  });

  it('switches between tabs on tab button clicks', async () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    // Default tab is overview
    expect(screen.getByTestId('payout-tabpanel-overview')).toBeInTheDocument();
    expect(screen.getByText('⚡ Gas & Protocol Fees')).toBeInTheDocument();

    // Click Recipients tab
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    expect(screen.getByTestId('payout-tabpanel-recipients')).toBeInTheDocument();
    expect(screen.getByText(/Apex Growth Fund/i)).toBeInTheDocument();

    // Click Retry History tab
    const historyTab = screen.getByRole('tab', { name: /retry history/i });
    fireEvent.click(historyTab);

    expect(screen.getByTestId('payout-tabpanel-history')).toBeInTheDocument();
    expect(screen.getByText(/Out of gas error/i)).toBeInTheDocument();
  });

  it('filters recipient list when typing in search input', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: /recipients/i }));

    const searchInput = screen.getByTestId('payout-recipient-search');
    fireEvent.change(searchInput, { target: { value: 'Vanguard' } });

    expect(screen.getByText(/Vanguard Capital/i)).toBeInTheDocument();
    expect(screen.queryByText(/Apex Growth Fund/i)).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    expect(screen.getByText(/No recipients found matching/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const closeBtn = screen.getByTestId('payout-panel-close-btn');
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when footer close button is clicked', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const footerCloseBtn = screen.getByTestId('payout-footer-close-btn');
    fireEvent.click(footerCloseBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop overlay', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const overlay = screen.getByTestId('payout-panel-overlay');
    fireEvent.click(overlay);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onExportCsv when export button is clicked', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const exportBtn = screen.getByTestId('payout-export-csv-btn');
    fireEvent.click(exportBtn);

    expect(defaultProps.onExportCsv).toHaveBeenCalledWith('PO-2026-004');
  });

  it('calls onRetryBatch when retry failed batch button is clicked', async () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: /retry history/i }));

    const retryBtn = screen.getByTestId('payout-retry-batch-btn');

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    expect(defaultProps.onRetryBatch).toHaveBeenCalledWith('PO-2026-004');
  });

  it('renders skeleton loading state when loading is true', () => {
    render(<PayoutDrillDownPanel {...defaultProps} loading={true} payoutData={null} />);

    expect(screen.getByTestId('payout-panel-skeleton')).toBeInTheDocument();
  });

  it('renders error state when error message is provided', () => {
    render(
      <PayoutDrillDownPanel
        {...defaultProps}
        error="Network error: Timeout"
        payoutData={null}
      />
    );

    expect(screen.getByTestId('payout-panel-error')).toBeInTheDocument();
    expect(screen.getByText('Network error: Timeout')).toBeInTheDocument();

    const retryLoadBtn = screen.getByRole('button', { name: /retry loading/i });
    fireEvent.click(retryLoadBtn);
    expect(defaultProps.onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it('resizes panel width via keyboard arrow keys on resizer handle', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const resizer = screen.getByTestId('payout-panel-resizer');
    resizer.focus();

    fireEvent.keyDown(resizer, { key: 'ArrowLeft' });
    expect(localStorage.getItem('revora_payout_panel_width')).toBe('600');

    fireEvent.keyDown(resizer, { key: 'ArrowRight' });
    expect(localStorage.getItem('revora_payout_panel_width')).toBe('580');
  });

  it('resizes panel width via mouse drag on resizer handle', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const resizer = screen.getByTestId('payout-panel-resizer');

    fireEvent.mouseDown(resizer);
    fireEvent.mouseMove(window, { clientX: window.innerWidth - 650 });
    fireEvent.mouseUp(window);

    expect(localStorage.getItem('revora_payout_panel_width')).toBe('650');
  });

  it('handles saved width from localStorage', () => {
    localStorage.setItem('revora_payout_panel_width', '720');
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const panel = screen.getByTestId('payout-panel');
    expect(panel).toHaveStyle({ width: '720px' });
  });

  it('falls back gracefully when localStorage getItem throws or contains invalid number', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });

    render(<PayoutDrillDownPanel {...defaultProps} />);
    const panel = screen.getByTestId('payout-panel');
    expect(panel).toHaveStyle({ width: '580px' });

    getItemSpy.mockRestore();
  });

  it('copies Payout ID to clipboard on copy icon click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<PayoutDrillDownPanel {...defaultProps} />);

    const copyBtn = screen.getByRole('button', { name: /copy payout id/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('PO-2026-004');
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  it('traps focus inside the panel when tab key is pressed', () => {
    render(<PayoutDrillDownPanel {...defaultProps} />);

    const closeBtn = screen.getByTestId('payout-panel-close-btn');
    closeBtn.focus();

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).not.toBeNull();
  });

  it('passes axe accessibility validation with 0 violations', async () => {
    const { container } = render(<PayoutDrillDownPanel {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
