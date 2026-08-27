import { Marquee } from "@/components/primitives/Marquee";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { asset } from "@/lib/asset";

/**
 * A marquee only loops seamlessly while one strip is at least as wide as the
 * viewport — below that, the -100% translate exposes a gap before the second
 * copy arrives. A short roster gets repeated until the strip clears the screen.
 */
function repeatToFill<T>(items: T[], min: number): T[] {
  if (items.length >= min) return items;
  return Array.from({ length: Math.ceil(min / items.length) }, () => items).flat();
}

/**
 * Two counter-running tickers under one label.
 *
 * The portraits drift the opposite way to the names and take more than twice
 * as long to cross, so the two bands read as separate planes at different
 * depths rather than one block sliding past. Matching speed and direction
 * would just look like a single wide strip that happened to wrap.
 *
 * The portraits carry a real alpha channel (see scripts/matte-headshots.mjs),
 * so there is no blend mode and no background to hide — transparent is
 * transparent, they match the page exactly, and they keep matching it if the
 * page colour changes. An earlier pass faked this with `mix-blend-screen`,
 * which worked until the animated strip's own transform created a stacking
 * context and isolated the blend, leaving a visible box around every portrait.
 * Real alpha has no such failure mode. An edge mask fades both strips out at
 * the margins so nothing hard-clips at the frame.
 */
export function TeamMarquee({
  label,
  items,
  headshots = [],
}: {
  label: string;
  items: string[];
  headshots?: string[];
}) {
  const names = repeatToFill(items, 10);
  const faces = repeatToFill(headshots, 12);
  const edgeFade =
    "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]";

  return (
    <section className="bg-turf overflow-hidden pt-4 pb-10 lg:pt-8 lg:pb-16">
      <div className="mb-6 text-center lg:mb-8">
        <MonoLabel scramble size="lg" className="opacity-40">
          {label}
        </MonoLabel>
      </div>

      {faces.length > 0 && (
        <Marquee duration={90} reverse className={`-mb-2 ${edgeFade}`}>
          {faces.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={asset(src)}
              alt=""
              aria-hidden="true"
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="h-[200px] w-[200px] shrink-0 object-contain lg:h-[380px] lg:w-[380px]"
            />
          ))}
        </Marquee>
      )}

      <Marquee duration={40} className={edgeFade}>
        {names.map((name, i) => (
          <span key={`${name}-${i}`} className="flex shrink-0 items-center gap-x-3 px-3">
            <span className="type-display-lg !text-[28px] !leading-[28px] !tracking-[-1px] whitespace-nowrap opacity-60 lg:!text-[40px] lg:!leading-[40px]">
              {name}
            </span>
            <span className="text-volt type-hud-lg">{">="}</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
