import { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  timezone: string;
}

function computeCountdown(targetDate: Date): Countdown {
  const now = Date.now();
  const diff = Math.max(0, targetDate.getTime() - now);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: totalSeconds <= 0,
    totalSeconds,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function useCountdown(targetDate: Date): Countdown {
  const reducedMotion = useReducedMotion();
  const intervalMs = reducedMotion ? 60_000 : 1_000;

  const [countdown, setCountdown] = useState<Countdown>(() =>
    computeCountdown(targetDate)
  );

  const targetRef = useRef(targetDate);
  targetRef.current = targetDate;

  useEffect(() => {
    setCountdown(computeCountdown(targetRef.current));

    const id = window.setInterval(() => {
      setCountdown(computeCountdown(targetRef.current));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, targetDate]);

  return countdown;
}
