// src/components/AppShell/AppShell.tsx
import React, { useState, useEffect } from 'react';
import './AppShell.css';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsOverlay } from '../KeyboardShortcutsOverlay/KeyboardShortcutsOverlay';
import { DensityToggle } from '../DensityToggle';
import {
  NetworkSwitcherBadge,
  ChainMismatchModal,
  NetworkSwitcherProvider,
} from '../NetworkSwitcher';
import { ErrorRecoveryPanel } from '../ErrorRecoveryPanel';
import { useErrorSnapshots } from '../../hooks/useErrorSnapshots';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShellContent: React.FC<AppShellProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isErrorPanelOpen, setIsErrorPanelOpen] = useState(false);
  const { unreadCount } = useErrorSnapshots();
  const {
    isOpen: shortcutsOpen,
    isMac,
    open: openShortcuts,
    close: closeShortcuts,
  } = useKeyboardShortcuts();

  // Check if mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.pathname]);

  const navItems = [
    { name: 'Discovery', path: '/discovery' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Management', path: '/management' },
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          {/* Logo */}
          <div className="logo">
            <a href="/">
              <h1>Revora</h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Primary navigation">
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <a href={item.path} className="nav-link">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account & Notifications */}
          <div className="header-actions">
            {/* Network Switcher Status Badge */}
            <NetworkSwitcherBadge />

            <button 
              className="error-recovery-btn" 
              aria-label="Recovery snapshots"
              onClick={() => setIsErrorPanelOpen(true)}
            >
              ⚠️
              {unreadCount > 0 && (
                <span className="error-affordance-badge" data-testid="error-unread-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button className="notifications-btn" aria-label="Notifications">
              🔔
            </button>
            <button
              className="help-btn"
              onClick={openShortcuts}
              aria-label="Keyboard shortcuts"
            >
              ?
            </button>
            {/* Density toggle — compact (icon-only) in header */}
            <DensityToggle compact />
            <button className="account-btn" aria-label="Account menu">
              👤
            </button>
            
            {/* Mobile menu button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobile && (
        <div
          className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}
          aria-hidden={!isMobileMenuOpen}
          style={{ display: isMobileMenuOpen ? 'block' : 'none' }}
        >
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Overlay for mobile drawer */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="app-main">
        <div className="content-container">
          {children}
        </div>
      </main>

      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcutsOverlay
        isOpen={shortcutsOpen}
        onClose={closeShortcuts}
        isMac={isMac}
        isMobile={isMobile}
      />

      {/* Error Recovery Panel */}
      <ErrorRecoveryPanel 
        isOpen={isErrorPanelOpen} 
        onClose={() => setIsErrorPanelOpen(false)} 
      />

      {/* Network Switcher Chain Mismatch Modal */}
      <ChainMismatchModal />
    </div>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => {
  return (
    <NetworkSwitcherProvider>
      <AppShellContent {...props} />
    </NetworkSwitcherProvider>
  );
};

export default AppShell;