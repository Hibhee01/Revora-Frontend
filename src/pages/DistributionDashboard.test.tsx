/**
 * Integration tests for DistributionDashboard + KYC rejection panel (Issue #229).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import {
  DistributionDashboard,
  DEMO_REJECTION_REASONS,
} from './DistributionDashboard';

expect.extend(toHaveNoViolations);

function renderPage(
  props: React.ComponentProps<typeof DistributionDashboard> = {}
) {
  return render(
    <MemoryRouter>
      <DistributionDashboard {...props} />
    </MemoryRouter>
  );
}

describe('DistributionDashboard', () => {
  it('shows the KYC rejection panel by default with demo reasons', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /distribution dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('kyc-rejected-section')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /why your verification was rejected/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(DEMO_REJECTION_REASONS.length);
  });

  it('shows the empty-state when KYC is not rejected', () => {
    renderPage({ kycStatus: 'approved' });
    expect(screen.queryByTestId('kyc-rejected-section')).not.toBeInTheDocument();
    expect(screen.getByText(/no distributions yet/i)).toBeInTheDocument();
  });

  it('jumps to the failing step and surfaces a preview', async () => {
    const user = userEvent.setup();
    const onNavigateToStep = vi.fn();
    renderPage({ onNavigateToStep });

    await user.click(
      screen.getByRole('button', { name: /Re-upload ID: ID photo unclear/i })
    );

    expect(onNavigateToStep).toHaveBeenCalledWith(
      'id-upload',
      expect.objectContaining({ code: 'ID_BLURRY' })
    );
    expect(screen.getByTestId('kyc-step-preview')).toHaveTextContent(/ID Upload/i);
    await waitFor(() =>
      expect(screen.getByTestId('kyc-step-status')).toHaveTextContent(/Opened ID Upload/i)
    );
  });

  it('maps unclear vendor codes to Contact support', () => {
    renderPage();
    expect(
      screen.getByRole('link', { name: /Contact support: Needs clarification/i })
    ).toHaveAttribute('href', '/support/kyc');
  });

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
