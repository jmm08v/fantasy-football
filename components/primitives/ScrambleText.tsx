"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { VIEWPORT } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Telemetry decode.
 *
 * Text resolves left to right; everything not yet resolved renders as a run of
 * chevrons. That's the trick the reference site uses for its HUD readouts —
 * no random character soup, just a hard resolved/unresolved boundary, which
 * stays legible at 10px where true scrambling turns to mush.
 *
 * `min-w-[1ch]` plus `whitespace-pre-wrap` reserves the final width up front so
 * neighbouring layout never reflows mid-decode.
 */
export function ScrambleText({
  text,
  className,
  speed = 28,
  delay = 0,
  filler = ">",
}: {
  text: string;
  className?: string;
  /** ms per character */
  speed?: number;
  delay?: number;
  filler?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const reduced = useReducedMotion();
  const [resolved, setResolved] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;

    let frame = 0;
    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start - delay;
      if (elapsed > 0) {
        frame = Math.min(text.length, Math.floor(elapsed / speed));
        setResolved(frame);
      }
      if (frame < text.length) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, text, speed, delay]);

  // Reduced motion resolves during render — no effect, no transient chevrons.
  const count = reduced ? text.length : resolved;

  // Spaces stay spaces while unresolved, so word shapes and line breaks hold
  // steady through the decode instead of collapsing into one chevron slab.
  const shown = text.slice(0, count);
  const pending = text.slice(count).replace(/\S/g, filler);

  return (
    <span
      ref={ref}
      className={cn("inline-block min-w-[1ch] whitespace-pre-wrap", className)}
      // Screen readers get the finished string, never the chevron mid-state.
      aria-label={text}
    >
      <span aria-hidden="true">
        {shown}
        {pending}
      </span>
    </span>
  );
}
