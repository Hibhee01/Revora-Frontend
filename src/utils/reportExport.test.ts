/**
 * reportExport.test.ts
 * Issue #627 – unit coverage for the dependency-free report generators.
 */

import { describe, expect, it } from "vitest";
import {
  buildReportExportRows,
  reportExportFileName,
  toCsv,
  toPdfBytes,
  toXlsxBytes,
} from "./reportExport";

const INPUT = {
  reportPeriod: "2026-05",
  periodLabel: "May 2026",
  grossRevenue: 125000,
  currency: "USD",
  locale: "en-US",
  notes: 'Q2 revenue, "final" numbers',
  payoutEstimate: 10000,
};

describe("buildReportExportRows", () => {
  it("builds the summary preview for the current-view scope", () => {
    const rows = buildReportExportRows("current", INPUT);
    expect(rows).toEqual([
      ["Period", "Gross revenue", "Estimated payout"],
      ["May 2026", "125000", "10000"],
    ]);
  });

  it("builds the full record for the filtered-set scope", () => {
    const rows = buildReportExportRows("filtered", INPUT);
    expect(rows).toEqual([
      [
        "Period",
        "Gross revenue",
        "Currency",
        "Locale",
        "Estimated payout",
        "Notes",
      ],
      ["May 2026", "125000", "USD", "en-US", "10000", 'Q2 revenue, "final" numbers'],
    ]);
  });

  it("handles boundary values: zero revenue and empty notes", () => {
    const rows = buildReportExportRows("filtered", {
      ...INPUT,
      grossRevenue: 0,
      payoutEstimate: 0,
      notes: "",
    });
    expect(rows[1]).toEqual(["May 2026", "0", "USD", "en-US", "0", ""]);
  });
});

describe("reportExportFileName", () => {
  it("includes the period and format with the scope suffix for filtered exports", () => {
    expect(reportExportFileName("current", "csv", "2026-05")).toBe(
      "revenue-report-2026-05.csv"
    );
    expect(reportExportFileName("filtered", "xlsx", "2026-05")).toBe(
      "revenue-report-2026-05-filtered.xlsx"
    );
    expect(reportExportFileName("current", "pdf", "2026-05")).toBe(
      "revenue-report-2026-05.pdf"
    );
  });
});

describe("toCsv", () => {
  it("writes a header and data rows with CRLF line endings", () => {
    const csv = toCsv([
      ["Period", "Gross revenue"],
      ["May 2026", "125000"],
    ]);
    expect(csv).toBe("Period,Gross revenue\r\nMay 2026,125000\r\n");
  });

  it("quotes cells containing commas, quotes, or newlines", () => {
    const csv = toCsv([['a,b', 'say "hi"', "line1\nline2"]]);
    expect(csv).toBe('"a,b","say ""hi""","line1\nline2"\r\n');
  });
});

describe("toXlsxBytes", () => {
  it("produces a stored ZIP (PK signatures) containing the OOXML parts", () => {
    const bytes = toXlsxBytes([
      ["Period", "Gross revenue"],
      ["May 2026", "125000"],
    ]);
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("[Content_Types].xml");
    expect(text).toContain("xl/worksheets/sheet1.xml");
    expect(text).toContain("<t xml:space=\"preserve\">May 2026</t>");
    expect(text).toContain("<v>125000</v>");
    // Central directory and EOCD signatures present.
    expect(text.includes("PK\u0001\u0002")).toBe(true);
    expect(text.includes("PK\u0005\u0006")).toBe(true);
  });
});

describe("toPdfBytes", () => {
  it("produces a structurally valid single-page PDF", () => {
    const bytes = toPdfBytes([
      ["Period", "Gross revenue"],
      ["May 2026", "125000"],
    ]);
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("/Type /Page");
    expect(text).toContain("May 2026");
    expect(text).toContain("125000");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);

    // startxref must point at the xref table.
    const startxref = Number(/startxref\n(\d+)\n%%EOF/.exec(text)?.[1]);
    expect(Number.isFinite(startxref)).toBe(true);
    expect(text.slice(startxref, startxref + 4)).toBe("xref");
  });
});
