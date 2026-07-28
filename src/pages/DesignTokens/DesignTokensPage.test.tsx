import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesignTokensPage } from "./DesignTokensPage";
import { contrastRatio, wcagGrade } from "./contrast";
import { TOKEN_GROUPS } from "./tokens";

// ─── Mock clipboard ───────────────────────────────────────────────────────────
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

// ─── Mock URL.createObjectURL ─────────────────────────────────────────────────
global.URL.createObjectURL = vi.fn(() => "blob:mock");
global.URL.revokeObjectURL = vi.fn();

// ─── contrast.ts unit tests ───────────────────────────────────────────────────
describe("contrastRatio", () => {
  it("returns null for non-hex values", () => {
    expect(contrastRatio("rgba(0,0,0,0)", "#fff")).toBeNull();
  });
  it("returns ~21 for black on white", () => {
    const ratio = contrastRatio("#000000", "#ffffff");
    expect(ratio).toBeGreaterThan(20);
  });
  it("returns 1 for identical colours", () => {
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
  });
  it("calculates blue on dark correctly", () => {
    const ratio = contrastRatio("#3b82f6", "#020617");
    expect(ratio).toBeGreaterThan(1);
  });
});

describe("wcagGrade", () => {
  it("returns AAA for ratio >= 7", () => expect(wcagGrade(7.1)).toBe("AAA"));
  it("returns AA for ratio >= 4.5", () => expect(wcagGrade(5)).toBe("AA"));
  it("returns AA Large for ratio >= 3", () => expect(wcagGrade(3.5)).toBe("AA Large"));
  it("returns Fail for ratio < 3", () => expect(wcagGrade(2.5)).toBe("Fail"));
  it("returns Fail for null", () => expect(wcagGrade(null)).toBe("Fail"));
});

// ─── tokens.ts shape tests ────────────────────────────────────────────────────
describe("TOKEN_GROUPS", () => {
  it("has at least 5 groups", () => {
    expect(TOKEN_GROUPS.length).toBeGreaterThanOrEqual(5);
  });
  it("every token has name, variable, and value", () => {
    for (const group of TOKEN_GROUPS) {
      for (const token of group.tokens) {
        expect(token.name).toBeTruthy();
        expect(token.variable).toMatch(/^--/);
        expect(token.value).toBeTruthy();
      }
    }
  });
  it("color group contains primary token", () => {
    const colors = TOKEN_GROUPS.find((g) => g.id === "colors");
    expect(colors?.tokens.some((t) => t.variable === "--primary")).toBe(true);
  });
});

// ─── Page render tests ────────────────────────────────────────────────────────
describe("DesignTokensPage", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  it("renders the page title", () => {
    render(<DesignTokensPage />);
    expect(screen.getByRole("heading", { name: /design tokens/i, level: 1 })).toBeInTheDocument();
  });

  it("renders all section headings", () => {
    render(<DesignTokensPage />);
    expect(screen.getByText("Colors")).toBeInTheDocument();
    expect(screen.getByText("Chart Categorical Palette (Dark Mode)")).toBeInTheDocument();
    expect(screen.getByText("Chart Categorical Palette (Light Mode)")).toBeInTheDocument();
    expect(screen.getByText("Spacing")).toBeInTheDocument();
    expect(screen.getByText("Border Radius")).toBeInTheDocument();
    expect(screen.getByText("Typography")).toBeInTheDocument();
    expect(screen.getByText("Shadows / Elevation")).toBeInTheDocument();
  });

  it("renders Export JSON button", () => {
    render(<DesignTokensPage />);
    expect(screen.getByRole("button", { name: /export json/i })).toBeInTheDocument();
  });

  it("renders Copy CSS button", () => {
    render(<DesignTokensPage />);
    // match by aria-label since button text includes arrow symbol
    expect(screen.getByRole("button", { name: /copy all tokens as css/i })).toBeInTheDocument();
  });

  it("renders surface toggle buttons", () => {
    render(<DesignTokensPage />);
    expect(screen.getByRole("button", { name: /dark surface/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /light surface/i })).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<DesignTokensPage />);
    expect(screen.getByRole("searchbox", { name: /search design tokens/i })).toBeInTheDocument();
  });

  it("filters tokens on search", async () => {
    render(<DesignTokensPage />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "primary");
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.queryByText("Spacing")).not.toBeInTheDocument();
  });

  it("shows empty state when no tokens match", async () => {
    render(<DesignTokensPage />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "xyznotexist");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/no tokens match/i)).toBeInTheDocument();
  });

  it("copies variable name on clicking Copy var button", async () => {
    render(<DesignTokensPage />);
    // find by aria-label which is always set correctly
    const copyBtns = screen.getAllByRole("button", { name: /copy css variable/i });
    await userEvent.click(copyBtns[0]);
    expect(mockWriteText).toHaveBeenCalledWith(expect.stringMatching(/^--/));
  });

  it("shows ✓ Copied feedback after copy", async () => {
    render(<DesignTokensPage />);
    const copyBtns = screen.getAllByRole("button", { name: /copy css variable/i });
    await userEvent.click(copyBtns[0]);
    await waitFor(() =>
      expect(screen.getAllByText(/✓ copied/i).length).toBeGreaterThan(0)
    );
  });

  it("copies all CSS on clicking Copy CSS", async () => {
    render(<DesignTokensPage />);
    const btn = screen.getByRole("button", { name: /copy all tokens as css/i });
    await userEvent.click(btn);
    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining(":root"));
  });

  it("toggles surface to light when clicked", async () => {
    render(<DesignTokensPage />);
    const lightBtn = screen.getByRole("button", { name: /light surface/i });
    await userEvent.click(lightBtn);
    expect(lightBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("triggers JSON download on Export JSON click", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<DesignTokensPage />);
    fireEvent.click(screen.getByRole("button", { name: /export json/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("has accessible names on all copy buttons", () => {
    render(<DesignTokensPage />);
    const copyBtns = screen.getAllByRole("button", { name: /copy/i });
    copyBtns.forEach((btn) => {
      expect(btn).toHaveAccessibleName();
    });
  });

  it("search clears results when input cleared", async () => {
    render(<DesignTokensPage />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "primary");
    await userEvent.clear(input);
    expect(screen.getByText("Spacing")).toBeInTheDocument();
  });
});
