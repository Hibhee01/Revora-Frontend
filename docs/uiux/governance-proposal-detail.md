# Governance proposal detail pattern

## Purpose
The governance proposal detail pattern presents the primary decision surface for voters. It combines proposal context, quorum and support progress, voting actions, and participation context in a single reviewable layout.

## Anatomy
- Hero band with proposal state pill and optional time-remaining label
- Quorum progress bar with numeric values and aria-valuenow/aria-valuemax attributes
- Support progress bar showing current support against the reached voting power
- Vote CTA with three states: open, voted, and closed
- Vote breakdown chart and participation KPI cards

## Accessibility
- Use semantic headings and button labels that expose clear intent
- Keep numeric progress labels visible and pair them with aria attributes on progress bars
- Ensure focus indicators remain visible on vote actions and keyboard navigation remains predictable
- Support reduced motion, high contrast, and responsive stacking on smaller screens

## Responsive behavior
- Stack the voting CTA and participation cards on smaller screens
- Keep progress bar labels visible without crowding the layout
- Preserve reading order so the hero summary appears before progress and action elements
