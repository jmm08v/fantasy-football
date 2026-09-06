/**
 * Canvas renderer for the 40.
 *
 * A pure function of run state — no React, no reads of the DOM beyond the
 * context it is handed — so the parent can call it from the same frame loop
 * that steps the physics, and so it can never disagree with the simulation
 * about where the runner is.
 *
 * The figure is drawn rather than sprited, which is what lets the legs be
 * driven by `state.stride`. That is the whole conceit of the control scheme:
 * the left pad swings the left leg, the right pad swings the right, and the
 * player is literally running the runner rather than filling a meter.
 */

import { DISTANCE_M, toYards, type RunState } from "./dash";

/** Mirrors the tokens in app/globals.css. Canvas cannot read CSS variables. */
const PALETTE = {
  chalk: "#ffffff",
  volt: "#c8ff4d",
  flag: "#ff5c3d",
} as const;

const YARD_M = 0.9144;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function drawTrack(
  ctx: CanvasRenderingContext2D,
  s: RunState,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);

  // Enough track on screen to read speed from the markers going by, but never
  // so zoomed out on a wide desktop that the runner becomes an ant. Showing
  // roughly 15 m keeps the figure large enough to read its gait, which is the
  // feedback that tells a player whether their rhythm is landing.
  const pxPerM = clamp(w / 12, 22, 60);
  const groundY = h * 0.64;

  // Camera keeps the runner a third in from the left, so there is always more
  // track ahead than behind. Clamped at the back so the start line stays in
  // shot while you are still in the blocks.
  const camX = Math.max(s.x - (0.3 * w) / pxPerM, -2.6);
  const sx = (metres: number) => (metres - camX) * pxPerM;

  drawGround(ctx, w, h, groundY);
  drawMarkers(ctx, sx, w, groundY, pxPerM);
  drawFinish(ctx, sx, groundY, h, s);
  if (s.v > 4) drawSpeedLines(ctx, sx(s.x), groundY, pxPerM, s.v);
  drawRunner(ctx, sx(s.x), groundY, pxPerM, s);
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  groundY: number,
): void {
  ctx.strokeStyle = `${PALETTE.chalk}33`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 0.5);
  ctx.lineTo(w, groundY + 0.5);
  ctx.stroke();

  // Two faint lanes below the running line give the ground some depth without
  // introducing a second colour.
  ctx.strokeStyle = `${PALETTE.chalk}14`;
  for (const off of [0.34, 0.68]) {
    const y = Math.round(groundY + (h - groundY) * off) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/** Yard ticks: every yard short, every fifth tall and numbered. */
function drawMarkers(
  ctx: CanvasRenderingContext2D,
  sx: (m: number) => number,
  w: number,
  groundY: number,
  pxPerM: number,
): void {
  ctx.font = `10px ui-monospace, SFMono-Regular, monospace`;
  ctx.textAlign = "center";

  for (let yard = 0; yard <= 44; yard++) {
    const x = sx(yard * YARD_M);
    if (x < -40 || x > w + 40) continue;

    const major = yard % 5 === 0;
    ctx.strokeStyle = major ? `${PALETTE.chalk}59` : `${PALETTE.chalk}1f`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, groundY);
    ctx.lineTo(Math.round(x) + 0.5, groundY - (major ? 18 : 7));
    ctx.stroke();

    if (major && pxPerM > 16) {
      ctx.fillStyle = `${PALETTE.chalk}66`;
      ctx.fillText(String(yard), x, groundY - 26);
    }
  }
}

function drawFinish(
  ctx: CanvasRenderingContext2D,
  sx: (m: number) => number,
  groundY: number,
  h: number,
  s: RunState,
): void {
  const x = sx(DISTANCE_M);
  const done = s.phase === "done";

  ctx.strokeStyle = PALETTE.volt;
  ctx.lineWidth = done ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, groundY + 14);
  ctx.lineTo(Math.round(x) + 0.5, groundY - h * 0.42);
  ctx.stroke();

  ctx.fillStyle = PALETTE.volt;
  ctx.font = `10px ui-monospace, SFMono-Regular, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("40", x + 8, groundY - h * 0.42 + 10);
}

/** Horizontal streaks behind the runner. Density tracks velocity. */
function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  pxPerM: number,
  v: number,
): void {
  const intensity = clamp((v - 4) / 8, 0, 1);
  ctx.strokeStyle = `${PALETTE.volt}${Math.round(intensity * 60)
    .toString(16)
    .padStart(2, "0")}`;
  ctx.lineWidth = 1;
  const bodyH = pxPerM * 1.8;
  for (let i = 0; i < 5; i++) {
    const y = groundY - bodyH * (0.25 + i * 0.16);
    const len = (18 + i * 9) * intensity;
    ctx.beginPath();
    ctx.moveTo(x - pxPerM * 0.5 - len, y);
    ctx.lineTo(x - pxPerM * 0.5, y);
    ctx.stroke();
  }
}

/**
 * The sprinter. Angles are radians from straight-down, so a limb is two
 * segments hinged at a joint and the maths stays readable.
 */
function drawRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  pxPerM: number,
  s: RunState,
): void {
  const H = pxPerM * 1.8;
  const stroke = Math.max(2, pxPerM * 0.075);

  // Contact shadow — without it the figure reads as floating above the line.
  ctx.fillStyle = `${PALETTE.chalk}1a`;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, H * 0.2, H * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.volt;
  ctx.fillStyle = PALETTE.volt;
  ctx.lineWidth = stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (s.phase === "set") {
    drawStance(ctx, x, groundY, H);
    return;
  }

  // Lean is steep out of the blocks and comes upright as speed builds — the
  // silhouette of the drive phase, for free, from one number.
  const lean = clamp(0.42 - s.v * 0.035, 0.05, 0.42);
  const hipY = groundY - H * 0.5;
  const hipX = x;
  const shoulderX = hipX + Math.sin(lean) * H * 0.42;
  const shoulderY = hipY - Math.cos(lean) * H * 0.42;

  // Torso
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Head
  const headR = H * 0.085;
  ctx.beginPath();
  ctx.arc(
    shoulderX + Math.sin(lean) * headR * 1.7,
    shoulderY - Math.cos(lean) * headR * 1.7,
    headR,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  const phase = s.stride;
  // Legs drive, arms counter-rotate half a cycle out — the natural gait, and
  // it also visually reinforces that the two pads alternate.
  drawLeg(ctx, hipX, hipY, H, phase);
  drawLeg(ctx, hipX, hipY, H, phase + Math.PI);
  drawArm(ctx, shoulderX, shoulderY, H, phase + Math.PI, lean);
  drawArm(ctx, shoulderX, shoulderY, H, phase, lean);
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  H: number,
  phase: number,
): void {
  const thighL = H * 0.26;
  const shinL = H * 0.24;

  const thigh = Math.sin(phase) * 0.95;
  // Knee folds hardest as the leg recovers forward, stays near straight as it
  // extends behind — the asymmetry is what makes it read as a sprint.
  const knee = Math.max(0, Math.sin(phase + 0.9)) * 1.45;

  const kx = hx + Math.sin(thigh) * thighL;
  const ky = hy + Math.cos(thigh) * thighL;
  const fx = kx + Math.sin(thigh - knee) * shinL;
  const fy = ky + Math.cos(thigh - knee) * shinL;

  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(kx, ky);
  ctx.lineTo(fx, fy);
  ctx.stroke();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  sxp: number,
  syp: number,
  H: number,
  phase: number,
  lean: number,
): void {
  const upperL = H * 0.19;
  const foreL = H * 0.17;

  const upper = Math.sin(phase) * 0.85 + lean;
  const elbow = 1.5; // Sprinters hold a fixed ~90°; letting it flap looks wrong.

  const ex = sxp + Math.sin(upper) * upperL;
  const ey = syp + Math.cos(upper) * upperL;
  const hx2 = ex + Math.sin(upper + elbow) * foreL;
  const hy2 = ey + Math.cos(upper + elbow) * foreL;

  ctx.beginPath();
  ctx.moveTo(sxp, syp);
  ctx.lineTo(ex, ey);
  ctx.lineTo(hx2, hy2);
  ctx.stroke();
}

/** Three-point stance, held until the first tap starts the clock. */
function drawStance(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  H: number,
): void {
  const hipY = groundY - H * 0.44;
  const shoulderX = x + H * 0.34;
  const shoulderY = groundY - H * 0.5;

  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Down hand, the point of the stance.
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(shoulderX + H * 0.16, groundY);
  ctx.stroke();

  // Back leg extended, front leg cocked.
  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(x - H * 0.2, groundY - H * 0.16);
  ctx.lineTo(x - H * 0.3, groundY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(x + H * 0.08, groundY - H * 0.18);
  ctx.lineTo(x - H * 0.02, groundY);
  ctx.stroke();

  const headR = H * 0.085;
  ctx.beginPath();
  ctx.arc(shoulderX + headR * 1.4, shoulderY - headR * 0.2, headR, 0, Math.PI * 2);
  ctx.fill();
}

/** Live readout values, so the HUD and the canvas never disagree. */
export function readout(s: RunState) {
  return {
    time: s.finishTime ?? s.t,
    yards: Math.min(40, toYards(s.x)),
    speed: s.v,
  };
}
