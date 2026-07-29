# Blacklist: Filter Chips & Saved Views (Design Spec)

Status: Draft

Purpose
- Provide repeatable filters and saved views for large blacklists.
- Support multi-select chips, overflow, and a saved-views dropdown with actions.

Anatomy
- Chip: label, optional count, remove affordance, and keyboard focus state.
- Saved-views dropdown: list, rename action, set default, and share (URL param sync).

Interactions
- Click chip to toggle; Shift+Click to multi-select range.
- Keyboard: Arrow navigation across chips; Delete/backspace to remove when focused; Enter to open saved-views menu.

Persistence & Sharing
- Save views per-user on the backend; include encoded filters in URL params for sharing.

Edge cases
- Many chips wrapping: collapse into "+N" overflow menu.
- Keyboard accessibility for overflow menu and chip removal.

Next steps
- Implement `src/pages/DistributionDashboard.tsx` UI and saved-views API hooks.
- Add tests and accessibility checks.
