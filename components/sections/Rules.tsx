"use client";

import { useState } from "react";
import { Container } from "@/components/primitives/Container";
import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { CSS_EASE } from "@/lib/motion";

/**
 * Accordion.
 *
 * Height animates via `grid-template-rows: 0fr -> 1fr`, which interpolates to
 * the content's real height with no JS measuring and no library. The reference
 * site ships react-animate-height for this; the CSS is two lines and one fewer
 * dependency.
 *
 * 300ms here against 700ms on the cards is intentional: this is a direct
 * response to a click, and anything slower feels broken.
 */
export function Rules({
  title,
  items,
}: {
  title: string;
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-turf">
      <Container className="py-20 lg:py-32">
        <SplitChars as="h2" className="type-display-lg col-span-6 mb-12 lg:col-span-12 lg:mb-20">
          {title}
        </SplitChars>

        <div className="col-span-6 flex flex-col gap-y-2 lg:col-span-12">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="border-chalk/40 hover:border-chalk overflow-hidden rounded-[40px] border transition duration-300"
                style={{ transitionTimingFunction: CSS_EASE.quart }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-x-6 px-8 py-6 text-left lg:px-10"
                >
                  <MonoLabel className="hidden w-1/4 shrink-0 opacity-40 lg:block">
                    {String(i + 1).padStart(2, "0")}
                  </MonoLabel>
                  <span className="type-card flex-1">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="text-volt shrink-0 transition-transform duration-300"
                    style={{
                      transitionTimingFunction: CSS_EASE.quart,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                </button>

                <div
                  className="grid transition-all duration-300"
                  style={{
                    transitionTimingFunction: CSS_EASE.quart,
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="type-body px-8 pb-8 opacity-70 lg:px-10 lg:pb-10 lg:pl-[calc(25%+3.5rem)]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
