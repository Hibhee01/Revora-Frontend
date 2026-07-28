# Pull Request: Design Dark-Mode Chart Palette with Semantic Categorical Hues

## Related Issue
Closes #267

## Summary of Changes
This PR designs and publishes an accessible (WCAG 2.1 AA compliant) 8-series categorical chart color palette specifically optimized for dark surface backgrounds (`#020617`, `#0f172a`), complete with mirrored light-mode tokens for seamless theme swapping, interactive color-blindness vision simulation, comprehensive Do/Don't usage guidelines, and integration across existing chart widgets (`AllocationWidget` and `InvestorStatement`).

The panel is accessible from a global toolbar affordance in the `AppShell` with an unread count badge. It groups snapshots by category and allows users to either retry or discard individual actions. A global "clear all" option is also provided for convenience.

## Detailed Implementation Notes

### 1. Categorical Chart Tokens (`src/index.css` & `src/pages/DesignTokens/tokens.ts`)
- **Dark-Mode Categorical Palette:** Defined 8 distinct hues with guaranteed contrast ratios ranging from **6.8:1 to 11.8:1** against `#020617` dark surface background (WCAG AA non-text requirement is ≥ 3:1):
  - `--chart-cat-1-dark`: `#60a5fa` (Blue 400 - Contrast 8.5:1)
  - `--chart-cat-2-dark`: `#34d399` (Emerald 400 - Contrast 10.2:1)
  - `--chart-cat-3-dark`: `#fbbf24` (Amber 400 - Contrast 11.8:1)
  - `--chart-cat-4-dark`: `#a78bfa` (Violet 400 - Contrast 7.4:1)
  - `--chart-cat-5-dark`: `#f87171` (Rose 400 - Contrast 6.8:1)
  - `--chart-cat-6-dark`: `#22d3ee` (Cyan 400 - Contrast 11.0:1)
  - `--chart-cat-7-dark`: `#fb923c` (Orange 400 - Contrast 8.9:1)
  - `--chart-cat-8-dark`: `#f472b6` (Pink 400 - Contrast 7.7:1)
- **Light-Mode Mirrored Palette:** Defined matching 8 light-mode categorical hues (`--chart-cat-1-light` through `--chart-cat-8-light`) with ≥ 3.1:1 to 5.8:1 contrast on `#ffffff` surfaces.
- **Theme-Aware Swap Tokens:** Mapped `--chart-cat-1` through `--chart-cat-8` to default dark tokens for effortless theme switching.

### 2. Design Tokens Page Integration & Usage Guidelines (`src/pages/DesignTokens`)
- **Published Token Groups:** Added "Chart Categorical Palette (Dark Mode)" and "Chart Categorical Palette (Light Mode)" to `TOKEN_GROUPS` in `tokens.ts`.
- **`ChartPaletteGuidelines.tsx` Component:**
  - **Categorical Swatches Tab:** Displays interactive swatches, variable names, light/dark hex pairings, contrast ratios, and WCAG rating badges.
  - **Live Chart Preview Tab:** Renders interactive 8-series Donut Allocation and Categorical Bar charts.
  - **Color-Blind Vision Simulator:** Toggles SVG color matrix filters for Deuteranopia, Protanopia, Tritanopia, and Monochromacy (grayscale) to validate color-blind safety in real-time.
  - **Do's & Don'ts Guidelines:** Visual cards explaining contrast rules, marker/pattern usage, token mirroring, avoiding deep light hues on dark surfaces, avoiding reliance on hue alone, and segment spacing.
  - **Accessibility & Responsive Notes:** Outlines WCAG 1.4.11 non-text contrast compliance, WCAG 1.4.1 color vision independence, print media fallbacks, and screen responsiveness down to 320px.

### 3. Component Adoption (`src/components`)
- Updated `AllocationWidget.tsx` and `InvestorStatement.tsx` to utilize `var(--chart-cat-1)` through `var(--chart-cat-8)` tokens, resolving previous hardcoded color usage.

---

## Verification & Coverage
- **`ChartPaletteGuidelines.test.tsx`:** 8 comprehensive unit tests covering section rendering, token presence, contrast validation (>3:1), tab switching, color vision mode toggles, surface prop switching, and accessibility callout verification.
- **`DesignTokensPage.test.tsx`:** Updated to assert new chart palette token sections.
