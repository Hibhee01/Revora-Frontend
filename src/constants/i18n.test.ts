import {
  buildTranslationKey,
  COPY_EXPANSION_SAMPLES,
  copyExpansionRatio,
  copyExpansionWithinBudget,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  getPluralCategory,
  interpolatePlaceholders,
  isRtlLocale,
  selectPluralForm,
} from "./i18n";
import { describe, expect, it } from "vitest";

describe("i18n utility functions", () => {
  it("builds stable translation keys from namespace segments", () => {
    expect(buildTranslationKey("auth", "login", "title")).toBe("auth.login.title");
  });

  it("detects RTL locales", () => {
    expect(isRtlLocale("ar-SA")).toBe(true);
    expect(isRtlLocale("en-US")).toBe(false);
  });

  it("formats numbers for locale-specific display", () => {
    expect(formatNumber(12345.678, "ja-JP")).toContain("12,346");
    expect(formatNumber(12345.678, "de-DE")).toContain("12.345");
  });

  it("formats currency by locale and symbol", () => {
    expect(formatCurrency(1200, "EUR", "de-DE")).toContain("€");
    expect(formatCurrency(1200, "USD", "en-US")).toContain("$");
  });

  it("formats dates using locale settings", () => {
    expect(formatDate("2026-05-10", "en-US")).toContain("2026");
    expect(formatDate("2026-05-10", "de-DE")).toContain("2026");
  });

  it("returns correct plural categories for locales", () => {
    expect(getPluralCategory("en-US", 1)).toBe("one");
    expect(getPluralCategory("en-US", 5)).toBe("other");
  });

  it("selects the matching plural form fallback for locale counts", () => {
    const forms = {
      one: "1 offering available",
      other: "{count} offerings available",
    };

    expect(selectPluralForm("en-US", 1, forms)).toBe("1 offering available");
    expect(selectPluralForm("en-US", 3, forms)).toBe("{count} offerings available");
  });
});

describe("i18n copy expansion framework", () => {
  it("documents expansion samples for the required edge-case locales", () => {
    const locales = COPY_EXPANSION_SAMPLES.map((s) => s.locale);
    expect(locales).toContain("de-DE");
    expect(locales).toContain("ja-JP");
    expect(locales).toContain("ar-SA");
    expect(locales).toContain("en-US");
  });

  it("computes the growth ratio of expanded copy relative to baseline", () => {
    expect(copyExpansionRatio("12345", "1234")).toBe(1.25);
    expect(copyExpansionRatio("", "Confirm payout")).toBe(0);
  });

  it("documents a German compound sample that motivates the +40% budget", () => {
    const de = COPY_EXPANSION_SAMPLES.find((s) => s.locale === "de-DE")!;
    expect(copyExpansionRatio(de.expanded, de.baseline)).toBeGreaterThanOrEqual(1.4);
  });

  it("accepts copy within the +40% layout budget", () => {
    expect(copyExpansionWithinBudget("12345", "1234")).toBe(true);
    const en = COPY_EXPANSION_SAMPLES.find((s) => s.locale === "en-US")!;
    expect(copyExpansionWithinBudget(en.expanded, en.baseline)).toBe(true);
  });

  it("rejects copy that would break the +40% layout budget", () => {
    expect(copyExpansionWithinBudget("123456", "1234")).toBe(false);
    // A deliberately over-long compound must be rejected so the design system
    // does not silently ship a clipped label.
    expect(copyExpansionWithinBudget("A very long German compound word bestätigen hier", "OK")).toBe(false);
  });

  it("keeps Japanese no-space copy intact and LTR", () => {
    const ja = COPY_EXPANSION_SAMPLES.find((s) => s.locale === "ja-JP")!;
    expect(ja.expanded).not.toContain(" ");
    expect(isRtlLocale(ja.locale)).toBe(false);
  });

  it("flags Arabic as RTL for direction-aware rendering", () => {
    expect(isRtlLocale("ar-SA")).toBe(true);
    expect(isRtlLocale("en-US")).toBe(false);
  });

  it("interpolates placeholder tokens with runtime values", () => {
    const template = "{count} offerings available for {currency}";
    expect(interpolatePlaceholders(template, { count: 3, currency: "USD" })).toBe(
      "3 offerings available for USD",
    );
  });

  it("leaves unknown placeholders untouched for translator preview", () => {
    expect(interpolatePlaceholders("{count} items", {})).toBe("{count} items");
  });
});

describe("i18n invalid and boundary input handling", () => {
  it("builds a stable key from empty and whitespace segments", () => {
    expect(buildTranslationKey("", "login", "title")).toBe("login.title");
    expect(buildTranslationKey("auth", "   ", "title")).toBe("auth.title");
  });

  it("normalizes mixed-case and whitespace key segments", () => {
    expect(buildTranslationKey("Revenue Share", "Offering Detail", "Submit")).toBe(
      "revenue-share.offering-detail.submit",
    );
  });

  it("falls back to en-US number formatting for unknown locales", () => {
    const unknown = formatNumber(12345.678, "xx-XX");
    expect(unknown).toBe(formatNumber(12345.678, "en-US"));
  });

  it("falls back to a default currency for unknown locales", () => {
    expect(formatCurrency(1200, undefined, "xx-XX")).toContain("$");
  });

  it("formats NaN and negative numbers without throwing", () => {
    expect(formatNumber(NaN, "en-US")).toBe("NaN");
    expect(formatNumber(-1234.5, "de-DE")).toContain("-1.234");
    expect(formatPercent(NaN, "en-US")).toContain("NaN");
    expect(formatCompactNumber(NaN, "en-US")).toBe("NaN");
  });

  it("returns the raw input for invalid dates instead of throwing", () => {
    expect(formatDate("not-a-date", "en-US")).toBe("not-a-date");
    expect(formatDate("", "en-US")).toBe("");
  });

  it("falls back to the other form when the plural category is missing", () => {
    const forms = { other: "fallback" } as { one?: string; other: string };
    expect(selectPluralForm("ar-SA", 2, forms)).toBe("fallback");
    expect(getPluralCategory("ar-SA", 0)).toBe("zero");
    expect(selectPluralForm("ar-SA", 0, forms)).toBe("fallback");
  });
});
