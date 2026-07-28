import type { MouseEvent } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from "react-router-dom";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { DesignTokensPage } from "./pages/DesignTokens/DesignTokensPage";
import { InvestorDiscovery } from "./components/InvestorDiscovery"; // Import here
import { InvestorPortfolioSummary } from "./pages/InvestorPortfolioSummary";
import { RevenueReportForm } from "./components/RevenueReportForm";
import { LedgerDemoPage } from "./pages/LedgerDemoPage";
import { PayoutSchedule } from "./pages/PayoutSchedule";
import NotificationBell from "./components/Notifications/NotificationBell";
import { notificationsMock } from "./components/Notifications/notificationsData";
import { AdminAlertsInbox } from "./pages/AdminAlertsInbox";

export function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Startup routes */}
          <Route
            path="/startup/dashboard"
            element={<Placeholder title="Startup Dashboard" />}
          />
          <Route
            path="/startup/report-revenue"
            element={<RevenueReportForm />}
          />
          {/* Issue #229 – KYC rejection reasons panel */}
          <Route path="/startup/distributions" element={<DistributionDashboard />} />

          {/* Investor routes */}
          <Route path="/investor/portal" element={<InvestorDiscovery />} />
          <Route path="/investor/portfolio" element={<InvestorPortfolioSummary />} />
          {/* Issue #139 – Virtualized Ledger Table */}
          <Route path="/investor/ledger" element={<LedgerDemoPage />} />

          {/* Admin routes */}
          <Route path="/admin/alerts" element={<AdminAlertsInbox />} />
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
          Stellar RevenueShare – Revora
        </h1>
        <p className="home-description">
          Tokenized revenue-sharing infrastructure on Stellar. Bridge the gap
          between visionaries and supporters.
        </p>

        <div className="home-grid">
          <section className="home-section glass-card">
            <h2 className="home-section-title">Startup Dashboard</h2>
            <ul className="home-list">
              <li>• Configure RevenueShare offerings</li>
              <li>
                • <Link to="/startup/report-revenue" className="link-styled">Report monthly revenue</Link>
              </li>
              <li>
                • <Link to="/startup/distributions" className="link-styled">View distribution dashboard</Link>
              </li>
              <li>• Track on-chain RevenueShare payouts</li>
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

        <div className="home-actions">
          <Link to="/signup" className="btn btn--primary">
            Get Started
          </Link>
          <Link to="/login" className="btn btn--secondary">
            Sign In
          </Link>
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
