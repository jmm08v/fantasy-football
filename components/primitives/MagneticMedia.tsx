"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * The hero centrepiece: scales up on load, then drifts toward the cursor.
 *
 * Two details do the heavy lifting:
 *
 * 1. `mix-blend-lighten` — the source is a plain MP4 on a black background.
 *    Lighten drops every pixel darker than the page behind it, so the subject
 *    appears cut out with no alpha channel, no WebGL, no 3D pipeline. A 500KB
 *    video replaces a multi-megabyte three.js scene. This is the single
 *    highest-leverage trick on the reference site.
 *
 * 2. A 1.5s `sine.out` follow with `overwrite: "auto"` — far too slow to track
 *    the pointer, which is the point. The object lags behind the cursor like it
 *    has mass. `overwrite` kills the in-flight tween on every move so the
 *    tweens never stack and fight.
 *
 * Drop in an MP4, WebM, or transparent PNG sequence of your own — a helmet, a
 * trophy, a floating football.
 */
export function MagneticMedia({
  src,
  poster,
  className,
  strength = 0.06,
  blend = true,
  blendMode = "mix-blend-screen",
}: {
  src: string;
  poster?: string;
  className?: string;
  /** Fraction of the cursor's offset from centre that the media travels. */
  strength?: number;
  blend?: boolean;
  /**
   * `screen` for dark subjects, `lighten` for bright ones.
   *
   * `lighten` keeps only pixels brighter than the page, so a glossy black
   * helmet loses its whole body and survives as a few specular streaks.
   * `screen` adds luminance instead: pure black still resolves to exactly the
   * page colour (no visible video rectangle) while the dark midtones lift just
   * enough to read as a shape.
   */
  blendMode?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  // A looping background video is motion the reader never asked for. Under
  // reduced motion it holds on the poster frame instead of playing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) el.pause();
    else void el.play().catch(() => {});
  }, [reduced]);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      gsap.set(el, { opacity: 1, scale: 1 });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: DUR.media, ease: EASE.reveal },
    );

    const onMove = (e: PointerEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * strength;
      const y = (e.clientY - window.innerHeight / 2) * strength;
      gsap.to(el, { x, y, duration: DUR.drift, ease: EASE.drift, overwrite: "auto" });
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: DUR.drift, ease: EASE.drift });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, { dependencies: [reduced, strength], scope: ref });

  return (
    <video
      ref={ref}
      muted
      playsInline
      autoPlay
      loop
      poster={poster}
      aria-hidden="true"
      className={cn(
        // No positioning transform here on purpose. GSAP writes the `transform`
        // property wholesale for the drift, which would silently wipe out any
        // Tailwind -translate-*-1/2 centering. Placement is the wrapper's job:
        // give it flex centering (see Hero) and this stays in normal flow.
        "pointer-events-none relative opacity-0",
        blend && blendMode,
        className,
      )}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
