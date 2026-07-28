# Document Multi-Upload Queue

**Issue:** #223 · **Branch:** `uiux/document-multi-upload-queue`

---

## Overview

The `UploadQueue` component provides a visible, accessible queue for batch document uploads. Each file gets a dedicated row showing a progress ring, file metadata, and per-file controls. A summary bar above the list shows aggregate progress and batch-level actions.

---

## Anatomy

### Drop Zone
- Full-width dashed-border target; activates on hover and drag-over
- Keyboard accessible (`tabindex="0"`, responds to `Enter` / `Space`)
- Hidden `<input type="file" multiple>` triggered on click/key

### Queue Row
```
[ Progress Ring ] [ Filename · Size · Status ]  [ Retry? ] [ Remove ]
```
- **Progress Ring** — SVG circle with animated `stroke-dashoffset`; center icon reflects state (FileText / Loader2 / CheckCircle2 / AlertCircle)
- **Filename** — truncated with `text-overflow: ellipsis`; full name in `title` attribute
- **Size** — formatted as B / KB / MB
- **Status text** — colour-coded: muted (pending), primary (uploading + %), success (complete), error (failed)
- **Error message** — shown below status when `errorMessage` is set; truncated with tooltip
- **Retry button** — visible only for `error` state; `aria-label="Retry upload for {filename}"`
- **Remove button** — always visible; `aria-label="Remove {filename} from queue"`

### Summary Bar
```
[ Label / stats ]                    [ Upload all ] [ Clear done ]
[ ══════════════════════════════ ]   overall %
```
- Label copy adapts: "N files queued" → "Uploading N of N files…" → "N of N uploaded"
- Stats chips: ✓ done (success), ✗ failed (error), ↻ uploading (primary)
- Progress bar: `role="progressbar"` with `aria-valuenow/min/max`
- "Upload all" — shown when pending files exist and no upload is in progress
- "Clear done" — shown when at least one file has succeeded

---

## States

| State      | Ring colour | Row border tint | Status text colour |
|------------|-------------|-----------------|-------------------|
| `pending`  | track only  | default         | muted             |
| `uploading`| primary     | default         | primary           |
| `success`  | success     | green 25%       | success           |
| `error`    | error       | red 25%         | error             |

---

## Design Tokens Used

All tokens are defined in `src/index.css :root`.

| Token | Usage |
|-------|-------|
| `--glass-bg` | Row and summary backgrounds |
| `--glass-border` / `--glass-border-bright` | Row borders |
| `--glass-blur` | Backdrop filter |
| `--primary` / `--primary-hover` | Upload progress, primary actions |
| `--success` | Success ring, stat chip, bar fill (all-complete) |
| `--error` | Error ring, stat chip, error message |
| `--text-main` / `--text-muted` | Filename, metadata |
| `--radius-lg` / `--radius-xl` | Row and drop zone radii |
| `--spacing-*` | All internal gaps and padding |
| `--font-size-sm` / `--font-size-xs` | Filename and metadata type scale |

---

## Accessibility (WCAG 2.1 AA)

- **Live region** — `role="status" aria-live="polite" aria-atomic="true"` announces state changes (uploading, complete, error) without interrupting the user
- **Progress bar** — `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **File list** — `<ul aria-label="Upload queue, N file(s)">` with `<li aria-labelledby>` per row
- **Drop zone** — `role="button" tabindex="0"` with descriptive `aria-label`; keyboard-operable via `Enter` / `Space`
- **Icon buttons** — all have explicit `aria-label` including the filename for context
- **Decorative icons** — `aria-hidden="true"` on all Lucide icons
- **Focus rings** — `outline: 2px solid var(--primary); outline-offset: 2px` on all interactive elements via `.upload-queue__btn:focus-visible` and `.upload-queue__action-btn:focus-visible`
- **Colour contrast** — all text/icon colours pass ≥ 4.5:1 on the dark glass background
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` disables ring, bar, and fill transitions

---

## Responsive Behaviour

| Breakpoint | Change |
|------------|--------|
| `> 480px`  | 3-column grid row (ring · meta · controls) |
| `≤ 480px`  | Ring shrinks to 2rem; summary row stacks vertically; actions right-aligned |

---

## Hook: `useUploadQueue`

```ts
const {
  queue,          // UploadFile[]
  addFiles,       // (files: File[]) => void
  removeFile,     // (id: string) => void
  retryFile,      // (id: string, uploader: Uploader) => void
  uploadFiles,    // (uploader: Uploader) => void  — starts all pending
  clearComplete,  // () => void  — removes succeeded items
  totalCount, successCount, errorCount, uploadingCount, overallProgress,
} = useUploadQueue();
```

**Uploader contract:**
```ts
type Uploader = (file: File, onProgress: (pct: number) => void) => Promise<void>;
```

---

## Usage

```tsx
import { UploadQueue } from '../components/UploadQueue';
import { useUploadQueue } from '../hooks/useUploadQueue';

const myUploader: Uploader = async (file, onProgress) => {
  // call your API here, invoke onProgress(0–100) as data is sent
};

export const MyPage = () => {
  const q = useUploadQueue();
  return (
    <UploadQueue
      {...q}
      onUploadAll={() => q.uploadFiles(myUploader)}
      onRetry={(id, up) => q.retryFile(id, up)}
      uploader={myUploader}
      accept=".pdf,.docx,.xlsx"
    />
  );
};
```

---

## Edge Cases Handled

| Scenario | Behaviour |
|----------|-----------|
| Empty drop / no files selected | `onAddFiles` not called |
| Very large batch (100+ files) | All rendered; no performance cliff |
| Mixed success/failure | Each row independent; retry per-file |
| All files failed (offline) | Retry button on every row; summary shows error count |
| Non-`Error` rejection | Falls back to "Upload failed" message |
| Progress out of range | Clamped to `[0, 100]` |
| File with 200-char name | Truncated with ellipsis; full name in `title` |
| `uploader` prop absent | Retry click is a no-op (safe) |

---

## File Structure

```
src/
  components/
    UploadQueue/
      UploadQueue.tsx       # Component
      UploadQueue.css       # Styles (design-token-based)
      UploadQueue.test.tsx  # Component tests
      index.ts              # Barrel export
  hooks/
    useUploadQueue.ts       # State hook
    useUploadQueue.test.ts  # Hook tests
  pages/
    DistributionDashboard.tsx  # Integration point
```
