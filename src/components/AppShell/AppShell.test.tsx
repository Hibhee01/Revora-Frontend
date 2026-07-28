import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppShell from './AppShell';
import { DensityProvider } from '../DensityProvider';

const renderAppShell = (ui: React.ReactNode) => {
  return render(<DensityProvider>{ui}</DensityProvider>);
};

describe('AppShell', () => {
  beforeEach(() => {
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  test('renders children content', () => {
    renderAppShell(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('displays logo and navigation items', () => {
    renderAppShell(<AppShell><div>Content</div></AppShell>);
    
    expect(screen.getByText('Revora')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  test('renders help button with aria-label', () => {
    renderAppShell(<AppShell><div>Content</div></AppShell>);
    
    const helpBtn = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    expect(helpBtn).toBeInTheDocument();
    expect(helpBtn.textContent).toBe('?');
  });

  test('opens keyboard shortcuts overlay when help button is clicked', () => {
    renderAppShell(<AppShell><div>Content</div></AppShell>);
    
    const helpBtn = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    fireEvent.click(helpBtn);
    
    expect(
      screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })
    ).toBeInTheDocument();
  });

  test('help button click is idempotent (multiple clicks keep overlay open)', () => {
    renderAppShell(<AppShell><div>Content</div></AppShell>);
    
    const helpBtn = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    fireEvent.click(helpBtn);
    fireEvent.click(helpBtn);
    fireEvent.click(helpBtn);
    
    expect(
      screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })
    ).toBeInTheDocument();
  });

  test('overlay closes via Escape after help button launch', () => {
    renderAppShell(<AppShell><div>Content</div></AppShell>);
    
    const helpBtn = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    fireEvent.click(helpBtn);
    expect(
      screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: 'Keyboard Shortcuts' })
    ).not.toBeInTheDocument();
  });

  test('mobile menu opens and closes', () => {
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));
    
    renderAppShell(<AppShell><div>Content</div></AppShell>);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument();
    
    fireEvent.click(menuButton);
    expect(screen.queryByLabelText('Mobile navigation')).not.toBeVisible();
  });
});
