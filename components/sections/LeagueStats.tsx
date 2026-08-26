"use client";

import { useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { Container } from "@/components/primitives/Container";
import { SplitLines } from "@/components/primitives/SplitLines";
import { MediaSlot } from "@/components/primitives/MediaSlot";
import { CSS_EASE } from "@/lib/motion";

/**
 * Sticky stat rack.
 *
 * A tall image scrolls on the left while a shorter, sticky column of numbers
 * holds on the right — so one scroll gesture drives two different rates. The
 * active row is picked from scroll progress rather than from each row's own
 * viewport intersection, which guarantees exactly one row is ever lit.
 *
 * Everything about the transition is slow (700ms) and low-contrast: the ring
 * brightens, the number takes the accent, the copy lifts from 60% to full. No
 * movement at all. Motion here would fight the scroll.
 */
export function LeagueStats({
  stats,
  photo = false,
}: {
  stats: { value: string; label: string }[];
  /**
   * Show the tall image beside the stats. With it on, the stat column sticks
   * while the image scrolls past — that two-rate scroll is the whole point of
   * the layout. With it off there is nothing to stick against, so the column
   * un-sticks and centres instead of pinning to a blank half-screen.
   */
  photo?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(stats.length - 1, Math.floor(p * stats.length));
    setActive(next < 0 ? 0 : next);
  });

  return (
    <section ref={ref} className="bg-turf">
      <Container className="gap-y-10 py-20 lg:items-start lg:py-32">
        {photo && (
          <MediaSlot label="LEAGUE PHOTO" className="col-span-6 lg:col-span-6" />
        )}

        <div
          className={
            photo
              ? "col-span-6 flex flex-col gap-y-2 lg:sticky lg:top-24 lg:col-span-6"
              : "col-span-6 flex flex-col gap-y-2 lg:col-start-3 lg:col-end-11"
          }
        >
          {stats.map((stat, i) => {
            const on = i === active;
            return (
              <div
                key={stat.value + i}
                className="relative flex flex-col items-start gap-y-3 rounded-[32px] p-6 lg:flex-row lg:items-center lg:gap-x-6 lg:gap-y-0 lg:rounded-full lg:px-10"
              >
                <div
                  aria-hidden="true"
                  className="border-chalk pointer-events-none absolute -inset-px z-[1] rounded-[inherit] border transition-all duration-700"
                  style={{
                    transitionTimingFunction: CSS_EASE.expo,
                    opacity: on ? 1 : 0.2,
                    transform: on ? "scale(1)" : "scale(0.97)",
                  }}
                />
                <div
                  className="type-stat shrink-0 transition-colors duration-700"
                  style={{
                    transitionTimingFunction: CSS_EASE.expo,
                    color: on ? "var(--color-volt)" : "var(--color-chalk)",
                  }}
                >
                  {stat.value}
                </div>
                <SplitLines
                  className="type-body transition-opacity duration-500"
                  as="div"
                >
                  {stat.label}
                </SplitLines>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
