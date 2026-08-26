"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ViewportFrame, FrameMark } from "./ViewportFrame";
import { HudBar, type Readout } from "./HudBar";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { LEAGUE } from "@/components/data/league";

const NAV = ["Rulebook", "Standings", "Recaps", "Keepers", "Draft Board"];

/**
 * Persistent chrome: the frame, the wordmark on its top edge, the telemetry
 * bar, and the menu the bar opens. Everything here is fixed, so page content
 * scrolls behind it untouched.
 */
export function SiteChrome({ left, right }: { left: Readout[]; right: Readout[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <ViewportFrame>
        <FrameMark label={LEAGUE.name.toUpperCase()} />
      </ViewportFrame>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="bg-turf/95 fixed inset-0 z-[35] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
          >
            <nav className="flex h-full flex-col items-center justify-center gap-y-2">
              {NAV.map((item, i) => (
                <motion.a
                  key={item}
                  href="#"
                  className="type-display-lg hover:text-volt transition-colors duration-300"
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item}
                </motion.a>
              ))}
              <div className="mt-12">
                <MonoLabel className="opacity-40">PRESS MENU TO CLOSE</MonoLabel>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <HudBar left={left} right={right} onMenuClick={() => setMenuOpen((v) => !v)} />
    </>
  );
}
