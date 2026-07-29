# Lockup partial unlock claim modal

## Purpose

When a lockup unlocks partially, investors need a quick way to decide whether to claim immediately, postpone the action, or enable auto-claim for the next unlock.

## Interaction summary

- Show the unlocked amount prominently with a concise supporting line.
- Surface an estimated gas label so investors understand the cost trade-off before they confirm.
- Offer three choices: claim now, claim later, and auto-claim on next unlock.
- Support plain-language explanation for auto-claim and a clear success or warning state.

## Accessibility requirements

- Use a modal dialog with `role="dialog"`, `aria-modal="true"`, and labelled heading.
- Support keyboard dismissal with Escape and focus management.
- Ensure visible focus indicators, high contrast, and responsive stacking on small screens.
- Keep status updates in `role="status"` or `role="alert"` to support screen reader announcements.

## Responsive guidance

- Stack action buttons vertically on small screens.
- Keep the unlocked amount and gas card readable at narrow widths.
- Preserve right-to-left support with the `dir="auto"` behavior.
