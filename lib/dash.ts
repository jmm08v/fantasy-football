/**
 * The 40-yard dash simulation.
 *
 * Pure functions, no React and no DOM, so the physics can be calibrated in a
 * plain node script (`scripts/calibrate-dash.mjs`) rather than by feel in a
 * browser. Every number a player can feel lives in TUNING below.
 *
 * The model is deliberately small:
 *
 *   - A clean alternating tap adds an impulse to velocity.
 *   - That impulse shrinks as velocity approaches `topSpeed`, so you cannot
 *     tap your way past a ceiling. This is what makes 40 yards read as an
 *     acceleration test rather than a mashing contest.
 *   - Velocity bleeds off continuously, so cadence has to be *sustained*.
 *     Stop tapping and you are visibly decelerating within a stride.
 *
 * Those three rules together produce the real shape of a 40: a hard drive
 * phase, a build, then a near-flat top end where extra effort buys hundredths.
 */

/** 40 yards in metres — the distance the timer actually measures. */
export const DISTANCE_M = 36.58;

/**
 * Fitted by `scripts/calibrate-dash.mjs` against the cadence→time curve a 40
 * ought to have: ~6.5s at a casual 5 taps/s, ~4.7s at a strong 9, and a floor
 * near 3.9s that only a metronome reaches. Change one value and re-run the
 * bench; they are balanced against each other, not independently meaningful.
 */
export const TUNING = {
  /** Hard velocity ceiling in m/s. Sits above real top speed on purpose — the
   *  drag term, not this, is what players actually run into. */
  topSpeed: 15,
  /** Velocity added by one clean alternating stride, at a standstill. */
  impulse: 2.5,
  /** Continuous velocity decay, per second. Higher = less coasting. */
  drag: 1.35,
  /**
   * Taps closer together than this are ignored. Two thumbs top out around
   * 14/s; 30ms allows 33/s, so this never touches a human and does stop an
   * autoclicker from integrating a hundred impulses into one stride.
   */
  minStrideGap: 0.03,
} as const;

export type Side = "L" | "R";
export type Phase = "set" | "running" | "done";

export type RunState = {
  phase: Phase;
  /** Seconds since the first tap. The clock is self-started, like the Combine. */
  t: number;
  /** Metres travelled. */
  x: number;
  /** Velocity, m/s. */
  v: number;
  /** Clean alternating strides. */
  taps: number;
  /** Same-pad taps — no impulse, but worth surfacing as feedback. */
  fumbles: number;
  lastSide: Side | null;
  lastTapAt: number;
  /**
   * Radians. Advances half a stride per tap so the drawn legs are driven by
   * the player's actual rhythm rather than by a decorative timer.
   */
  stride: number;
  /** Set once the finish line is crossed, interpolated to sub-frame accuracy. */
  finishTime: number | null;
};

export function createRun(): RunState {
  return {
    phase: "set",
    t: 0,
    x: 0,
    v: 0,
    taps: 0,
    fumbles: 0,
    lastSide: null,
    lastTapAt: -Infinity,
    stride: 0,
    finishTime: null,
  };
}

/**
 * Register a pad press. Returns whether it counted, so the UI can flash the
 * pad red on a fumble without re-deriving the rule.
 */
export function tap(s: RunState, side: Side): "drive" | "fumble" | "ignored" {
  if (s.phase === "done") return "ignored";

  // The first tap is what starts the clock — there is no gun.
  if (s.phase === "set") {
    s.phase = "running";
    s.lastSide = side;
    s.lastTapAt = 0;
    s.taps = 1;
    s.v += TUNING.impulse;
    s.stride += Math.PI;
    return "drive";
  }

  if (s.t - s.lastTapAt < TUNING.minStrideGap) return "ignored";

  // Alternation is the whole control scheme: same pad twice is a stumble, not
  // a stride. It costs no speed directly, but the momentum lost to drag while
  // you recover is the real penalty.
  if (side === s.lastSide) {
    s.fumbles += 1;
    return "fumble";
  }

  s.lastSide = side;
  s.lastTapAt = s.t;
  s.taps += 1;
  s.v += TUNING.impulse * headroom(s.v);
  s.stride += Math.PI;
  return "drive";
}

/** Impulse falls to zero as velocity approaches the ceiling. */
function headroom(v: number): number {
  return Math.max(0, 1 - v / TUNING.topSpeed);
}

/**
 * Advance the simulation by a fixed `dt`. Callers must drive this on a fixed
 * timestep accumulator, never on raw frame deltas — otherwise a 120Hz phone
 * and a 60Hz laptop produce different times for identical input, which would
 * make the leaderboard meaningless.
 */
export function advance(s: RunState, dt: number): void {
  if (s.phase !== "running") return;

  const before = s.x;
  s.v -= TUNING.drag * s.v * dt;
  if (s.v < 0) s.v = 0;
  s.x += s.v * dt;
  s.t += dt;

  // Legs keep turning over between taps so the figure never freezes mid-air;
  // the tap impulse above is what actually drives the rhythm.
  s.stride += s.v * dt * 1.1;

  if (s.x >= DISTANCE_M) {
    // Interpolate the exact crossing inside this step. Without this the time
    // quantises to the timestep and every result clusters on 1/240s bounds.
    const overshoot = s.x - DISTANCE_M;
    const travelled = s.x - before;
    const backA = travelled > 0 ? (overshoot / travelled) * dt : 0;
    s.finishTime = s.t - backA;
    s.x = DISTANCE_M;
    s.phase = "done";
  }
}

/** Fixed physics step: 240Hz. Fine enough that sub-step error is invisible. */
export const STEP = 1 / 240;

/** Formats seconds the way a combine result is written: 4.31, always 2dp. */
export function formatTime(seconds: number): string {
  return seconds.toFixed(2);
}

/** Metres → yards, for the live distance readout. */
export function toYards(metres: number): number {
  return metres * 1.09361;
}
