"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { DUR, EASE, STAGGER, VIEWPORT, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Per-character cascade — the hero headline effect.
 *
 * Each glyph drops in from a full line-height above while un-rotating on X.
 * With no `perspective` on the ancestor chain the rotation reads as a vertical
 * squash rather than a 3D flip, which is exactly how the reference site does
 * it: mechanical, like a split-flap board, not showy.
 *
 * A 0.02s step across a long headline means the tail is still arriving well
 * after the head has landed — that overlap is the whole effect. Raise it and
 * it turns into a typewriter; drop it to 0 and the cascade disappears.
 */
export function SplitChars({
  children,
  className,
  delay = 0,
  as: Tag = "h1",
  immediate = false,
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  /** Skip the viewport gate. Use for above-the-fold copy that is already visible. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, VIEWPORT);
  const inView = immediate || seen;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !inView) return;

      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1 });
        return;
      }

      // Splitting before webfonts land measures the fallback face and produces
      // the wrong glyph boxes, so wait for them.
      let split: SplitText | undefined;
      document.fonts.ready.then(() => {
        gsap.set(el, { opacity: 1 });
        split = SplitText.create(el, {
          type: "chars,words,lines",
          autoSplit: true, // re-split + replay on resize / font swap
          onSplit: (self) =>
            gsap.from(self.chars, {
              duration: DUR.chars,
              yPercent: -100,
              rotationX: -90,
              opacity: 0,
              stagger: STAGGER.chars,
              ease: EASE.reveal,
              delay,
            }),
        });
      });

      return () => split?.revert();
    },
    { dependencies: [inView, delay], scope: ref },
  );

  return (
    <Tag ref={ref as never} data-split className={cn(className)}>
      {children}
    </Tag>
  );
}
