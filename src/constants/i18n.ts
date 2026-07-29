export const SUPPORTED_LOCALES = [
  "en-US",
  "de-DE",
  "ja-JP",
  "ar-SA",
  "fr-FR",
  "es-ES",
  "zh-CN",
  "en-GB",
] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const TRANSLATION_KEY_CONVENTIONS = {
  separator: ".",
  example: "namespace.section.element",
  rules: [
    "Use dot-separated namespaces for distributed copy: auth.login.title, form.revenue.submit, error.offering.network",
    "Keep keys stable and independent from wording changes: do not embed literal copy or punctuation in keys",
    "Use lowercase, kebab-case segments and avoid UI implementation details in key names",
    "Use noun-driven keys for static copy and verb-driven keys for actions",
    "Place runtime parameters in placeholders, not in the key: report.accountSummary, not report.withTotal",
  ] as const,
};

export const I18N_COPY_EXPANSION_RATIO = 1.4;
export const RTL_LOCALES: string[] = ["ar-SA", "ar-EG", "he-IL", "fa-IR"];
export const LOCALE_DIRECTION: Record<string, "ltr" | "rtl"> = {
  "en-US": "ltr",
  "de-DE": "ltr",
  "ja-JP": "ltr",
  "ar-SA": "rtl",
  "fr-FR": "ltr",
  "es-ES": "ltr",
  "zh-CN": "ltr",
  "en-GB": "ltr",
};

export type IcuPluralForms = {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

export interface LocaleMeta {
  code: string;
  label: string;
  nativeLabel: string;
  defaultCurrency: string;
  date: Intl.DateTimeFormatOptions;
  number: Intl.NumberFormatOptions;
  currency: Intl.NumberFormatOptions;
}

export const LOCALE_FORMAT_SETTINGS: Record<string, LocaleMeta> = {
  "en-US": {
    code: "en-US",
    label: "English (United States)",
    nativeLabel: "English (United States)",
    defaultCurrency: "USD",
    date: { year: "numeric", month: "short", day: "numeric" },
    number: { maximumFractionDigits: 2 },
    currency: { style: "currency", currency: "USD", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
  "de-DE": {
    code: "de-DE",
    label: "German (Germany) - Deutsch (Deutschland)",
    nativeLabel: "Deutsch (Deutschland)",
    defaultCurrency: "EUR",
    date: { year: "numeric", month: "numeric", day: "numeric" },
    number: { maximumFractionDigits: 2 },
    currency: { style: "currency", currency: "EUR", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
  "ja-JP": {
    code: "ja-JP",
    label: "Japanese (Japan) - 日本語 (日本)",
    nativeLabel: "日本語 (日本)",
    defaultCurrency: "JPY",
    date: { year: "numeric", month: "numeric", day: "numeric" },
    number: { maximumFractionDigits: 0, useGrouping: true },
    currency: { style: "currency", currency: "JPY", currencyDisplay: "symbol", maximumFractionDigits: 0 },
  },
  "ar-SA": {
    code: "ar-SA",
    label: "Arabic (Saudi Arabia) - العربية (المملكة العربية السعودية)",
    nativeLabel: "العربية (السعودية)",
    defaultCurrency: "SAR",
    date: { year: "numeric", month: "numeric", day: "numeric" },
    number: { maximumFractionDigits: 2, useGrouping: true },
    currency: { style: "currency", currency: "SAR", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
  "fr-FR": {
    code: "fr-FR",
    label: "French (France) - Français (France)",
    nativeLabel: "Français (France)",
    defaultCurrency: "EUR",
    date: { year: "numeric", month: "numeric", day: "numeric" },
    number: { maximumFractionDigits: 2 },
    currency: { style: "currency", currency: "EUR", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
  "es-ES": {
    code: "es-ES",
    label: "Spanish (Spain) - Español (España)",
    nativeLabel: "Español (España)",
    defaultCurrency: "EUR",
    date: { year: "numeric", month: "numeric", day: "numeric" },
    number: { maximumFractionDigits: 2 },
    currency: { style: "currency", currency: "EUR", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
  "zh-CN": {
    code: "zh-CN",
    label: "Chinese (Simplified, China) - 中文 (简体, 中国)",
    nativeLabel: "中文 (中国)",
    defaultCurrency: "CNY",
    date: { year: "numeric", month: "numeric", day: "numeric" },
    number: { maximumFractionDigits: 2, useGrouping: true },
    currency: { style: "currency", currency: "CNY", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
  "en-GB": {
    code: "en-GB",
    label: "English (United Kingdom) - International Format Standard",
    nativeLabel: "English (United Kingdom)",
    defaultCurrency: "GBP",
    date: { year: "numeric", month: "short", day: "numeric" },
    number: { maximumFractionDigits: 2 },
    currency: { style: "currency", currency: "GBP", currencyDisplay: "symbol", maximumFractionDigits: 2 },
  },
};

export function buildTranslationKey(
  namespace: string,
  section: string,
  element: string,
): string {
  return [namespace, section, element]
    .filter(Boolean)
    .map((segment) => segment.trim().toLowerCase().replace(/\s+/g, "-"))
    .join(TRANSLATION_KEY_CONVENTIONS.separator);
}

export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

export function formatNumber(
  value: number,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  const setting = LOCALE_FORMAT_SETTINGS[locale]?.number ?? {};
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    useGrouping: true,
    ...setting,
    ...options,
  }).format(value);
}

export function formatCurrency(
  value: number,
  currency?: string,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  const defaultCurr = currency ?? LOCALE_FORMAT_SETTINGS[locale]?.defaultCurrency ?? "USD";
  const setting = LOCALE_FORMAT_SETTINGS[locale]?.currency ?? {};
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: defaultCurr,
    currencyDisplay: "symbol",
    ...setting,
    ...options,
  }).format(value);
}

export function formatDate(
  value: string | number | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {},
): string {
  const setting = LOCALE_FORMAT_SETTINGS[locale]?.date ?? { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat(locale, {
    ...setting,
    ...options,
  }).format(new Date(value));
}

export function formatPercent(
  value: number,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCompactNumber(
  value: number,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function getPluralCategory(locale: string, count: number): string {
  return new Intl.PluralRules(locale).select(count);
}

export function selectPluralForm(
  locale: string,
  count: number,
  forms: IcuPluralForms,
): string {
  const category = getPluralCategory(locale, count) as keyof IcuPluralForms;
  return forms[category] ?? forms.other;
}

export const I18N_ACCESSIBILITY_GUIDELINES = {
  responsiveCopy: "Always allow localized copy to wrap and line-break without truncation. Avoid fixed-width buttons and headline containers that clip expanded values.",
  translatorUI: "Render translation content with dir=\"auto\" and visible placeholder labels so translators can preview expanded strings in context.",
  copyExpansion: "Design UI components to handle at least 40% copy expansion, especially for German compounds and Arabic RTL sentence structures.",
  numericAccessibility: "Use locale-aware currency, number, and date formatting. Provide visible labels for currency and date context, not just symbols.",
};
