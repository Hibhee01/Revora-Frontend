export type PayoutStatus = 'completed' | 'processing' | 'failed' | 'scheduled';

export type RecipientStatus = 'success' | 'pending' | 'failed';

export interface RecipientItem {
  id: string;
  walletAddress: string;
  name?: string;
  tier: string;
  sharePercentage: number;
  amount: number;
  status: RecipientStatus;
  gasAllocatedGwei: number;
  txHash?: string;
}

export interface RetryEvent {
  id: string;
  timestamp: string;
  attemptNumber: number;
  status: 'success' | 'failed';
  reason: string;
  errorDetails?: string;
  txHash?: string;
  gasUsedGwei?: number;
}

export interface PayoutDetail {
  id: string;
  payoutNumber: string;
  date: string;
  time: string;
  status: PayoutStatus;
  grossAmount: number;
  netAmount: number;
  protocolFeeUsd: number;
  currency: string;
  offeringName: string;
  offeringId: string;
  gasFeeUsd: number;
  gasFeeEth: number;
  gasPriceGwei: number;
  estimatedGasUsd: number;
  estimatedGasPriceGwei: number;
  executionNetwork: string;
  blockNumber: number;
  contractAddress: string;
  transactionHash: string;
  recipientsCount: number;
  recipients: RecipientItem[];
  retries: RetryEvent[];
  nextPayoutDate?: string;
  nextPayoutEstimateUsd?: number;
  nextPayoutLink?: string;
}

export type PanelTab = 'overview' | 'recipients' | 'history';

export interface PayoutDrillDownPanelProps {
  isOpen: boolean;
  payoutId: string | null;
  payoutData?: PayoutDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetryBatch?: (payoutId: string) => Promise<void> | void;
  onExportCsv?: (payoutId: string) => void;
  onRetryLoad?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}
