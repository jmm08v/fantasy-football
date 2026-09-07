"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ViewportFrame, FrameMark } from "./ViewportFrame";
import { HudBar, type Readout } from "./HudBar";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { LEAGUE } from "@/components/data/league";
import { DASH_RESET } from "@/lib/dashEvents";

/**
 * Only what actually goes somewhere. Every other entry used to be `href="#"`,
 * which closed the menu and left you exactly where you were — the reason the
 * dash felt like a room with no door.
 *
 * An item with no `href` renders as plainly unavailable rather than as a link
 * that silently does nothing. A dead link is worse than an honest one.
 */
const NAV: { label: string; href?: string; external?: boolean }[] = [
  { label: "40-Yard Dash", href: "/dash" },
  { label: "Constitution" },
  { label: "Draft Board" },
];

/** `trailingSlash: true` means the live path is "/dash/" but hrefs are "/dash". */
function samePath(pathname: string, href: string): boolean {
  const trim = (v: string) => (v.length > 1 ? v.replace(/\/+$/, "") : v);
  return trim(pathname) === trim(href);
}

/**
 * Persistent chrome: the frame, the wordmark on its top edge, the telemetry
 * bar, and the menu the bar opens. Everything here is fixed, so page content
 * scrolls behind it untouched.
 */
export function SiteChrome({ left, right }: { left: Readout[]; right: Readout[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  /**
   * Tapping the entry for the page you are already on is a no-op as far as the
   * router is concerned — nothing remounts, so the dash stayed frozen on
   * whatever screen it was showing. Ask it to start over instead.
   */
  function handleNav(href: string) {
    setMenuOpen(false);
    if (samePath(pathname, href)) {
      window.dispatchEvent(new Event(DASH_RESET));
    }
  }

  return (
    <>
      <ViewportFrame>
        {/* Not uppercased any more: this is the link's accessible name rather
            than drawn type, and some screen readers spell out all-caps. */}
        <FrameMark label={LEAGUE.name} />
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
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-baseline gap-x-3"
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="type-display-lg hover:text-volt transition-colors duration-300"
                      onClick={() => handleNav(item.href!)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <span className="type-display-lg opacity-25">{item.label}</span>
                      <MonoLabel className="opacity-40">SOON</MonoLabel>
                    </>
                  )}
                </motion.div>
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
