import React, { useId, useRef, useEffect, useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  WifiOff,
  ExternalLink,
} from 'lucide-react';
import { useNetworkSwitcher } from '../../hooks/useNetworkSwitcher';
import { LoadingSpinner } from '../LoadingSpinner';
import './ChainMismatchModal.css';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface ChainMismatchModalProps {
  /** Optional custom open override */
  isOpen?: boolean;
  /** Optional custom close handler */
  onClose?: () => void;
  /** Additional CSS class name */
  className?: string;
}

export const ChainMismatchModal: React.FC<ChainMismatchModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  className = '',
}) => {
  const {
    connectedChain,
    appChain,
    walletName,
    isWalletConnected,
    isMismatch,
    isModalOpen: contextIsOpen,
    isSwitching,
    walletCapability,
    switchWalletChain,
    changeAppChain,
    closeModal,
  } = useNetworkSwitcher();

  const isOpen = externalIsOpen ?? (contextIsOpen || isMismatch);
  const handleClose = externalOnClose ?? closeModal;

  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [showHelpSteps, setShowHelpSteps] = useState(false);

  // Focus restoration
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus({ preventScroll: true });
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Focus trap + Escape key handling
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const supportsAutoSwitch = walletCapability.supportsAutoSwitch;

  return (
    <div
      className="cmm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleOverlayClick}
      data-testid="chain-mismatch-modal"
    >
      <div className={`cmm-dialog glass-card ${className}`.trim()} ref={dialogRef}>
        {/* Header */}
        <div className="cmm-header">
          <div className="cmm-title-row">
            <div className="cmm-warning-icon-wrap" aria-hidden="true">
              {isWalletConnected ? (
                <AlertTriangle size={20} className="cmm-warning-icon" />
              ) : (
                <WifiOff size={20} className="cmm-offline-icon" />
              )}
            </div>
            <h2 id={titleId} className="cmm-title">
              {isWalletConnected
                ? 'Network Mismatch Detected'
                : 'Wallet Offline or Disconnected'}
            </h2>
          </div>
          <button
            type="button"
            className="cmm-close-btn"
            onClick={handleClose}
            aria-label="Close network mismatch dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Subtitle / Description */}
        <p id={descriptionId} className="cmm-description">
          {isWalletConnected
            ? `Your wallet (${walletName}) is currently connected to ${connectedChain.name}, but this application requires ${appChain.name}.`
            : `Your wallet appears to be offline or disconnected. Please connect your wallet or select an app network.`}
        </p>

        {/* Side-by-Side Chain Chips */}
        {isWalletConnected && (
          <div className="cmm-chips-container" data-testid="side-by-side-chips">
            {/* Connected Wallet Chain Chip */}
            <div className="cmm-chip cmm-chip--connected">
              <span className="cmm-chip-badge cmm-chip-badge--warning">
                <AlertTriangle size={12} aria-hidden="true" />
                <span>Wallet Connected</span>
              </span>
              <div className="cmm-chip-content">
                <span
                  className="cmm-chain-dot"
                  style={{ backgroundColor: connectedChain.color }}
                  aria-hidden="true"
                />
                <div className="cmm-chain-info">
                  <span className="cmm-chain-name">{connectedChain.name}</span>
                  <span className="cmm-chain-id">Chain ID: {connectedChain.id}</span>
                </div>
              </div>
            </div>

            {/* Transition Arrow */}
            <div className="cmm-arrow-wrap" aria-hidden="true">
              <ArrowRight size={20} className="cmm-arrow-icon" />
            </div>

            {/* App Required Chain Chip */}
            <div className="cmm-chip cmm-chip--required">
              <span className="cmm-chip-badge cmm-chip-badge--required">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>App Required</span>
              </span>
              <div className="cmm-chip-content">
                <span
                  className="cmm-chain-dot"
                  style={{ backgroundColor: appChain.color }}
                  aria-hidden="true"
                />
                <div className="cmm-chain-info">
                  <span className="cmm-chain-name">{appChain.name}</span>
                  <span className="cmm-chain-id">Chain ID: {appChain.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Per-wallet capability microcopy */}
        <div className="cmm-capability-notice">
          {isWalletConnected ? (
            <p className="cmm-notice-text">{walletCapability.mismatchNotice}</p>
          ) : (
            <p className="cmm-notice-text">
              Reconnect your wallet in {appChain.name} mode, or change your app target network below.
            </p>
          )}
        </div>

        {/* Manual switch help collapsible section */}
        {isWalletConnected && walletCapability.manualSwitchSteps.length > 0 && (
          <div className="cmm-help-section">
            <button
              type="button"
              className="cmm-help-toggle"
              aria-expanded={showHelpSteps}
              onClick={() => setShowHelpSteps((prev) => !prev)}
            >
              <HelpCircle size={14} aria-hidden="true" />
              <span>How to switch networks manually in {walletName}</span>
              <ChevronDown
                size={14}
                className={`cmm-toggle-chevron ${showHelpSteps ? 'cmm-toggle-chevron--open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showHelpSteps && (
              <div className="cmm-help-body" data-testid="manual-help-steps">
                <ol className="cmm-steps-list">
                  {walletCapability.manualSwitchSteps.map((step, idx) => (
                    <li key={idx} className="cmm-step-item">
                      {step}
                    </li>
                  ))}
                </ol>
                {walletCapability.helpUrl && (
                  <a
                    href={walletCapability.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cmm-help-url"
                  >
                    <span>Visit {walletName} support documentation</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="cmm-actions">
          {isWalletConnected && (
            <button
              type="button"
              className="cmm-btn cmm-btn--primary"
              onClick={switchWalletChain}
              disabled={isSwitching || !supportsAutoSwitch}
              aria-label={
                isSwitching
                  ? `Requesting network switch to ${appChain.name} in wallet...`
                  : supportsAutoSwitch
                    ? `Switch wallet to ${appChain.name}`
                    : `Manual network switch required in ${walletName}`
              }
            >
              {isSwitching ? (
                <>
                  <LoadingSpinner size={14} aria-hidden="true" />
                  <span>Switching in wallet...</span>
                </>
              ) : supportsAutoSwitch ? (
                <>
                  <RefreshCw size={14} aria-hidden="true" />
                  <span>Switch to {appChain.shortName} in wallet</span>
                </>
              ) : (
                <>
                  <HelpCircle size={14} aria-hidden="true" />
                  <span>Manual switch required in wallet</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className="cmm-btn cmm-btn--secondary"
            onClick={() => changeAppChain()}
            disabled={isSwitching || !isWalletConnected}
            aria-label={`Change app network to ${connectedChain.name}`}
          >
            <span>Change app network to {connectedChain.shortName}</span>
          </button>

          <button
            type="button"
            className="cmm-btn cmm-btn--tertiary"
            onClick={handleClose}
            disabled={isSwitching}
            aria-label="Dismiss dialog"
          >
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChainMismatchModal;
