# Your Fantasy — league site framework

A Next.js starter that reproduces the design and motion system of
[morethanequal.com](https://www.morethanequal.com/), retooled for an 8-team
half-PPR keeper league. Structure and mechanics are faithful to the reference;
the palette and content are yours to replace.

The league's real settings — format, roster, FAAB, keeper rules — live in
`components/data/league.ts` and render through the `Rulebook` section. Only the
standings and recap entries are placeholder data.

**Live:** https://jmm08v.github.io/fantasy-football/

```bash
npm run dev
```

## Deploying

Pushing to `main` redeploys — `.github/workflows/deploy.yml` builds the static
export and publishes it to GitHub Pages. Nothing to run by hand.

Two things make the export work on Pages, and both are easy to break:

- **`NEXT_PUBLIC_BASE_PATH`.** Pages serves from `/fantasy-football`, not the
  domain root. The workflow sets this; `next.config.ts` feeds it to `basePath`.
  Locally it's unset, so dev stays at the root.
- **`lib/asset.ts`.** Next rewrites its own `_next/*` URLs for `basePath`
  automatically, but a literal string like `"/media/hero.mp4"` is invisible to
  it — that one works in dev and 404s in production. Route every `public/` file
  through `asset()`.

To host at a domain root instead (Vercel, Netlify, a custom domain), drop the
`NEXT_PUBLIC_BASE_PATH` env var from the workflow; `asset()` becomes a no-op.

---

## Part 1 — What the reference site is actually doing

### Stack

| Concern | Reference | Here |
| --- | --- | --- |
| Framework | Next.js App Router | same |
| Content | Prismic (slice per section) | `components/data/league.ts` |
| CSS | Tailwind v4, CSS-first `@theme` | same |
| Text animation | **GSAP core + SplitText** | same |
| Reveals / hover / menu | **Motion** (Framer Motion) | same |
| Accordion | `react-animate-height` | CSS `grid-template-rows` |
| Smooth scroll | none | none |
| ScrollTrigger | **not used** | not used |
| WebGL | **none** | none |

Total JS on the reference is ~332 KB. There is no Lenis, no Locomotive, no
three.js. Everything that looks expensive is done cheaply.

### Style

**Colour.** Three values carry the whole site: `#181719` (a *warm* near-black,
never `#000`), `#201e21` for raised surfaces, and `#80ff9d` as the single
accent. Everything else is white at 20/40/60/80% opacity. Hairlines do the work
that colour usually does.

**Type.** TWK Everett for display, RM Mono for micro-labels. The display
settings are the signature:

```
font-size: 120px; line-height: 108px; letter-spacing: -4.8px;
```

Line-height is 0.9× the size and tracking is −4%. Headlines set this tight stop
reading as words and start reading as graphics. Mono labels sit at 10–12px,
uppercase — the "instrumentation" voice against the display voice.

**Shape.** Radii run 24px on mobile to 40/80/104px on desktop. Nothing is
square. Every rounded image carries a `1px white/40` hairline overlay on top,
which is what makes photography feel mounted into the interface.

**The frame.** A fixed, rounded, hairline rectangle that the entire site scrolls
behind. This is the strongest identity move on the site — content never touches
the browser edge, so the page reads as a heads-up display. The reference builds
it with a 64px border on an oversized, negatively-offset div; this repo gets the
same picture from `box-shadow: 0 0 0 100vmax` on one element.

**The helmet is a video.** Not WebGL. It is `/videos/helmet.mp4` on a black
background with `mix-blend-lighten`, which drops every pixel darker than the
page behind it. A ~500 KB MP4 replaces a multi-megabyte 3D pipeline, and it
works on every device. This is the highest-leverage trick on the site.

### Motion

Both signature text effects, lifted from the bundle verbatim:

```js
// headline — per character
gsap.from(split.chars, {
  duration: 1.2, yPercent: -100, rotationX: -90, opacity: 0,
  stagger: 0.02, ease: "expo.out",
});

// body copy — per line, behind an overflow-clip mask
gsap.from(split.lines, {
  duration: 0.6, yPercent: -100, opacity: 0,
  stagger: 0.1, ease: "expo.out",
});
```

No ancestor sets `perspective`, so `rotationX` reads as a vertical squash rather
than a 3D flip — mechanical, like a split-flap board. The 0.02s character step
means the tail of a headline is still arriving after the head has landed; that
overlap *is* the effect.

The hero centrepiece also drifts toward the cursor at `duration: 1.5,
ease: "sine.out", overwrite: "auto"` — far too slow to track the pointer, which
is exactly why it reads as mass rather than as a cursor follower.

Everything else resolves to a small vocabulary:

| Token | Value | Used for |
| --- | --- | --- |
| workhorse ease | `cubic-bezier(.165,.84,.44,1)` | hovers, cards, accordion |
| long ease | `cubic-bezier(.25,.74,.22,.99)` | stat rack transitions |
| reveal ease | `expo.out` | all split text |
| durations | 100 / 300 / 700 / 1500ms | tap · UI · hover · drift |

Card hover moves three properties on one shared 700ms curve — image
`scale(1.05)`, body panel `translateY(-20px)`, border `white/20 → white/60`.
The body panel is opaque and sits above the image, so lifting it acts as a
moving mask. Sharing the curve is what makes three effects read as one
mechanism.

Only two CSS keyframes exist on the entire site: a 30s linear marquee and a
spinner.

### What the reference gets wrong

Two things this repo fixes rather than copies:

1. **No `prefers-reduced-motion` handling anywhere.** Every animation runs
   regardless. `app/globals.css` here has a full reduced-motion block — content
   still arrives, it just arrives instantly.
2. **Split text is hidden by CSS and only revealed by JS.** If the bundle fails,
   the copy is invisible forever. Here `[data-split]` is hidden with a
   `<noscript>` override in `app/layout.tsx`, so no-JS readers get the text.

---

## Part 2 — Using this repo

### Where to start

`app/globals.css` is the whole design system: colour, type scale, easing
curves, durations, frame geometry. Retheming the site is editing that one
`@theme` block. `components/data/league.ts` holds every string and number.

### Primitives

| File | What it does |
| --- | --- |
| `primitives/SplitChars` | headline character cascade (`immediate` skips the viewport gate) |
| `primitives/SplitLines` | masked line-by-line body reveal |
| `primitives/ScrambleText` | telemetry decode; unresolved characters render as chevrons, whitespace preserved |
| `primitives/MonoLabel` | the HUD voice; `scramble` is opt-in |
| `primitives/MagneticMedia` | `mix-blend-lighten` video + cursor drift |
| `primitives/Marquee` | CSS-only seamless loop, no JS |
| `primitives/Reveal` | Motion `whileInView` for everything that isn't text |
| `primitives/Container` | 6-col mobile / 12-col desktop, max 1720px |
| `frame/ViewportFrame` | the fixed visor + wordmark |
| `frame/HudBar` | bottom telemetry strip + menu trigger |

### The hero backdrop

`public/media/hero.mp4` is a 5s loop of a rotating black helmet on a pure black
ground (624x624, ~1.3 MB), sitting behind the headline in the top ~78% of the
hero. `public/media/hero-poster.jpg` is frame 60, so there's no black flash
before playback starts.

Two things make it work:

- **`mix-blend-screen`, not `lighten`.** Screen resolves pure black to exactly
  the page colour, so no video rectangle or matte edge is ever visible, while
  the helmet's dark midtones still lift enough to read as a shape. `lighten`
  keeps only pixels *brighter* than the page, which on a glossy black helmet
  throws away the body and leaves a few disconnected specular streaks.
- **`brightness(1.55)` on the source.** Black multiplied by anything is still
  black, so the filter lifts the subject without ever revealing the ground.

Placement is the wrapper's job, not the video's. `MagneticMedia` deliberately
sets **no** positioning transform: GSAP writes the whole `transform` property
for the cursor drift, so a Tailwind `-translate-x-1/2` centering class would be
silently wiped the first time the pointer moved. The wrapper flex-centres it
instead.

To swap in your own clip: export on a **pure black** background, drop it at
`public/media/hero.mp4`, and regenerate the poster. Tune `brightness` to taste —
brighter sources need less. `MediaSlot` is a gradient placeholder standing in
for real photography; when you replace it with `next/image`, keep the
`.hairline` overlay.

### Fonts

TWK Everett and RM Mono are commercial. `app/layout.tsx` currently loads Archivo
and JetBrains Mono as the closest free stand-ins. Swap them there and nothing
downstream changes.

### Sections

`Hero` · `TeamMarquee` · `Manifesto` · `LeagueStats` · `Pillars` · **`Rulebook`**
(format, roster depth chart, FAAB, keeper rules) · `Rules` (the "why" accordion)
· `Standings` · `Recaps` · `SiteFooter`. Reorder or drop them in `app/page.tsx`.

### Where scramble belongs

On short atmospheric strings — eyebrows, telemetry, a tagline. Not on data.
Records and scores that spend their first half-second as chevrons read as a
loading failure, which is why `MonoLabel` defaults `scramble` to off.
