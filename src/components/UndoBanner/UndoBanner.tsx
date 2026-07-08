import React from "react";
import { Undo2, X } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { UndoBannerItem } from "../../hooks/useUndoBanners";

export interface UndoBannerProps {
  /** Active undo banners, newest last. Render order is newest on top. */
  banners: UndoBannerItem[];
  /** Reverse the action for a banner. */
  onUndo: (id: string) => void;
  /** Commit the action for a banner immediately and dismiss it. */
  onDismiss: (id: string) => void;
  /**
   * Maximum number of banners shown at once. Older banners beyond this are
   * collapsed into a "+N more" summary rather than overflowing the viewport.
   * Defaults to 3.
   */
  maxVisible?: number;
  /** Optional id for the live-region container. */
  id?: string;
  className?: string;
}

const RING_RADIUS = 11;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * CountdownRing — a small circular progress indicator that depletes as the
 * action approaches permanence. With reduced motion it renders the whole-second
 * count instead of a sweeping ring.
 */
function CountdownRing({
  remainingMs,
  durationMs,
  reducedMotion,
}: {
  remainingMs: number;
  durationMs: number;
  reducedMotion: boolean;
}) {
  const fraction = durationMs > 0 ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0;
  const seconds = Math.ceil(remainingMs / 1000);

  if (reducedMotion) {
    return (
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/30 text-xs font-semibold tabular-nums"
        aria-hidden="true"
        data-testid="undo-countdown"
      >
        {seconds}
      </span>
    );
  }

  return (
    <svg
      className="h-7 w-7 flex-shrink-0 -rotate-90"
      viewBox="0 0 28 28"
      aria-hidden="true"
      data-testid="undo-countdown"
    >
      <circle cx="14" cy="14" r={RING_RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={2} />
      <circle
        cx="14"
        cy="14"
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
        style={{ transition: "stroke-dashoffset 100ms linear" }}
      />
    </svg>
  );
}

/**
 * UndoBanner — the Undo banner pattern for reversible destructive actions.
 *
 * Renders a stack of banners pinned above the page footer. Each banner shows a
 * description of what happened, a countdown ring to permanence, a primary
 * "Undo" CTA, and a dismiss control that commits the action immediately.
 *
 * Accessibility (WCAG 2.1 AA):
 * - The container is a polite live region (`role="status"`, `aria-live="polite"`)
 *   so new banners are announced without interrupting the user.
 * - The countdown is decorative (`aria-hidden`); screen-reader users are not
 *   pressured by a ticking timer and can act via the labelled Undo button.
 * - Respects `prefers-reduced-motion` by replacing the animated ring with a
 *   static seconds count.
 */
export const UndoBanner: React.FC<UndoBannerProps> = ({
  banners,
  onUndo,
  onDismiss,
  maxVisible = 3,
  id = "undo-banner-region",
  className = "",
}) => {
  const reducedMotion = useReducedMotion();

  // Newest banners are most relevant — show them on top.
  const ordered = [...banners].reverse();
  const visible = ordered.slice(0, maxVisible);
  const hiddenCount = ordered.length - visible.length;

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Undo notifications"
      className={`pointer-events-none fixed inset-x-0 bottom-16 z-50 flex flex-col items-center gap-2 px-4 ${className}`}
    >
      {visible.map((banner) => (
        <div
          key={banner.id}
          data-testid="undo-banner"
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border border-white/10 bg-[#1f2937] px-4 py-3 text-sm text-white shadow-lg"
        >
          <CountdownRing
            remainingMs={banner.remainingMs}
            durationMs={banner.durationMs}
            reducedMotion={reducedMotion}
          />
          <p className="flex-1 min-w-0 truncate">{banner.message}</p>
          <button
            type="button"
            onClick={() => onUndo(banner.id)}
            className="flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 font-semibold text-[#60a5fa] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
          >
            <Undo2 size={16} aria-hidden="true" />
            {banner.actionLabel}
          </button>
          <button
            type="button"
            onClick={() => onDismiss(banner.id)}
            aria-label={`Dismiss: ${banner.message}`}
            className="flex-shrink-0 rounded p-1 text-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ))}

      {hiddenCount > 0 && (
        <div
          data-testid="undo-overflow"
          className="pointer-events-auto rounded-md bg-[#111827] px-3 py-1 text-xs text-white/70"
        >
          +{hiddenCount} more pending
        </div>
      )}
    </div>
  );
};
