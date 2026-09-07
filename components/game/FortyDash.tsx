"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { TrackCanvas } from "./TrackCanvas";
import { TapPads } from "./TapPads";
import { PinGate } from "./PinGate";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { PillButton } from "@/components/primitives/PillButton";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import {
  advance,
  createRun,
  formatTime,
  STEP,
  tap,
  toYards,
  type RunState,
  type Side,
} from "@/lib/dash";
import { drawTrack } from "@/lib/drawTrack";
import {
  attemptsLeft,
  bestFor,
  getServerSnapshot,
  getSnapshot,
  MAX_ATTEMPTS,
  completeAttempt,
  startAttempt,
  standings,
  subscribe,
} from "@/lib/dashStore";
import { hasPin } from "@/lib/dashAuth";
import { DASH_RESET } from "@/lib/dashEvents";

/**
 * The 40-yard dash.
 *
 * Two rules shape the whole screen:
 *
 *   1. Practice is unlimited and never posts.
 *   2. A combine run is declared *before* it starts, burns one of two, and
 *      posts whatever the clock says.
 *
 * That ordering is the entire game. If a run could be submitted after the
 * fact, "two attempts" would collapse into "post your best of fifty" and the
 * board would measure patience instead of speed. Committing first is also
 * where the nerves come from, which is the point.
 */

type Screen = "lobby" | "pin" | "run" | "result";
type Mode = "practice" | "combine";

export function FortyDash({
  players,
}: {
  players: { name: string; headshot: string }[];
}) {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [mode, setMode] = useState<Mode>("practice");
  const [player, setPlayer] = useState(players[0]?.name ?? "");
  const board = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Which face the PIN gate wears — decided when the player asks for an
  // official run, never during render, because it reads localStorage.
  const [pinMode, setPinMode] = useState<"set" | "enter">("enter");
  const [result, setResult] = useState<number | null>(null);
  const [flash, setFlash] = useState<Side | null>(null);
  // The simulation's own phase lives in a ref and changes without rendering,
  // so anything the UI needs to react to gets mirrored into state exactly once.
  const [started, setStarted] = useState(false);

  // Live simulation state deliberately sits outside React: it changes 240
  // times a second and nothing about it should trigger a render.
  const run = useRef<RunState>(createRun());
  const surface = useRef<{ ctx: CanvasRenderingContext2D; w: number; h: number } | null>(null);
  /** Guards the one-shot finish handler: the loop sees `done` every frame. */
  const settled = useRef(false);
  /** Clears the red stumble flash. Owned here so the pads stay stateless. */
  const flashTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    [],
  );
  // Written to directly from the frame loop — see updateHud.
  const timeEl = useRef<HTMLSpanElement>(null);
  const yardEl = useRef<HTMLSpanElement>(null);
  const speedEl = useRef<HTMLSpanElement>(null);

  const onContext = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      surface.current = { ctx, w, h };
      drawTrack(ctx, run.current, w, h);
    },
    [],
  );

  const updateHud = useCallback(() => {
    const s = run.current;
    if (timeEl.current) timeEl.current.textContent = formatTime(s.finishTime ?? s.t);
    if (yardEl.current) yardEl.current.textContent = Math.min(40, toYards(s.x)).toFixed(1);
    if (speedEl.current) speedEl.current.textContent = s.v.toFixed(1);
  }, []);

  const finish = useCallback(
    (time: number) => {
      // The run stays in its `done` phase so the canvas keeps drawing the
      // sprinter frozen at the line rather than resetting to a stance.
      setResult(time);
      setScreen("result");
      // The attempt was already spent at the PIN gate; this only fills in the
      // time it earned.
      if (mode === "combine") completeAttempt(player, time);
    },
    [mode, player],
  );

  /**
   * One loop for physics and drawing. Physics runs on a fixed 240Hz step
   * accumulator rather than on frame deltas, so a 120Hz phone and a 60Hz
   * laptop produce identical times for identical input — non-negotiable when
   * the output is a leaderboard.
   */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // A backgrounded tab resumes with an enormous delta. Clamping stops it
      // being integrated into a run the player never made.
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;

      acc += dt;
      while (acc >= STEP) {
        advance(run.current, STEP);
        acc -= STEP;
      }

      if (surface.current) {
        const { ctx, w, h } = surface.current;
        drawTrack(ctx, run.current, w, h);
      }
      updateHud();

      if (run.current.phase === "done" && !settled.current) {
        settled.current = true;
        finish(run.current.finishTime ?? run.current.t);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // `finish` only changes between runs, when mode or player does, so the
    // accumulator is never reset mid-sprint.
  }, [updateHud, finish]);

  function beginRun(next: Mode) {
    run.current = createRun();
    settled.current = false;
    setFlash(null);
    setResult(null);
    setStarted(false);
    setMode(next);
    setScreen("run");
  }

  /**
   * Reopening the dash from the menu while already on the page should put the
   * player back at the board rather than leaving them wherever they were.
   *
   * A run in flight is deliberately not refunded: the attempt was spent at the
   * gun, and walking away from it is the same as any other bail.
   */
  useEffect(() => {
    function onReset() {
      run.current = createRun();
      settled.current = false;
      setScreen("lobby");
      setStarted(false);
      setResult(null);
      setFlash(null);
    }
    window.addEventListener(DASH_RESET, onReset);
    return () => window.removeEventListener(DASH_RESET, onReset);
  }, []);

  /**
   * An official run has to be claimed by somebody before it starts, so the
   * PIN gate stands between the button and the blocks. Nothing is spent here:
   * the attempt is only burned once the run actually begins.
   */
  function requestCombine() {
    setPinMode(hasPin(player) ? "enter" : "set");
    setScreen("pin");
  }

  const onTap = useCallback((side: Side) => {
    const outcome = tap(run.current, side);
    if (outcome === "fumble") {
      setFlash(side);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 180);
      return;
    }
    // First clean stride starts the clock — mirror that so the "tap to start"
    // overlay clears. Every later stride sets the same value, and React bails
    // out of an identical update, so this costs one render per run.
    if (outcome === "drive") setStarted(true);
  }, []);

  const left = attemptsLeft(board, player);
  const best = bestFor(board, player);
  const table = standings(
    board,
    players.map((p) => p.name),
  );

  return (
    <div
      className="relative flex min-h-screen flex-col justify-between"
      style={{
        paddingLeft: "var(--frame-inset)",
        paddingRight: "var(--frame-inset)",
        paddingTop: "calc(var(--frame-inset) + 44px)",
        paddingBottom: "var(--frame-bottom)",
        // The pads block their own gestures, but a fast tap landing just off
        // one lands here — and a double-tap zoom triggered mid-sprint persists
        // after you navigate away, which is what makes the whole site look
        // stuck afterwards. `manipulation` drops the zoom, keeps scrolling.
        touchAction: "manipulation",
      }}
    >
      {/* Live telemetry. Values are written straight to the DOM by the frame
          loop rather than through state, so a running clock costs no renders. */}
      <div className="flex items-start justify-between gap-x-6 px-2 pb-3">
        <Readout label="TIME" ref2={timeEl} accent wide />
        <div className="flex gap-x-6">
          <Readout label="YARDS" ref2={yardEl} />
          <Readout label="M/S" ref2={speedEl} />
        </div>
      </div>

      {/* A 40 seen side-on is a wide, short band. Capped rather than left to
          fill a tall phone screen, where it would strand the runner in a
          quarter of the frame under an empty sky. */}
      <div className="relative max-h-[36vh] min-h-[190px] flex-1 overflow-hidden rounded-[32px]">
        <TrackCanvas onContext={onContext} />
        <div className="hairline" />

        {screen === "lobby" && (
          <Lobby
            players={players}
            player={player}
            onPick={setPlayer}
            table={table}
          />
        )}

        {screen === "run" && !started && (
          <Overlay>
            <MonoLabel className="opacity-60">
              {mode === "combine" ? "OFFICIAL RUN — THIS ONE POSTS" : "PRACTICE"}
            </MonoLabel>
            <p className="type-card max-w-xs pt-3 text-center">
              Tap either pad to start. The clock starts with you.
            </p>
          </Overlay>
        )}

        {screen === "result" && result != null && (
          <Result
            time={result}
            mode={mode}
            player={player}
            best={best}
            left={left}
            rank={table.findIndex((r) => r.player === player) + 1}
          />
        )}
      </div>

      <div className="pt-3">
        {screen === "run" ? (
          <TapPads onTap={onTap} flash={flash} />
        ) : (
          <Controls
            screen={screen}
            mode={mode}
            left={left}
            onPractice={() => beginRun("practice")}
            onCombine={requestCombine}
            onLobby={() => setScreen("lobby")}
          />
        )}
      </div>

      {/* Alternation is the control scheme, so it is stated once, plainly,
          under the pads rather than buried in an instructions panel. */}
      <div className="flex justify-center px-2 pt-3">
        <MonoLabel className="block max-w-full text-center opacity-35">
          {screen === "run" && started
            ? "KEEP ALTERNATING"
            : "ALTERNATE PADS — SAME ONE TWICE IS A STUMBLE"}
        </MonoLabel>
      </div>

      {screen === "pin" && (
        <PinGate
          player={player}
          headshot={players.find((p) => p.name === player)?.headshot ?? ""}
          mode={pinMode}
          attemptsLeft={left}
          onVerified={() => {
            // Spending the attempt here, not at the finish, is what stops a
            // player quitting a bad start and trying again for free.
            if (startAttempt(player)) beginRun("combine");
            else setScreen("lobby");
          }}
          onCancel={() => setScreen("lobby")}
        />
      )}
    </div>
  );
}

function Readout({
  label,
  ref2,
  accent = false,
  wide = false,
}: {
  label: string;
  ref2: React.RefObject<HTMLSpanElement | null>;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col gap-y-1">
      <MonoLabel className="opacity-40">{label}</MonoLabel>
      <span
        className={cn(
          "font-[family-name:var(--font-hud)] tabular-nums",
          wide ? "text-4xl lg:text-6xl" : "text-xl lg:text-2xl",
          accent ? "text-volt" : "text-chalk",
        )}
      >
        <span ref={ref2}>0.00</span>
      </span>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-turf/70 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[2px]">
      {children}
    </div>
  );
}

function Lobby({
  players,
  player,
  onPick,
  table,
}: {
  players: { name: string; headshot: string }[];
  player: string;
  onPick: (name: string) => void;
  table: {
    player: string;
    best: number | null;
    used: number;
    abandoned: number;
  }[];
}) {
  return (
    <div className="bg-turf/85 absolute inset-0 overflow-y-auto backdrop-blur-[2px]">
      <div className="flex flex-col gap-y-6 p-5 lg:p-8">
        <div>
          <MonoLabel className="opacity-40">WHO IS RUNNING</MonoLabel>
          <div className="flex flex-wrap gap-2 pt-3">
            {players.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onPick(p.name)}
                className={cn(
                  "flex items-center gap-x-2 rounded-full border py-1.5 pr-4 pl-1.5 transition-colors duration-200",
                  p.name === player
                    ? "border-volt bg-volt text-turf"
                    : "border-chalk/25 text-chalk hover:border-chalk/60",
                )}
              >
                {/* The portraits are matted to transparent and are mostly
                    dark, so they need a lighter disc behind them to read at
                    this size — on the volt chip the fill supplies it. */}
                <Image
                  src={asset(p.headshot)}
                  alt=""
                  width={28}
                  height={28}
                  className={cn(
                    "h-7 w-7 rounded-full object-cover",
                    p.name === player ? "bg-turf/20" : "bg-chalk/15",
                  )}
                />
                <span className="type-hud">{p.name.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <MonoLabel className="opacity-40">POSTED TIMES</MonoLabel>
          <div className="flex flex-col gap-y-1 pt-3">
            {table.map((row, i) => (
              <div
                key={row.player}
                className={cn(
                  "flex items-center gap-x-3 rounded-full px-3 py-2",
                  row.player === player && "bg-chalk/5",
                )}
              >
                <MonoLabel className="text-volt w-6 opacity-70">
                  {row.best == null ? "—" : String(i + 1).padStart(2, "0")}
                </MonoLabel>
                <span className="type-body flex-1">{row.player}</span>
                <MonoLabel className="opacity-40">
                  {`${row.used}/${MAX_ATTEMPTS}`}
                </MonoLabel>
                <span
                  className={cn(
                    "font-[family-name:var(--font-hud)] w-16 text-right text-base tabular-nums",
                    row.best == null && "opacity-25",
                  )}
                >
                  {/* An attempt spent without a finish reads DNF rather than
                      as an empty slot — it is gone either way. */}
                  {row.best != null
                    ? formatTime(row.best)
                    : row.abandoned > 0
                      ? "DNF"
                      : "--.--"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Result({
  time,
  mode,
  player,
  best,
  left,
  rank,
}: {
  time: number;
  mode: Mode;
  player: string;
  best: number | null;
  left: number;
  rank: number;
}) {
  const posted = mode === "combine";
  const isBest = posted && best != null && Math.abs(best - time) < 0.001;

  return (
    <Overlay>
      <MonoLabel className="opacity-50">
        {posted ? `POSTED — ${player.toUpperCase()}` : "PRACTICE — NOT POSTED"}
      </MonoLabel>
      <div className="type-stat text-volt pt-2 tabular-nums">{formatTime(time)}</div>
      <MonoLabel className="opacity-50">SECONDS OVER 40 YARDS</MonoLabel>

      {posted && (
        <div className="flex flex-col items-center gap-y-1 pt-5">
          <MonoLabel className={isBest ? "text-volt" : "opacity-60"}>
            {isBest ? `NEW BEST — CURRENTLY ${ordinal(rank)}` : `BEST STANDS AT ${formatTime(best ?? time)}`}
          </MonoLabel>
          <MonoLabel className="opacity-40">
            {left === 0 ? "NO ATTEMPTS LEFT" : `${left} ATTEMPT${left === 1 ? "" : "S"} LEFT`}
          </MonoLabel>
        </div>
      )}
    </Overlay>
  );
}

function Controls({
  screen,
  mode,
  left,
  onPractice,
  onCombine,
  onLobby,
}: {
  screen: Screen;
  mode: Mode;
  left: number;
  onPractice: () => void;
  onCombine: () => void;
  onLobby: () => void;
}) {
  /*
   * Two tall actions side by side, everything else full width beneath them.
   * Giving Exit its own row is what buys the pair their width — sharing one
   * row with it left three targets competing for a phone's screen, and the two
   * that matter were the ones getting squeezed.
   *
   * `h-16` against the 42px these used to stand is the requested half again.
   * It also leaves room for two lines, which the attempts label needs once the
   * button is only half the screen wide.
   */
  return (
    <div className="flex flex-col gap-y-2">
      <div className="grid grid-cols-2 gap-2">
        <PillButton
          variant="solid"
          onClick={onPractice}
          className="h-16 w-full justify-center px-3 text-center"
        >
          {screen === "result" && mode === "practice" ? "Practice again" : "Practice"}
        </PillButton>

        {left > 0 ? (
          <PillButton
            variant="accent"
            onClick={onCombine}
            className="h-16 w-full justify-center px-3 text-center"
          >
            {`Official run — ${left} left`}
          </PillButton>
        ) : (
          <span className="type-hud border-chalk/25 flex h-16 items-center justify-center rounded-full border px-3 text-center opacity-40">
            BOTH ATTEMPTS USED
          </span>
        )}
      </div>

      {screen === "result" && (
        <PillButton
          variant="outline"
          onClick={onLobby}
          className="w-full justify-center"
        >
          Board
        </PillButton>
      )}

      {/* The logo in the frame already goes home, but nobody should have to
          discover that to leave a full-screen game. */}
      <PillButton variant="outline" href="/" className="w-full justify-center">
        Exit
      </PillButton>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
