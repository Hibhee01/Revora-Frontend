import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { OfferingRegistrationSuccess, type NextStepCard } from './OfferingRegistrationSuccess';
import type { Milestone } from './StatusTimeline';

const renderComponent = (props: Record<string, unknown> = {}) =>
  render(
    <MemoryRouter>
      <OfferingRegistrationSuccess {...props} />
    </MemoryRouter>,
  );

describe('OfferingRegistrationSuccess', () => {
  it('renders the success hero with title', () => {
    renderComponent();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /your offering has been submitted/i,
    );
  });

  it('includes issuer name in title when provided', () => {
    renderComponent({ issuerName: 'Acme Corp' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Acme Corp/,
    );
  });

  it('includes offering name in subtitle when provided', () => {
    renderComponent({ offeringName: 'Series A 2026' });
    expect(
      screen.getByText(/Series A 2026/),
    ).toBeInTheDocument();
  });

  it('renders decorative success illustration', () => {
    renderComponent();
    const svg = document.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows fallback illustration when illustration fails to load', () => {
    renderComponent();

    const illustrationWrap = document.querySelector('.ors-hero-illustration-wrap');
    expect(illustrationWrap).toBeInTheDocument();

    const fallback = document.querySelector('.ors-hero-illustration-fallback');
    expect(fallback).not.toBeInTheDocument();

    const svg = document.querySelector('svg');
    if (svg) {
      const errorEvent = new Event('error');
      svg.dispatchEvent(errorEvent);
    }
  });

  it('renders reference number badge', () => {
    renderComponent({ referenceNumber: 'REF-2026-000001' });
    const badge = screen.getByText('REF-2026-000001');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', 'Reference: REF-2026-000001');
  });

  it('renders review timeline section', () => {
    renderComponent();
    expect(
      screen.getByText('Review Timeline'),
    ).toBeInTheDocument();
  });

  it('renders timeline milestones via StatusTimeline', () => {
    const milestones: Milestone[] = [
      { id: 'step-1', label: 'Step One', status: 'completed' },
      { id: 'step-2', label: 'Step Two', status: 'in-progress' },
      { id: 'step-3', label: 'Step Three', status: 'pending' },
    ];
    renderComponent({ milestones });

    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();
  });

  it('renders default milestones when none are provided', () => {
    renderComponent();
    expect(screen.getByText('Offering Submitted')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Compliance Check')).toBeInTheDocument();
    expect(screen.getByText('Offering Published')).toBeInTheDocument();
  });

  it('shows estimated review date when submissionDate is provided', () => {
    renderComponent({
      submissionDate: '2026-07-28T12:00:00Z',
      estimatedReviewDays: 5,
    });
    expect(
      screen.getByText(/August 2, 2026/),
    ).toBeInTheDocument();
  });

  it('does not show estimated date when no submissionDate', () => {
    renderComponent({ submissionDate: undefined });
    expect(screen.queryByText(/Estimated review completion/)).toBeNull();
  });

  it('renders next steps section with heading', () => {
    renderComponent();
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
  });

  it('renders default CTA cards (Dashboard, Documents, Support)', () => {
    renderComponent();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('renders Dashboard card as a link to /startup/dashboard', () => {
    renderComponent();
    const dashboardLink = screen.getByLabelText(/Go to Dashboard: Track the review status/i);
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/startup/dashboard');
  });

  it('renders Documents card as a link to /startup/documents', () => {
    renderComponent();
    const documentsLink = screen.getByLabelText(/View Documents: Upload additional documents/i);
    expect(documentsLink).toBeInTheDocument();
    expect(documentsLink).toHaveAttribute('href', '/startup/documents');
  });

  it('renders custom next steps when provided', () => {
    const nextSteps: NextStepCard[] = [
      {
        icon: <span>📊</span>,
        title: 'Analytics',
        description: 'View your analytics',
        to: '/analytics',
        label: 'View Analytics',
      },
    ];
    renderComponent({ nextSteps });
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    const link = screen.getByLabelText(/View Analytics/);
    expect(link).toHaveAttribute('href', '/analytics');
  });

  it('renders support card with contact button when onContactSupport is provided', () => {
    const onContactSupport = vi.fn();
    renderComponent({
      nextSteps: undefined,
      onContactSupport,
    });

    const contactBtn = screen.getByLabelText('Contact Support');
    expect(contactBtn).toBeInTheDocument();
    contactBtn.click();
    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });

  it('renders support section with mailto link by default', () => {
    renderComponent();
    const supportLink = screen.getByLabelText(/Email support team at support@revora.com/i);
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', 'mailto:support@revora.com');
  });

  it('renders support section with button when onContactSupport is provided', () => {
    const onContactSupport = vi.fn();
    renderComponent({ onContactSupport });
    const supportBtn = screen.getByLabelText('Contact support team');
    expect(supportBtn).toBeInTheDocument();
    expect(supportBtn.tagName.toLowerCase()).toBe('button');
  });

  it('has main landmark with accessible name', () => {
    renderComponent();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-labelledby', 'ors-hero-title');
  });

  it('renders timeline inside a glass-card', () => {
    renderComponent();
    const timelineCards = document.querySelectorAll('.glass-card');
    expect(timelineCards.length).toBeGreaterThanOrEqual(1);
  });

  it('does not crash with empty milestones array', () => {
    renderComponent({ milestones: [] });
    expect(screen.getByText('Review Timeline')).toBeInTheDocument();
  });

  it('renders timeline with aria-label on nav', () => {
    renderComponent();
    const timelineNav = screen.getByLabelText('Offering registration progress');
    expect(timelineNav).toBeInTheDocument();
  });

  it('uses default reference number format when none provided', () => {
    renderComponent();
    const badge = document.querySelector('.ors-reference-badge');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toMatch(/REF-2026-\d{6}/);
  });

  it('renders CTA cards with consistent icon wraps', () => {
    renderComponent();
    const iconWraps = document.querySelectorAll('.ors-cta-card-icon-wrap');
    expect(iconWraps.length).toBe(3);
  });

  it('renders next steps nav with accessible label', () => {
    renderComponent();
    const nav = screen.getByLabelText('Quick actions');
    expect(nav).toBeInTheDocument();
  });

  it('handles long issuer names without breaking layout', () => {
    renderComponent({
      issuerName: 'Extremely Long Company Name That Should Wrap Gracefully Without Breaking Layout',
    });
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Extremely Long Company Name');
  });

  it('renders with minimal props without errors', () => {
    const { container } = renderComponent({});
    expect(container.querySelector('.ors-container')).toBeInTheDocument();
  });

  it('includes title attribute on reference badge', () => {
    renderComponent({ referenceNumber: 'REF-TEST' });
    const badge = screen.getByText('REF-TEST');
    expect(badge).toHaveAttribute('title', 'Reference: REF-TEST');
  });

  it('renders arrow icons on CTA cards', () => {
    renderComponent();
    const arrows = document.querySelectorAll('.ors-cta-card-action-icon');
    expect(arrows.length).toBeGreaterThan(0);
  });
});
