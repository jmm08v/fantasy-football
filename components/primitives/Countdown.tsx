"use client";

import { useSyncExternalStore } from "react";
import { MonoLabel } from "./MonoLabel";
import { getClock, getServerClock, subscribeToClock } from "@/lib/clock";

/**
 * Time remaining until an instant, ticking once a second.
 *
 * `target` must carry its own UTC offset — "2026-09-07T17:00:00-04:00", not
 * "2026-09-07T17:00". A bare local time is parsed in the *viewer's* zone, so a
 * manager on the west coast would see a countdown three hours wrong and have
 * no way to tell.
 */
export function Countdown({
  target,
  prefix = "STARTS IN",
  passed = "UNDERWAY",
  className,
}: {
  /** ISO 8601 including an offset. */
  target: string;
  prefix?: string;
  /** Shown once the target is behind us. */
  passed?: string;
  className?: string;
}) {
  const now = useSyncExternalStore(subscribeToClock, getClock, getServerClock);

  // Zero is the server sentinel — see lib/clock. Dashes hold the space at the
  // right width so nothing shifts when the real figure arrives a frame later.
  if (now === 0) {
    return <MonoLabel className={className}>{`${prefix} --:--:--`}</MonoLabel>;
  }

  const remaining = new Date(target).getTime() - now;
  if (!Number.isFinite(remaining)) return null;
  if (remaining <= 0) return <MonoLabel className={className}>{passed}</MonoLabel>;

  return <MonoLabel className={className}>{`${prefix} ${format(remaining)}`}</MonoLabel>;
}

function format(ms: number): string {
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}D ${clock}` : clock;
}
