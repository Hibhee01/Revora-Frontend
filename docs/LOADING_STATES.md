# Revora Loading States Hierarchy & Guidelines

Standardized progress and loading indicators across the Revora-Frontend platform.

---

## 1. Design Tokens & Motion

To maintain a premium, glassmorphic aesthetic while ensuring accessibility, all loading components utilize a single, high-contrast shimmer token.

### Tokens
- `--shimmer-gradient`: `linear-gradient(90deg, rgba(148, 163, 184, 0.06) 25%, rgba(148, 163, 184, 0.18) 50%, rgba(148, 163, 184, 0.06) 75%)`
- Animation: `shimmer 1.6s infinite linear`

### Motion Accessibility (WCAG 2.1 AA)
For users who prefer reduced motion (`prefers-reduced-motion: reduce`):
- **Shimmer animations**: Paused (`animation-play-state: paused`) and fallback to a static, low-contrast solid background (`rgba(148, 163, 184, 0.1)`).
- **Spinning loader animations**: Slowed down to `3s` duration to avoid rapid, distracting motion.

---

## 2. Loading Hierarchy & Latency Thresholds

| Loading State | Component | Latency Threshold | Best Use Cases | Accessibility Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Button Spinner** | `<LoadingSpinner>` | `< 1s` | In-context actions (e.g., submitting forms, primary CTAs). | `aria-hidden="true"` if label text is present. |
| **Inline Progress** | `<ProgressBar>` | `1s - 3s` | Background tasks, file uploads, multi-step actions. | `role="progressbar"`, `aria-valuenow`. |
| **Section Skeleton** | `<Skeleton>` | `1s - 3s` | Dashboard cards, lists, table row replacements. | `aria-hidden="true"` (purely decorative). |
| **Page-Level Loader** | `<PageLoader>` | `> 3s` | Full application boot, major router transitions. | `role="status"`, `aria-live="polite"`. |

---

## 3. Component Details & Examples

### A. Button Spinner (`LoadingSpinner`)
Renders a brand-consistent spinner using Lucide's `Loader2`. Included automatically inside the `<Button>` component when the `loading` prop is set.

```tsx
import { LoadingSpinner } from './components/LoadingSpinner';

// Standalone Spinner
<LoadingSpinner label="Loading user data..." />

// Inside Button (automatically handles aria-hidden based on loading text)
<Button loading={true}>Saving settings</Button>
```

### B. Inline Progress Bar (`ProgressBar`)
Supports both determinate (percentage-based) and indeterminate (shimmering) loading behavior.

```tsx
import { ProgressBar } from './components/ProgressBar';

// Indeterminate Progress
<ProgressBar label="Updating system" />

// Determinate Progress with label text
<ProgressBar value={45} label="Uploading file" showLabelText={true} />
```

### C. Section Skeleton (`Skeleton`)
Generates structural shape placeholders to minimize layout shift (CLS) during content fetching.

```tsx
import { Skeleton } from './components/Skeleton';

// Avatar placeholder
<Skeleton variant="avatar" />

// Titled text paragraph block (renders 3 lines of text)
<div className="card">
  <Skeleton variant="title" />
  <Skeleton variant="text" count={3} />
</div>
```

### D. Page-Level Loader (`PageLoader`)
A full-screen frosted glass overlay designed for initial loading states.

```tsx
import { PageLoader } from './components/PageLoader';

// Full Screen Page Loader
<PageLoader label="Booting Revora Console..." />
```
