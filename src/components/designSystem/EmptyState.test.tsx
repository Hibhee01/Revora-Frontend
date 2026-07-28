import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { EmptyState } from './EmptyState';

const noop = () => {};

describe('EmptyState', () => {
  const baseProps = {
    variant: 'distribution-dashboard' as const,
    title: 'No distributions yet',
    description: 'When revenue is reported, distributions will appear here.',
    primaryAction: { label: 'Report Revenue', onClick: noop },
  };

  it('renders the container with role="status"', () => {
    render(<EmptyState {...baseProps} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<EmptyState {...baseProps} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders the title as an h2 linked via aria-labelledby', () => {
    render(<EmptyState {...baseProps} />);
    const container = screen.getByRole('status');
    const labelId = container.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const heading = document.getElementById(labelId!);
    expect(heading).not.toBeNull();
    expect(heading!.tagName.toLowerCase()).toBe('h2');
    expect(heading).toHaveTextContent('No distributions yet');
  });

  it('renders the description', () => {
    render(<EmptyState {...baseProps} />);
    expect(screen.getByText(/When revenue is reported/i)).toBeInTheDocument();
  });

  it('renders the primary action button', () => {
    render(<EmptyState {...baseProps} />);
    expect(screen.getByRole('button', { name: /Report Revenue/i })).toBeInTheDocument();
  });

  it('calls primaryAction.onClick when clicked', async () => {
    const spy = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState {...baseProps} primaryAction={{ label: 'Report Revenue', onClick: spy }} />);
    await user.click(screen.getByRole('button', { name: /Report Revenue/i }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action when provided', () => {
    render(
      <EmptyState
        {...baseProps}
        secondaryAction={{ label: 'Learn More', onClick: noop }}
      />,
    );
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
  });

  it('does NOT render secondary action when not provided', () => {
    render(<EmptyState {...baseProps} />);
    expect(screen.queryByRole('button', { name: /Learn More/i })).toBeNull();
  });

  it('renders context node when provided', () => {
    render(
      <EmptyState
        {...baseProps}
        context={<span data-testid="context-node">filtered context</span>}
      />,
    );
    expect(screen.getByTestId('context-node')).toBeInTheDocument();
  });

  it('applies custom className to root', () => {
    render(<EmptyState {...baseProps} className="my-custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('my-custom-class');
  });

  it('renders a decorative SVG illustration', () => {
    render(<EmptyState {...baseProps} />);
    const svg = document.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('role', 'presentation');
  });

  it.each([
    'distribution-dashboard',
    'payout-schedule',
    'ledger',
    'audit-trail',
    'notifications',
    'revenue-reports',
  ] as const)('renders variant %s without crashing', (variant) => {
    const { getByRole } = render(<EmptyState {...baseProps} variant={variant} />);
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('renders primary action as link when href is provided', () => {
    render(
      <EmptyState
        {...baseProps}
        primaryAction={{ label: 'Go Back', href: '/dashboard' }}
      />,
    );
    const link = screen.getByRole('link', { name: /Go Back/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('uses aria-label from action when provided', () => {
    render(
      <EmptyState
        {...baseProps}
        primaryAction={{ label: 'Report', onClick: noop, ariaLabel: 'Submit your revenue report' }}
      />,
    );
    expect(screen.getByLabelText('Submit your revenue report')).toBeInTheDocument();
  });

  it('falls back to label for aria-label when ariaLabel is not provided', () => {
    render(
      <EmptyState
        {...baseProps}
        primaryAction={{ label: 'Report Revenue', onClick: noop }}
      />,
    );
    expect(screen.getByLabelText('Report Revenue')).toBeInTheDocument();
  });
});
