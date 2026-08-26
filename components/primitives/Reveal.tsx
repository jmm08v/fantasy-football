"use client";

import { motion } from "motion/react";
import { VIEWPORT } from "@/lib/motion";

/**
 * Generic viewport reveal for anything that isn't text — cards, images, rows.
 *
 * Deliberately understated: 24px of travel, no scale, no blur. The split-text
 * components carry the personality; if every element also performed, the page
 * would read as noise. Stagger sibling cards with `index`.
 */
export function Reveal({
  children,
  className,
  index = 0,
  y = 24,
  duration = 0.7,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  y?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{
        duration,
        delay: index * 0.08,
        ease: [0.165, 0.84, 0.44, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
