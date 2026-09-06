/**
 * Tuning bench for the 40-yard dash.
 *
 * Drives lib/dash.ts with a metronome instead of thumbs and prints the 40 time
 * each cadence produces. Run it after touching TUNING — the numbers below are
 * the contract the game is balanced against, and it is much faster to check
 * them here than to try to feel a 0.05 change through a touchscreen.
 *
 *   node scripts/calibrate-dash.mjs
 *
 * Node strips the TypeScript types on import, so there is no build step.
 */

import { createRun, tap, advance, STEP, DISTANCE_M, TUNING } from "../lib/dash.ts";

/** Runs the distance at a perfect constant cadence. Returns seconds. */
function runAt(tapsPerSecond, { stopAt = Infinity } = {}) {
  const s = createRun();
  const gap = 1 / tapsPerSecond;
  let side = "L";
  let nextTap = 0;

  tap(s, side);
  nextTap = gap;

  // Generous ceiling: a cadence too slow to ever finish should fall out as a
  // did-not-finish rather than spinning here forever.
  for (let guard = 0; guard < 240 * 60 && s.phase === "running"; guard++) {
    if (s.t >= nextTap && s.t < stopAt) {
      side = side === "L" ? "R" : "L";
      tap(s, side);
      nextTap += gap;
    }
    advance(s, STEP);
  }

  return {
    time: s.finishTime,
    taps: s.taps,
    topSpeed: s.v,
    distance: s.x,
  };
}

console.log("TUNING", TUNING, `\ndistance ${DISTANCE_M} m (40 yd)\n`);

console.log("cadence   40 time   taps   speed at finish");
console.log("-------   -------   ----   ---------------");
for (const rate of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14]) {
  const r = runAt(rate);
  const time = r.time == null ? "  DNF  " : `${r.time.toFixed(2)}s`;
  const speed = r.time == null ? "—" : `${r.topSpeed.toFixed(1)} m/s`;
  console.log(
    `${String(rate).padStart(5)}/s   ${time.padStart(7)}   ${String(r.taps).padStart(4)}   ${speed}`,
  );
}

// A player who sprints then quits should visibly decelerate, not coast home.
console.log("\nstop tapping at 2.0s (does momentum carry you?)");
const bail = runAt(9, { stopAt: 2.0 });
console.log(
  bail.time == null
    ? `  never finishes — reached ${bail.distance.toFixed(1)} m of ${DISTANCE_M}`
    : `  ${bail.time.toFixed(2)}s`,
);

// Mashing one pad is all fumbles and must go nowhere.
const mash = createRun();
tap(mash, "L");
for (let i = 0; i < 2000; i++) {
  tap(mash, "L");
  advance(mash, STEP);
}
console.log(
  `\nmashing one pad for ${(2000 * STEP).toFixed(1)}s: ${mash.x.toFixed(2)} m travelled, ${mash.fumbles} fumbles`,
);
