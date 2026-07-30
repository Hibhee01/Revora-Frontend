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

  it("reverses all pending actions when undoAll is called", () => {
    const onUndo1 = vi.fn();
    const onUndo2 = vi.fn();
    const onCommit1 = vi.fn();
    const onCommit2 = vi.fn();
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "A", onUndo: onUndo1, onCommit: onCommit1 });
      result.current.registerUndo({ message: "B", onUndo: onUndo2, onCommit: onCommit2 });
    });

    expect(result.current.banners).toHaveLength(2);

    act(() => {
      result.current.undoAll();
    });

    expect(result.current.banners).toHaveLength(0);
    expect(onUndo1).toHaveBeenCalledTimes(1);
    expect(onUndo2).toHaveBeenCalledTimes(1);
    expect(onCommit1).not.toHaveBeenCalled();
    expect(onCommit2).not.toHaveBeenCalled();
  });

  it("commits all pending actions immediately when dismissAll is called", () => {
    const onUndo1 = vi.fn();
    const onUndo2 = vi.fn();
    const onCommit1 = vi.fn();
    const onCommit2 = vi.fn();
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "A", onUndo: onUndo1, onCommit: onCommit1 });
      result.current.registerUndo({ message: "B", onUndo: onUndo2, onCommit: onCommit2 });
    });

    expect(result.current.banners).toHaveLength(2);

    act(() => {
      result.current.dismissAll();
    });

    expect(result.current.banners).toHaveLength(0);
    expect(onCommit1).toHaveBeenCalledTimes(1);
    expect(onCommit2).toHaveBeenCalledTimes(1);
    expect(onUndo1).not.toHaveBeenCalled();
    expect(onUndo2).not.toHaveBeenCalled();
  });

  it("scales auto-dismiss duration dynamically based on current stack size", () => {
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "First action", onUndo: vi.fn() });
    });
    expect(result.current.banners[0].durationMs).toBe(5000); // base

    act(() => {
      result.current.registerUndo({ message: "Second action burst", onUndo: vi.fn() });
    });
    expect(result.current.banners[1].durationMs).toBe(6000); // 5000 + 1000

    act(() => {
      result.current.registerUndo({ message: "Third action burst", onUndo: vi.fn() });
    });
    expect(result.current.banners[2].durationMs).toBe(7000); // 5000 + 2000
  });

  it("undo is a no-op when the id is not found", () => {
    // Covers the early-return guard in undo() (line 151)
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "Action", onUndo: vi.fn() });
    });

    expect(result.current.banners).toHaveLength(1);

    // Calling undo with an unknown id should not throw and not change state
    act(() => {
      result.current.undo("non-existent-id");
    });

    expect(result.current.banners).toHaveLength(1);
  });

  it("dismiss is a no-op when the id is not found", () => {
    // Covers the early-return guard in dismiss() (line 162)
    const { result } = renderHook(() => useUndoBanners());

    act(() => {
      result.current.registerUndo({ message: "Action", onUndo: vi.fn() });
    });

    expect(result.current.banners).toHaveLength(1);

    // Calling dismiss with an unknown id should not throw and not change state
    act(() => {
      result.current.dismiss("non-existent-id");
    });

    expect(result.current.banners).toHaveLength(1);
  });
});
