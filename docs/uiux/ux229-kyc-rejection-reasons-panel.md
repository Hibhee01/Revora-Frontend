# UX229: KYC Rejection Reasons Panel with Corrective Actions

## Scope

Rejected KYC applications must never end in a dead end. This design adds a
**rejection reasons panel** that lists each issue with a plain-language
explanation and a corrective action button that jumps directly to the failing
KYC step — or to Contact support when the reason is unclear.

| File | Role |
|---|---|
| `src/components/KycRejectionPanel/kycRejectionTaxonomy.ts` | Canonical reason codes, copy templates, normalize / resolve helpers |
| `src/components/KycRejectionPanel/KycRejectionPanel.tsx` | Panel UI (chips, severity, CTAs, support fallback) |
| `src/components/KycRejectionPanel/KycRejectionPanel.css` | Tokens, stacked mobile layout, RTL-safe logical properties |
| `src/pages/DistributionDashboard.tsx` | Hosts the panel when KYC status is `rejected` |

Route: `/startup/distributions`.

## Problem Statement

When KYC fails, users previously saw a generic failure state with no path
forward. That creates abandonment and support tickets. Compliance decisions
also arrive as opaque vendor codes that must map to a consistent, reviewable
taxonomy — free-form labels diverge from policy and break i18n.

## Solution

### Canonical rejection reason taxonomy

Every chip maps to one of these codes (see `KYC_REJECTION_TAXONOMY`):

| Code | Chip label | Step | Severity |
|---|---|---|---|
| `ID_BLURRY` | ID photo unclear | ID Upload | blocking |
| `ID_EXPIRED` | ID expired | ID Upload | blocking |
| `ID_TYPE_UNSUPPORTED` | ID type not accepted | ID Upload | blocking |
| `ID_NAME_MISMATCH` | Name does not match | ID Upload | blocking |
| `LIVENESS_FAILED` | Liveness check failed | Liveness Check | blocking |
| `LIVENESS_SPOOF_SUSPECTED` | Selfie could not be verified | Liveness Check | blocking |
| `ADDRESS_MISSING` | Address proof missing | Address Proof | blocking |
| `ADDRESS_MISMATCH` | Address does not match | Address Proof | blocking |
| `ADDRESS_EXPIRED` | Address proof too old | Address Proof | warning |
| `SELFIE_ID_MISMATCH` | Selfie does not match ID | Liveness Check | blocking |
| `AML_HIT_REQUIRES_REVIEW` | Manual compliance review | Support | info |
| `AML_INCOMPLETE` | AML screening incomplete | AML Screening | warning |
| `UNCLEAR` | Needs clarification | Support | info |

`normalizeRejectionCode()` accepts casing / separators (`id-blurry`,
`address expired`) and maps **unknown or empty codes → `UNCLEAR`**, so the
UI always has a CTA.

Copy templates are plain-language and actionable. Optional reviewer `detail`
is appended as “Reviewer note: …”.

### Reason list with per-item CTA and severity icon

Each list item shows:

1. **Severity** — icon + text label (`Blocking` / `Needs attention` /
   `Information`). Colour is never the only cue.
2. **Reason chip** — short canonical label.
3. **Step hint** — which KYC step the CTA opens.
4. **Explanation** — template copy (+ optional reviewer note).
5. **Corrective CTA** — button that calls `onNavigateToStep(stepId, reason)`,
   or a link to Contact support when `contactSupport` is set.

### Contact support fallback

Documented in two places so it cannot be missed:

1. **Per-item CTA** for `UNCLEAR` and `AML_HIT_REQUIRES_REVIEW`
   (`actionLabel: "Contact support"`, `href` defaults to `/support/kyc`).
2. **Panel footer** — always visible. Copy switches when any reason is
   unclear (“Still stuck? …”) vs. only known reasons (“If a fix does not
   work…”). Both include a labelled “Contact support” link.

### Distribution Dashboard integration

When `kycStatus === 'rejected'`, the dashboard shows the branded
`kycRejected` illustration, the panel, and a step preview after a CTA jump.
Non-rejected statuses keep the existing empty state.

## Accessibility (WCAG 2.1 AA)

- Panel is a labelled `<section role="region">` with `aria-describedby` summary.
- List semantics (`ul` / `li`); each CTA’s accessible name includes the chip
  label (`Re-upload ID: ID photo unclear`).
- Severity conveyed with **icon + text + colour**.
- Corrective navigation announced via `aria-live="polite"`.
- Visible `:focus-visible` rings on CTAs and the footer link.
- Logical CSS properties; arrow icon mirrors under `[dir="rtl"]`.
- `prefers-reduced-motion` disables transitions.

### axe results

`jest-axe` covers: multi-reason panel, support-only panel, and the full
Distribution Dashboard page — **0 violations**.

## Responsive

Below **720px**, each reason item stacks (`flex-direction: column`) so the
CTA sits full-width under the explanation — the “mobile stacked layout”
required by the issue. Covered structurally in tests (CSS media query
targets `.kyc-rej-item` / `.kyc-rej-item-action`).

## Usage Examples

```tsx
<KycRejectionPanel
  reasons={[
    { id: '1', code: 'ID_BLURRY' },
    { id: '2', code: 'ADDRESS_EXPIRED', detail: 'Document dated January 2025.' },
    { id: '3', code: 'VENDOR_UNKNOWN' }, // → UNCLEAR → Contact support
  ]}
  onNavigateToStep={(stepId, reason) => openKycWizard(stepId, reason)}
  supportHref="/support/kyc"
/>
```

## Integration Map

- `src/App.tsx` — route `/startup/distributions` + Home link.
- Reuses: `SuccessFailureIllustration` (`kycRejected`), glass-card, button
  classes, severity vocabulary shared with `ComplianceHoldBanner`.
- KYC step ids align with `StatusTimeline` presets (`id-upload`,
  `liveness-check`, `address-proof`, `aml-screening`).

## Testing

```bash
npx vitest run src/components/KycRejectionPanel src/pages/DistributionDashboard.test.tsx
```

Suites cover: taxonomy round-trips, unknown → UNCLEAR, multi-reason + blocking
counts, corrective CTA navigation, support fallback, RTL, mobile structure,
and axe. Coverage for the new files is gated at **95%** in `vite.config.ts`.

## Before / After

- **Before**: Distribution Dashboard was an empty-state stub; KYC rejection
  had no actionable reasons UI on this page.
- **After**: Rejected KYC surfaces a taxonomy-backed reasons panel with
  per-item corrective CTAs and a documented Contact support fallback.
  (No visual-regression tooling in-repo; verify at `/startup/distributions`.)

## Security Notes

- Reason codes are normalised against an allowlist; unknown codes never
  render raw vendor strings as chip labels.
- Explanations and reviewer notes render as React text nodes (no HTML
  injection).
- Support href is a same-origin path by default; hosts may override it.
