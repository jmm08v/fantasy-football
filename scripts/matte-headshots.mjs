/**
 * Turns rim-lit-on-black portraits into real cut-outs.
 *
 *   node scripts/matte-headshots.mjs [size] [inDir] [outDir]
 *   npm run headshots
 *
 * The source portraits are light on pure black, which means luminance already
 * *is* the matte: black ground becomes fully transparent, the bright rim fully
 * opaque, and every soft falloff in between survives as partial alpha. That
 * beats threshold-based background removal, which would hard-edge exactly the
 * glow that makes these read.
 *
 * Colour is written as flat white rather than un-premultiplied (c / a). These
 * portraits are neutral — measured chroma spread is under 1/255 on average and
 * never above 6 — so white loses nothing visible, while dividing by a tiny
 * alpha would amplify sensor noise in near-transparent pixels into full-range
 * colour. That noise is invisible once composited but catastrophic for
 * compression: un-premultiplying produced 7.3 MB, flat white produces a
 * constant colour plane and a fraction of the size.
 *
 * Compositing white at alpha a over the page reproduces the original exactly
 * for neutral pixels: 255*a + bg*(1-a) equals what screen blending gave.
 *
 * Real alpha also means the page needs no blend mode: the transparent ground
 * shows whatever is behind it, so the portraits match the background exactly
 * and keep matching it if the background is ever retuned.
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

// Must cover the largest display size at 2x DPR. Portraits show at up to
// 480 CSS px on desktop and 420 on mobile, so 1000 clears both. Undershooting
// this is what made an earlier 440px export look soft in the hair — if you
// enlarge the portraits again, raise this to match.
const SIZE = Number(process.argv[2] || 1000);
const inDir = process.argv[3] || "headshots";
const outDir = process.argv[4] || "public/media/headshots";

const files = fs.readdirSync(inDir).filter((f) => /\.png$/i.test(f)).sort();
if (!files.length) {
  console.error(`No PNGs in ${inDir}/`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

let total = 0;
for (const file of files) {
  const { data, info } = await sharp(path.join(inDir, file))
    .resize(SIZE, SIZE, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let p = 0; p < data.length; p += 4) {
    const a = Math.max(data[p], data[p + 1], data[p + 2]);
    if (a === 0) continue; // already zeroed — fully transparent
    out[p] = 255;
    out[p + 1] = 255;
    out[p + 2] = 255;
    out[p + 3] = a;
  }

  // Keep the person's name — these are identifiable, and 01..07 threw that away.
  const name = `${path.parse(file).name.toLowerCase().replace(/_/g, "-")}.webp`;
  const dest = path.join(outDir, name);
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 90, effort: 6 })
    .toFile(dest);

  const kb = fs.statSync(dest).size / 1024;
  total += kb;
  console.log(`${name}  ${info.width}x${info.height}  ${kb.toFixed(1)} kB`);
}
console.log(`\n${files.length} portraits, ${total.toFixed(0)} kB total`);
