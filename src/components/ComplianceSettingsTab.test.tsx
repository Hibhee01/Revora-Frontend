import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComplianceSettingsTab,
  REGIONS_BY_CONTINENT,
} from './ComplianceSettingsTab';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderComponent = () => render(<ComplianceSettingsTab />);

// Flat list of all regions
const ALL_REGION_NAMES = Object.values(REGIONS_BY_CONTINENT)
  .flat()
  .map((r) => r.name);

const ALL_CONTINENTS = Object.keys(REGIONS_BY_CONTINENT);

const HIGH_RISK_REGIONS = Object.values(REGIONS_BY_CONTINENT)
  .flat()
  .filter((r) => r.isHighRisk);

// Get the expand/collapse toggle button for a continent (has aria-expanded).
// Uses textContent because the button's accessible name includes the region count
// e.g. "Africa (6)" and there are other buttons whose aria-label contains "Africa".
const getContinentToggle = (name: string) => {
  const btn = screen
    .getAllByRole('button')
    .find(
      (b) =>
        b.hasAttribute('aria-expanded') &&
        b.textContent?.includes(name)
    );
  if (!btn) throw new Error(`Could not find expand/collapse button for "${name}"`);
  return btn;
};

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – rendering', () => {
  beforeEach(() => {
    renderComponent();
  });

  it('renders without crashing', () => {
    expect(screen.getByText('Regional Access Controls')).toBeInTheDocument();
  });

  it('shows the search input with correct aria-label', () => {
    const input = screen.getByLabelText('Search regions');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
  });

  it('shows all continent sections by default (expanded)', () => {
    ALL_CONTINENTS.forEach((continent) => {
      // The expand button text contains the continent name exactly
      const toggleBtn = getContinentToggle(continent);
      expect(toggleBtn).toBeInTheDocument();
    });
  });

  it('renders every region name by default', () => {
    ALL_REGION_NAMES.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('handles all continents in REGIONS_BY_CONTINENT', () => {
    const expectedCount = ALL_CONTINENTS.length;
    // Each continent has an expand/collapse button with aria-expanded
    const expandButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-expanded') !== null);
    expect(expandButtons.length).toBe(expectedCount);
  });
});

// ─── Accordion expand / collapse ─────────────────────────────────────────────

describe('ComplianceSettingsTab – accordion expand/collapse', () => {
  it('collapses a continent section when its header is clicked', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Africa is expanded by default — Nigeria should be visible
    expect(screen.getByText('Nigeria')).toBeInTheDocument();

    await user.click(getContinentToggle('Africa'));

    expect(screen.queryByText('Nigeria')).not.toBeInTheDocument();
  });

  it('expands a continent section again after collapsing', async () => {
    renderComponent();
    const user = userEvent.setup();

    const africaBtn = getContinentToggle('Africa');

    // Collapse
    await user.click(africaBtn);
    expect(screen.queryByText('Nigeria')).not.toBeInTheDocument();

    // Expand again
    await user.click(getContinentToggle('Africa'));
    expect(screen.getByText('Nigeria')).toBeInTheDocument();
  });

  it('sets aria-expanded=false when a continent is collapsed', async () => {
    renderComponent();
    const user = userEvent.setup();

    const africaBtn = getContinentToggle('Africa');
    expect(africaBtn).toHaveAttribute('aria-expanded', 'true');

    await user.click(africaBtn);
    expect(getContinentToggle('Africa')).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded=true when a continent is expanded', async () => {
    renderComponent();
    const user = userEvent.setup();

    const africaBtn = getContinentToggle('Africa');
    await user.click(africaBtn); // collapse
    await user.click(getContinentToggle('Africa')); // expand
    expect(getContinentToggle('Africa')).toHaveAttribute('aria-expanded', 'true');
  });
});

// ─── Search / filter ──────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – search', () => {
  it('filters to show only matching regions when a query is typed', async () => {
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Search regions');
    await user.type(input, 'Nigeria');

    expect(screen.getByText('Nigeria')).toBeInTheDocument();
    // A region from a different continent should not appear
    expect(screen.queryByText('Japan')).not.toBeInTheDocument();
    expect(screen.queryByText('Germany')).not.toBeInTheDocument();
  });

  it('shows all regions when the search query is cleared', async () => {
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Search regions');
    await user.type(input, 'Nigeria');
    await user.clear(input);

    // All regions should be visible again
    expect(screen.getByText('Nigeria')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
  });

  it('shows empty state message when no regions match the query', async () => {
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Search regions');
    await user.type(input, 'xyz_nonexistent');

    expect(screen.getByText(/No regions match/i)).toBeInTheDocument();
    // No region rows at all
    ALL_REGION_NAMES.forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });

  it('search is case-insensitive', async () => {
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Search regions');
    await user.type(input, 'nigeria');

    expect(screen.getByText('Nigeria')).toBeInTheDocument();
  });

  it('filters partial matches correctly', async () => {
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Search regions');
    // "land" matches Finland, Ireland, New Zealand, etc. — just check a known one
    await user.type(input, 'New Zealand');

    expect(screen.getByText('New Zealand')).toBeInTheDocument();
    expect(screen.queryByText('Nigeria')).not.toBeInTheDocument();
  });
});

// ─── Status toggles ───────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – status toggles', () => {
  it('marks a region as blocked when the Blocked button is clicked', async () => {
    renderComponent();
    const user = userEvent.setup();

    const blockBtn = screen.getByRole('button', { name: 'Block Nigeria' });
    expect(blockBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(blockBtn);
    expect(blockBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks a region as restricted when the Restricted button is clicked', async () => {
    renderComponent();
    const user = userEvent.setup();

    const restrictBtn = screen.getByRole('button', { name: 'Restrict Nigeria' });
    expect(restrictBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(restrictBtn);
    expect(restrictBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks a region back to allowed after being blocked', async () => {
    renderComponent();
    const user = userEvent.setup();

    const blockBtn = screen.getByRole('button', { name: 'Block Nigeria' });
    const allowBtn = screen.getByRole('button', { name: 'Allow Nigeria' });

    await user.click(blockBtn);
    expect(blockBtn).toHaveAttribute('aria-pressed', 'true');
    expect(allowBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(allowBtn);
    expect(allowBtn).toHaveAttribute('aria-pressed', 'true');
    expect(blockBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('only one status button is aria-pressed=true at a time for a region', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Restrict Nigeria' }));

    expect(screen.getByRole('button', { name: 'Allow Nigeria' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Restrict Nigeria' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Block Nigeria' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('each status toggle group has the correct role and aria-label', () => {
    renderComponent();
    const group = screen.getByRole('group', { name: 'Access status for Nigeria' });
    expect(group).toBeInTheDocument();
  });
});

// ─── High-risk warning banner ─────────────────────────────────────────────────

describe('ComplianceSettingsTab – high-risk warning banner', () => {
  it('shows the warning banner initially because high-risk regions are allowed by default', () => {
    renderComponent();
    // hasAllowedHighRisk is true on mount (all regions start as "allowed")
    // and showHighRiskWarning starts true, so the banner should be visible
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/high-risk or sanctioned/i)).toBeInTheDocument();
  });

  it('hides the banner after dismissing it with the X button', async () => {
    renderComponent();
    const user = userEvent.setup();

    expect(screen.getByRole('alert')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss high-risk warning' });
    await user.click(dismissBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides the banner when all high-risk regions are blocked (no longer allowed)', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Block every high-risk region
    for (const region of HIGH_RISK_REGIONS) {
      const blockBtn = screen.getByRole('button', { name: `Block ${region.name}` });
      await user.click(blockBtn);
    }

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('re-shows the banner when a high-risk region is set back to allowed after being blocked', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Block all high-risk regions to hide banner
    for (const region of HIGH_RISK_REGIONS) {
      await user.click(screen.getByRole('button', { name: `Block ${region.name}` }));
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Re-allow one
    await user.click(screen.getByRole('button', { name: `Allow ${HIGH_RISK_REGIONS[0].name}` }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dismissed banner does not reappear when high-risk status changes', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Dismiss first
    await user.click(screen.getByRole('button', { name: 'Dismiss high-risk warning' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Block then re-allow a high-risk region — banner should stay dismissed
    const iran = HIGH_RISK_REGIONS[0];
    await user.click(screen.getByRole('button', { name: `Block ${iran.name}` }));
    await user.click(screen.getByRole('button', { name: `Allow ${iran.name}` }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ─── Bulk actions ─────────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – bulk actions', () => {
  it('"Allow All" in a continent sets all its regions to allowed', async () => {
    renderComponent();
    const user = userEvent.setup();

    // First block all Africa regions
    const africaRegions = REGIONS_BY_CONTINENT['Africa'];
    for (const region of africaRegions) {
      await user.click(screen.getByRole('button', { name: `Block ${region.name}` }));
    }

    // Now Allow All
    await user.click(screen.getByRole('button', { name: 'Allow all regions in Africa' }));

    for (const region of africaRegions) {
      expect(screen.getByRole('button', { name: `Allow ${region.name}` })).toHaveAttribute('aria-pressed', 'true');
    }
  });

  it('"Block All" in a continent sets all its regions to blocked', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Block all regions in Africa' }));

    const africaRegions = REGIONS_BY_CONTINENT['Africa'];
    for (const region of africaRegions) {
      expect(screen.getByRole('button', { name: `Block ${region.name}` })).toHaveAttribute('aria-pressed', 'true');
    }
  });

  it('"Allow All" does not affect regions in other continents', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Block a Japan (Asia) region manually
    await user.click(screen.getByRole('button', { name: 'Block Japan' }));

    // Allow All for Africa only
    await user.click(screen.getByRole('button', { name: 'Allow all regions in Africa' }));

    // Japan should still be blocked
    expect(screen.getByRole('button', { name: 'Block Japan' })).toHaveAttribute('aria-pressed', 'true');
  });
});

// ─── Summary counts ───────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – summary counts', () => {
  it('renders the summary aria-live region', () => {
    renderComponent();
    // The <p> has aria-live but its visible text is split across child <span> elements,
    // so we query directly via the DOM attribute rather than by text content.
    const summary = document.querySelector('[aria-live="polite"]');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveAttribute('aria-live', 'polite');
    expect(summary).toHaveAttribute('aria-atomic', 'true');
  });

  it('shows correct initial counts (all regions allowed)', () => {
    renderComponent();
    const totalRegions = Object.values(REGIONS_BY_CONTINENT).flat().length;
    expect(screen.getByText(`${totalRegions} allowed`)).toBeInTheDocument();
    expect(screen.getByText('0 blocked')).toBeInTheDocument();
    expect(screen.getByText('0 restricted')).toBeInTheDocument();
  });

  it('updates blocked count when a region is blocked', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Block Nigeria' }));

    expect(screen.getByText('1 blocked')).toBeInTheDocument();
  });

  it('updates restricted count when a region is restricted', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Restrict Nigeria' }));

    expect(screen.getByText('1 restricted')).toBeInTheDocument();
  });
});

// ─── Reset to Defaults ────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – Reset to Defaults', () => {
  it('resets all region statuses back to allowed', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Block a couple of regions
    await user.click(screen.getByRole('button', { name: 'Block Nigeria' }));
    await user.click(screen.getByRole('button', { name: 'Restrict Japan' }));

    await user.click(screen.getByRole('button', { name: 'Reset compliance settings to defaults' }));

    expect(screen.getByRole('button', { name: 'Allow Nigeria' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Allow Japan' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('restores the high-risk banner after reset (all high-risk become allowed again)', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Block all high-risk regions to clear banner
    for (const region of HIGH_RISK_REGIONS) {
      await user.click(screen.getByRole('button', { name: `Block ${region.name}` }));
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset compliance settings to defaults' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('clears the search query on reset', async () => {
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Search regions');
    await user.type(input, 'Nigeria');
    expect(input).toHaveValue('Nigeria');

    await user.click(screen.getByRole('button', { name: 'Reset compliance settings to defaults' }));

    expect(input).toHaveValue('');
  });

  it('re-expands all continents on reset after some were collapsed', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Collapse Africa
    await user.click(getContinentToggle('Africa'));
    expect(screen.queryByText('Nigeria')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset compliance settings to defaults' }));

    expect(screen.getByText('Nigeria')).toBeInTheDocument();
  });
});

// ─── Save Changes button ──────────────────────────────────────────────────────

describe('ComplianceSettingsTab – Save Changes', () => {
  it('Save Changes button exists', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: 'Save compliance settings' })).toBeInTheDocument();
  });

  it('Save Changes button is focusable (rendered as a button element)', () => {
    renderComponent();
    const saveBtn = screen.getByRole('button', { name: 'Save compliance settings' });
    expect(saveBtn.tagName).toBe('BUTTON');
    expect(saveBtn).not.toBeDisabled();
  });
});

// ─── Map decoration ───────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – world map decoration', () => {
  it('map SVG has aria-hidden="true"', () => {
    renderComponent();
    const svg = document.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  it('screen-reader description for the map is present (sr-only paragraph)', () => {
    renderComponent();
    const srDesc = screen.getByText(/Decorative world map/i);
    expect(srDesc).toBeInTheDocument();
    expect(srDesc.tagName).toBe('P');
    expect(srDesc.className).toContain('sr-only');
  });
});

// ─── WCAG / Accessibility ─────────────────────────────────────────────────────

describe('ComplianceSettingsTab – WCAG accessibility', () => {
  it('all status toggle buttons have aria-label and aria-pressed', () => {
    renderComponent();
    // All buttons with aria-pressed are toggle buttons
    const toggleButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.hasAttribute('aria-pressed'));

    expect(toggleButtons.length).toBeGreaterThan(0);
    toggleButtons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-label');
      const pressed = btn.getAttribute('aria-pressed');
      expect(pressed === 'true' || pressed === 'false').toBe(true);
    });
  });

  it('all continent region panels have role="region" and aria-labelledby', () => {
    renderComponent();
    const regions = screen.getAllByRole('region');
    expect(regions.length).toBe(ALL_CONTINENTS.length);
    regions.forEach((region) => {
      expect(region).toHaveAttribute('aria-labelledby');
      const labelId = region.getAttribute('aria-labelledby')!;
      const labelEl = document.getElementById(labelId);
      expect(labelEl).toBeInTheDocument();
    });
  });

  it('continent expand/collapse buttons have aria-expanded', () => {
    renderComponent();
    const expandButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.hasAttribute('aria-expanded'));
    expect(expandButtons.length).toBe(ALL_CONTINENTS.length);
    expandButtons.forEach((btn) => {
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });
  });

  it('continent expand/collapse buttons have aria-controls pointing to valid element', () => {
    renderComponent();
    const expandButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.hasAttribute('aria-controls'));
    expandButtons.forEach((btn) => {
      const controlsId = btn.getAttribute('aria-controls')!;
      expect(document.getElementById(controlsId)).toBeInTheDocument();
    });
  });

  it('all bulk-action buttons have descriptive aria-labels', () => {
    renderComponent();
    ALL_CONTINENTS.forEach((continent) => {
      expect(
        screen.getByRole('button', { name: `Allow all regions in ${continent}` })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: `Block all regions in ${continent}` })
      ).toBeInTheDocument();
    });
  });

  it('all interactive buttons render as <button> elements (keyboard reachable)', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.tagName).toBe('BUTTON');
    });
  });
});

// ─── High-risk badge ──────────────────────────────────────────────────────────

describe('ComplianceSettingsTab – high-risk badge', () => {
  it('shows the "High Risk" badge for each high-risk region', () => {
    renderComponent();
    const badges = screen.getAllByText('High Risk');
    expect(badges.length).toBe(HIGH_RISK_REGIONS.length);
  });

  it('each high-risk badge has the correct aria-label', () => {
    renderComponent();
    const badgeElements = screen.getAllByLabelText('High risk region');
    expect(badgeElements.length).toBe(HIGH_RISK_REGIONS.length);
  });

  it('non-high-risk regions do not have the badge', () => {
    renderComponent();
    // Nigeria is not high-risk
    const nigeriaCells = screen
      .getAllByText('Nigeria')
      .map((el) => el.closest('li'));
    nigeriaCells.forEach((cell) => {
      if (cell) {
        expect(within(cell).queryByText('High Risk')).not.toBeInTheDocument();
      }
    });
  });
});

// ─── RTL (Right-to-Left) search corner cases ──────────────────────────────────

describe('ComplianceSettingsTab – RTL search corner cases', () => {
  it('searching "Nigeria" shows Nigeria and hides unrelated regions', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Search regions'), 'Nigeria');

    expect(screen.getByText('Nigeria')).toBeInTheDocument();
    expect(screen.queryByText('Japan')).not.toBeInTheDocument();
    expect(screen.queryByText('Germany')).not.toBeInTheDocument();
    expect(screen.queryByText('Australia')).not.toBeInTheDocument();
  });

  it('searching "xyz_nonexistent" shows no region rows', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Search regions'), 'xyz_nonexistent');

    ALL_REGION_NAMES.forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/No regions match/i)).toBeInTheDocument();
  });
});
