import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from './App';

describe('App Components Accessibility', () => {
  it('renders standard links and buttons correctly', () => {
    render(<App />);
    
    // Test that the 'Get Started' and 'Sign In' links render and have href attributes
    const getStartedLink = screen.getByText('Get Started');
    const signInLink = screen.getByText('Sign In');
    
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink.tagName.toLowerCase()).toBe('a');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.tagName.toLowerCase()).toBe('a'); 
  });

  it('renders the header correctly', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /Stellar RevenueShare – Revora/i });
    expect(heading).toBeInTheDocument();
  });

  it('provides a skip-to-content link that moves focus to main', async () => {
    render(<App />);
    const user = userEvent.setup();

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const main = screen.getByRole('main');

    await user.tab();
    expect(skipLink).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(main).toHaveFocus();
  });

  it('uses a single main landmark on each route', () => {
    render(<App />);
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('does not throw if skip target is missing', async () => {
    render(<App />);
    const user = userEvent.setup();

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const originalGetElementById = document.getElementById.bind(document);
    const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'main-content') return null;
      return originalGetElementById(id);
    });

    await user.click(skipLink);
    expect(skipLink).toBeInTheDocument();
    getElementByIdSpy.mockRestore();
  });

  it('enforces one h1 on the investor discovery route and keeps heading hierarchy', () => {
    window.history.pushState({}, '', '/investor/portal');
    render(<App />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: /discover offerings/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: /offerings/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('renders the startup dashboard placeholder route', () => {
    window.history.pushState({}, '', '/startup/dashboard');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /startup dashboard/i })).toBeInTheDocument();
  });

  it('renders the offering registration route with its document uploader', () => {
    window.history.pushState({}, '', '/startup/offering-registration');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /offering registration/i })).toBeInTheDocument();
    expect(screen.getByText('Upload KYC documents')).toBeInTheDocument();
  });
});
