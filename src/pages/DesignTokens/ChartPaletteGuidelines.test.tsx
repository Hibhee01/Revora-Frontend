import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChartPaletteGuidelines } from "./ChartPaletteGuidelines";
import { DARK_CHART_TOKENS, LIGHT_CHART_TOKENS } from "./tokens";
import { contrastRatio, DARK_SURFACE } from "./contrast";

describe("ChartPaletteGuidelines", () => {
  it("renders the section heading and description", () => {
    render(<ChartPaletteGuidelines surface="dark" />);
    expect(
      screen.getByRole("heading", { name: /dark-mode categorical chart palette/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/8 distinct categorical hues optimized for dark surfaces/i)
    ).toBeInTheDocument();
  });

  it("renders all 8 dark categorical tokens in swatches tab", () => {
    render(<ChartPaletteGuidelines surface="dark" />);
    for (const token of DARK_CHART_TOKENS) {
      expect(screen.getByText(token.name)).toBeInTheDocument();
      expect(screen.getByText(token.variable)).toBeInTheDocument();
    }
  });

  it("validates that all 8 dark categorical hues exceed 3:1 WCAG AA contrast ratio on dark surface", () => {
    for (const token of DARK_CHART_TOKENS) {
      const ratio = contrastRatio(token.value, DARK_SURFACE);
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("validates that all 8 light categorical hues exceed 3:1 contrast ratio on light surface", () => {
    for (const token of LIGHT_CHART_TOKENS) {
      const ratio = contrastRatio(token.value, "#ffffff");
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("switches tabs when tab buttons are clicked", async () => {
    render(<ChartPaletteGuidelines surface="dark" />);
    
    // Click Live Chart Preview tab
    const chartTab = screen.getByRole("tab", { name: /live chart preview/i });
    await userEvent.click(chartTab);
    expect(chartTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("8-Series Donut Allocation")).toBeInTheDocument();
    expect(screen.getByText("Categorical Bar Chart")).toBeInTheDocument();

    // Click Do's & Don'ts tab
    const guidelinesTab = screen.getByRole("tab", { name: /do's & don'ts/i });
    await userEvent.click(guidelinesTab);
    expect(guidelinesTab).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: /do: maintain ≥ 3:1 contrast on dark surfaces/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /don't: reuse deep light-mode hues on dark surfaces/i })
    ).toBeInTheDocument();
  });

  it("toggles color vision simulation modes", async () => {
    render(<ChartPaletteGuidelines surface="dark" />);
    
    const deutBtn = screen.getByRole("button", { name: /deuteranopia/i });
    await userEvent.click(deutBtn);
    expect(deutBtn).toHaveAttribute("aria-pressed", "true");

    const protBtn = screen.getByRole("button", { name: /protanopia/i });
    await userEvent.click(protBtn);
    expect(protBtn).toHaveAttribute("aria-pressed", "true");

    const tritBtn = screen.getByRole("button", { name: /tritanopia/i });
    await userEvent.click(tritBtn);
    expect(tritBtn).toHaveAttribute("aria-pressed", "true");

    const monoBtn = screen.getByRole("button", { name: /monochromacy/i });
    await userEvent.click(monoBtn);
    expect(monoBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders light-mode swatches when surface prop is 'light'", () => {
    render(<ChartPaletteGuidelines surface="light" />);
    expect(screen.getByText(/dark: #60a5fa/i)).toBeInTheDocument();
    expect(screen.getByText(/light: #2563eb/i)).toBeInTheDocument();
  });

  it("renders accessibility and responsive notes section", () => {
    render(<ChartPaletteGuidelines surface="dark" />);
    expect(
      screen.getByRole("heading", { name: /accessibility \(wcag 2\.1 aa\) & responsive assumptions/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/wcag 2\.1 aa non-text contrast/i)).toBeInTheDocument();
  });
});
