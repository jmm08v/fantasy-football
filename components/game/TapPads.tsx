"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import type { Side } from "@/lib/dash";
import { cn } from "@/lib/cn";

/**
 * The two thumb pads.
 *
 * Everything here exists to make a touchscreen behave like a keyboard, because
 * a 40 is decided by tens of milliseconds and mobile browsers spend those by
 * default:
 *
 *   - `touch-action: none` kills double-tap-to-zoom and scroll interception.
 *     Without it iOS sits on every tap waiting to see if a second one is
 *     coming, and the whole game feels underwater.
 *   - Presses are tracked per `pointerId`, so lifting one thumb while the
 *     other is still down doesn't drop a stride. Tracking a single boolean
 *     loses roughly every other tap once a player gets fast.
 *   - `pointerdown` — never `click`. A click fires on release, which would put
 *     the impulse at the end of the stride instead of the start.
 *   - `preventDefault` on the press stops the synthetic mouse event, the text
 *     selection, and the long-press callout.
 *
 * Keyboard is wired to the same handler so desktop plays identically.
 */

/** Two keys per pad — arrows, or adjacent letters for index/middle finger. */
const KEYS: Record<string, Side> = {
  ArrowLeft: "L",
  a: "L",
  A: "L",
  ArrowRight: "R",
  l: "R",
  L: "R",
};

export function TapPads({
  onTap,
  disabled = false,
  flash = null,
}: {
  onTap: (side: Side) => void;
  disabled?: boolean;
  /** Set by the parent on a same-pad stumble, to flash that pad red. */
  flash?: Side | null;
}) {
  const [down, setDown] = useState<{ L: boolean; R: boolean }>({ L: false, R: false });
  // pointerId → which pad it landed on, so releases retire the right pad.
  const pointers = useRef<Map<number, Side>>(null);
  pointers.current ??= new Map();

  const press = useCallback(
    (side: Side) => {
      if (disabled) return;
      onTap(side);
    },
    [disabled, onTap],
  );

  // Keyboard lives on window rather than on a focused element: there is no
  // sensible thing to focus mid-sprint, and a missed focus would silently
  // break the controls.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const side = KEYS[e.key];
      if (!side) return;
      e.preventDefault();
      // Held keys autorepeat at ~30/s, which would out-tap any human.
      if (e.repeat) return;
      setDown((d) => ({ ...d, [side]: true }));
      press(side);
    }
    function onKeyUp(e: KeyboardEvent) {
      const side = KEYS[e.key];
      if (!side) return;
      setDown((d) => ({ ...d, [side]: false }));
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [press]);

  // One handler for both pads, reading which pad from the element. A handler
  // built per-pad by a factory would be constructed during render, which is
  // exactly where a ref must not be touched.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const side = e.currentTarget.dataset.side as Side;
      pointers.current?.set(e.pointerId, side);
      setDown((d) => ({ ...d, [side]: true }));
      press(side);
    },
    [press],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const map = pointers.current;
    if (!map) return;
    const side = map.get(e.pointerId);
    if (!side) return;
    map.delete(e.pointerId);
    // Only clear the pad if no other finger is still holding it.
    if (![...map.values()].includes(side)) {
      setDown((d) => ({ ...d, [side]: false }));
    }
  }, []);

  const handlers = {
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
  };

  return (
    // Placement is the parent's job — on this site the bottom edge already
    // belongs to the HUD bar, so the pads sit inside the frame rather than
    // pinned to the viewport.
    <div className="flex items-end justify-between gap-3">
      <Pad
        side="L"
        hint="Index"
        down={down.L}
        flash={flash === "L"}
        disabled={disabled}
        {...handlers}
      />
      <Pad
        side="R"
        hint="Middle"
        down={down.R}
        flash={flash === "R"}
        disabled={disabled}
        {...handlers}
      />
    </div>
  );
}

function Pad({
  side,
  hint,
  down,
  flash,
  disabled,
  ...handlers
}: {
  side: Side;
  hint: string;
  down: boolean;
  flash: boolean;
  disabled: boolean;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-side={side}
      aria-label={`${side === "L" ? "Left" : "Right"} stride`}
      disabled={disabled}
      {...handlers}
      className={cn(
        // Sized in viewport units so the pads claim the space a phone has
        // spare below the track — a bigger target is the single thing that
        // most improves tapping accuracy at speed.
        "relative flex max-h-[190px] min-h-[112px] h-[21vh] flex-1 flex-col items-center justify-center gap-y-2 select-none",
        "rounded-[32px] border",
        // The pressed fill has no transition on purpose: it has to land on the
        // same frame as the stride, or the controls feel laggy even when the
        // physics is perfectly on time.
        flash
          ? "bg-flag border-flag text-turf"
          : down
            ? "bg-volt border-volt text-turf scale-[0.98]"
            : "border-chalk/30 text-chalk bg-chalk/5",
        disabled && "opacity-30",
      )}
      style={{
        touchAction: "none",
        WebkitTapHighlightColor: "transparent",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <span className="type-stat leading-none">{side}</span>
      <MonoLabel className={cn(flash || down ? "opacity-70" : "opacity-40")}>
        {flash ? "SAME PAD" : hint}
      </MonoLabel>
    </button>
  );
}
