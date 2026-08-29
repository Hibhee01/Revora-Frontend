# Internationalization UX Framework

## Purpose
This document defines the design system conventions for internationalization (i18n) across the Revora frontend. It covers copy-key naming, pluralization, locale-aware formatting, long-string handling, translator-friendly UI, and responsive accessibility.

## Copy key conventions
- Use dot-separated namespaces: `namespace.section.element`
- Keep keys stable and content-agnostic: do not include punctuation, casing, or exact copy in the key name
- Use kebab-case for key segments and avoid UI implementation references
- Prefer semantic naming over verb/phrase fragments
- Use placeholder tokens in copy, not string concatenation

### Example key patterns
- `auth.login.title`
- `auth.login.subtitle`
- `form.revenue.gross-revenue.label`
- `form.revenue.payout-estimate.description`
- `error.offering.network.message`

## Pluralization conventions
- Use ICU plural categories: `zero`, `one`, `two`, `few`, `many`, `other`
- Do not build pluralized UI copy by concatenating runtime values
- Use a helper that selects the correct form by locale and count
- Keep plural forms close to the copy key and use placeholders for numbers

### Example
`{count, plural, one {# offering available} other {# offerings available}}`

## Locale formatting
All numeric, date, and currency display should use `Intl`-based locale formatting.

### Supported locales and formats
- `en-US`
  - Date: `Apr 10, 2026`
  - Number: `1,234.56`
  - Currency: `$1,234`
- `de-DE`
  - Date: `10.4.2026`
  - Number: `1.234,56`
  - Currency: `1.234 €`
- `ja-JP`
  - Date: `2026/04/10`
  - Number: `12,346`
  - Currency: `￥1,234`
- `ar-SA`
  - Date: `١٠‏/٠٤‏/٢٠٢٦`
  - Number: `١٬٢٣٥`
  - Currency: `ر.س ١٬٢٣٤`

### Implementation notes
- Use `Intl.DateTimeFormat` with locale-specific date shape
- Use `Intl.NumberFormat` for numbers and currency
- Avoid manual string assembly for separators, symbols, or decimals

## UI guidelines for copy expansion
- Design all copy containers to support at least `+40%` localized expansion
- Avoid fixed-width buttons and single-line labels that truncate long text
- Use responsive layouts that stack or wrap rather than force horizontal compression
- Allow `overflow-wrap: break-word` and `word-break: break-word`
- Ensure `min-width: 0` on flex items containing text
- Use multi-line copy for dense headings and button labels when necessary

### Special language notes
- German compounds can expand 30-40% in UI copy
- Japanese does not use spaces, so avoid width-based truncation
- Arabic requires right-to-left direction and natural punctuation ordering

## Translator-friendly UI
- Wrap translated copy in a component that uses `dir="auto"`
- Expose `lang` when the locale is known
- Show generated copy in context with actual layout boundaries
- Avoid hiding copy behind icons, tooltips, or truncated content during translation review
- Provide sample strings with placeholders to help translators avoid invalid token placement

## Accessibility & responsiveness
- Maintain WCAG 2.1 AA contrast on all translated text and labels
- Use semantic markup and accessible roles for copy-heavy views
- Prefer `aria-label` on icons and buttons over duplicate visible text for clarity
- Keep line-length moderate and allow wrapping for long localized paragraphs
- Validate new language support for both keyboard and screen reader workflows

## Component design pattern
- Use a reusable localized text wrapper for directionality and wrapping
- Keep copy keys and runtime values separate
- Provide a shared utility module for locale-specific formatting and plural selection
- Document all supported locale behaviors in the design system

## Copy expansion utilities (`src/constants/i18n.ts`)
- `COPY_EXPANSION_SAMPLES` - per-locale baseline/expanded sample pairs (en-US, de-DE, ja-JP, ar-SA, zh-CN) with a note explaining why each string grows. These drive the translator-facing preview in `I18nFormatterPreview` and pin the edge cases the design system must tolerate: German compounds, Japanese no-space text, Arabic RTL reordering, CJK density.
- `copyExpansionRatio(expanded, baseline)` - growth ratio of a localized string relative to its English baseline. `1.4` = 40% longer.
- `copyExpansionWithinBudget(expanded, baseline, budgetRatio = 1.4)` - returns whether the string stays within the documented +40% layout budget.
- `interpolatePlaceholders(template, params)` - the single contract for inserting runtime values into localized copy via `{name}` tokens; unknown tokens are left untouched so translators can preview them.

### Boundary behavior
- `buildTranslationKey` drops empty/whitespace-only segments (never emits `a..b`) and normalizes mixed case and internal whitespace to kebab-case.
- All `Intl`-based formatters fall back to `en-US` defaults for unknown locales; `formatCurrency` falls back to the locale's default currency, then `USD`.
- `formatDate` returns the raw input string for invalid dates instead of throwing `RangeError`.
- `formatNumber` / `formatPercent` / `formatCompactNumber` tolerate `NaN` and negative values.
- `selectPluralForm` falls back to the `other` form when the locale's plural category has no entry.

## Summary
This framework enables Revora UI to support internationalized copy consistently, safely, and accessibly. It formalizes translation key naming, locale formatting, plural rules, and responsive copy expansion so new UX work can be reviewed against a single system.
