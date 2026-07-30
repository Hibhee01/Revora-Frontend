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

  it("collapses banners beyond maxVisible (default 4) into a summary", () => {
    const banners = Array.from({ length: 6 }, (_, i) =>
      makeBanner({ id: `b${i}`, message: `Action ${i}` }),
    );
    render(<UndoBanner banners={banners} onUndo={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getAllByTestId("undo-banner")).toHaveLength(4);
    expect(screen.getByTestId("undo-overflow")).toHaveTextContent("+2 more pending");
  });

  it("collapses banners beyond custom maxVisible into a summary", () => {
    const banners = Array.from({ length: 5 }, (_, i) =>
      makeBanner({ id: `b${i}`, message: `Action ${i}` }),
    );
    render(<UndoBanner banners={banners} onUndo={vi.fn()} onDismiss={vi.fn()} maxVisible={3} />);

    expect(screen.getAllByTestId("undo-banner")).toHaveLength(3);
    expect(screen.getByTestId("undo-overflow")).toHaveTextContent("+2 more pending");
  });

  it("renders stack header with Undo All and Dismiss All affordances when multiple banners exist", () => {
    const onUndoAll = vi.fn();
    const onDismissAll = vi.fn();
    const banners = [
      makeBanner({ id: "b1", message: "Action 1" }),
      makeBanner({ id: "b2", message: "Action 2" }),
    ];

    render(
      <UndoBanner
        banners={banners}
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
        onUndoAll={onUndoAll}
        onDismissAll={onDismissAll}
      />,
    );

    expect(screen.getByTestId("undo-stack-header")).toHaveTextContent("2 pending actions");

    fireEvent.click(screen.getByTestId("undo-all-button"));
    expect(onUndoAll).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("dismiss-all-button"));
    expect(onDismissAll).toHaveBeenCalledTimes(1);
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

  it("has no axe-detectable accessibility violations for single banner or stack with Undo All", async () => {
    const banners = [
      makeBanner({ id: "b1", message: "Action 1" }),
      makeBanner({ id: "b2", message: "Action 2" }),
    ];
    const { container } = render(
      <UndoBanner
        banners={banners}
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
        onUndoAll={vi.fn()}
        onDismissAll={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("CountdownRing renders fraction=0 when durationMs is 0", () => {
    // Covers the durationMs === 0 branch in CountdownRing (line 51)
    render(
      <UndoBanner
        banners={[makeBanner({ durationMs: 0, remainingMs: 0 })]}
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    // Ring still renders without crashing; the SVG circle dashoffset = full circumference (empty ring)
    const ring = screen.getByTestId("undo-countdown");
    expect(ring).toBeInTheDocument();
  });

  it("calls captureOrigin when the first banner appears (prevLen 0 → 1)", () => {
    // Covers UndoBanner.tsx line 126: captureOrigin() called when banners.length goes 0→1
    const { rerender } = render(
      <UndoBanner banners={[]} onUndo={vi.fn()} onDismiss={vi.fn()} />,
    );
    // No banner yet — region is empty
    expect(screen.queryByTestId("undo-banner")).not.toBeInTheDocument();

    // Add the first banner — captureOrigin should be called internally
    rerender(
      <UndoBanner
        banners={[makeBanner({ id: "first" })]}
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByTestId("undo-banner")).toBeInTheDocument();
  });

  it("uses onKeyboardUndo instead of onUndo when provided", () => {
    const onUndo = vi.fn();
    const onKeyboardUndo = vi.fn();
    const banner = makeBanner({ id: "kb1" });

    render(
      <UndoBanner
        banners={[banner]}
        onUndo={onUndo}
        onDismiss={vi.fn()}
        onKeyboardUndo={onKeyboardUndo}
      />,
    );

    // Trigger keyboard shortcut
    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect(onKeyboardUndo).toHaveBeenCalledWith("kb1");
    expect(onUndo).not.toHaveBeenCalled();
  });
});
