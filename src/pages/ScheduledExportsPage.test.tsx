import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ScheduledExportsPage } from './ScheduledExportsPage';

describe('ScheduledExportsPage', () => {
  it('renders the panel', () => {
    render(<ScheduledExportsPage />);
    expect(screen.getByRole('heading', { name: /scheduled exports/i, level: 1 })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ScheduledExportsPage />);
    await waitFor(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
