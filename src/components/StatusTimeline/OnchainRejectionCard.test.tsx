import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { OnchainRejectionCard } from './OnchainRejectionCard';
import { ONCHAIN_REJECTION_COPY } from './onchainRejectionCopy';
import { axe } from 'jest-axe';

describe('OnchainRejectionCard', () => {
  it('renders role="alert" with aria-live="polite"', () => {
    render(<OnchainRejectionCard reason="insufficient-gas" />);
    const card = screen.getByTestId('onchain-rejection-card');
    expect(card).toHaveAttribute('role', 'alert');
    expect(card).toHaveAttribute('aria-live', 'polite');
  });

  it('renders copy template for insufficient-gas', () => {
    render(<OnchainRejectionCard reason="insufficient-gas" />);
    const copy = ONCHAIN_REJECTION_COPY['insufficient-gas'];
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.assuranceNote)).toBeInTheDocument();
  });

  it('renders copy template for all defined rejection reasons', () => {
    const reasons = [
      'insufficient-gas',
      'nonce-mismatch',
      'slippage-exceeded',
      'user-rejected',
      'execution-reverted',
      'unknown',
    ] as const;

    reasons.forEach((reason) => {
      const { unmount } = render(<OnchainRejectionCard reason={reason} />);
      const copy = ONCHAIN_REJECTION_COPY[reason];
      expect(screen.getByText(copy.title)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles unknown rejection reasons gracefully using fallback copy (edge case)', () => {
    render(<OnchainRejectionCard reason="some-unrecognized-error-code-12345" />);
    const fallbackCopy = ONCHAIN_REJECTION_COPY.unknown;
    expect(screen.getByText(fallbackCopy.title)).toBeInTheDocument();
    expect(screen.getByText(fallbackCopy.description)).toBeInTheDocument();
  });

  it('supports custom title and description overrides', () => {
    render(
      <OnchainRejectionCard
        reason="insufficient-gas"
        title="Custom Gas Limit Title"
        description="Custom explanation of the transaction error."
      />,
    );
    expect(screen.getByText('Custom Gas Limit Title')).toBeInTheDocument();
    expect(
      screen.getByText('Custom explanation of the transaction error.'),
    ).toBeInTheDocument();
  });

  it('renders primary CTA "Retry with adjusted gas" and triggers onRetry callback', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<OnchainRejectionCard reason="insufficient-gas" onRetry={onRetry} />);

    const retryBtn = screen.getByRole('button', { name: /Retry with adjusted gas/i });
    expect(retryBtn).toBeInTheDocument();

    await user.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders secondary CTA "Adjust gas settings" and triggers onAdjustGas callback', async () => {
    const onAdjustGas = vi.fn();
    const user = userEvent.setup();

    render(<OnchainRejectionCard reason="insufficient-gas" onAdjustGas={onAdjustGas} />);

    const adjustBtn = screen.getByRole('button', { name: /Adjust gas settings/i });
    expect(adjustBtn).toBeInTheDocument();

    await user.click(adjustBtn);
    expect(onAdjustGas).toHaveBeenCalledTimes(1);
  });

  it('renders tertiary CTA "Cancel transaction" and triggers onCancel callback', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<OnchainRejectionCard reason="insufficient-gas" onCancel={onCancel} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel transaction/i });
    expect(cancelBtn).toBeInTheDocument();

    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles retrying state with loading indicator', () => {
    render(
      <OnchainRejectionCard
        reason="insufficient-gas"
        onRetry={() => {}}
        isRetrying={true}
      />,
    );
    const retryBtn = screen.getByRole('button', { name: /Retrying transaction with adjusted gas/i });
    expect(retryBtn).toBeDisabled();
    expect(screen.getByText(/Retrying with gas\.\.\./i)).toBeInTheDocument();
  });

  it('handles retry-then-succeed transition (edge case)', async () => {
    let resolveRetry: () => void = () => {};
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<OnchainRejectionCard reason="insufficient-gas" onRetry={onRetry} />);

    const retryBtn = screen.getByRole('button', { name: /Retry with adjusted gas/i });
    await user.click(retryBtn);

    // Spinner shows while async retry resolves
    expect(screen.getByText(/Retrying with gas\.\.\./i)).toBeInTheDocument();

    // Resolve retry
    resolveRetry();

    // Succeeded card appears
    await waitFor(() => {
      expect(screen.getByTestId('onchain-rejection-success')).toBeInTheDocument();
      expect(screen.getByText(/Transaction succeeded/i)).toBeInTheDocument();
    });
  });

  it('handles retry failure gracefully when onRetry throws an error', async () => {
    const onRetry = vi.fn().mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();

    render(<OnchainRejectionCard reason="insufficient-gas" onRetry={onRetry} />);

    const retryBtn = screen.getByRole('button', { name: /Retry with adjusted gas/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('onchain-rejection-card')).toBeInTheDocument();
      expect(screen.queryByTestId('onchain-rejection-success')).toBeNull();
    });
  });

  it('passes jest-axe accessibility checks', async () => {
    const { container } = render(
      <OnchainRejectionCard
        reason="insufficient-gas"
        onRetry={() => {}}
        onAdjustGas={() => {}}
        onCancel={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
