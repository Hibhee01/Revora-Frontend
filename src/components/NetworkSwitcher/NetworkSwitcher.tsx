import React, { useState, useCallback } from 'react';
import { NetworkSwitcherPanel } from './NetworkSwitcherPanel';
import './NetworkSwitcher.css';

export interface Network {
  id: string;
  name: string;
}

interface NetworkSwitcherProps {
  networks: Network[];
  currentNetworkId?: string;
  onNetworkChange: (networkId: string) => void;
}

export function NetworkSwitcher({ networks, currentNetworkId, onNetworkChange }: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentNetwork = networks.find((n) => n.id === currentNetworkId);

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="network-switcher" onKeyDown={handleKeyDown}>
      <button
        className="network-switcher-trigger"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current network: ${currentNetwork?.name ?? 'Select network'}`}
      >
        {currentNetwork ? currentNetwork.name : 'Select Network'}
      </button>
      {isOpen && (
        <NetworkSwitcherPanel
          networks={networks}
          currentNetworkId={currentNetworkId}
          onNetworkChange={(id) => {
            onNetworkChange(id);
            close();
          }}
          onClose={close}
        />
      )}
    </div>
  );
}
