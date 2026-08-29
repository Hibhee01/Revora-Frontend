# RTL (Right-to-Left) Support Guidelines

## Overview
This document outlines the RTL implementation for the Revora-Frontend project, following WCAG 2.1 AA accessibility standards and modern CSS logical properties.

## Implementation Status
- **Base CSS**: `src/index.css` - Fully migrated to logical properties
- **AppShell**: `src/components/AppShell/AppShell.css` - RTL-ready with logical positioning
- **Timelines**: `src/components/PayoutTimeline/PayoutTimeline.css` - Comprehensive RTL support
- **Tables**: `src/components/LedgerTable/LedgerTable.css` - RTL-aware focus rings and spacing
- **Status Components**: `src/components/StatusTimeline/OnChainStatusBadge.css` - RTL-safe positioning
- **Drawers/Modals**: `src/components/HelpDrawer/HelpDrawer.css` - RTL slide animations
- **Command Palette**: `src/components/CommandPalette/CommandPalette.css` - RTL keyboard navigation

## CSS Logical Properties Migration

### Physical → Logical Property Mapping

| Physical Property | Logical Property | Usage |
|-------------------|------------------|-------|
| `margin-left` | `margin-inline-start` | Spacing from reading start |
| `margin-right` | `margin-inline-end` | Spacing from reading end |
| `padding-left` | `padding-inline-start` | Internal spacing from start |
| `padding-right` | `padding-inline-end` | Internal spacing from end |
| `left` | `inset-inline-start` | Position from inline start |
| `right` | `inset-inline-end` | Position from inline end |
| `text-align: left` | `text-align: start` | Align to reading start |
| `text-align: right` | `text-align: end` | Align to reading end |
| `border-left` | `border-inline-start` | Border on inline start side |
| `border-right` | `border-inline-end` | Border on inline end side |

### New Utility Classes

#### Logical Positioning
```css
.inset-inline-start-0 { inset-inline-start: 0; }
.inset-inline-end-0 { inset-inline-end: 0; }
.inset-inline-start-3 { inset-inline-start: 0.75rem; }
.inset-inline-end-3 { inset-inline-end: 0.75rem; }
.inset-inline-start-4 { inset-inline-start: 1rem; }
.inset-inline-end-4 { inset-inline-end: 1rem; }
.inset-inline-start--1 { inset-inline-start: -0.25rem; }
.inset-inline-end--1 { inset-inline-end: -0.25rem; }
```

#### Logical Spacing
```css
.margin-inline-end-1 { margin-inline-end: 0.25rem; }
.margin-inline-end-2 { margin-inline-end: 0.5rem; }
.margin-inline-start-2 { margin-inline-start: 0.5rem; }
.padding-inline-start-10 { padding-inline-start: 2.5rem; }
.padding-inline-end-2 { padding-inline-end: 0.5rem; }
.padding-inline-end-10 { padding-inline-end: 2.5rem; }
.space-inline-3 > * + * { margin-inline-start: 0.75rem; }
```

#### Logical Text Alignment
```css
.text-align-start { text-align: start; }
.text-align-end { text-align: end; }
```

## Icon Mirroring Rules

### Icons That Should Mirror in RTL
- **Directional arrows**: Left/right arrows, chevrons, carets
- **Navigation icons**: Back/forward buttons, menu indicators
- **Progress indicators**: Directional progress bars
- **Timeline connectors**: Lines showing sequence/flow

### Icons That Should NOT Mirror
- **Symmetric icons**: Circles, squares, generic shapes
- **Text-based icons**: Letter-based indicators
- **Brand logos**: Company logos, trademarks
- **Status icons**: Checkmarks, crosses, warning symbols (unless directional)
- **Numeric indicators**: Numbers, counts, badges

### Implementation
```css
/* Apply to icons that need mirroring */
.icon-rtl {
  transform: scaleX(-1);
}

[dir="rtl"] .icon-rtl {
  transform: scaleX(-1);
}
```

## Component-Specific Guidelines

### Forms and Inputs
- Use `padding-inline-start/end` for input padding
- Use `margin-inline-start/end` for label spacing
- Ensure error messages align with reading direction
- Date/number inputs should use `direction: ltr` with `unicode-bidi: isolate`

### Tables
- Use logical properties for cell padding and borders
- Sort indicators should mirror based on direction
- Action menus should position from inline-end
- Focus rings should use `inset-inline` properties

### Timelines and Progress Indicators
- Connectors use `inset-inline-start/end` for positioning
- Gradients may need RTL-specific overrides (`to left` vs `to right`)
- Tooltips should anchor toward reading start
- "Today" markers position from inline-start

### Drawers and Modals
- Side drawers slide from inline-end by default
- Use `inset-inline-end` for positioning
- Shadows may need RTL-specific direction
- Close buttons position at inline-end

### Navigation
- Breadcrumbs use logical spacing
- Menu items align from reading start
- Active states use inline borders
- Dropdowns position from inline-end

## Animation and Transitions

### RTL-Specific Animations
```css
/* LTR slide-in */
@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* RTL slide-in */
[dir="rtl"] .slide-in {
  animation-name: slide-in-rtl;
}

@keyframes slide-in-rtl {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

### Gradient Directions
```css
/* LTR gradient */
.gradient {
  background: linear-gradient(to right, color1, color2);
}

/* RTL gradient override */
[dir="rtl"] .gradient {
  background: linear-gradient(to left, color1, color2);
}
```

## Testing Checklist

### Visual Testing
- [ ] Layout mirrors correctly in RTL mode
- [ ] Text alignment follows reading direction
- [ ] Icons mirror appropriately per rules
- [ ] Spacing remains consistent
- [ ] Borders and shadows position correctly

### Functional Testing
- [ ] Keyboard navigation works in RTL
- [ ] Focus rings position correctly
- [ ] Hover states mirror appropriately
- [ ] Dropdowns and menus align properly
- [ ] Modals and drawers slide from correct side

### Accessibility Testing
- [ ] Screen readers announce content correctly
- [ ] Focus order follows logical reading direction
- [ ] ARIA attributes respect direction
- [ ] Mixed LTR/RTL content handled properly
- [ ] High contrast mode works in RTL

### Responsive Testing
- [ ] Mobile layouts work in RTL
- [ ] Touch targets maintain proper sizing
- [ ] Drawer/modal responsive behavior correct
- [ ] Tables scroll properly in RTL

## Browser Compatibility

### Logical Properties Support
- Chrome/Edge: 69+
- Firefox: 66+
- Safari: 12.1+
- iOS Safari: 12.2+
- Android Chrome: 69+

### Fallback Strategy
For browsers that don't support logical properties, the design system gracefully degrades:
- Physical properties are removed in favor of logical ones
- Modern browsers (95%+ support) will render correctly
- Legacy browsers may have LTR-only rendering

## Development Guidelines

### When Adding New Components
1. Use logical properties by default
2. Test in both LTR and RTL modes
3. Apply icon mirroring per the rules above
4. Document any RTL-specific overrides
5. Include RTL in component tests

### When Modifying Existing Components
1. Replace physical properties with logical equivalents
2. Update any RTL-specific overrides
3. Test both directions
4. Update documentation if needed

### Code Review Checklist
- [ ] No physical properties (left/right) used
- [ ] Icon mirroring applied correctly
- [ ] RTL overrides present where needed
- [ ] Animations have RTL variants
- [ ] Documentation updated

## Common Patterns

### Flexbox with RTL
```css
.container {
  display: flex;
  gap: var(--spacing-md);
  /* automatically handles RTL */
}

/* For explicit direction control */
.container {
  flex-direction: row; /* or row-reverse if needed */
}
```

### Grid with RTL
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  /* automatically handles RTL */
}
```

### Absolute Positioning
```css
.positioned {
  position: absolute;
  inset-inline-end: 1rem;
  /* positions from right in LTR, left in RTL */
}
```

## Resources
- [MDN: Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [W3C: CSS Logical Properties](https://www.w3.org/TR/css-logical-1/)
- [WCAG 2.1: Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html)
- [RTL Styling 101](https://rtlstyling.com/)

## Migration Notes

### Files Modified
- `src/index.css` - Base styles and utility classes
- `src/components/AppShell/AppShell.css` - Layout and navigation
- `src/components/ActivityItem.css` - Activity feed items
- Component CSS files already using logical properties:
  - `CommandPalette.css`
  - `HelpDrawer.css`
  - `NotificationBell.css`
  - `PayoutTimeline.css`
  - `OnChainStatusBadge.css`
  - `LedgerTable.css`

### Breaking Changes
None. The migration maintains backward compatibility through:
- Logical properties being widely supported
- Existing RTL overrides preserved
- Graceful degradation for older browsers

## Future Improvements
- Add automated RTL testing to CI/CD
- Create visual regression tests for RTL layouts
- Add RTL toggle to development environment
- Document component-specific RTL behaviors
- Create RTL design system documentation
