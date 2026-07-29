import React, { useState, useEffect, useCallback } from "react";
import { Bell, BellRing, X, Clock } from "lucide-react";
import { useCountdown } from "../hooks/useCountdown";

export interface PreOpenBannerProps {
  targetDate: Date;
  onOptIn: () => void;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export const PreOpenBanner: React.FC<PreOpenBannerProps> = ({
  targetDate,
  onOptIn,
  onDismiss,
  className = "",
  id = "preopen-banner",
}) => {
  const countdown = useCountdown(targetDate);
  const [optedIn, setOptedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    setIsCompact(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const handleOptIn = useCallback(() => {
    setOptedIn(true);
    setShowToast(true);
    onOptIn();
  }, [onOptIn]);

  useEffect(() => {
    if (showToast) {
      const id = window.setTimeout(() => setShowToast(false), 4000);
      return () => window.clearTimeout(id);
    }
  }, [showToast]);

  if (countdown.isExpired) return null;

  const segments = [
    { value: countdown.days, label: "days" },
    { value: countdown.hours, label: "hours" },
    { value: countdown.minutes, label: "min" },
  ];

  return (
    <section
      id={id}
      className={`preopen-banner glass-card animate-fade-in ${className}`}
      role="region"
      aria-label="Redemption window countdown"
      data-testid="preopen-banner"
    >
      <div className="preopen-banner-inner">
        <div className="preopen-banner-content">
          <div className="preopen-banner-header">
            <Clock size={18} aria-hidden="true" className="preopen-clock-icon" />
            <h2 className="preopen-title" id="preopen-banner-title">
              Redemption window opens in
            </h2>
          </div>

          <div
            className="preopen-countdown"
            role="timer"
            aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes until redemption window opens`}
          >
            {segments.map((seg, i) => (
              <React.Fragment key={seg.label}>
                <div className={`preopen-segment ${isCompact ? "preopen-segment--compact" : ""}`}>
                  <span
                    className="preopen-segment-value"
                    aria-hidden="true"
                    data-testid={`countdown-${seg.label}`}
                  >
                    {String(seg.value).padStart(2, "0")}
                  </span>
                  <span className="preopen-segment-label">{seg.label}</span>
                </div>
                {i < segments.length - 1 && (
                  <span className="preopen-separator" aria-hidden="true">:</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {!isCompact && (
            <p className="preopen-timezone">
              All times shown in <strong>{countdown.timezone}</strong>
            </p>
          )}
        </div>

        <div className="preopen-banner-actions">
          {!optedIn ? (
            <button
              type="button"
              onClick={handleOptIn}
              className="preopen-optin-btn focus-ring"
              aria-label="Notify me when redemption window opens"
              data-testid="preopen-optin-btn"
            >
              <Bell size={16} aria-hidden="true" />
              {!isCompact && <span>Notify me</span>}
            </button>
          ) : (
            <span
              className="preopen-optedin-badge"
              data-testid="preopen-optedin-badge"
            >
              <BellRing size={16} aria-hidden="true" />
              {!isCompact && <span>Reminder set</span>}
            </span>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="preopen-dismiss-btn focus-ring"
              aria-label="Dismiss countdown banner"
              data-testid="preopen-dismiss-btn"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {showToast && (
        <div
          className="preopen-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="preopen-toast"
        >
          <BellRing size={14} aria-hidden="true" />
          <span>We'll notify you when the redemption window opens</span>
        </div>
      )}
    </section>
  );
};
