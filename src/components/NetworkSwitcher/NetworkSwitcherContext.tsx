import React, { createContext, useState, useCallback, useMemo } from 'react';
import {
  DEFAULT_APP_CHAIN_ID,
  getChainMetadata,
  ChainMetadata,
  parseChainId,
} from '../../constants/chains';
import {
  getWalletCapability,
  WalletCapability,
} from '../../constants/walletCapabilities';

export interface NetworkSwitcherContextValue {
  /** Connected chain ID in user's wallet */
  connectedChainId: number;
  /** App-selected required chain ID */
  appChainId: number;
  /** Connected wallet name (e.g. 'MetaMask', 'WalletConnect') */
  walletName: string;
  /** Online/connected status of user wallet */
  isWalletConnected: boolean;
  /** Is there a chain mismatch? (connectedChainId !== appChainId) */
  isMismatch: boolean;
  /** Is the chain mismatch modal open? */
  isModalOpen: boolean;
  /** Is a wallet switch request currently pending? */
  isSwitching: boolean;
  /** Metadata for connected wallet chain */
  connectedChain: ChainMetadata;
  /** Metadata for app required chain */
  appChain: ChainMetadata;
  /** Wallet capability info */
  walletCapability: WalletCapability;
  /** Trigger programmatic wallet chain switch */
  switchWalletChain: () => Promise<void>;
  /** Change app target chain to match wallet or selected chain */
  changeAppChain: (targetChainId?: number) => void;
  /** Update connected wallet chain */
  setConnectedChainId: (chainId: number | string) => void;
  /** Update app target chain */
  setAppChainId: (chainId: number | string) => void;
  /** Set connected wallet name */
  setWalletName: (name: string) => void;
  /** Set wallet connection status */
  setIsWalletConnected: (connected: boolean) => void;
  /** Open mismatch modal */
  openModal: () => void;
  /** Close mismatch modal */
  closeModal: () => void;
}

export const NetworkSwitcherContext =
  createContext<NetworkSwitcherContextValue | null>(null);

export interface NetworkSwitcherProviderProps {
  children: React.ReactNode;
  initialConnectedChainId?: number | string;
  initialAppChainId?: number | string;
  initialWalletName?: string;
  initialIsWalletConnected?: boolean;
  initialIsModalOpen?: boolean;
  onWalletSwitchRequested?: (targetChainId: number) => Promise<void>;
  onAppChainChanged?: (newChainId: number) => void;
}

export const NetworkSwitcherProvider: React.FC<NetworkSwitcherProviderProps> = ({
  children,
  initialConnectedChainId = 1, // Ethereum Mainnet (mismatched with Polygon by default)
  initialAppChainId = DEFAULT_APP_CHAIN_ID, // Polygon PoS (137)
  initialWalletName = 'MetaMask',
  initialIsWalletConnected = true,
  initialIsModalOpen = false,
  onWalletSwitchRequested,
  onAppChainChanged,
}) => {
  const [connectedChainId, setConnectedChainIdState] = useState<number>(() =>
    parseChainId(initialConnectedChainId),
  );
  const [appChainId, setAppChainIdState] = useState<number>(() =>
    parseChainId(initialAppChainId),
  );
  const [walletName, setWalletNameState] = useState<string>(initialWalletName);
  const [isWalletConnected, setIsWalletConnectedState] = useState<boolean>(
    initialIsWalletConnected,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(initialIsModalOpen);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  const isMismatch = useMemo(() => {
    if (!isWalletConnected) return false;
    return connectedChainId !== appChainId;
  }, [connectedChainId, appChainId, isWalletConnected]);

  const connectedChain = useMemo(
    () => getChainMetadata(connectedChainId),
    [connectedChainId],
  );

  const appChain = useMemo(() => getChainMetadata(appChainId), [appChainId]);

  const walletCapability = useMemo(
    () => getWalletCapability(walletName),
    [walletName],
  );

  const setConnectedChainId = useCallback((id: number | string) => {
    setConnectedChainIdState(parseChainId(id));
  }, []);

  const setAppChainId = useCallback(
    (id: number | string) => {
      const parsed = parseChainId(id);
      setAppChainIdState(parsed);
      if (onAppChainChanged) onAppChainChanged(parsed);
    },
    [onAppChainChanged],
  );

  const setWalletName = useCallback((name: string) => {
    setWalletNameState(name);
  }, []);

  const setIsWalletConnected = useCallback((connected: boolean) => {
    setIsWalletConnectedState(connected);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const switchWalletChain = useCallback(async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      if (onWalletSwitchRequested) {
        await onWalletSwitchRequested(appChainId);
      } else {
        // Mock async wallet switch delay for simulation
        await new Promise((res) => setTimeout(res, 600));
      }
      // Update connected chain to match app target
      setConnectedChainIdState(appChainId);
      setIsModalOpen(false);
    } catch {
      // Rejection or failure — retain modal state
    } finally {
      setIsSwitching(false);
    }
  }, [appChainId, isSwitching, onWalletSwitchRequested]);

  const changeAppChain = useCallback(
    (targetChainId?: number) => {
      const newChain = targetChainId ?? connectedChainId;
      setAppChainIdState(newChain);
      if (onAppChainChanged) onAppChainChanged(newChain);
      setIsModalOpen(false);
    },
    [connectedChainId, onAppChainChanged],
  );

  const value = useMemo<NetworkSwitcherContextValue>(
    () => ({
      connectedChainId,
      appChainId,
      walletName,
      isWalletConnected,
      isMismatch,
      isModalOpen,
      isSwitching,
      connectedChain,
      appChain,
      walletCapability,
      switchWalletChain,
      changeAppChain,
      setConnectedChainId,
      setAppChainId,
      setWalletName,
      setIsWalletConnected,
      openModal,
      closeModal,
    }),
    [
      connectedChainId,
      appChainId,
      walletName,
      isWalletConnected,
      isMismatch,
      isModalOpen,
      isSwitching,
      connectedChain,
      appChain,
      walletCapability,
      switchWalletChain,
      changeAppChain,
      setConnectedChainId,
      setAppChainId,
      setWalletName,
      setIsWalletConnected,
      openModal,
      closeModal,
    ],
  );

  return (
    <NetworkSwitcherContext.Provider value={value}>
      {children}
    </NetworkSwitcherContext.Provider>
  );
};
