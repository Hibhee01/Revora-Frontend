import React from 'react';
import { AlertTriangle, ChevronDown, WifiOff } from 'lucide-react';
import { useNetworkSwitcher } from '../../hooks/useNetworkSwitcher';
import './ChainMismatchModal.css';

export interface NetworkSwitcherBadgeProps {
  /** Optional custom click handler override */
  onClick?: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * NetworkSwitcherBadge — Header status badge displaying active network and mismatch alerts.
 */
export const NetworkSwitcherBadge: React.FC<NetworkSwitcherBadgeProps> = ({
  onClick,
  className = '',
}) => {
  const {
    appChain,
    connectedChain,
    isMismatch,
    isWalletConnected,
    openModal,
  } = useNetworkSwitcher();

  const handleClick = onClick || openModal;

  const ariaLabel = isMismatch
    ? `Network mismatch: Connected to ${connectedChain.name}, app requires ${appChain.name}. Click to resolve.`
    : !isWalletConnected
      ? `Wallet offline or disconnected. App target network: ${appChain.name}. Click to connect.`
      : `Active network: ${appChain.name}. Click to switch networks.`;

  return (
    <button
      type="button"
      className={`ns-badge ${isMismatch ? 'ns-badge--mismatch' : ''} ${
        !isWalletConnected ? 'ns-badge--offline' : ''
      } ${className}`.trim()}
      onClick={handleClick}
      aria-label={ariaLabel}
      data-testid="network-switcher-badge"
    >
      <span
        className="ns-badge-dot"
        style={{
          backgroundColor: isMismatch ? '#f59e0b' : appChain.color,
        }}
        aria-hidden="true"
      />

      <span className="ns-badge-label">
        {isMismatch ? (
          <span className="ns-badge-mismatch-label">
            <AlertTriangle size={12} aria-hidden="true" />
            <span>Wrong Network</span>
          </span>
        ) : !isWalletConnected ? (
          <span className="ns-badge-offline-label">
            <WifiOff size={12} aria-hidden="true" />
            <span>{appChain.shortName}</span>
          </span>
        ) : (
          <span>{appChain.shortName}</span>
        )}
      </span>

      <ChevronDown size={12} className="ns-badge-chevron" aria-hidden="true" />
    </button>
  );
};

export default NetworkSwitcherBadge;
