# UX273: i18n Number/Date/Currency Formatter Preview in Settings

## Scope

Design and implementation of the **`I18nFormatterPreview`** design-system component and the **`SettingsPage`** that hosts it. Users can select and search through locale preferences to preview real-time number, currency, date, and bidirectional text formatting rules compared side-by-side with the system default (`en-US`).

UI/UX only — zero full-page reloads required.

---

## Problem Statement

| Issue | Detail |
|---|---|
| Blind Locale Selection | Previously, overriding number/date/currency locales took effect without showing how values actually formatted |
| Separator & Symbol Confusion | Different locales format decimal separators (`,` vs `.`), currency placement (`$1,000` vs `1.000 €`), and date order differently |
| Bidirectional (RTL) Ambiguity | Arabic (`ar-SA`) and RTL locales require direction isolation to prevent digit/currency scrambling |
| Responsive Layout Clipping | Long locale names and wide comparison tables previously overflowed on smaller mobile viewports |

---

## Component Architecture

### `I18nFormatterPreview` (`src/components/I18nFormatterPreview`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `initialLocale` | `string` | `'en-US'` | Initial selected locale code |
| `systemDefaultLocale` | `string` | `'en-US'` | Base reference system default locale |
| `onLocaleChange` | `(locale: string) => void` | — | Callback emitted on locale selection |
| `className` | `string` | `''` | Optional styling extension |
| `ariaHeadingId` | `string` | `'i18n-preview-heading'` | Heading anchor ID for accessibility |

---

## Key Features & UX Flow

1. **Searchable Combobox Dropdown**:
   - Filter available locales in real-time by English name, native script, country code, or currency code.
   - Keyboard accessible via `ArrowUp`, `ArrowDown`, `Enter`, and `Escape`.
   - WCAG-compliant ARIA combobox pattern (`role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`).

2. **Real-time Live Reactivity**:
   - Selecting any locale instantly updates all table sample rows without page reloads.

3. **Revert to System Default Affordance**:
   - Prominent **"Revert to Default"** action button.
   - Enabled when `selectedLocale !== systemDefaultLocale`.
   - Automatically resets selected locale back to `en-US` and announces change via `aria-live="polite"`.

4. **Formatter Comparison Table**:
   - **Current Locale Column**: Rendered wrapped in `<LocalizedText locale={selectedLocale}>` with directionality attributes (`dir="rtl"` for RTL locales).
   - **System Default Column**: Displays base `en-US` formatting for easy comparison.
   - **Formatting Difference Badge**: Explains differences in grouping separators, compact suffixes (e.g. `B` vs `Mrd.`), currency placement, and date component ordering.

---

## Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|---|---|
| **1.3.1 Info & Relationships** | Semantic `<table>` structure with `<th scope="col">` and data-label attributes for mobile card rendering. |
| **1.4.3 Contrast (Minimum)** | High-contrast text colours meeting 4.5:1 ratio on slate dark backgrounds (`#f8fafc`, `#60a5fa`, `#94a3b8`). |
| **2.1.1 Keyboard Accessibility** | Full combobox keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Tab`). Focus outlines on all inputs and buttons. |
| **4.1.2 Name, Role, Value** | Combobox roles (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-activedescendant`). |
| **4.1.3 Status Messages** | `<div aria-live="polite">` announces locale updates to screen reader users. |

### axe Notes

Automated tests in `I18nFormatterPreview.test.tsx` and `SettingsPage.test.tsx` validate LTR, RTL (`ar-SA`), and custom initial states using `jest-axe`. **Zero violations**.

---

## Responsive & Edge Cases

| Case | Handling |
|---|---|
| **≤640px Mobile Viewport** | Table automatically transforms into responsive card stack via `@media (max-width: 640px)` CSS rule. |
| **Very Long Locale Names** | Text wrapping with `overflow-wrap: break-word` prevents text clipping or container overflow. |
| **RTL Text Preview** | Arabic (`ar-SA`) automatically applies `dir="rtl"` via `LocalizedText` and isolates numeric dates. |
| **Dark Mode** | Built with Revora design tokens (`glass-card`, `#0f172a` slate palette, `#60a5fa` accent rings). |

---

## Verification & Coverage

- `src/components/I18nFormatterPreview/I18nFormatterPreview.tsx`: 100% Statements, 100% Branches, 100% Functions, 100% Lines.
- `src/pages/SettingsPage.tsx`: 100% Statements, 100% Branches, 100% Functions, 100% Lines.
