import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import payoutIcon from '../assets/icons/payout.svg';
import offeringIcon from '../assets/icons/offering.svg';
import blacklistIcon from '../assets/icons/blacklist.svg';
import './ActivityItem.css';

export interface TransactionReceiptProps {
  transactionHash?: string;
  fromAddress?: string;
  toAddress?: string;
  value?: string;
  status?: 'pending' | 'completed' | 'failed' | 'success';
  gas?: string;
  explorerUrl?: string;
  className?: string;
}

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  transactionHash = '',
  fromAddress = '',
  toAddress = '',
  value = '',
  status,
  gas = '',
  explorerUrl = '',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleCopy = async () => {
    if (!transactionHash) return;
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(transactionHash);
        success = true;
      }
    } catch (err) {
      console.warn('Navigator clipboard failed, trying fallback...', err);
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = transactionHash;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (result) {
          success = true;
        }
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
    }

    if (success) {
      setCopied(true);
      setShowToast(true);
      setAnnouncement('Transaction hash copied to clipboard');
      
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 3000);
    } else {
      setAnnouncement('Failed to copy transaction hash');
    }
  };

  const truncateHash = (hash: string) => {
    const trimmed = hash.trim();
    if (!trimmed) return '—';
    if (trimmed.length <= 13) return trimmed;
    return `${trimmed.slice(0, 6)}…${trimmed.slice(-6)}`;
  };

  const resolvedStatus = status ? status.toLowerCase() : '';
  const statusDisplay = resolvedStatus
    ? resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1)
    : '—';

  // Fallback Explorer URL construction
  const resolvedExplorerUrl = explorerUrl.trim()
    ? explorerUrl.trim()
    : (transactionHash.trim()
        ? `https://stellar.expert/explorer/public/tx/${encodeURIComponent(transactionHash.trim())}`
        : '');

  return (
    <div className={`tx-receipt-panel ${className}`} data-testid="tx-receipt-panel">
      {/* Accessibility screen reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="tx-live-region">
        {announcement}
      </div>

      <div className="tx-receipt-grid">
        <div className="tx-receipt-row">
          <span className="tx-receipt-label">Status</span>
          <span 
            className={`tx-receipt-value status-badge status-${resolvedStatus || 'unknown'}`} 
            data-testid="tx-status"
          >
            {statusDisplay}
          </span>
        </div>

        <div className="tx-receipt-row">
          <span className="tx-receipt-label">Transaction Hash</span>
          <span className="tx-receipt-value hash-container">
            {transactionHash ? (
              <>
                <span className="tx-hash-text" title={transactionHash} data-testid="tx-hash">
                  {truncateHash(transactionHash)}
                </span>
                <button
                  type="button"
                  className="tx-copy-btn"
                  onClick={handleCopy}
                  aria-label="Copy transaction hash to clipboard"
                  title="Copy transaction hash"
                  data-testid="tx-copy-btn"
                >
                  {copied ? (
                    <Check size={14} className="copied-icon" aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                </button>
              </>
            ) : (
              <span data-testid="tx-hash-fallback">—</span>
            )}
          </span>
        </div>

        <div className="tx-receipt-row">
          <span className="tx-receipt-label">From Address</span>
          <span 
            className="tx-receipt-value address-value" 
            title={fromAddress || undefined} 
            data-testid="tx-from"
          >
            {fromAddress || '—'}
          </span>
        </div>

        <div className="tx-receipt-row">
          <span className="tx-receipt-label">To Address</span>
          <span 
            className="tx-receipt-value address-value" 
            title={toAddress || undefined} 
            data-testid="tx-to"
          >
            {toAddress || '—'}
          </span>
        </div>

        <div className="tx-receipt-row">
          <span className="tx-receipt-label">Value</span>
          <span className="tx-receipt-value" data-testid="tx-value">
            {value || '—'}
          </span>
        </div>

        <div className="tx-receipt-row">
          <span className="tx-receipt-label">Gas</span>
          <span className="tx-receipt-value" data-testid="tx-gas">
            {gas || '—'}
          </span>
        </div>
      </div>

      {resolvedExplorerUrl && (
        <div className="tx-receipt-explorer-container">
          <a
            href={resolvedExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-explorer-link"
            aria-label="View transaction on Explorer (opens in a new tab)"
            data-testid="tx-explorer-link"
          >
            <span>View on Explorer</span>
            <ExternalLink size={14} className="external-icon" aria-hidden="true" />
          </a>
        </div>
      )}

      {showToast && (
        <div className="tx-toast tx-toast--success" data-testid="tx-toast">
          Transaction hash copied to clipboard
        </div>
      )}
    </div>
  );
};

export interface ActivityItemProps {
  activity: {
    id?: string;
    type: 'payout' | 'offering' | 'blacklist';
    title: string;
    description: string;
    timestamp: string;
    isRead?: boolean;
    transactionDetails?: {
      transactionHash?: string;
      fromAddress?: string;
      toAddress?: string;
      value?: string;
      status?: 'pending' | 'completed' | 'failed' | 'success';
      gas?: string;
      explorerUrl?: string;
    };
  };
  onMarkRead?: (id: string) => void;
}

const iconMap: Record<string, string> = {
  payout: payoutIcon,
  offering: offeringIcon,
  blacklist: blacklistIcon,
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onMarkRead }) => {
  const { id = '', type, title, description, timestamp, isRead = true, transactionDetails } = activity;
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = iconMap[type];
  const date = new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      className={`activity-item-wrapper ${transactionDetails ? 'has-receipt' : ''}`}
      data-testid="activity-item-wrapper"
    >
      <div 
        className={`activity-item glass-card-interactive ${!isRead ? 'unread' : ''}`} 
        role="article"
        aria-current={!isRead ? 'true' : 'false'}
      >
        <div className="activity-item-indicator" aria-hidden="true">
          {!isRead && <span className="unread-dot" title="Unread" />}
        </div>
        <img src={Icon} alt="" aria-hidden="true" className="activity-icon" />
        <div className="activity-content">
          <h3 className="activity-title text-primary">{title}</h3>
          <p className="activity-description text-muted">{description}</p>
        </div>
        <div className="activity-meta">
          <time className="activity-time text-muted" dateTime={timestamp} aria-label={`Occurred at ${date}`}> {date} </time>
          <div className="activity-actions">
            {!isRead && onMarkRead && (
              <button 
                className="mark-read-btn" 
                onClick={() => onMarkRead(id)}
                aria-label="Mark item as read"
                title="Mark as read"
              >
                Mark read
              </button>
            )}
            {transactionDetails && (
              <button
                type="button"
                className="toggle-receipt-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Hide transaction receipt details" : "View transaction receipt details"}
                title={isExpanded ? "Hide Receipt" : "View Receipt"}
                data-testid="toggle-receipt-btn"
              >
                {isExpanded ? (
                  <>
                    <span>Hide Receipt</span>
                    <ChevronUp size={14} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>View Receipt</span>
                    <ChevronDown size={14} aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {transactionDetails && isExpanded && (
        <TransactionReceipt 
          {...transactionDetails}
          className="inline-receipt" 
        />
      )}
    </div>
  );
};

export default ActivityItem;
