import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  ResumeRecoveryBanner,
  readRecoveryFrame,
  saveRecoveryFrame,
  dismissRecoveryForever,
  variantFromPage,
} from "./ResumeRecoveryBanner";
import type { RecoveryFrame } from "./ResumeRecoveryBanner";

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

function makeFrame(overrides: Partial<RecoveryFrame> = {}): RecoveryFrame {
  return {
    page: "/startup/report-revenue",
    timestamp: Date.now(),
    payload: { step: 2, formData: { amount: "1000" } },
    ...overrides,
  };
}

function renderBanner(
  initialEntries: string[] = ["/startup/report-revenue"],
  overrides: Record<string, unknown> = {},
) {
  const onResume = vi.fn();
  const result = render(
    <MemoryRouter initialEntries={initialEntries}>
      <ResumeRecoveryBanner onResume={onResume} {...overrides} />
    </MemoryRouter>,
  );
  return { ...result, onResume };
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// readRecoveryFrame / saveRecoveryFrame / dismissRecoveryForever
// ---------------------------------------------------------------------------

describe("localStorage helpers", () => {
  it("saves and reads a recovery frame", () => {
    const frame = makeFrame();
    saveRecoveryFrame(frame);
    const result = readRecoveryFrame(frame.page, 7);
    expect(result).toEqual(frame);
  });

  it("returns null for non-existent page", () => {
    expect(readRecoveryFrame("/nonexistent", 7)).toBeNull();
  });

  it("returns null when expired", () => {
    const frame = makeFrame({ timestamp: Date.now() - 8 * MS_PER_DAY });
    saveRecoveryFrame(frame);
    expect(readRecoveryFrame(frame.page, 7)).toBeNull();
    // Expired slot should be cleaned up.
    expect(localStorage.getItem(`recovery_state_${frame.page}`)).toBeNull();
  });

  it("returns null when dismissed forever", () => {
    const frame = makeFrame();
    saveRecoveryFrame(frame);
    dismissRecoveryForever(frame.page);
    expect(readRecoveryFrame(frame.page, 7)).toBeNull();
    expect(localStorage.getItem(`recovery_state_${frame.page}`)).toBeNull();
    expect(localStorage.getItem(`recovery_dismissed_${frame.page}`)).toBe(
      "true",
    );
  });

  it("handles corrupt JSON gracefully", () => {
    localStorage.setItem("recovery_state_/bad", "{not json!!!");
    expect(readRecoveryFrame("/bad", 7)).toBeNull();
    expect(localStorage.getItem("recovery_state_/bad")).toBeNull();
  });

  it("handles missing timestamp field", () => {
    localStorage.setItem(
      "recovery_state_/no-ts",
      JSON.stringify({ page: "/no-ts", payload: {} }),
    );
    expect(readRecoveryFrame("/no-ts", 7)).toBeNull();
  });

  it("returns null when localStorage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      () => {
        throw new Error("quota exceeded");
      },
    );
    expect(readRecoveryFrame("/err", 7)).toBeNull();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// variantFromPage
// ---------------------------------------------------------------------------

describe("variantFromPage", () => {
  it("returns 'upload' for upload-related pages", () => {
    expect(variantFromPage("/startup/offering-registration/upload")).toBe(
      "upload",
    );
  });

  it("returns 'payout' for payout-related pages", () => {
    expect(variantFromPage("/investor/payouts")).toBe("payout");
  });

  it("returns 'form' by default", () => {
    expect(variantFromPage("/startup/report-revenue")).toBe("form");
    expect(variantFromPage("/anything")).toBe("form");
  });
});

// ---------------------------------------------------------------------------
// Component rendering
// ---------------------------------------------------------------------------

describe("ResumeRecoveryBanner", () => {
  it("renders nothing when no recovery frame exists", () => {
    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when dismissed forever", () => {
    const frame = makeFrame();
    saveRecoveryFrame(frame);
    dismissRecoveryForever(frame.page);

    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when frame is expired", () => {
    const frame = makeFrame({ timestamp: Date.now() - 8 * MS_PER_DAY });
    saveRecoveryFrame(frame);

    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it("renders recovery banner with correct form variant copy", () => {
    saveRecoveryFrame(makeFrame({ page: "/startup/report-revenue" }));

    renderBanner(["/startup/report-revenue"]);
    expect(
      screen.getByText("Your form draft was saved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We detected an incomplete form submission/),
    ).toBeInTheDocument();
  });

  it("renders upload variant copy when page matches", () => {
    saveRecoveryFrame(
      makeFrame({ page: "/startup/offering-registration/upload" }),
    );

    renderBanner(["/startup/offering-registration/upload"]);
    expect(
      screen.getByText("Your upload was interrupted"),
    ).toBeInTheDocument();
  });

  it("renders payout variant copy when page matches", () => {
    saveRecoveryFrame(makeFrame({ page: "/investor/payouts" }));

    renderBanner(["/investor/payouts"]);
    expect(
      screen.getByText("Your payout setup was interrupted"),
    ).toBeInTheDocument();
  });

  it("does not show banner for a non-matching route", () => {
    saveRecoveryFrame(makeFrame({ page: "/startup/report-revenue" }));

    const { container } = renderBanner(["/investor/ledger"]);
    expect(container.firstChild).toBeNull();
  });

  it("calls onResume with page and payload when Resume Session is clicked", () => {
    const payload = { step: 3, formData: { name: "Acme" } };
    saveRecoveryFrame(
      makeFrame({ page: "/startup/report-revenue", payload }),
    );

    const { onResume } = renderBanner(["/startup/report-revenue"]);
    fireEvent.click(screen.getByTestId("resume-recovery-resume"));

    expect(onResume).toHaveBeenCalledWith("/startup/report-revenue", payload);
  });

  it("dismisses recovery permanently when Dismiss is clicked", () => {
    saveRecoveryFrame(makeFrame({ page: "/startup/report-revenue" }));

    const { container } = renderBanner(["/startup/report-revenue"]);
    fireEvent.click(screen.getByTestId("resume-recovery-dismiss"));

    expect(
      localStorage.getItem("recovery_dismissed_/startup/report-revenue"),
    ).toBe("true");
    expect(container.firstChild).toBeNull();
  });

  it("shows remaining days when frame is within expiration", () => {
    const frame = makeFrame({
      timestamp: Date.now() - 3 * MS_PER_DAY,
      page: "/startup/report-revenue",
    });
    saveRecoveryFrame(frame);

    renderBanner(["/startup/report-revenue"]);
    expect(screen.getByText(/available for 4 days/)).toBeInTheDocument();
  });

  it("shows 1 day remaining (singular)", () => {
    const frame = makeFrame({
      timestamp: Date.now() - 6 * MS_PER_DAY,
      page: "/startup/report-revenue",
    });
    saveRecoveryFrame(frame);

    renderBanner(["/startup/report-revenue"]);
    expect(screen.getByText(/available for 1 day/)).toBeInTheDocument();
  });

  it("supports custom expirationDays", () => {
    const frame = makeFrame({
      timestamp: Date.now() - 2 * MS_PER_DAY,
      page: "/startup/report-revenue",
    });
    saveRecoveryFrame(frame);

    // With 1-day expiration, a 2-day-old frame should be expired.
    const { container } = renderBanner(
      ["/startup/report-revenue"],
      { expirationDays: 1 },
    );
    expect(container.firstChild).toBeNull();
  });

  it("applies custom className", () => {
    saveRecoveryFrame(makeFrame());

    const { container } = renderBanner(["/startup/report-revenue"], {
      className: "my-custom-class",
    });
    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("Accessibility", () => {
  it("has role=alert and aria-live=polite", () => {
    saveRecoveryFrame(makeFrame());
    renderBanner();

    const banner = screen.getByTestId("resume-recovery-banner");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(banner).toHaveAttribute("aria-atomic", "true");
  });

  it("has aria-label on the banner container", () => {
    saveRecoveryFrame(makeFrame());
    renderBanner();

    const banner = screen.getByTestId("resume-recovery-banner");
    expect(banner).toHaveAttribute(
      "aria-label",
      "Recovery available: Your form draft was saved",
    );
  });

  it("Resume button has explicit aria-label", () => {
    saveRecoveryFrame(makeFrame());
    renderBanner();

    expect(
      screen.getByRole("button", { name: /resume session/i }),
    ).toBeInTheDocument();
  });

  it("Dismiss button has explicit aria-label", () => {
    saveRecoveryFrame(makeFrame());
    renderBanner();

    expect(
      screen.getByRole("button", { name: /dismiss recovery banner/i }),
    ).toBeInTheDocument();
  });

  it("status icon is decorative (aria-hidden)", () => {
    saveRecoveryFrame(makeFrame());
    renderBanner();

    const icon = screen
      .getByTestId("resume-recovery-banner")
      .querySelector("svg[aria-hidden='true']");
    expect(icon).toBeInTheDocument();
  });

  it("has no axe-detectable accessibility violations", async () => {
    saveRecoveryFrame(makeFrame());

    const { container } = renderBanner();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// Multi-key / concurrent router gate
// ---------------------------------------------------------------------------

describe("Concurrent recovery router gate", () => {
  it("only shows the frame matching the active route when multiple are cached", () => {
    saveRecoveryFrame(
      makeFrame({ page: "/startup/report-revenue", payload: { a: 1 } }),
    );
    saveRecoveryFrame(
      makeFrame({ page: "/investor/payouts", payload: { b: 2 } }),
    );

    renderBanner(["/startup/report-revenue"]);
    expect(
      screen.getByText("Your form draft was saved"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Your payout setup was interrupted"),
    ).not.toBeInTheDocument();
  });

  it("shows the payout frame when navigated to payout route", () => {
    saveRecoveryFrame(
      makeFrame({ page: "/startup/report-revenue" }),
    );
    saveRecoveryFrame(
      makeFrame({ page: "/investor/payouts" }),
    );

    renderBanner(["/investor/payouts"]);
    expect(
      screen.getByText("Your payout setup was interrupted"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Your form draft was saved"),
    ).not.toBeInTheDocument();
  });

  it("shows no banner when active route has no cached frame", () => {
    saveRecoveryFrame(
      makeFrame({ page: "/startup/report-revenue" }),
    );
    saveRecoveryFrame(
      makeFrame({ page: "/investor/payouts" }),
    );

    const { container } = renderBanner(["/investor/ledger"]);
    expect(container.firstChild).toBeNull();
  });

  it("respects activePage override over route", () => {
    saveRecoveryFrame(
      makeFrame({ page: "/investor/payouts", payload: { x: 1 } }),
    );

    renderBanner(["/anything"], { activePage: "/investor/payouts" });
    expect(
      screen.getByText("Your payout setup was interrupted"),
    ).toBeInTheDocument();
  });
});
