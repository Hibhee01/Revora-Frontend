# Inline Document Uploader (Offering Registration Wizard)

An inline uploader tile for attaching legal and financial documents to a
multi-step wizard — e.g. KYC verification during Offering Registration —
without leaving the current step. Shows per-file progress, metadata, and
replace/remove controls directly in the flow instead of a separate modal.

> Implementation: [`DocumentUploader`](../../src/components/DocumentUploader/DocumentUploader.tsx),
> demoed on [`OfferingRegistrationDemo`](../../src/pages/OfferingRegistrationDemo.tsx)
> (route `/startup/offering-registration`), which slots it into the KYC step of
> the [Offering Registration status timeline](./ux153-status-timeline-pattern.md).

## Why inline over a modal

- **Stays in flow** — founders often attach several documents while still
  reviewing other fields on the same wizard step; a modal would force a
  context switch per file.
- **Progress stays visible** — multiple files can upload concurrently, each
  with its own tile, so the founder can keep filling out the rest of the step
  while uploads complete in the background.
- **Errors are recoverable in place** — a failed upload shows Retry/Remove
  right on its tile rather than reopening a dialog.

Use a modal instead when the upload is a standalone, blocking task unrelated
to a larger form (not the case here).

## Anatomy

```
┌───────────────────────────────────────────────┐
│               ⬆                                │
│        Upload KYC documents                    │
│  Government ID, proof of address, articles...   │
│     (drag & drop or click to browse)            │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ 📄  passport.pdf                          ✕    │
│     240 KB                                     │
│     ▓▓▓▓▓▓▓▓░░░░░░░░  55%                      │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│ ✓  articles-of-incorporation.pdf          ✕    │
│     200 KB · Uploaded                          │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│ ⚠  financials.pdf                      ↻  ✕    │
│     9.0 MB                                     │
│     Network error. Check your connection...     │
└───────────────────────────────────────────────┘
```

- **Dropzone** — empty-state tile; a native `<label>`/`<input type="file">`
  pair, so click, drag-drop, and keyboard activation all work without custom
  key handling.
- **File tile** — one per attached file: icon (document / check / warning),
  name, size, and a state-specific region (progress bar, "Uploaded" caption,
  or error text).
- **Actions** — Remove (✕) is always available and doubles as **Cancel**
  while a file is uploading; Retry (↻) appears only on failed tiles.

## Action contract (for engineers)

`DocumentUploader` is **controlled**: the consumer owns the file list and
status transitions. The component performs synchronous client-side
validation (size/type) before handing accepted files up, but never performs
network I/O itself — that mirrors the [Undo Banner pattern](./undo-banner-pattern.md)'s
split between a dumb, testable view and caller-owned async logic.

| Prop | Required | Meaning |
| --- | --- | --- |
| `files` | yes | Current `UploadableFile[]` (id, name, size, status, progress?, errorMessage?). |
| `onFilesAdded` | yes | Called with `File[]` that passed client-side validation. |
| `onRemove` | yes | Remove/cancel a file by id. |
| `onRetry` | no | Retry a failed upload by id. Omit to hide the Retry control. |
| `label` | no | Dropzone accessible name. Defaults to `"Upload documents"`. |
| `description` | no | Helper copy under the label. |
| `accept` | no | Comma-separated accept string, e.g. `".pdf,.png,.jpg"`. |
| `maxSizeBytes` | no | Per-file size cap; oversized files are rejected client-side. |
| `multiple` | no | Allow multiple files at once. Defaults to `true`. |

```tsx
const [files, setFiles] = useState<UploadableFile[]>([]);

function handleFilesAdded(added: File[]) {
  const entries = added.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    status: 'uploading' as const,
    progress: 0,
  }));
  setFiles((prev) => [...prev, ...entries]);
  entries.forEach((entry, i) => uploadToServer(added[i], entry.id, setFiles));
}

<DocumentUploader
  files={files}
  onFilesAdded={handleFilesAdded}
  onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
  onRetry={(id) => retryUpload(id, setFiles)}
  label="Upload KYC documents"
  accept=".pdf,.png,.jpg"
  maxSizeBytes={10 * 1024 * 1024}
/>
```

## Placement & responsive behaviour

- Sits directly under the relevant wizard step's heading/instructions — e.g.
  the KYC step's "Verification documents" section — not in a side panel or
  overlay, so it never competes with the step's own validation state.
- The dropzone and tiles are full-width block elements that reflow naturally;
  below 480px, tile actions wrap onto their own row so touch targets never
  compress.
- All interactive controls (dropzone, remove, retry) keep a 44×44px touch
  target regardless of viewport, per the platform's touch-target baseline.

## Accessibility (WCAG 2.1 AA)

- **Live region** — a single `role="status" aria-live="polite"` region
  announces completion (`"<name> uploaded successfully."`), failure
  (`"<name> failed to upload. <reason>"`), and client-side validation
  rejections (size/type), independent of the visual tile state.
- **Per-file error text** — in addition to the shared live region, a failed
  tile's reason is also exposed via `role="alert"` on the tile itself, so a
  screen-reader user inspecting that tile directly still gets the reason
  without waiting on the live region.
- **Keyboard** — the dropzone is a real `<label htmlFor>` + `<input
  type="file">`; Tab reaches it in DOM order and Enter/Space opens the native
  file picker exactly as they would for any file input — no custom
  keydown handling, and the visible focus ring is drawn via `:focus-within`
  on the dropzone.
- **Drag-and-drop is additive, not required** — every action reachable via
  drag-drop (adding files) is equally reachable via the keyboard-operable
  input; nothing is drag-only.
- **Reduced motion** — per-file progress uses the shared
  [`<ProgressBar>`](../LOADING_STATES.md), whose shimmer/indeterminate
  animation already respects `prefers-reduced-motion` (see
  [reduced-motion-guidelines.md](./reduced-motion-guidelines.md)); no
  additional motion is introduced by this component.
- **Labelling** — Remove is labelled `"Remove <name>"` normally and
  `"Cancel upload of <name>"` while the file is still uploading; Retry is
  labelled `"Retry upload of <name>"`. All three are explicit per-file, never
  relying on visual position alone.

### axe notes

`DocumentUploader.test.tsx` runs `jest-axe` against the uploader in both an
empty state and a populated state (uploading, completed, and error tiles
together) and asserts no violations. Points verified during design:

- The dropzone's accessible name comes from its `<label>` text content, not a
  bare icon.
- Decorative icons (document, check, warning, upload-cloud, remove/retry
  glyphs) are `aria-hidden="true"`; only the text labels carry the accessible
  name for interactive controls.
- Error text and the live region are both text-based (no color-only
  signalling of failure).

## Test coverage

- [`DocumentUploader.test.tsx`](../../src/components/DocumentUploader/DocumentUploader.test.tsx) —
  empty-state rendering, accepting a valid file via the native input,
  rejecting oversized/mismatched-type files (and announcing the rejection),
  drag enter/drop/leave, per-file progress bar, live-region announcements on
  completion and failure, retry/remove callbacks, cancel-labelling while
  uploading, and axe (empty + populated states).
- [`OfferingRegistrationDemo.test.tsx`](../../src/pages/OfferingRegistrationDemo.test.tsx) —
  end-to-end simulated upload to completion, and a simulated network failure
  with a working retry, exercising the uploader wired into a real wizard
  context.
