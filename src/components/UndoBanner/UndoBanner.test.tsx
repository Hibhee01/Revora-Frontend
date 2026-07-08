import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { UndoBanner } from "./UndoBanner";

expect.extend(toHaveNoViolations);
import type { UndoBannerItem } from "../../hooks/useUndoBanners";

function makeBanner(overrides: Partial<UndoBannerItem> = {}): UndoBannerItem {
  return {
    id: "b1",
    message: 'Deleted "Q3 report"',
    actionLabel: "Undo",
    durationMs: 5000,
    remainingMs: 3000,
    ...overrides,
  };
}

/** Set the prefers-reduced-motion media query result for a test. */
function mockReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  mockReducedMotion(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UndoBanner", () => {
  it("renders a banner with its message, Undo CTA, and dismiss control", () => {
    render(<UndoBanner banners={[makeBanner()]} onUndo={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText('Deleted "Q3 report"')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("uses a polite live region placed above the footer", () => {
    render(<UndoBanner banners={[makeBanner()]} onUndo={vi.fn()} onDismiss={vi.fn()} />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveClass("fixed");
  });

  it("calls onUndo with the banner id when Undo is pressed", () => {
    const onUndo = vi.fn();
    render(<UndoBanner banners={[makeBanner({ id: "abc" })]} onUndo={onUndo} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledWith("abc");
  });

  it("calls onDismiss with the banner id when dismissed", () => {
    const onDismiss = vi.fn();
    render(<UndoBanner banners={[makeBanner({ id: "xyz" })]} onUndo={vi.fn()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledWith("xyz");
  });

  it("respects a custom action label", () => {
    render(
      <UndoBanner
        banners={[makeBanner({ actionLabel: "Restore" })]}
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /restore/i })).toBeInTheDocument();
  });

  it("stacks multiple banners with the newest on top", () => {
    const banners = [
      makeBanner({ id: "old", message: "Older action" }),
      makeBanner({ id: "new", message: "Newer action" }),
    ];
    render(<UndoBanner banners={banners} onUndo={vi.fn()} onDismiss={vi.fn()} />);

    const rendered = screen.getAllByTestId("undo-banner");
    expect(rendered).toHaveLength(2);
    // Newest first in the DOM.
    expect(rendered[0]).toHaveTextContent("Newer action");
    expect(rendered[1]).toHaveTextContent("Older action");
  });

  it("collapses banners beyond maxVisible into a summary", () => {
    const banners = Array.from({ length: 5 }, (_, i) =>
      makeBanner({ id: `b${i}`, message: `Action ${i}` }),
    );
    render(<UndoBanner banners={banners} onUndo={vi.fn()} onDismiss={vi.fn()} maxVisible={3} />);

    expect(screen.getAllByTestId("undo-banner")).toHaveLength(3);
    expect(screen.getByTestId("undo-overflow")).toHaveTextContent("+2 more pending");
  });

  it("renders an animated countdown ring by default (decorative)", () => {
    render(<UndoBanner banners={[makeBanner()]} onUndo={vi.fn()} onDismiss={vi.fn()} />);
    const ring = screen.getByTestId("undo-countdown");
    expect(ring.tagName.toLowerCase()).toBe("svg");
    expect(ring).toHaveAttribute("aria-hidden", "true");
  });

  it("replaces the ring with a static seconds count under reduced motion", () => {
    mockReducedMotion(true);
    render(
      <UndoBanner
        banners={[makeBanner({ remainingMs: 2400 })]}
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const countdown = screen.getByTestId("undo-countdown");
    expect(countdown.tagName.toLowerCase()).not.toBe("svg");
    expect(countdown).toHaveTextContent("3"); // ceil(2.4s)
  });

  it("has no axe-detectable accessibility violations", async () => {
    const { container } = render(
      <UndoBanner banners={[makeBanner()]} onUndo={vi.fn()} onDismiss={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
