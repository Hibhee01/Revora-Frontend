# Audit Note Editor (Blacklist)

A compact markdown-style editor for recording audit notes during blacklist operations. Supports write/preview modes, safe formatting controls, pre-filled templates, and character count validation.

> Implementation: [`AuditNoteEditor`](../../src/components/AuditNoteEditor.tsx),
> [`AuditNoteEditor.types`](../../src/components/AuditNoteEditor.types.ts),
> [`AuditNoteEditor.css`](../../src/components/AuditNoteEditor.css).

## Why a dedicated editor over a plain textarea

- **Structured audit trail** — every blacklist decision is accompanied by a well-formatted, timestamped note that survives compliance review.
- **Consistent formatting** — the safe markdown subset (`**bold**`, `_italic_`, `- list`, `[link](url)`) keeps notes readable without risking arbitrary HTML/XSS.
- **Template speed** — pre-filled templates for common blacklist reasons (sanctions, fraud, compliance, admin) standardise language and reduce manual typing.
- **Validation guardrails** — minimum and maximum character counts ensure notes are substantive but not bloated.

## Anatomy

```
┌─────────────────────────────────────────────────────────┐
│  Audit Note                        [ Templates ▾ ]      │  ← Header row
├─────────────────────────────────────────────────────────┤
│  [B] [I] [≡] [🔗]            Write │ Preview            │  ← Toolbar
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Write your audit note here...                   │    │  ← Textarea
│  │                                                 │    │     (Write mode)
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ **bold** _italic_ - list [link](url)            │    │  ← Preview panel
│  └─────────────────────────────────────────────────┘    │     (Preview mode)
├─────────────────────────────────────────────────────────┤
│  42 characters           Minimum 10 characters required │  ← Footer
└─────────────────────────────────────────────────────────┘
```

### Header row
| Element | Description |
| --- | --- |
| Label | "Audit Note" — `<label>` associated with the textarea |
| Templates button | Opens a dropdown list of pre-filled templates; hidden when `templates` array is empty |

### Toolbar
The toolbar contains two groups separated flexbox-style:

**Left group — Formatting controls (4 buttons):**
| Button | Icon | Markdown | Keyboard |
| --- | --- | --- | --- |
| Bold | `Bold` (14px) | `**text**` | Ctrl+B / Cmd+B |
| Italic | `Italic` (14px) | `_text_` | Ctrl+I / Cmd+I |
| Bullet list | `List` (14px) | `\n- text` | — |
| Link | `Link` (14px) | `[text](url)` | — |

**Right group — Mode toggle (tab styled):**
| Button | Icon | Action |
| --- | --- | --- |
| Write | `Pencil` (12px) | Shows the textarea (default, `aria-selected=true`) |
| Preview | `Eye` (12px) | Shows the rendered preview panel |

### Editor area (Write mode)
- Standard `<textarea>` with 5 rows, resizable vertically.
- Placeholder: "Write your audit note here..."
- Border turns red on validation error (`aria-invalid=true`).
- Focus ring uses the primary brand colour.

### Preview panel (Preview mode)
- Uses `<pre>` with `white-space: pre-wrap` and `word-break: break-word`.
- Content is rendered via React's JSX text interpolation, which always uses `textContent` — HTML tags like `<script>` appear as literal text, never executed. XSS-safe by default.
- Empty state: "Nothing to preview." in italic muted text.
- `data-testid="ane-preview-content"` for automated assertions.

### Footer
- **Character count**: live-updating, `aria-live="polite"`.
  - Format: `{n} characters` or `{n} / {max} characters` when `maxChars` is set.
  - Turns red on error.
- **Validation message**: shown as `role="alert"` when below minimum or above maximum.

## Template system

Four default templates shipped with the component:

| ID | Label | Content |
| --- | --- | --- |
| `sanctions` | Sanctions list | "Address added to blacklist due to sanctions screening. Source: " |
| `fraud` | Fraud investigation | "Address flagged during fraud investigation. Case reference: " |
| `compliance` | Compliance review | "Blacklisted as part of routine compliance review. Reason: " |
| `admin` | Manual administrative action | "Manually blacklisted by administrator. Note: " |

### Behaviour
- Clicking "Templates" opens a `role="listbox"` dropdown anchored right-aligned.
- Each template is a `role="option"` item, keyboard-navigable (Enter/Space to select).
- Selecting a template inserts its content at the cursor position in the textarea.
- **Escape** closes the dropdown; focus returns to the Templates button.
- **Click outside** closes the dropdown.
- The dropdown closes automatically after selection.
- Passing `templates={[]}` hides the Templates button entirely.

## Validation

| Condition | Visual | ARIA |
| --- | --- | --- |
| Empty | Normal | — |
| 0 < length < minChars | Red border + error text | `aria-invalid="true"` + `role="alert"` |
| minChars ≤ length ≤ maxChars | Normal | — |
| length > maxChars | Red border + error text | `aria-invalid="true"` + `role="alert"` |

## Keyboard interactions

| Key | Context | Action |
| --- | --- | --- |
| Ctrl+B / Cmd+B | Textarea focused | Wraps selection with `**` (bold) |
| Ctrl+I / Cmd+I | Textarea focused | Wraps selection with `_` (italic) |
| Enter / Space | Template option focused | Inserts template at cursor |
| Escape | Template dropdown open | Closes dropdown, focus to Templates button |
| Tab | Any button | Normal focus order through toolbar, templates, mode toggle, textarea |

## Controlled vs uncontrolled mode

The editor supports both patterns:

**Uncontrolled (default):**
```tsx
<AuditNoteEditor />
// Internal state tracks the value
```

**Controlled:**
```tsx
<AuditNoteEditor value={note} onChange={setNote} />
// Parent owns the state
```

## Accessibility (WCAG 2.1 AA)

### ARIA mapping

| Element | Role | Attributes | Rationale |
| --- | --- | --- | --- |
| Container | `group` | `aria-label="Audit note editor"` | Groups related controls |
| Textarea | — | `aria-describedby="ane-char-count"`, `aria-invalid` | Links to char count, error state |
| Toolbar | `toolbar` | `aria-label="Formatting controls"` | Landmark for format buttons |
| Mode toggle | `tablist` / `tab` / `tabpanel` | `aria-selected`, `aria-controls`, `aria-labelledby` | Tabs pattern for write/preview |
| Char count | — | `aria-live="polite"` | Announces count without interrupting |
| Validation | `alert` | — | Announces errors immediately |
| Template dropdown | `listbox` / `option` | `aria-label="Note templates"`, `aria-expanded` on trigger | Standard combobox pattern |

### Reduced motion

No animations are present in the component; all transitions use `0.15s ease` which is minimal. When `prefers-reduced-motion: reduce` is active, the component functions without change since no visual animations exist.

### High contrast / forced colors

`@media (forced-colors: active)` overrides:
- Container and all focusable elements get visible `1px solid ButtonText` borders.
- Colours use system `ButtonText`, `ButtonFace`, etc.

### axe expectations

Points verified during design:

- **Contrast**: All text/label colours use `var(--ane-text)` / `var(--ane-text-muted)` from theme tokens meeting AA.
- **Labels**: Textarea has an associated `<label>` via `htmlFor="ane-textarea"`.
- **Live regions**: Character count uses `aria-live="polite"`, validation uses `role="alert"`.
- **Focus order**: Toolbar buttons → Templates dropdown → Mode toggle → Textarea is the natural DOM order.
- **XSS safety**: Preview renders content via React's JSX text interpolation (`{value}` inside `<pre>`), which always uses `textContent`, not `innerHTML`. User-supplied HTML tags such as `<script>` are rendered as literal text and never executed. No manual escaping is needed because React's built-in escaping handles this correctly.

## Responsive behaviour

| Breakpoint | Behaviour |
| --- | --- |
| ≥641px | Default layout: horizontal toolbar, side-by-side header |
| ≤640px | Toolbar stacks vertically, header stacks vertically, footer stacks vertically |
| Print | Toolbar and Templates hidden; textarea borderless, black text on white |
| RTL | `[dir='rtl']` flips toolbar and header direction, repositions template dropdown to the left |

## Edge cases

### Very long notes
- Character count displays the exact number (no truncation).
- The textarea uses `resize: vertical` so users can expand the input area.
- When `maxChars` is set, the validation prevents exceeding the limit.
- No hard word/character limit in the component itself — `maxChars` is configurable.

### XSS in preview
- React's JSX text interpolation (`{value}` inside `<pre>`) uses `textContent`, so user content is always rendered as literal text — no HTML entities, no script execution.
- The `innerHTML` of the `<pre>` element will show React's escaped entities (e.g. `&lt;script&gt;`), confirming the safety layer.
- See [XSS prevention](#xss-prevention) above for details.

### Keyboard-only formatting
- Ctrl+B / Cmd+B for bold.
- Ctrl+I / Cmd+I for italic.
- Tab navigation through all toolbar buttons, template dropdown, and mode toggle.

### Empty templates array
- When `templates={[]}` is passed, the Templates button is not rendered.
- The header shows only the "Audit Note" label.

### Controlled value reset
- When switching from controlled to uncontrolled (or vice versa), the internal state resets cleanly via the `isControlled` check.

## Test coverage

[`AuditNoteEditor.test.tsx`](../../src/components/AuditNoteEditor.test.tsx) covers:

- Rendering (container, label, textarea, toolbar, mode toggle, templates)
- Character count (initial, updates, max display)
- Validation (min error, max error, hide on valid, `aria-invalid`)
- Write/Preview toggle (initial mode, switch, empty message, content display, switch back)
- Keyboard shortcuts (Ctrl+B, Ctrl+I)
- Templates (open, list, insert, close on select, close on Escape, close on click outside)
- Format toolbar (bold, italic, list, link)
- XSS prevention (HTML escape in preview, angle bracket escaping)
- Accessibility (toolbar role, tab roles, aria-describedby, aria-live, role="alert")
- Controlled mode (uses value, calls onChange)
