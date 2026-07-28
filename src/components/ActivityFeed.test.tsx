import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivityFeed from './ActivityFeed';
import { BrowserRouter } from 'react-router-dom';

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <ActivityFeed />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading activity feed…')).toBeInTheDocument();
  });

  it('renders feed items and empty states correctly', async () => {
    render(
      <BrowserRouter>
        <ActivityFeed />
      </BrowserRouter>
    );
    
    // Fast-forward through the loading delay
    vi.runAllTimers();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading activity feed…')).not.toBeInTheDocument();
    });

    // It should render ActivityItems
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);

    // It should render the Empty Day Divider
    expect(screen.getByText(/days with no activity/)).toBeInTheDocument();

    // It should render the Quiet Week Summary Card
    expect(screen.getByText("It's been a quiet week")).toBeInTheDocument();
    expect(screen.getByText("Manage Notification Settings")).toBeInTheDocument();
  });
});
