"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { DUR, EASE, STAGGER, VIEWPORT, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Line-by-line reveal for body copy.
 *
 * `mask: "lines"` wraps each line in an overflow-clipped div, so lines slide
 * out from behind a hard edge instead of just fading. That clip is what sells
 * it — without the mask this is an ordinary fade-up.
 *
 * Lines get a 0.1s step (5x the character step) because there are far fewer of
 * them and each one needs to be read.
 */
export function SplitLines({
  children,
  className,
  delay = 0,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "p" | "div" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, VIEWPORT);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !inView) return;

      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1 });
        return;
      }

      let split: SplitText | undefined;
      document.fonts.ready.then(() => {
        gsap.set(el, { opacity: 1 });
        split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              duration: DUR.lines,
              yPercent: -100,
              opacity: 0,
              stagger: STAGGER.lines,
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
