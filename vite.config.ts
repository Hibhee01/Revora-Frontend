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
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/hooks/useUploadQueue.ts',
        'src/components/UploadQueue/UploadQueue.tsx',
        'src/pages/DistributionDashboard.tsx',
        'src/utils/financialTermsValidation.ts',
        'src/hooks/useFinancialTermsForm.ts',
        'src/components/FinancialTermsForm/FinancialTermsForm.tsx',
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
        // Issue #199 – Inline document uploader
        'src/components/DocumentUploader/DocumentUploader.tsx',
        // Issue #472 – Governance vote receipt
        'src/components/GovernanceVoteReceipt/GovernanceVoteReceipt.tsx',
        // Command Palette
        'src/components/CommandPalette/CommandPalette.tsx',
        'src/components/CommandPalette/commandPaletteData.ts',
        'src/hooks/useCommandPalette.ts',
        // Issue #493 – Notification bell reduced-motion
        'src/components/Notifications/NotificationBell.tsx',
      ],
      thresholds: {
        'src/utils/financialTermsValidation.ts': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/hooks/useFinancialTermsForm.ts': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/FinancialTermsForm/FinancialTermsForm.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/hooks/useUploadQueue.ts': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/UploadQueue/UploadQueue.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/DocumentUploader/DocumentUploader.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/GovernanceVoteReceipt/GovernanceVoteReceipt.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
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
        'src/components/CommandPalette/CommandPalette.tsx': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/CommandPalette/commandPaletteData.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/hooks/useCommandPalette.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/Notifications/NotificationBell.tsx': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
      }
    }
  }
});
