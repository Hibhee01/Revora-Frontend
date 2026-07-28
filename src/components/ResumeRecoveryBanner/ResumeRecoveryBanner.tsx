import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, AlertTriangle, X } from "lucide-react";
import { useLocation } from "react-router-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecoveryVariant = "form" | "upload" | "payout";

export interface RecoveryFrame {
  page: string;
  timestamp: number;
  payload: unknown;
}

export interface ResumeRecoveryBannerProps {
  /** Number of days before a cached recovery frame expires. Default: 7. */
  expirationDays?: number;
  /** Optional override for the active page key. Falls back to pathname. */
  activePage?: string;
  /** Callback fired when the user clicks "Resume Session". */
  onResume: (page: string, payload: unknown) => void;
  /** Optional external className. */
  className?: string;
  /** Optional id for the live-region container. */
  id?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

const STORAGE_PREFIX = "recovery_state_";
const DISMISS_PREFIX = "recovery_dismissed_";

// ---------------------------------------------------------------------------
// Variant copy
// ---------------------------------------------------------------------------

const VARIANT_COPY: Record<
  RecoveryVariant,
  { heading: string; description: string }
> = {
  form: {
    heading: "Your form draft was saved",
    description:
      "We detected an incomplete form submission. Resume where you left off to avoid re-entering data.",
  },
  upload: {
    heading: "Your upload was interrupted",
    description:
      "A file upload did not complete. You can resume the upload without starting over.",
  },
  payout: {
    heading: "Your payout setup was interrupted",
    description:
      "We saved your payout configuration. Resume to complete the setup.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(page: string): string {
  return `${STORAGE_PREFIX}${page}`;
}

function dismissKey(page: string): string {
  return `${DISMISS_PREFIX}${page}`;
}

/**
 * Read a recovery frame from localStorage. Returns `null` if missing,
 * expired, or flagged as permanently dismissed.
 */
export function readRecoveryFrame(
  page: string,
  expirationDays: number,
): RecoveryFrame | null {
  if (typeof window === "undefined") return null;

  // Permanently dismissed – never show again.
  try {
    if (localStorage.getItem(dismissKey(page)) === "true") return null;
  } catch {
    return null;
  }

  try {
    const raw = localStorage.getItem(storageKey(page));
    if (!raw) return null;

    const frame: RecoveryFrame = JSON.parse(raw);
    if (
      !frame ||
      typeof frame.timestamp !== "number" ||
      typeof frame.page !== "string"
    ) {
      return null;
    }

    // Expiration barrier.
    if (Date.now() - frame.timestamp > expirationDays * MS_PER_DAY) {
      localStorage.removeItem(storageKey(page));
      return null;
    }

    return frame;
  } catch {
    localStorage.removeItem(storageKey(page));
    return null;
  }
}

/**
 * Persist a recovery frame into localStorage.
 */
export function saveRecoveryFrame(frame: RecoveryFrame): void {
  try {
    localStorage.setItem(storageKey(frame.page), JSON.stringify(frame));
  } catch {
    // Storage full or unavailable – degrade silently.
  }
}

/**
 * Permanently dismiss recovery for a given page.
 */
export function dismissRecoveryForever(page: string): void {
  try {
    localStorage.setItem(dismissKey(page), "true");
    localStorage.removeItem(storageKey(page));
  } catch {
    // Ignore.
  }
}

/**
 * Derive a RecoveryVariant from a pathname string.
 */
export function variantFromPage(page: string): RecoveryVariant {
  if (page.includes("upload")) return "upload";
  if (page.includes("payout")) return "payout";
  return "form";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ResumeRecoveryBanner
 *
 * An inline error-recovery pattern that lets users pick up where they left off
 * after an interrupted session. Cached state is seeded in `localStorage` with
 * a timestamp-based expiration barrier and a "dismiss forever" escape hatch.
 *
 * Only the recovery frame matching the current route parameter context is
 * displayed — multi-key structures are handled cleanly via filtering.
 *
 * Accessibility (WCAG 2.1 AA):
 * - Container uses `role="alert"` with `aria-live="polite"`.
 * - Every interactive element carries an explicit `aria-label`.
 * - Color contrast meets 4.5:1 minimum against the dark surface.
 * - The component is keyboard-navigable with visible focus rings.
 */
export const ResumeRecoveryBanner: React.FC<ResumeRecoveryBannerProps> = ({
  expirationDays = 7,
  activePage,
  onResume,
  className = "",
  id = "resume-recovery-banner",
}) => {
  const location = useLocation();
  const currentPage = activePage ?? location.pathname;

  const [frame, setFrame] = useState<RecoveryFrame | null>(null);

  // -----------------------------------------------------------------------
  // 1. LocalStorage seeding & expiration check
  // -----------------------------------------------------------------------
  useEffect(() => {
    const matched = readRecoveryFrame(currentPage, expirationDays);
    setFrame(matched);
  }, [currentPage, expirationDays]);

  // -----------------------------------------------------------------------
  // 2. Concurrent recovery router gate — only show the frame matching the
  //    active route. If multiple keys were cached we'd filter here.
  // -----------------------------------------------------------------------
  const visibleFrame = useMemo(() => {
    if (!frame) return null;
    // Strict match: only display when the cached page equals the active route.
    if (frame.page !== currentPage) return null;
    return frame;
  }, [frame, currentPage]);

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------
  const variant: RecoveryVariant = useMemo(
    () => variantFromPage(currentPage),
    [currentPage],
  );

  const copy = VARIANT_COPY[variant];

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleResume = useCallback(() => {
    if (!visibleFrame) return;
    onResume(visibleFrame.page, visibleFrame.payload);
  }, [visibleFrame, onResume]);

  const handleDismiss = useCallback(() => {
    dismissRecoveryForever(currentPage);
    setFrame(null);
  }, [currentPage]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (!visibleFrame) return null;

  const age = Date.now() - visibleFrame.timestamp;
  const remainingDays = Math.max(
    0,
    Math.ceil((expirationDays * MS_PER_DAY - age) / MS_PER_DAY),
  );

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Recovery available: ${copy.heading}`}
      data-testid="resume-recovery-banner"
      className={`flex flex-col md:flex-row items-start md:items-center gap-3 rounded-lg border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[#fbbf24] shadow-lg ${className}`}
    >
      {/* Status icon */}
      <AlertTriangle
        size={20}
        className="flex-shrink-0 text-[#fbbf24]"
        aria-hidden="true"
      />

      {/* Context copy */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#fbbf24]">{copy.heading}</p>
        <p className="mt-0.5 text-xs text-[#fbbf24]/80">
          {copy.description}
          {remainingDays > 0 && (
            <span className="ml-1 opacity-70">
              (available for {remainingDays} day{remainingDays !== 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={handleResume}
        aria-label="Resume Session"
        data-testid="resume-recovery-resume"
        className="flex flex-shrink-0 items-center gap-1.5 rounded-md bg-[#f59e0b] px-3 py-1.5 text-xs font-semibold text-[#1f2937] hover:bg-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2 focus:ring-offset-[#111827] transition-colors"
      >
        <RotateCcw size={14} aria-hidden="true" />
        Resume Session
      </button>

      {/* Secondary dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss recovery banner permanently"
        data-testid="resume-recovery-dismiss"
        className="flex-shrink-0 rounded p-1 text-[#fbbf24]/60 hover:bg-white/10 hover:text-[#fbbf24] focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 transition-colors"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
