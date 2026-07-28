/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/hooks/useUploadQueue.ts',
        'src/components/UploadQueue/UploadQueue.tsx',
        'src/pages/DistributionDashboard.tsx',
        'src/pages/Login.tsx',
        'src/pages/Signup.tsx',
        'src/pages/ForgotPassword.tsx',
        'src/components/AuthLayout.tsx',
        'src/components/Button.tsx',
        'src/components/PasswordStrength.tsx',
        'src/utils/passwordStrength.ts',
        'src/components/InvestorDiscovery.tsx',
        'src/components/InvestorDiscovery.test.tsx',
        'src/components/KpiHeader.tsx',
        'src/components/AllocationWidget.tsx',
        'src/components/PerformanceTrendWidget.tsx',
        'src/pages/InvestorPortfolioSummary.tsx',
        // Issue #174 – Density modes
        'src/components/DensityProvider/DensityProvider.tsx',
        'src/components/DensityToggle/DensityToggle.tsx',
        'src/hooks/useDensity.ts',
        // Issue #221 – Payout status pills
        'src/components/PayoutStatusPill/payoutStatuses.ts',
        'src/components/PayoutStatusPill/PayoutStatusPill.tsx',
        'src/pages/PayoutSchedule.tsx',
        // Issue #225 - Thumbnail Preview Grid
        'src/components/ThumbnailGrid/ThumbnailGrid.tsx',
      ],
      thresholds: {
        'src/components/NetworkSwitcher/ChainMismatchModal.tsx': {
          branches: 80,
          functions: 95,
          lines: 90,
          statements: 90,
        },
        'src/components/NetworkSwitcher/NetworkSwitcherBadge.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/NetworkSwitcher/NetworkSwitcherContext.tsx': {
          branches: 80,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/hooks/useNetworkSwitcher.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/constants/chains.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/constants/walletCapabilities.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 90,
        },
        'src/components/designSystem/OnchainRejectionIllustration.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/StatusTimeline/OnchainRejectionCard.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/StatusTimeline/onchainRejectionCopy.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/DensityProvider/DensityProvider.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/DensityToggle/DensityToggle.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/hooks/useDensity.ts': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/PayoutTimeline/PayoutTimeline.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/pages/PayoutSchedule.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/InvestorDiscovery.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/KpiHeader.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/AllocationWidget.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/PerformanceTrendWidget.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/pages/InvestorPortfolioSummary.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        // Issue – Investor Statement PDF/UA
        'src/components/InvestorStatement/InvestorStatement.tsx': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/components/InvestorStatement/usePrintStatement.ts': {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        // Issue #225 - Thumbnail Preview Grid
        'src/components/ThumbnailGrid/ThumbnailGrid.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      }
    }
  }
});
