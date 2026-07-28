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
        // Issue #272 – Payout timeline RTL mirror
        'src/components/PayoutTimeline/PayoutTimeline.tsx',
        'src/pages/PayoutSchedule.tsx',
      ],
      thresholds: {
        'src/hooks/useUploadQueue.ts': {
          branches: 95, functions: 95, lines: 95, statements: 95,
        },
        'src/components/UploadQueue/UploadQueue.tsx': {
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
      }
    }
  }
});
