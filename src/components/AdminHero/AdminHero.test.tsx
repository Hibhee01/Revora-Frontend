import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminHero, AdminTileData, IncidentData } from './AdminHero';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

const sampleTiles: AdminTileData[] = [
  {
    id: 'api-latency',
    label: 'API Latency',
    value: '42ms',
    status: 'healthy',
    detail: 'Avg response time',
    href: '/admin/api-latency',
  },
  {
    id: 'relay-health',
    label: 'On-Chain Relay',
    value: 'Connected',
    status: 'healthy',
    detail: 'Last block: 2s ago',
    href: '/admin/relay-health',
  },
  {
    id: 'open-alerts',
    label: 'Open Alerts',
    value: '3',
    status: 'degraded',
    href: '/admin/alerts',
  },
  {
    id: 'compliance-holds',
    label: 'Compliance Holds',
    value: '1',
    status: 'outage',
    detail: 'Identity verification required',
    href: '/admin/compliance',
  },
];

describe('AdminHero', () => {
  it('renders the title and subtitle', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('System health and compliance overview')).toBeInTheDocument();
  });

  it('renders all tiles', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    expect(screen.getByRole('list', { name: 'System health tiles' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders tile labels and values', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    expect(screen.getByText('API Latency')).toBeInTheDocument();
    expect(screen.getByText('42ms')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders tile detail when provided', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    expect(screen.getByText('Avg response time')).toBeInTheDocument();
    expect(screen.getByText('Last block: 2s ago')).toBeInTheDocument();
  });

  it('renders drill-down links with correct hrefs', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    const links = screen.getAllByRole('link', { name: /View details for/ });
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute('href', '/admin/api-latency');
    expect(links[1]).toHaveAttribute('href', '/admin/relay-health');
  });

  it('renders status glyphs with correct aria-labels', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    const glyphs = screen.getAllByRole('img', { name: /Status:/ });
    expect(glyphs).toHaveLength(4);
    expect(glyphs[0]).toHaveAttribute('aria-label', 'Status: Healthy');
    expect(glyphs[2]).toHaveAttribute('aria-label', 'Status: Degraded');
  });

  it('does not render incident banner when no incident provided', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders incident banner when incident is provided', () => {
    const incident: IncidentData = {
      id: 'test-incident',
      severity: 'warning',
      title: 'Partial outage detected',
      message: 'Some services may be affected',
    };
    renderWithRouter(<AdminHero tiles={sampleTiles} incident={incident} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Partial outage detected')).toBeInTheDocument();
    expect(screen.getByText('Some services may be affected')).toBeInTheDocument();
  });

  it('calls onDismissIncident when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const incident: IncidentData = {
      id: 'test-incident',
      severity: 'critical',
      title: 'Critical issue',
      message: 'System down',
    };
    renderWithRouter(
      <AdminHero tiles={sampleTiles} incident={incident} onDismissIncident={onDismiss} />
    );
    const dismissBtn = screen.getByRole('button', { name: /Dismiss incident/ });
    await user.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('test-incident');
  });

  it('renders outage and unknown status glyphs', () => {
    const mixedTiles: AdminTileData[] = [
      { id: 'a', label: 'Outage Tile', value: '0', status: 'outage', href: '/a' },
      { id: 'b', label: 'Unknown Tile', value: '?', status: 'unknown', href: '/b' },
    ];
    renderWithRouter(<AdminHero tiles={mixedTiles} />);
    const glyphs = screen.getAllByRole('img', { name: /Status:/ });
    expect(glyphs[0]).toHaveAttribute('aria-label', 'Status: Outage');
    expect(glyphs[1]).toHaveAttribute('aria-label', 'Status: Unknown');
  });

  it('applies custom className', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} className="custom-class" />);
    expect(screen.getByTestId('ah-tile-api-latency')).toBeInTheDocument();
  });

  it('uses custom id for section and heading association', () => {
    renderWithRouter(<AdminHero tiles={sampleTiles} id="custom-hero" />);
    const section = document.getElementById('custom-hero');
    expect(section).toBeInTheDocument();
  });
});
