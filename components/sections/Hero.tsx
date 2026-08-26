"use client";

import { SplitChars } from "@/components/primitives/SplitChars";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { MagneticMedia } from "@/components/primitives/MagneticMedia";
import { STAGGER } from "@/lib/motion";

/**
 * Scattered headline.
 *
 * Four words parked at unrelated points on the 12-column grid, sized to fill
 * the viewport edge to edge. The composition — not the copy — is the message:
 * type this large stops being read as words and starts being read as graphics.
 *
 * The per-word `delay` continues the character cascade across the whole
 * screen, so the four blocks land as one gesture rather than four animations.
 */
/**
 * Desktop-only placement. Below `lg` the words simply stack: these are
 * 12-column coordinates, and letting them run on the 6-column mobile grid
 * silently collapses words into the same cell.
 */
const PLACEMENT = [
  "lg:col-start-1 lg:col-end-8 lg:row-start-1 lg:self-start lg:justify-self-start",
  "lg:col-start-9 lg:col-end-13 lg:row-start-1 lg:self-start lg:justify-self-end",
  "lg:col-start-5 lg:col-end-10 lg:row-start-2 lg:self-center lg:justify-self-center",
  "lg:col-start-1 lg:col-end-8 lg:row-start-3 lg:self-end lg:justify-self-start",
];

export function Hero({
  words,
  tagline,
  mediaSrc,
  mediaPoster,
}: {
  words: string[];
  tagline: string;
  mediaSrc?: string;
  mediaPoster?: string;
}) {
  // Each word starts where the previous one's characters left off, so the
  // stagger reads as one cascade crossing the screen rather than four.
  const delays = words.map(
    (_, i) => words.slice(0, i).reduce((n, w) => n + w.length, 0) * STAGGER.chars,
  );

  return (
    <section className="bg-turf relative min-h-screen overflow-hidden">
      {/*
        Animated backdrop. The wrapper — not the video — decides placement: it
        claims the top 85% of the hero, and MagneticMedia centres itself inside
        it, which lands the helmet behind the headline without absolute pixel
        maths that would break at other viewport sizes.

        `mix-blend-screen` makes the video's black ground resolve to exactly the
        page colour, so there's no visible video rectangle or matte edge — only
        the helmet floating on the page. The source is a 624px square, kept near
        native size rather than stretched to cover; upscaling it full-bleed
        would only produce a soft grey smear.
      */}
      {mediaSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 flex h-[78%] items-center justify-center overflow-hidden"
        >
          <MagneticMedia
            src={mediaSrc}
            poster={mediaPoster}
            // Source is a 5s loop of a black helmet on black. `brightness`
            // lifts the midtones so the form reads against the page — pure
            // black multiplies to black, so the ground stays invisible.
            className="w-[min(78vw,420px)] brightness-[1.55] contrast-[1.08] lg:w-[min(46vw,540px)]"
          />
          {/* Dissolves the backdrop into the page before the fold ends. */}
          <div className="from-turf via-turf/40 absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t to-transparent" />
        </div>
      )}

      <h1 className="sr-only">{words.join(" ")}</h1>

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1720px] grid-cols-6 content-center gap-x-4 px-8 pt-28 pb-32 lg:grid-cols-12 lg:grid-rows-3 lg:px-12">
        {words.map((word, i) => (
          <SplitChars
            key={word}
            as="div"
            delay={delays[i]}
            immediate
            className={`type-display-xl pointer-events-none col-span-6 whitespace-nowrap ${PLACEMENT[i % PLACEMENT.length]}`}
          >
            {word}
          </SplitChars>
        ))}

        <p className="col-span-6 mt-10 lg:col-start-8 lg:col-end-12 lg:row-start-3 lg:mt-0 lg:self-end">
          <MonoLabel scramble size="lg" delay={900} className="opacity-70">
            {tagline}
          </MonoLabel>
        </p>
      </div>
    </section>
  );
}
