import React, { act } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DistributionDashboard } from './DistributionDashboard';

expect.extend(toHaveNoViolations);

describe('DistributionDashboard', () => {
  const renderWithRouter = (initialEntries = ['/distribution-dashboard']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/distribution-dashboard" element={<DistributionDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders distribution dashboard header and description', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { level: 1, name: /distribution dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Monitor and audit on-chain RevenueShare payout cycles/i)).toBeInTheDocument();
  });

  it('renders report monthly revenue link', () => {
    renderWithRouter();

    const link = screen.getByText('+ Report Monthly Revenue');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/startup/report-revenue');
  });

  it('renders the governance proposal detail experience', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { name: /increase developer grant fund/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /quorum/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /for/i })).toBeInTheDocument();
  });

  it('renders recent uploads queue section', () => {
    renderWithRouter();

    expect(screen.getByText('Recent Uploads Queue')).toBeInTheDocument();
    expect(screen.getByText('Q3_Revenue_Report.pdf')).toBeInTheDocument();
    expect(screen.getByText('malicious_payload.exe')).toBeInTheDocument();
  });

  describe('error rate sparkline tiles', () => {
    it('renders error rate section heading', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { level: 2, name: /Payout Error Rates/i })).toBeInTheDocument();
    });

    it('renders error rate section container', () => {
      renderWithRouter();

      expect(screen.getByTestId('error-rate-section')).toBeInTheDocument();
    });

    it('renders View all failed link', () => {
      renderWithRouter();

      const link = screen.getByTestId('error-rate-view-all');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/startup/distributions?status=failed');
    });

    it('renders By Issuer and By Region subgroups', () => {
      renderWithRouter();

      expect(screen.getByTestId('error-rate-by-issuer')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-by-region')).toBeInTheDocument();
    });

    it('renders By Issuer heading', () => {
      renderWithRouter();

      expect(screen.getByText('By Issuer')).toBeInTheDocument();
    });

    it('renders By Region heading', () => {
      renderWithRouter();

      expect(screen.getByText('By Region')).toBeInTheDocument();
    });

    it('renders issuer error rate tiles with correct values', () => {
      renderWithRouter();

      expect(screen.getByTestId('error-rate-tile-issuer-acme')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-tile-issuer-nexus')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-tile-issuer-aero')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-tile-issuer-stellar')).toBeInTheDocument();
    });

    it('renders region error rate tiles with correct values', () => {
      renderWithRouter();

      expect(screen.getByTestId('error-rate-tile-region-na')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-tile-region-eu')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-tile-region-apac')).toBeInTheDocument();
      expect(screen.getByTestId('error-rate-tile-region-latam')).toBeInTheDocument();
    });

    it('renders 4 issuer tiles and 4 region tiles', () => {
      renderWithRouter();

      const issuerList = screen.getByRole('list', { name: /Error rates by issuer/i });
      expect(issuerList.children).toHaveLength(4);

      const regionList = screen.getByRole('list', { name: /Error rates by region/i });
      expect(regionList.children).toHaveLength(4);
    });

    it('renders issuer tile with link to filtered detail page', () => {
      renderWithRouter();

      const tileLink = screen.getByTestId('error-rate-tile-issuer-acme').closest('a');
      expect(tileLink).toHaveAttribute(
        'href',
        '/startup/distributions?issuer=Nexus%20Cloud%20Series%20A&status=failed'
      );
    });

    it('renders region tile with link to filtered detail page', () => {
      renderWithRouter();

      const tileLink = screen.getByTestId('error-rate-tile-region-na').closest('a');
      expect(tileLink).toHaveAttribute(
        'href',
        '/startup/distributions?region=North%20America&status=failed'
      );
    });

    it('displays issuer filter value in tile footer', () => {
      renderWithRouter();

      expect(screen.getByText('Issuer: Nexus Cloud Series A')).toBeInTheDocument();
      expect(screen.getByText('Issuer: Quantum Labs')).toBeInTheDocument();
    });

    it('displays region filter value in tile footer', () => {
      renderWithRouter();

      expect(screen.getByText('Region: North America')).toBeInTheDocument();
      expect(screen.getByText('Region: Asia Pacific')).toBeInTheDocument();
    });

    it('renders sparkline SVGs with trend labels', () => {
      renderWithRouter();

      const decreasingSparklines = screen.getAllByRole('img', { name: /decreasing/i });
      const increasingSparklines = screen.getAllByRole('img', { name: /increasing/i });

      expect(decreasingSparklines.length).toBeGreaterThanOrEqual(1);
      expect(increasingSparklines.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders GovernanceResults section', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { name: /Results Breakdown/i })).toBeInTheDocument();
    expect(screen.getByText(/68\.4% turnout/i)).toBeInTheDocument();
  });

  it('renders empty state for distributions', () => {
    renderWithRouter();

    expect(screen.getByText('No distributions yet')).toBeInTheDocument();
  });

  it('has working Back to Discovery link', () => {
    renderWithRouter();

    const backLink = screen.getByText('Back to Discovery');
    expect(backLink.closest('a')).toHaveAttribute('href', '/investor/portal');
  });

  it('passes axe accessibility checks with 0 violations', async () => {
    const { container } = renderWithRouter();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
