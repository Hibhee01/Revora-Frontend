import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { PreOpenBanner } from "./PreOpenBanner";

expect.extend(toHaveNoViolations);

function futureDate(days = 3, hours = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function pastDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PreOpenBanner", () => {
  it("renders countdown segments with labels", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    expect(screen.getByTestId("preopen-banner")).toBeInTheDocument();
    expect(screen.getByTestId("countdown-days")).toBeInTheDocument();
    expect(screen.getByTestId("countdown-hours")).toBeInTheDocument();
    expect(screen.getByTestId("countdown-min")).toBeInTheDocument();
    expect(screen.getByText("days")).toBeInTheDocument();
    expect(screen.getByText("hours")).toBeInTheDocument();
    expect(screen.getByText("min")).toBeInTheDocument();
  });

  it("shows the title", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    expect(screen.getByText("Redemption window opens in")).toBeInTheDocument();
  });

  it("displays opt-in bell button", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const btn = screen.getByTestId("preopen-optin-btn");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Notify me");
  });

  it("calls onOptIn when opt-in button is clicked", () => {
    const onOptIn = vi.fn();
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={onOptIn} />
    );

    fireEvent.click(screen.getByTestId("preopen-optin-btn"));
    expect(onOptIn).toHaveBeenCalledTimes(1);
  });

  it("switches to opted-in badge after clicking notify button", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId("preopen-optin-btn"));
    expect(screen.getByTestId("preopen-optedin-badge")).toBeInTheDocument();
    expect(screen.getByTestId("preopen-optedin-badge")).toHaveTextContent("Reminder set");
    expect(screen.queryByTestId("preopen-optin-btn")).not.toBeInTheDocument();
  });

  it("shows toast after opt-in", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId("preopen-optin-btn"));
    expect(screen.getByTestId("preopen-toast")).toBeInTheDocument();
    expect(screen.getByTestId("preopen-toast")).toHaveTextContent(
      "We'll notify you when the redemption window opens"
    );
  });

  it("auto-dismisses toast after 4 seconds", () => {
    vi.useFakeTimers();
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId("preopen-optin-btn"));
    expect(screen.getByTestId("preopen-toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByTestId("preopen-toast")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} onDismiss={onDismiss} />
    );

    fireEvent.click(screen.getByTestId("preopen-dismiss-btn"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not render dismiss button when onDismiss is not provided", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    expect(screen.queryByTestId("preopen-dismiss-btn")).not.toBeInTheDocument();
  });

  it("returns null when target date is in the past", () => {
    const { container } = render(
      <PreOpenBanner targetDate={pastDate()} onOptIn={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("has the timer role with descriptive aria-label", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const timer = screen.getByRole("timer");
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveAttribute(
      "aria-label",
      expect.stringContaining("days, ")
    );
    expect(timer).toHaveAttribute(
      "aria-label",
      expect.stringContaining(" hours, ")
    );
    expect(timer).toHaveAttribute(
      "aria-label",
      expect.stringContaining(" minutes until redemption window opens")
    );
  });

  it("has region role with aria-label", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const region = screen.getByRole("region", {
      name: "Redemption window countdown",
    });
    expect(region).toBeInTheDocument();
  });

  it("shows timezone in full layout", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(screen.getByText(timezone)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} className="my-custom-class" />
    );

    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("uses default id when not provided", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const region = screen.getByRole("region", { name: "Redemption window countdown" });
    expect(region).toHaveAttribute("id", "preopen-banner");
  });

  it("uses custom id when provided", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} id="custom-id" />
    );

    const region = screen.getByRole("region", { name: "Redemption window countdown" });
    expect(region).toHaveAttribute("id", "custom-id");
  });

  it("has correct aria-hidden on decorative elements", () => {
    const { container } = render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const svgs = container.querySelectorAll("svg");
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    const separator = container.querySelector(".preopen-separator");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });

  it("opt-in button has descriptive aria-label", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const btn = screen.getByRole("button", {
      name: /notify me when redemption window opens/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it("dismiss button has descriptive aria-label", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} onDismiss={vi.fn()} />
    );

    const btn = screen.getByRole("button", {
      name: /dismiss countdown banner/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it("toast has polite live region", () => {
    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId("preopen-optin-btn"));

    const toast = screen.getByTestId("preopen-toast");
    expect(toast).toHaveAttribute("role", "status");
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  it("displays compact layout classes when viewport is mobile size", () => {
    mockMatchMedia(true);

    const { container } = render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    const segment = container.querySelector(".preopen-segment--compact");
    expect(segment).toBeInTheDocument();

    expect(screen.queryByText("Notify me")).not.toBeInTheDocument();
    expect(screen.getByTestId("preopen-optin-btn")).toBeInTheDocument();
  });

  it("does not show timezone in compact layout", () => {
    mockMatchMedia(true);

    render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} />
    );

    expect(screen.queryByText(/All times shown in/)).not.toBeInTheDocument();
  });

  it("countdown values are padded to two digits", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T08:00:00Z"));
    const oneHourFromNow = new Date("2026-07-29T09:00:00Z");

    render(
      <PreOpenBanner targetDate={oneHourFromNow} onOptIn={vi.fn()} />
    );

    expect(screen.getByTestId("countdown-hours").textContent).toBe("01");
    vi.useRealTimers();
  });

  it("handles sub-hour countdowns correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T08:00:00Z"));
    const thirtyMinFromNow = new Date("2026-07-29T08:30:00Z");

    render(
      <PreOpenBanner targetDate={thirtyMinFromNow} onOptIn={vi.fn()} />
    );

    expect(screen.getByTestId("countdown-days").textContent).toBe("00");
    expect(screen.getByTestId("countdown-hours").textContent).toBe("00");
    expect(screen.getByTestId("countdown-min").textContent).toBe("30");
    vi.useRealTimers();
  });

  it("has no axe-detectable accessibility violations", async () => {
    const { container } = render(
      <PreOpenBanner targetDate={futureDate()} onOptIn={vi.fn()} onDismiss={vi.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
