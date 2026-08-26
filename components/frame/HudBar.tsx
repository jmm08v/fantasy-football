"use client";

import { MonoLabel } from "@/components/primitives/MonoLabel";
import { PillButton } from "@/components/primitives/PillButton";

export type Readout = { key: string; value: string };

/**
 * Telemetry strip pinned below the frame.
 *
 * Persistent live-ish numbers are what make the whole design read as motorsport
 * instead of just "dark website". For a league, swap engine temp and tyre wear
 * for the numbers your managers actually refresh for: waiver clock, top score,
 * open trades. Keep them terse and monospaced — the format matters more than
 * the data.
 */
export function HudBar({
  left,
  right,
  onMenuClick,
}: {
  left: Readout[];
  right: Readout[];
  onMenuClick?: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-x-4 px-6 pb-5 lg:px-10">
      <ReadoutGroup items={left} className="hidden sm:flex" />

      <div className="pointer-events-auto mx-auto">
        <PillButton
          onClick={onMenuClick}
          icon={
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
              <path d="M0 1h12M0 7h12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          }
        >
          Menu
        </PillButton>
      </div>

      <ReadoutGroup items={right} className="hidden lg:flex" align="right" />
    </div>
  );
}

function ReadoutGroup({
  items,
  className,
  align = "left",
}: {
  items: Readout[];
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex flex-1 gap-x-8 ${align === "right" ? "justify-end" : ""} ${className ?? ""}`}>
      {items.map((item, i) => (
        <div key={item.key} className="flex flex-col gap-y-1">
          <MonoLabel scramble className="opacity-40" delay={i * 90}>
            {item.key}
          </MonoLabel>
          <MonoLabel scramble delay={i * 90 + 160}>{item.value}</MonoLabel>
        </div>
      ))}
    </div>
  );
}
