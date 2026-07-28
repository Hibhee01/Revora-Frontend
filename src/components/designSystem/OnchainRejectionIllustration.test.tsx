import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { OnchainRejectionIllustration } from './OnchainRejectionIllustration';
import { SuccessFailureIllustration } from './SuccessFailureIllustration';
import { axe } from 'jest-axe';

describe('OnchainRejectionIllustration', () => {
  it('renders an SVG illustration with default size of 96px', () => {
    const { container } = render(<OnchainRejectionIllustration />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('96');
    expect(svg?.getAttribute('height')).toBe('96');
  });

  it('customizes size prop', () => {
    const { container } = render(<OnchainRejectionIllustration size={120} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('120');
  });

  it('is aria-hidden by default', () => {
    const { container } = render(<OnchainRejectionIllustration />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('role')).toBe('presentation');
  });

  it('renders role img and aria-label when ariaHidden=false', () => {
    const { container } = render(
      <OnchainRejectionIllustration ariaHidden={false} ariaLabel="Custom rejection" />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Custom rejection');
  });

  it('integrates seamlessly as onchainRejection variant in SuccessFailureIllustration', () => {
    const { container } = render(
      <SuccessFailureIllustration variant="onchainRejection" ariaHidden={false} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toMatch(/On-chain transaction rejection/i);
  });

  it('passes jest-axe accessibility checks', async () => {
    const { container } = render(
      <OnchainRejectionIllustration ariaHidden={false} ariaLabel="On-chain rejection artwork" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
