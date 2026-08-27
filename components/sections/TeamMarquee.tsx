import { Marquee } from "@/components/primitives/Marquee";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { asset } from "@/lib/asset";

/**
 * A marquee only loops seamlessly while one strip is at least as wide as the
 * viewport — below that, the -100% translate exposes a gap before the second
 * copy arrives. Repeat the roster until the strip clears the widest screen we
 * care about.
 *
 * Driven by rendered width rather than a fixed count, because the two bands are
 * wildly different sizes: seven 480px portraits already overflow any viewport,
 * while seven names do not. A hardcoded minimum would either leave a gap in the
 * names or duplicate the portraits pointlessly.
 */
const TARGET_STRIP_PX = 2200;

function repeatToFill<T>(items: T[], approxItemPx: number): T[] {
  const needed = Math.ceil(TARGET_STRIP_PX / approxItemPx);
  if (items.length >= needed) return items;
  return Array.from({ length: Math.ceil(needed / items.length) }, () => items).flat();
}

/**
 * Two counter-running tickers under one label.
 *
 * The portraits drift the opposite way to the names and take longer to cross,
 * so the two bands read as separate planes at different depths rather than one
 * block sliding past. Matching speed and direction would just look like a
 * single wide strip that happened to wrap.
 *
 * Duration is time per full strip, so it sets portraits-per-second independent
 * of how large they are — 90s to 72s is a clean 25% quicker regardless of the
 * size change alongside it.
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
  const names = repeatToFill(items, 200);
  const faces = repeatToFill(headshots, 492); // 480px portrait + 12px gap
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
        <Marquee duration={72} reverse className={`-mb-2 ${edgeFade}`}>
          {faces.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={asset(src)}
              alt=""
              aria-hidden="true"
              width={1000}
              height={1000}
              loading="lazy"
              decoding="async"
              // Sized so a single portrait fills the mobile frame — you see one at
              // a time, with its neighbours dissolving into the edge fade.
              className="h-[min(92vw,420px)] w-[min(92vw,420px)] shrink-0 object-contain lg:h-[480px] lg:w-[480px]"
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
