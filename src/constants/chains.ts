/**
 * Chain Metadata & Configuration — Network Switcher (Issue #153 / UIUX)
 *
 * Defines supported blockchain networks, chain IDs, native currencies,
 * visual branding tokens, and fallback mechanisms for unknown networks.
 */

export interface ChainMetadata {
  /** Numerical chain ID (e.g. 1, 137, 42161) */
  id: number;
  /** Hexadecimal chain ID string (e.g. '0x1', '0x89') */
  hexId: string;
  /** Human-readable network name */
  name: string;
  /** Short display label */
  shortName: string;
  /** Native token symbol */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Block explorer URL */
  blockExplorerUrl: string;
  /** RPC URL placeholder */
  rpcUrl?: string;
  /** Brand color token for badge background */
  color: string;
  /** Accent color token for text/strokes */
  accentColor: string;
  /** Is this a testnet? */
  isTestnet?: boolean;
}

export const SUPPORTED_CHAINS: Record<number, ChainMetadata> = {
  1: {
    id: 1,
    hexId: '0x1',
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://etherscan.io',
    color: '#627eea',
    accentColor: '#8a9cf5',
  },
  137: {
    id: 137,
    hexId: '0x89',
    name: 'Polygon PoS',
    shortName: 'Polygon',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    blockExplorerUrl: 'https://polygonscan.com',
    color: '#8247e5',
    accentColor: '#a472f7',
  },
  42161: {
    id: 42161,
    hexId: '0xa4b1',
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://arbiscan.io',
    color: '#28a0f0',
    accentColor: '#60bbf9',
  },
  10: {
    id: 10,
    hexId: '0xa',
    name: 'OP Mainnet',
    shortName: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    color: '#ff0420',
    accentColor: '#ff5e6e',
  },
  8453: {
    id: 8453,
    hexId: '0x2105',
    name: 'Base Mainnet',
    shortName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://basescan.org',
    color: '#0052ff',
    accentColor: '#4d88ff',
  },
  43114: {
    id: 43114,
    hexId: '0xa86a',
    name: 'Avalanche C-Chain',
    shortName: 'Avalanche',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    blockExplorerUrl: 'https://snowtrace.io',
    color: '#e84142',
    accentColor: '#f17576',
  },
  11155111: {
    id: 11155111,
    hexId: '0xaa36a7',
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    color: '#f59e0b',
    accentColor: '#fbbf24',
    isTestnet: true,
  },
};

export const DEFAULT_APP_CHAIN_ID = 137; // Polygon PoS default for Revora

/**
 * Returns metadata for a chain ID, or a safe fallback for unknown chains (edge case handling).
 */
export function getChainMetadata(chainId: number | string): ChainMetadata {
  const numericId = typeof chainId === 'string' ? parseChainId(chainId) : chainId;

  if (numericId in SUPPORTED_CHAINS) {
    return SUPPORTED_CHAINS[numericId];
  }

  return {
    id: numericId || 0,
    hexId: `0x${(numericId || 0).toString(16)}`,
    name: `Unknown Network (Chain ID: ${numericId})`,
    shortName: `Chain ${numericId}`,
    nativeCurrency: { name: 'Unknown', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: '',
    color: '#94a3b8',
    accentColor: '#cbd5e1',
  };
}

/**
 * Parses chain ID from hex string or number.
 */
export function parseChainId(chainId: string | number): number {
  if (typeof chainId === 'number') return chainId;
  if (typeof chainId === 'string') {
    if (chainId.startsWith('0x') || chainId.startsWith('0X')) {
      return parseInt(chainId, 16);
    }
    return parseInt(chainId, 10);
  }
  return 0;
}
