import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PayoutDrillDownPanel.css';
import {
  PayoutDrillDownPanelProps,
  PanelTab,
  RecipientItem,
} from './PayoutDrillDownPanel.types';

const STORAGE_KEY_WIDTH = 'revora_payout_panel_width';
const MIN_WIDTH = 400;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 580;

const formatCurrency = (val: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const PayoutDrillDownPanel: React.FC<PayoutDrillDownPanelProps> = ({
  isOpen,
  payoutId,
  payoutData,
  loading = false,
  error = null,
  onClose,
  onRetryBatch,
  onExportCsv,
  onRetryLoad,
  triggerRef,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store element that had focus before modal opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = (document.activeElement as HTMLElement) || triggerRef?.current || null;
      // Focus close button on open
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen, triggerRef]);

  // Handle ESC key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle width resize via mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
      setPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(STORAGE_KEY_WIDTH, panelWidth.toString());
      } catch {
        // Ignore storage write errors
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, panelWidth]);

  // Keyboard accessibility for resizer
  const handleResizerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const updated = Math.min(panelWidth + 20, MAX_WIDTH);
      setPanelWidth(updated);
      localStorage.setItem(STORAGE_KEY_WIDTH, updated.toString());
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const updated = Math.max(panelWidth - 20, MIN_WIDTH);
      setPanelWidth(updated);
      localStorage.setItem(STORAGE_KEY_WIDTH, updated.toString());
    }
  };

  // Copy Payout ID to clipboard
  const handleCopyId = () => {
    if (!payoutData?.id) return;
    navigator.clipboard.writeText(payoutData.id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  // Handle batch retry execution
  const handleRetryBatch = async () => {
    if (!onRetryBatch || !payoutData?.id) return;
    setIsRetrying(true);
    try {
      await onRetryBatch(payoutData.id);
    } finally {
      setIsRetrying(false);
    }
  };

  // Filter recipients
  const filteredRecipients = React.useMemo(() => {
    if (!payoutData?.recipients) return [];
    if (!searchTerm.trim()) return payoutData.recipients;
    const term = searchTerm.toLowerCase();
    return payoutData.recipients.filter(
      (r) =>
        r.walletAddress.toLowerCase().includes(term) ||
        (r.name && r.name.toLowerCase().includes(term)) ||
        r.tier.toLowerCase().includes(term)
    );
  }, [payoutData?.recipients, searchTerm]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="payout-panel-overlay"
        onClick={onClose}
        aria-hidden="true"
        data-testid="payout-panel-overlay"
      />

      {/* Main Slide Panel */}
      <div
        ref={panelRef}
        className="payout-panel"
        style={{ width: `${panelWidth}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-panel-title"
        data-testid="payout-panel"
      >
        {/* Resizer Handle */}
        <div
          ref={resizerRef}
          className={`payout-panel-resizer ${isResizing ? 'is-resizing' : ''}`}
          onMouseDown={handleMouseDown}
          onKeyDown={handleResizerKeyDown}
          tabIndex={0}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize payout details panel"
          aria-valuenow={panelWidth}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          data-testid="payout-panel-resizer"
        />

        {/* Panel Header */}
        <div className="payout-panel-header">
          <div className="payout-panel-header-info">
            <div className="payout-panel-title-row">
              <h2 id="payout-panel-title" className="payout-panel-title">
                {payoutData?.payoutNumber || `Payout #${payoutId || ''}`}
              </h2>
              {payoutData?.status && (
                <span
                  className={`payout-status-badge payout-status-badge--${payoutData.status}`}
                  data-testid="payout-status-badge"
                >
                  <span className="payout-status-dot" />
                  {payoutData.status}
                </span>
              )}
            </div>

            <p className="payout-panel-subtitle">
              <span>{payoutData?.offeringName || 'RevenueShare Offering'}</span>
              {payoutData?.date && <span>• {payoutData.date}</span>}
              {payoutData?.grossAmount !== undefined && (
                <span>• {formatCurrency(payoutData.grossAmount, payoutData.currency)}</span>
              )}
            </p>
          </div>

          <div className="payout-panel-header-actions">
            {payoutData?.id && (
              <button
                type="button"
                className="payout-icon-btn"
                onClick={handleCopyId}
                title="Copy Payout ID"
                aria-label="Copy Payout ID"
              >
                {copiedId ? '✓' : '📋'}
              </button>
            )}

            {payoutData?.transactionHash && (
              <a
                href={`https://etherscan.io/tx/${payoutData.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="payout-icon-btn"
                title="View on Etherscan"
                aria-label="View on Etherscan"
              >
                ↗
              </a>
            )}

            <button
              ref={closeBtnRef}
              type="button"
              className="payout-icon-btn"
              onClick={onClose}
              aria-label="Close payout details panel"
              data-testid="payout-panel-close-btn"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        {!loading && !error && payoutData && (
          <div className="payout-panel-tabs" role="tablist" aria-label="Payout detail sections">
            <button
              id="tab-overview"
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="tabpanel-overview"
              className={`payout-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Gas
            </button>

            <button
              id="tab-recipients"
              type="button"
              role="tab"
              aria-selected={activeTab === 'recipients'}
              aria-controls="tabpanel-recipients"
              className={`payout-tab-btn ${activeTab === 'recipients' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('recipients')}
            >
              Recipients
              <span className="payout-tab-count">{payoutData.recipientsCount}</span>
            </button>

            <button
              id="tab-history"
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="tabpanel-history"
              className={`payout-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Retry History
              {payoutData.retries?.length > 0 && (
                <span className="payout-tab-count">{payoutData.retries.length}</span>
              )}
            </button>
          </div>
        )}

        {/* Panel Scrollable Body */}
        <div className="payout-panel-body">
          {/* Skeleton State */}
          {loading && (
            <div className="payout-panel-skeleton" data-testid="payout-panel-skeleton">
              <div className="payout-skeleton-box" style={{ height: '40px' }} />
              <div className="payout-skeleton-box" style={{ height: '100px' }} />
              <div className="payout-skeleton-box" style={{ height: '180px' }} />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="payout-panel-error" data-testid="payout-panel-error">
              <div className="payout-error-icon">⚠️</div>
              <h3>Failed to load payout details</h3>
              <p className="text-muted">{error}</p>
              {onRetryLoad && (
                <button
                  type="button"
                  className="payout-btn-primary"
                  onClick={onRetryLoad}
                >
                  Retry Loading
                </button>
              )}
            </div>
          )}

          {/* Main Content Panels */}
          {!loading && !error && payoutData && (
            <>
              {/* Tab 1: Overview & Gas Fees */}
              {activeTab === 'overview' && (
                <div
                  id="tabpanel-overview"
                  role="tabpanel"
                  aria-labelledby="tab-overview"
                  className="payout-tab-panel"
                  data-testid="payout-tabpanel-overview"
                >
                  {/* Top KPI Cards */}
                  <div className="payout-metrics-grid">
                    <div className="payout-metric-card">
                      <p className="payout-metric-label">Gross Amount</p>
                      <p className="payout-metric-value">
                        {formatCurrency(payoutData.grossAmount, payoutData.currency)}
                      </p>
                      <p className="payout-metric-subtext">Total payout pool</p>
                    </div>

                    <div className="payout-metric-card">
                      <p className="payout-metric-label">Net Distributed</p>
                      <p className="payout-metric-value">
                        {formatCurrency(payoutData.netAmount, payoutData.currency)}
                      </p>
                      <p className="payout-metric-subtext">Received by wallets</p>
                    </div>
                  </div>

                  {/* Gas & Fee Details */}
                  <div className="payout-details-section">
                    <h3 className="payout-section-title">⚡ Gas & Protocol Fees</h3>
                    <div className="payout-kv-list">
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Actual Gas Spent</span>
                        <span className="payout-kv-val">
                          ${payoutData.gasFeeUsd.toFixed(2)} ({payoutData.gasFeeEth} ETH)
                        </span>
                      </div>
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Gas Price</span>
                        <span className="payout-kv-val">{payoutData.gasPriceGwei} Gwei</span>
                      </div>
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Estimated Gas Variance</span>
                        <span className="payout-kv-val">
                          ${payoutData.estimatedGasUsd.toFixed(2)} ({payoutData.estimatedGasPriceGwei} Gwei)
                        </span>
                      </div>
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Protocol Maintenance Fee</span>
                        <span className="payout-kv-val">
                          ${payoutData.protocolFeeUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Execution Network Metadata */}
                  <div className="payout-details-section">
                    <h3 className="payout-section-title">🔗 On-Chain Execution</h3>
                    <div className="payout-kv-list">
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Network</span>
                        <span className="payout-kv-val">{payoutData.executionNetwork}</span>
                      </div>
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Block Number</span>
                        <span className="payout-kv-val">#{payoutData.blockNumber}</span>
                      </div>
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Contract Address</span>
                        <span className="payout-kv-val">
                          {payoutData.contractAddress.slice(0, 8)}...{payoutData.contractAddress.slice(-6)}
                        </span>
                      </div>
                      <div className="payout-kv-row">
                        <span className="payout-kv-key">Transaction Hash</span>
                        <span className="payout-kv-val">
                          <a
                            href={`https://etherscan.io/tx/${payoutData.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="payout-link"
                          >
                            {payoutData.transactionHash.slice(0, 10)}... ↗
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Payout Card Link */}
                  <div className="payout-next-card">
                    <div className="payout-next-info">
                      <h4>Next Scheduled Payout</h4>
                      <p>
                        Estimated date: {payoutData.nextPayoutDate || 'Upcoming Cycle'} • Est.{' '}
                        {payoutData.nextPayoutEstimateUsd
                          ? formatCurrency(payoutData.nextPayoutEstimateUsd, payoutData.currency)
                          : 'Pending Report'}
                      </p>
                    </div>
                    <a
                      href={payoutData.nextPayoutLink || '/startup/report-revenue'}
                      className="payout-btn-primary"
                    >
                      Report Revenue ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Tab 2: Itemized Recipients */}
              {activeTab === 'recipients' && (
                <div
                  id="tabpanel-recipients"
                  role="tabpanel"
                  aria-labelledby="tab-recipients"
                  className="payout-tab-panel"
                  data-testid="payout-tabpanel-recipients"
                >
                  <div className="payout-recipient-toolbar">
                    <input
                      type="search"
                      className="payout-search-input"
                      placeholder="Search recipient wallet address, name, or tier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Filter recipients"
                      data-testid="payout-recipient-search"
                    />
                  </div>

                  {filteredRecipients.length === 0 ? (
                    <div className="payout-panel-error" style={{ padding: '2rem 1rem' }}>
                      <p className="text-muted">No recipients found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="payout-recipient-list" data-testid="payout-recipient-list">
                      {filteredRecipients.map((rec: RecipientItem) => (
                        <div key={rec.id} className="payout-recipient-card">
                          <div className="payout-recipient-main">
                            <span className="payout-recipient-address">
                              {rec.name ? `${rec.name} (${rec.walletAddress.slice(0, 6)}...${rec.walletAddress.slice(-4)})` : `${rec.walletAddress.slice(0, 8)}...${rec.walletAddress.slice(-6)}`}
                            </span>
                            <div className="payout-recipient-meta">
                              <span className="payout-tier-pill">{rec.tier}</span>
                              <span>• Share: {rec.sharePercentage}%</span>
                              <span>• Gas: {rec.gasAllocatedGwei} Gwei</span>
                            </div>
                          </div>

                          <div className="payout-recipient-amount">
                            <span className="payout-recipient-val">
                              {formatCurrency(rec.amount, payoutData.currency)}
                            </span>
                            <span
                              className={`payout-status-badge payout-status-badge--${rec.status}`}
                            >
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Retry & Execution History */}
              {activeTab === 'history' && (
                <div
                  id="tabpanel-history"
                  role="tabpanel"
                  aria-labelledby="tab-history"
                  className="payout-tab-panel"
                  data-testid="payout-tabpanel-history"
                >
                  <div className="payout-details-section">
                    <div className="payout-title-row" style={{ justifyContent: 'space-between' }}>
                      <h3 className="payout-section-title">📜 Audit Trail & Dispatches</h3>
                      {payoutData.status === 'failed' && (
                        <button
                          type="button"
                          className="payout-btn-danger"
                          onClick={handleRetryBatch}
                          disabled={isRetrying}
                          data-testid="payout-retry-batch-btn"
                        >
                          {isRetrying ? 'Retrying...' : 'Retry Failed Batch'}
                        </button>
                      )}
                    </div>

                    <div className="payout-history-timeline" data-testid="payout-history-timeline">
                      {payoutData.retries?.map((retry) => (
                        <div key={retry.id} className="payout-history-item">
                          <div
                            className={`payout-history-marker ${
                              retry.status === 'failed' ? 'is-failed' : 'is-success'
                            }`}
                          />
                          <div className="payout-history-header">
                            <span className="payout-history-attempt">
                              Attempt #{retry.attemptNumber} • {retry.status.toUpperCase()}
                            </span>
                            <span className="payout-history-time">{retry.timestamp}</span>
                          </div>
                          <p className="payout-history-reason">{retry.reason}</p>
                          {retry.errorDetails && (
                            <div className="payout-error-box">{retry.errorDetails}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="payout-panel-footer">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onExportCsv && payoutData?.id && (
              <button
                type="button"
                className="payout-btn-secondary"
                onClick={() => onExportCsv(payoutData.id)}
                data-testid="payout-export-csv-btn"
              >
                📥 Export CSV Statement
              </button>
            )}
          </div>

          <button
            type="button"
            className="payout-btn-secondary"
            onClick={onClose}
            data-testid="payout-footer-close-btn"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
