import React, { useRef, useState, useCallback } from 'react';
import { Download, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import './TransactionReceiptShare.css';

export interface TransactionReceiptShareProps {
  issuerName?: string;
  issuerLogoUrl?: string;
  transactionId: string;
  explorerUrl?: string;
  transactionHash?: string;
  date: string;
  amount: number | string;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  senderWallet: string;
  recipientWallet: string;
}

export const TransactionReceiptShare: React.FC<TransactionReceiptShareProps> = ({
  issuerName = 'Revora',
  issuerLogoUrl,
  transactionId,
  transactionHash,
  explorerUrl,
  date,
  amount,
  currency,
  status,
  senderWallet,
  recipientWallet,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [hideAmount, setHideAmount] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!receiptRef.current) return;
    try {
      setIsCapturing(true);
      // Wait for a brief moment to ensure state updates (like isCapturing classes) are applied
      await new Promise((resolve) => setTimeout(resolve, 50));
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `receipt-${transactionId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsCapturing(false);
    }
  }, [transactionId]);

  const handleCopy = useCallback(async () => {
    if (!receiptRef.current) return;
    try {
      setIsCapturing(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert('Receipt image copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard copy failed, falling back to download', clipboardError);
          const dataUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `receipt-${transactionId}.png`;
          link.href = dataUrl;
          link.click();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsCapturing(false);
    }
  }, [transactionId]);

  return (
    <div className="tx-receipt-container">
      {/* Action Bar */}
      <div className="tx-receipt-actions">
        <button
          type="button"
          className="tx-action-btn"
          onClick={() => setHideAmount(!hideAmount)}
          aria-label={hideAmount ? "Show amount" : "Hide amount"}
          aria-pressed={hideAmount}
        >
          {hideAmount ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
          {hideAmount ? 'Show Amount' : 'Hide Amount'}
        </button>
        <div className="tx-action-group">
          <button
            type="button"
            className="tx-action-btn"
            onClick={handleCopy}
            disabled={isCapturing}
            aria-label="Copy image of receipt"
          >
            <Copy size={16} aria-hidden="true" />
            Copy Image
          </button>
          <button
            type="button"
            className="tx-action-btn primary"
            onClick={handleDownload}
            disabled={isCapturing}
            aria-label="Download receipt as image"
          >
            <Download size={16} aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      {/* Capturable Area */}
      <div
        className={`tx-receipt-card ${isCapturing ? 'is-capturing' : ''}`}
        ref={receiptRef}
        aria-label="Transaction Receipt Details"
      >
        <div className="tx-receipt-header">
          <div className="tx-receipt-brand">
            {issuerLogoUrl && <img src={issuerLogoUrl} alt="" className="tx-brand-logo" aria-hidden="true" />}
            <span className="tx-brand-name">{issuerName}</span>
          </div>
          <ShieldCheck size={20} className="tx-verified-icon" aria-hidden="true" />
        </div>

        <div className="tx-receipt-amount-section">
          <div className="tx-receipt-label">Amount</div>
          <div className="tx-receipt-amount">
            {hideAmount ? (
              <span className="tx-amount-hidden" aria-label="Amount hidden">••••••</span>
            ) : (
              <span>{amount} {currency}</span>
            )}
          </div>
        </div>

        <div className="tx-receipt-details">
          <div className="tx-detail-row">
            <span className="tx-detail-label">Status</span>
            <span className={`tx-detail-value status-${status}`}>{status.toUpperCase()}</span>
          </div>
          <div className="tx-detail-row">
            <span className="tx-detail-label">Date</span>
            <span className="tx-detail-value">{date}</span>
          </div>
          <div className="tx-detail-row">
            <span className="tx-detail-label">Transaction ID</span>
            <span className="tx-detail-value">{transactionId}</span>
          </div>
          {transactionHash && (
            <div className="tx-detail-row">
              <span className="tx-detail-label">Transaction Hash</span>
              <span className="tx-detail-value">{transactionHash}</span>
            </div>
          )}
          <div className="tx-detail-row sensitive-field">
            <span className="tx-detail-label">From</span>
            <span className="tx-detail-value unselectable" aria-label="Sender Wallet (Copy disabled)">{senderWallet}</span>
          </div>
          <div className="tx-detail-row sensitive-field">
            <span className="tx-detail-label">To</span>
            <span className="tx-detail-value unselectable" aria-label="Recipient Wallet (Copy disabled)">{recipientWallet}</span>
          </div>
        </div>
        <div className="tx-receipt-footer">
          <div>Generated securely by {issuerName}</div>
      
          {explorerUrl && (
              <div className="tx-explorer-link">
                  Explorer:
                  <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                      {explorerUrl}
                  </a>
              </div>
          )}
      
          {transactionHash && (
              <div className="tx-footer-hash">
                  Hash: {transactionHash}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionReceiptShare;
