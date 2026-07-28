# KYC resubmission timeline

`KycResubmissionTimeline` is the canonical post-resubmission pattern. It communicates Submitted, Under review, and Decision before the distribution dashboard empty state.

## Anatomy and states

Each node contains a state icon, label, plain-language description, and optional timestamp. Completed steps use a check, the active step uses `aria-current="step"` and a clock, upcoming steps use a circle, and canceled applications use an X. State never depends on color alone.

Supported workflow states are `submitted`, `under-review`, `decision`, and `canceled`. A decision label may be `Approved` or `More information needed`. Overdue is derived from the SLA instead of supplied as a separate, potentially stale state.

## Turnaround copy

The default SLA is three business days. The submission day is day zero. Saturdays, Sundays, and dates supplied through `holidays` are excluded. The component accepts `now` for deterministic server rendering and tests.

- Active: “We expect an update within 2 business days, by Thu, Jul 30.”
- Weekend or holiday: adds “Weekends and listed holidays do not count toward review time.”
- Due today: “We expect an update today.”
- Overdue: “Review is 2 business days overdue.” and exposes the support escalation link.
- Complete or canceled: replaces the estimate with the terminal outcome.

Holiday dates must come from the compliance calendar for the team handling the application; use local `YYYY-MM-DD` values. Calendar policy therefore remains outside the presentation component.

## Responsive and accessibility contract

The timeline is horizontal above 640px and becomes a stacked vertical timeline at 640px and below. It uses a semantic ordered list, visible labels, a labeled section, `aria-current`, machine-readable `<time>` values, and a polite status region. The escalation link has a 44px minimum target. Text and state colors are selected for WCAG 2.1 AA contrast on the existing dark surfaces. Reduced-motion preferences disable transitions.

Automated coverage includes business-calendar edge cases, terminal states, escalation behavior, semantics, and `jest-axe`. Visual review should cover desktop horizontal, 375px stacked mobile, overdue, and canceled variants.

## Example

```tsx
<KycResubmissionTimeline
  status="under-review"
  submittedAt="2026-07-24T10:30:00Z"
  reviewStartedAt="2026-07-27T08:00:00Z"
  holidays={['2026-07-27']}
  slaBusinessDays={3}
/>
```