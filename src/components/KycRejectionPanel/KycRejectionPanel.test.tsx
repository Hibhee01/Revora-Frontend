/**
 * Tests for KycRejectionPanel (Issue #229).
 * Covers multi-reason list, severity icons+text, corrective CTAs, unclear
 * → contact support fallback, empty render, RTL, mobile stacked class
 * structure, and axe accessibility checks.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { KycRejectionPanel } from './KycRejectionPanel';
import type { KycRejectionReason } from './kycRejectionTaxonomy';

expect.extend(toHaveNoViolations);

const MULTI_REASONS: KycRejectionReason[] = [
  { id: 'r1', code: 'ID_BLURRY' },
  { id: 'r2', code: 'ADDRESS_EXPIRED', detail: 'Document dated January 2025.' },
  { id: 'r3', code: 'LIVENESS_FAILED' },
  { id: 'r4', code: 'UNKNOWN_CODE' },
];

function renderPanel(
  reasons: KycRejectionReason[] = MULTI_REASONS,
  props: Partial<React.ComponentProps<typeof KycRejectionPanel>> = {}
) {
  const onNavigateToStep = vi.fn();
  const view = render(
    <KycRejectionPanel
      reasons={reasons}
      onNavigateToStep={onNavigateToStep}
      supportHref="/support/kyc"
      {...props}
    />
  );
  return { onNavigateToStep, ...view };
}

describe('KycRejectionPanel', () => {
  it('renders nothing when there are no reasons', () => {
    const { container } = renderPanel([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('exposes a labelled region with a summary of issue counts', () => {
    renderPanel();
    const region = screen.getByRole('region', {
      name: /why your verification was rejected/i,
    });
    expect(region).toBeInTheDocument();
    expect(screen.getByText(/4 issues need your attention/i)).toBeInTheDocument();
    expect(screen.getByText(/2 blocking/i)).toBeInTheDocument();
  });

  it('lists each reason with chip, severity text, explanation, and CTA', () => {
    renderPanel();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);

    const first = items[0];
    expect(within(first).getByTestId('kyc-chip-r1')).toHaveTextContent(/ID photo unclear/i);
    expect(within(first).getByTestId('kyc-severity-r1')).toHaveTextContent(/Blocking/i);
    expect(within(first).getByText(/sharp, well-lit/i)).toBeInTheDocument();
    expect(
      within(first).getByRole('button', { name: /Re-upload ID: ID photo unclear/i })
    ).toBeInTheDocument();
  });

  it('appends reviewer detail to the explanation', () => {
    renderPanel([{ id: 'd', code: 'ADDRESS_EXPIRED', detail: 'Document dated January 2025.' }]);
    expect(screen.getByText(/Reviewer note: Document dated January 2025/i)).toBeInTheDocument();
  });

  it('jumps to the failing KYC step when a corrective CTA is activated', async () => {
    const user = userEvent.setup();
    const { onNavigateToStep } = renderPanel([
      { id: 'r1', code: 'ID_BLURRY' },
      { id: 'r2', code: 'LIVENESS_FAILED' },
    ]);

    await user.click(
      screen.getByRole('button', { name: /Retake liveness check: Liveness check failed/i })
    );

    expect(onNavigateToStep).toHaveBeenCalledTimes(1);
    expect(onNavigateToStep.mock.calls[0][0]).toBe('liveness-check');
    expect(onNavigateToStep.mock.calls[0][1].code).toBe('LIVENESS_FAILED');
  });

  it('uses a Contact support link for unclear / AML-review reasons', async () => {
    const user = userEvent.setup();
    const { container } = renderPanel([
      { id: 'u', code: 'UNCLEAR' },
      { id: 'a', code: 'AML_HIT_REQUIRES_REVIEW' },
    ]);

    const unclearCta = screen.getByRole('link', {
      name: /Contact support: Needs clarification/i,
    });
    expect(unclearCta).toHaveAttribute('href', '/support/kyc');

    expect(
      screen.getByRole('link', { name: /Contact support: Manual compliance review/i })
    ).toHaveAttribute('href', '/support/kyc');

    await user.click(unclearCta);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(/Opening support for: Needs clarification/i);
  });

  it('renders warning severity with Needs attention label', () => {
    renderPanel([{ id: 'w', code: 'ADDRESS_EXPIRED' }]);
    expect(screen.getByTestId('kyc-severity-w')).toHaveTextContent(/Needs attention/i);
    expect(screen.getByTestId('kyc-rejection-item-w')).toHaveAttribute('data-severity', 'warning');
  });

  it('renders info severity for AML review', () => {
    renderPanel([{ id: 'i', code: 'AML_HIT_REQUIRES_REVIEW' }]);
    expect(screen.getByTestId('kyc-severity-i')).toHaveTextContent(/Information/i);
  });

  it('honours a custom title and supportHref', () => {
    renderPanel([{ id: 'r1', code: 'ID_BLURRY' }], {
      title: 'Fix these KYC issues',
      supportHref: '/help/kyc',
    });
    expect(
      screen.getByRole('region', { name: /Fix these KYC issues/i })
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kyc-support-fallback')).getByRole('link', {
        name: /Contact support about KYC rejection/i,
      })
    ).toHaveAttribute('href', '/help/kyc');
  });

  it('always documents the contact-support fallback in the footer', () => {
    renderPanel([{ id: 'r1', code: 'ID_BLURRY' }]);
    const footer = screen.getByTestId('kyc-support-fallback');
    expect(footer).toHaveTextContent(/contact support/i);
    expect(
      within(footer).getByRole('link', { name: /Contact support about KYC rejection/i })
    ).toHaveAttribute('href', '/support/kyc');
  });

  it('uses the unclear footer copy when an unknown reason is present', () => {
    renderPanel([{ id: 'x', code: 'VENDOR_XYZ' }]);
    expect(screen.getByTestId('kyc-support-fallback')).toHaveTextContent(/unclear rejection/i);
  });

  it('announces corrective navigation via a polite live region', async () => {
    const user = userEvent.setup();
    const { container } = renderPanel([{ id: 'r1', code: 'ID_BLURRY' }]);

    await user.click(screen.getByRole('button', { name: /Re-upload ID/i }));
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent(/Opening ID Upload to fix: ID photo unclear/i);
  });

  it('uses singular summary copy for a single reason', () => {
    renderPanel([{ id: 'r1', code: 'ID_BLURRY' }]);
    expect(screen.getByText(/1 issue needs your attention/i)).toBeInTheDocument();
  });

  it('renders correctly under RTL direction', () => {
    render(
      <div dir="rtl">
        <KycRejectionPanel reasons={[{ id: 'r1', code: 'ID_BLURRY' }]} />
      </div>
    );
    expect(screen.getByTestId('kyc-rejection-panel').closest('[dir="rtl"]')).not.toBeNull();
    expect(screen.getByTestId('kyc-chip-r1')).toHaveTextContent(/ID photo unclear/i);
  });

  it('stacks CTA below copy on mobile via CSS class structure', () => {
    // Layout is CSS-driven (@media max-width: 720px); assert the DOM structure
    // the stylesheet targets so the mobile stack cannot regress silently.
    const { container } = renderPanel([{ id: 'r1', code: 'ID_BLURRY' }]);
    const item = container.querySelector('.kyc-rej-item');
    expect(item?.querySelector('.kyc-rej-item-main')).not.toBeNull();
    expect(item?.querySelector('.kyc-rej-item-action')).not.toBeNull();
    expect(item?.className).toMatch(/kyc-rej-item--blocking/);
  });

  it('has no axe-detectable accessibility violations (multi-reason + unclear)', async () => {
    const { container } = renderPanel();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations for a single support-only reason', async () => {
    const { container } = renderPanel([{ id: 'u', code: 'UNCLEAR' }]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
