import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUndoBanners, DEFAULT_UNDO_DURATION_MS } from "./useUndoBanners";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useUndoBanners", () => {
  it("registers a banner with the default duration", () => {
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "Deleted draft", onUndo: vi.fn() });
    });

    expect(result.current.banners).toHaveLength(1);
    expect(result.current.banners[0].message).toBe("Deleted draft");
    expect(result.current.banners[0].durationMs).toBe(DEFAULT_UNDO_DURATION_MS);
    expect(result.current.banners[0].remainingMs).toBeGreaterThan(0);
  });

  it("counts down and commits the action when the timer elapses", () => {
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "Archive offering", onUndo, onCommit, durationMs: 1000 });
    });

    expect(result.current.banners).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.banners).toHaveLength(0);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it("reverses the action and removes the banner on undo", () => {
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    const { result } = renderHook(() => useUndoBanners());

    let id = "";
    act(() => {
      id = result.current.registerUndo({ message: "Remove from blacklist", onUndo, onCommit });
    });

    act(() => {
      result.current.undo(id);
    });

    expect(result.current.banners).toHaveLength(0);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();

    // Timer must not fire a late commit for an undone action.
    act(() => {
      vi.advanceTimersByTime(DEFAULT_UNDO_DURATION_MS + 500);
    });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits immediately when dismissed", () => {
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    const { result } = renderHook(() => useUndoBanners());

    let id = "";
    act(() => {
      id = result.current.registerUndo({ message: "Delete draft", onUndo, onCommit });
    });

    act(() => {
      result.current.dismiss(id);
    });

    expect(result.current.banners).toHaveLength(0);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it("supports several stacked banners independently", () => {
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "A", onUndo: vi.fn(), durationMs: 1000 });
      result.current.registerUndo({ message: "B", onUndo: vi.fn(), durationMs: 3000 });
    });

    expect(result.current.banners).toHaveLength(2);

    // First banner expires; second remains.
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.banners).toHaveLength(1);
    expect(result.current.banners[0].message).toBe("B");
  });
});
