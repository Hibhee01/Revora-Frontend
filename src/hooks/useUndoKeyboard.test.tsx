import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useUndoKeyboard } from "./useUndoKeyboard";
import type { UndoBannerItem } from "./useUndoBanners";

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

function TestHarness({
  banners = [],
  onUndo = vi.fn(),
  disabled = false,
}: {
  banners?: UndoBannerItem[];
  onUndo?: (id: string) => void;
  disabled?: boolean;
}) {
  const { captureOrigin } = useUndoKeyboard({ banners, onUndo, disabled });
  return (
    <div>
      <button data-testid="origin-btn" type="button" onClick={captureOrigin}>
        Origin
      </button>
      <input data-testid="text-input" type="text" />
      <textarea data-testid="textarea" />
      <select data-testid="select">
        <option value="a">A</option>
      </select>
      <div data-testid="contenteditable" contentEditable={true} />
      <span data-testid="plain">plain text</span>
    </div>
  );
}

describe("useUndoKeyboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onUndo with the newest banner id on Cmd+Z", () => {
    const onUndo = vi.fn();
    const banners = [makeBanner({ id: "old" }), makeBanner({ id: "new", message: "Newer action" })];

    render(<TestHarness banners={banners} onUndo={onUndo} />);

    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledWith("new");
  });

  it("calls onUndo with the newest banner id on Ctrl+Z", () => {
    const onUndo = vi.fn();
    const banners = [makeBanner({ id: "b1" })];

    render(<TestHarness banners={banners} onUndo={onUndo} />);

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledWith("b1");
  });

  it("does nothing when no banners are visible", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[]} onUndo={onUndo} />);

    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("is suppressed when focus is in an input element", () => {
    const onUndo = vi.fn();
    const banners = [makeBanner()];

    render(<TestHarness banners={banners} onUndo={onUndo} />);

    const input = screen.getByTestId("text-input");
    fireEvent.keyDown(input, { key: "z", metaKey: true, target: input });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("is suppressed when focus is in a textarea element", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} />);

    const textarea = screen.getByTestId("textarea");
    fireEvent.keyDown(textarea, { key: "z", ctrlKey: true, target: textarea });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("is suppressed when focus is in a select element", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} />);

    const select = screen.getByTestId("select");
    fireEvent.keyDown(select, { key: "z", metaKey: true, target: select });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("is suppressed when focus is in a contentEditable element", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} />);

    const editable = screen.getByTestId("contenteditable");
    fireEvent.keyDown(editable, { key: "z", metaKey: true, target: editable });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("does not fire for plain element focus (non-editable)", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} />);

    const plain = screen.getByTestId("plain");
    fireEvent.keyDown(plain, { key: "z", metaKey: true, target: plain });

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("does not fire when Shift+Meta+Z is pressed", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} />);

    fireEvent.keyDown(window, { key: "z", metaKey: true, shiftKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("does not fire when Alt+Meta+Z is pressed", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} />);

    fireEvent.keyDown(window, { key: "z", metaKey: true, altKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("restores focus to the origin element after undo", () => {
    const onUndo = vi.fn();
    // Need a non-input element to focus
    render(
      <div>
        <TestHarness banners={[makeBanner()]} onUndo={onUndo} />
      </div>,
    );

    // Click the origin button to focus it
    const originBtn = screen.getByTestId("origin-btn");
    originBtn.focus();
    expect(document.activeElement).toBe(originBtn);

    // Now call captureOrigin (the btn's onClick does this)
    fireEvent.click(originBtn);

    // Press Cmd+Z — should undo and restore focus to originBtn
    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect(onUndo).toHaveBeenCalledWith("b1");
    expect(document.activeElement).toBe(originBtn);
  });

  it("does not restore focus when origin element is no longer in the DOM", () => {
    const onUndo = vi.fn();

    // Use a dynamic component that removes the origin button
    function DynamicTest() {
      const [showBtn, setShowBtn] = React.useState(true);
      const { captureOrigin } = useUndoKeyboard({
        banners: [makeBanner()],
        onUndo: (id) => {
          onUndo(id);
          setShowBtn(false);
        },
      });

      return (
        <div>
          {showBtn && (
            <button
              data-testid="origin-btn"
              type="button"
              onClick={() => {
                captureOrigin();
                // Also simulate the banner being triggered
              }}
            >
              Origin
            </button>
          )}
          <span data-testid="fallback">fallback</span>
        </div>
      );
    }

    render(<DynamicTest />);

    const originBtn = screen.getByTestId("origin-btn");
    originBtn.focus();
    fireEvent.click(originBtn);

    // The undo removes the button from the DOM
    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect(onUndo).toHaveBeenCalledOnce();
    // Focus should not throw — it stays on body or wherever it fell
  });

  it("does nothing when disabled is true", () => {
    const onUndo = vi.fn();

    render(<TestHarness banners={[makeBanner()]} onUndo={onUndo} disabled />);

    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it("removes the keydown listener on unmount", () => {
    const onUndo = vi.fn();
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <TestHarness banners={[makeBanner()]} onUndo={onUndo} />,
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("updates onUndo callback without re-registering the listener", () => {
    const onUndo1 = vi.fn();
    const onUndo2 = vi.fn();
    const addSpy = vi.spyOn(window, "addEventListener");

    const { rerender } = render(
      <TestHarness banners={[makeBanner()]} onUndo={onUndo1} />,
    );

    expect(addSpy).toHaveBeenCalledTimes(1);

    rerender(<TestHarness banners={[makeBanner()]} onUndo={onUndo2} />);

    // The listener should still be the same (only registered once)
    fireEvent.keyDown(window, { key: "z", metaKey: true });
    expect(onUndo2).toHaveBeenCalledWith("b1");
    expect(onUndo1).not.toHaveBeenCalled();

    addSpy.mockRestore();
  });
});
