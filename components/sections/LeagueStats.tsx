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
}: {
  stats: { value: string; label: string }[];
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
        <MediaSlot label="LEAGUE PHOTO" className="lg:col-span-6" />

        <div className="flex flex-col gap-y-2 lg:sticky lg:top-24 lg:col-span-6">
          {stats.map((stat, i) => {
            const on = i === active;
            return (
              <div
                key={stat.value + i}
                className="relative flex items-center gap-x-6 rounded-full p-6 lg:px-10"
              >
                <div
                  aria-hidden="true"
                  className="border-chalk pointer-events-none absolute -inset-px z-[1] rounded-full border transition-all duration-700"
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
