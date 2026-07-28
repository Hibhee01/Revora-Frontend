# On-Chain Rejection Error Illustration & Copy Pattern

## Scope
Design system artwork, copy templates, and CTA pattern for on-chain transaction rejections. Fully integrated with `StatusTimeline` (for blocked blockchain execution steps) and available as standalone components (`OnchainRejectionIllustration`, `OnchainRejectionCard`).

---

## Design Principles
1. **Calm, Informative & Non-Blaming**: Error screens use reassuring visual language (`var(--primary)`, `var(--text-accent)`, soft warning rings) rather than harsh red blares. Microcopy explains what occurred in plain terms and reassures the user that no funds were lost.
2. **Action-Oriented Primary CTA**: Standardized primary CTA `"Retry with adjusted gas"` paired with optional secondary `"Adjust gas settings"` and tertiary `"Cancel transaction"` buttons.
3. **Tokenized Theme Support**: Uses CSS design system tokens (`var(--glass-bg)`, `var(--st-blocked-border)`, `var(--text-main)`, `var(--text-muted)`, `var(--text-accent)`, `var(--primary)`) that automatically adapt to light and dark modes.
4. **WCAG 2.1 AA Compliant**: High-contrast typography (>= 4.5:1), decorative SVGs (`aria-hidden="true"`), explicit focus rings, and screen-reader status announcements (`role="alert"`, `aria-live="polite"`).

---

## Illustration Component (`OnchainRejectionIllustration`)

```tsx
import { OnchainRejectionIllustration } from '@/components/designSystem/OnchainRejectionIllustration';

// Standard 96px decorative SVG artwork
<OnchainRejectionIllustration size={96} ariaHidden={true} />

// Via SuccessFailureIllustration variant
import { SuccessFailureIllustration } from '@/components/designSystem/SuccessFailureIllustration';

<SuccessFailureIllustration variant="onchainRejection" size={96} />
```

### Visual Metaphor
Dual concentric well rings enclosing a stylized blockchain connector mesh and a calm fuel-gauge needle pointing to the adjustment sector. A soft top badge provides visual hierarchy without aggressive alarm.

---

## Plain-Language Copy Templates (`onchainRejectionCopy.ts`)

| Rejection Reason | Title | Description | Assurance Note |
|---|---|---|---|
| `insufficient-gas` | Gas limit reached during processing | The gas limit allocated for this transaction was slightly below current network requirements. No funds were lost. | Increasing your gas limit or adjusting parameters will allow the network to process your transaction smoothly. |
| `nonce-mismatch` | Transaction sequence needs sync | A prior transaction is still finishing on the network, causing a temporary sequence pause. Your account balance remains unchanged. | Updating your transaction sequence order or retrying with adjusted gas will submit this request in order. |
| `slippage-exceeded` | Network price shifted in flight | Network rates shifted slightly while your transaction was being confirmed. The execution paused safely to protect your funds. | You can safely retry with updated gas settings or slightly adjust your slippage tolerance. |
| `user-rejected` | Transaction request canceled | The transaction signature was declined in your wallet. No charges or network fees were incurred. | When you are ready, you can initiate the transaction again with your preferred gas settings. |
| `execution-reverted` | Smart contract condition paused | The target smart contract condition was not met at execution time. The transaction was safely rolled back with no loss of capital. | Retrying with adjusted gas or updated parameters will allow the contract to re-evaluate the state. |
| `unknown` (fallback) | Transaction pause — safe retry available | An unexpected network response occurred while confirming your transaction. Your assets remain secure and untouched. | Retrying with adjusted gas settings will resubmit your transaction cleanly to the network. |

---

## Component Integration (`OnchainRejectionCard`)

```tsx
import { OnchainRejectionCard } from '@/components/StatusTimeline';

<OnchainRejectionCard
  reason="insufficient-gas"
  onRetry={handleRetry}
  onAdjustGas={handleOpenGasModal}
  onCancel={handleCancelTx}
/>
```

### StatusTimeline Preset Usage

```tsx
import { StatusTimeline } from '@/components/StatusTimeline';
import { getOnchainRejectionMilestones } from '@/components/StatusTimeline/presets';

<StatusTimeline
  milestones={getOnchainRejectionMilestones('insufficient-gas', {
    onRetry: async () => { /* retry logic */ },
    onAdjustGas: () => { /* gas modal logic */ },
    onCancel: () => { /* cancel logic */ },
  })}
/>
```

---

## CTA States & Edge Case Matrix

| State / Edge Case | Visual / Interactive Behavior |
|---|---|
| **Default Rejection** | Calm error card displays plain-language copy, illustration, and CTAs ("Retry with adjusted gas", "Adjust gas settings", "Cancel transaction"). |
| **Retrying State** | Primary button switches to disabled loading state with `<LoadingSpinner>` and text `"Retrying with gas..."`. |
| **Retry-Then-Succeed** | Card seamlessly updates to success status (`.st-onchain-rejection-card--succeeded`) with green check badge and confirmation copy. |
| **Unknown Error Code** | Gracefully falls back to `'unknown'` copy template reassuring fund safety. |
| **Responsive Viewports** | On mobile screens (<640px), header centers artwork and CTA buttons stack vertically with 100% width touch targets (min-height 38px/44px). |
| **Dark / Light Theme** | All colors derived from `:root` CSS variables; background uses glassmorphism blur and tokenized borders. |

---

## Verification & Accessibility (axe) Notes
- Automated `jest-axe` tests run on `OnchainRejectionIllustration`, `OnchainRejectionCard`, and `StatusTimeline` with 0 violations.
- WCAG SC 1.4.3 Contrast Minimum: Body text (`--text-muted` `#cbd5e1`) and titles (`--text-main` `#e5e7eb`) exceed 4.5:1 contrast against dark background (`#020617`).
