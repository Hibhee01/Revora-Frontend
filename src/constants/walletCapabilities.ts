/**
 * Wallet Capabilities & Per-Wallet Microcopy — Network Switcher
 *
 * Defines wallet types, auto-switching support flags, microcopy templates,
 * and step-by-step manual network switching help guides.
 */

export type WalletType =
  | 'metamask'
  | 'rabby'
  | 'coinbase'
  | 'walletconnect'
  | 'ledger'
  | 'phantom'
  | 'generic';

export interface WalletCapability {
  /** Wallet identifier key */
  type: WalletType;
  /** Display name of the wallet */
  name: string;
  /** Does this wallet support programmatic wallet_switchEthereumChain? */
  supportsAutoSwitch: boolean;
  /** Icon or badge identifier */
  iconName: string;
  /** Specific guidance message when chain mismatch occurs */
  mismatchNotice: string;
  /** Manual switch step-by-step instructions */
  manualSwitchSteps: string[];
  /** External support link (optional) */
  helpUrl?: string;
}

export const WALLET_CAPABILITIES: Record<WalletType, WalletCapability> = {
  metamask: {
    type: 'metamask',
    name: 'MetaMask',
    supportsAutoSwitch: true,
    iconName: 'metamask',
    mismatchNotice:
      'Click "Switch in wallet" to send a network change prompt directly to your MetaMask extension.',
    manualSwitchSteps: [
      'Open the MetaMask extension or mobile app.',
      'Click the network dropdown at the top of the wallet header.',
      'Select the target network from your network list (or add it if missing).',
      'Confirm the switch prompt.',
    ],
    helpUrl: 'https://support.metamask.io',
  },
  rabby: {
    type: 'rabby',
    name: 'Rabby Wallet',
    supportsAutoSwitch: true,
    iconName: 'rabby',
    mismatchNotice:
      'Click "Switch in wallet" to approve the network change prompt in Rabby.',
    manualSwitchSteps: [
      'Open Rabby Wallet from your browser toolbar.',
      'Click the current chain icon near the top right.',
      'Search and select the target chain from the chain menu.',
    ],
  },
  coinbase: {
    type: 'coinbase',
    name: 'Coinbase Wallet',
    supportsAutoSwitch: true,
    iconName: 'coinbase',
    mismatchNotice:
      'Click "Switch in wallet" to approve the network switch request in Coinbase Wallet.',
    manualSwitchSteps: [
      'Open Coinbase Wallet extension or app.',
      'Navigate to Settings → Active Network.',
      'Select the required network.',
    ],
  },
  walletconnect: {
    type: 'walletconnect',
    name: 'WalletConnect',
    supportsAutoSwitch: false,
    iconName: 'walletconnect',
    mismatchNotice:
      'Your connected mobile wallet via WalletConnect does not support automatic network switching from web apps. Please manually select the required chain in your mobile wallet app.',
    manualSwitchSteps: [
      'Open your mobile wallet app (e.g. Rainbow, Trust Wallet).',
      'Navigate to network settings or active connection details.',
      'Switch the active connection network to the required chain.',
      'Return to this browser window.',
    ],
  },
  ledger: {
    type: 'ledger',
    name: 'Ledger / Hardware Wallet',
    supportsAutoSwitch: false,
    iconName: 'ledger',
    mismatchNotice:
      'Hardware wallets require selecting the matching blockchain app on your physical device and updating your interface network manually.',
    manualSwitchSteps: [
      'Open the target blockchain app on your physical Ledger device.',
      'Ensure Blind Signing is enabled if submitting smart contract transactions.',
      'Change the app target chain or update your interface connection.',
    ],
  },
  phantom: {
    type: 'phantom',
    name: 'Phantom Wallet',
    supportsAutoSwitch: true,
    iconName: 'phantom',
    mismatchNotice:
      'Click "Switch in wallet" to approve the network prompt in Phantom.',
    manualSwitchSteps: [
      'Open Phantom Wallet.',
      'Click Settings → Network.',
      'Select the target EVM network.',
    ],
  },
  generic: {
    type: 'generic',
    name: 'Web3 Wallet',
    supportsAutoSwitch: true,
    iconName: 'generic',
    mismatchNotice:
      'Click "Switch in wallet" to request a network update in your connected wallet app.',
    manualSwitchSteps: [
      'Open your wallet application.',
      'Locate the network or chain selector at the top of the interface.',
      'Select the required target network.',
      'Approve any pending connection requests.',
    ],
  },
};

/**
 * Returns wallet capability info for a wallet name string, defaulting to generic.
 */
export function getWalletCapability(walletName?: string): WalletCapability {
  if (!walletName) return WALLET_CAPABILITIES.generic;

  const normalized = walletName.toLowerCase();
  if (normalized.includes('metamask')) return WALLET_CAPABILITIES.metamask;
  if (normalized.includes('rabby')) return WALLET_CAPABILITIES.rabby;
  if (normalized.includes('coinbase')) return WALLET_CAPABILITIES.coinbase;
  if (normalized.includes('walletconnect')) return WALLET_CAPABILITIES.walletconnect;
  if (normalized.includes('ledger') || normalized.includes('hardware'))
    return WALLET_CAPABILITIES.ledger;
  if (normalized.includes('phantom')) return WALLET_CAPABILITIES.phantom;

  return {
    ...WALLET_CAPABILITIES.generic,
    name: walletName,
  };
}
