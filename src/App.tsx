import type { MouseEvent } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from "react-router-dom";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { TwoFactorRecoveryPage } from "./pages/TwoFactorRecoveryPage";
import TwoFactorBackupCodesPage from "./pages/TwoFactorBackupCodesPage";
import { DesignTokensPage } from "./pages/DesignTokens/DesignTokensPage";
import { InvestorDiscovery } from "./components/InvestorDiscovery"; // Import here
import { InvestorPortfolioSummary } from "./pages/InvestorPortfolioSummary";
import { RevenueReportForm } from "./components/RevenueReportForm";
import { LedgerDemoPage } from "./pages/LedgerDemoPage";
import { OfferingRegistrationDemo } from "./pages/OfferingRegistrationDemo";
import NotificationBell from "./components/Notifications/NotificationBell";
import { notificationsMock } from "./components/Notifications/notificationsData";
import { OfferingWizardSummary } from "./pages/OfferingWizardSummary";
import { ScheduledExportsPage } from "./pages/ScheduledExportsPage";
import { StartupDashboard } from "./pages/StartupDashboard";
import { GovernanceVoteReceiptDemo } from "./pages/GovernanceVoteReceiptDemo";

export function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/recover-2fa" element={<TwoFactorRecoveryPage />} />
          <Route path="/settings/2fa/backup-codes" element={<TwoFactorBackupCodesPage />} />

          {/* Startup routes */}
          <Route
            path="/startup/dashboard"
            element={<StartupDashboard />}
          />
          <Route
            path="/startup/report-revenue"
            element={<RevenueReportForm />}
          />
          {/* Issue #199 – Inline document uploader (Offering Registration wizard) */}
          <Route
            path="/startup/offering-registration"
            element={<OfferingRegistrationDemo />}
          />
          {/* Issue #247 – Governance proposal creation multi-step form */}
          <Route
            path="/startup/governance/proposals/create"
            element={<GovernanceProposalCreatePage />}
          />
          {/* Issue #472 – Governance vote receipt with on-chain link */}
          <Route
            path="/startup/governance/vote-receipt"
            element={<GovernanceVoteReceiptDemo />}
          />

          {/* Investor routes */}
          <Route path="/investor/portal" element={<InvestorDiscovery />} />
          <Route path="/investor/portfolio" element={<InvestorPortfolioSummary />} />
          {/* Issue #139 – Virtualized Ledger Table */}
          <Route path="/investor/ledger" element={<LedgerDemoPage />} />

          {/* Admin routes */}
          <Route path="/admin/alerts" element={<AdminAlertsInbox />} />
          <Route path="/admin/scheduled-exports" element={<ScheduledExportsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

function AppLayout() {
  const handleSkipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById("main-content");
    if (!main) return;
    event.preventDefault();
    main.focus();
    main.scrollIntoView?.({ block: "start" });
    window.location.hash = "main-content";
  };

  return (
    <>
      <a href="#main-content" className="skip-link" onClick={handleSkipToContent}>
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}

function Home() {
  return (
    <div className="home-container animate-fade-in">
      {/* Header bar with notification bell */}
      <div className="w-full flex justify-end mb-4">
        <NotificationBell notifications={notificationsMock} />
      </div>
      <div className="home-card glass-card">
        <h1 className="home-title">
          Revora on <span className="text-primary">Stellar</span>
        </h1>
        <p className="home-description">
          Tokenized revenue-sharing infrastructure. Bridge the gap
          between visionaries and supporters with secure, on-chain execution.
        </p>

        <div className="home-grid">
          <section className="home-section glass-card">
            <h2 className="home-section-title">Startup Dashboard</h2>
            <ul className="home-list">
              <li>
                • <Link to="/startup/dashboard" className="link-styled">Issuer Dashboard</Link>
              </li>
              <li>• Configure RevenueShare offerings</li>
              <li>
                • <Link to="/startup/report-revenue" className="link-styled">Report monthly revenue</Link>
              </li>
              <li>
                • <Link to="/startup/offering-registration" className="link-styled">Register a RevenueShare offering</Link>
              </li>
              <li>• Track on-chain RevenueShare payouts</li>
              <li>
                • <Link to="/startup/governance/vote-receipt" className="link-styled">Governance vote receipt</Link>
              </li>
            </ul>
          </section>

          <section className="home-section glass-card">
            <h2 className="home-section-title">Investor Portal</h2>
            <ul className="home-list">
              <li>• Discover high-potential offerings</li>
              <li>• Invest using USDC on Stellar</li>
              <li>• <Link to="/investor/portfolio" className="link-styled">View portfolio summary</Link></li>
              <li>• <Link to="/investor/ledger" className="link-styled">Browse ledger entries</Link></li>
              <li>• <Link to="/investor/payouts" className="link-styled">View payout schedule</Link></li>
              <li>• See real-time RevenueShare payouts</li>
            </ul>
          </section>
        </div>

        <div className="home-actions" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <Link to="/signup" className="btn btn-primary" style={{ width: '100%' }}>
            Connect Stellar Wallet
          </Link>
          <div className="relative flex items-center w-full my-2">
            <div className="flex-grow border-t border-[rgba(148,163,184,0.1)]"></div>
            <span className="flex-shrink mx-4 text-muted text-xs uppercase tracking-wider font-medium">
              Or continue with email
            </span>
            <div className="flex-grow border-t border-[rgba(148,163,184,0.1)]"></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <Link to="/signup" className="btn btn-secondary" style={{ flex: 1 }}>
              Sign Up
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ flex: 1 }}>
              Sign In
            </Link>
          </div>
        </div>

        <div className="home-footer">
          revora-frontend (React + Vite + TS) • Powered by Stellar
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder-container">
      <div className="placeholder-card glass-card">
        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-text">
          This dashboard is currently under construction.
        </p>
        <Link to="/" className="btn btn--secondary btn--md">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
