/**
 * Where posted 40 times live.
 *
 * V1 keeps them in `localStorage`, which means they are per-device: your times
 * do not reach anyone else, and clearing site data resets your two attempts.
 * That is a placeholder, not the design. Everything the rest of the app needs
 * goes through the four functions at the bottom of this file, so moving to a
 * real shared store is a change to this file and nothing else.
 *
 * When that store lands, two things must move server-side to actually mean
 * anything: the attempt counter (otherwise a private window grants fresh
 * attempts) and a sanity bound on submitted times.
 */

const KEY = "hutt-hutt-dash-v1";

/** Two posted runs each, best one counts — the Combine rule. */
export const MAX_ATTEMPTS = 2;

/**
 * A plausibility window. Anything outside it did not come from a person
 * playing the game, and is refused rather than stored.
 */
export const PLAUSIBLE = { min: 3.5, max: 60 } as const;

export type Attempt = { time: number; at: string };
export type Board = Record<string, Attempt[]>;

/** Stable identity, so a board-less render never looks like a changed board. */
const EMPTY: Board = {};

/**
 * The board is an external store rather than component state: it lives in
 * localStorage, it is read on the client only, and React needs a snapshot it
 * can trust not to change identity between calls. `useSyncExternalStore`
 * handles the server/client split without the read-in-an-effect dance that
 * causes a hydration mismatch.
 */
let cache: Board | null = null;
const listeners = new Set<() => void>();

function read(): Board {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Board) : EMPTY;
  } catch {
    // Private mode, disabled storage, corrupt JSON — an empty board is a
    // perfectly good answer and beats taking the page down.
    return EMPTY;
  }
}

function write(board: Board): void {
  cache = board;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(board));
    } catch {
      // Nothing to do — the run already happened and the UI already showed it.
    }
  }
  for (const l of listeners) l();
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Memoised: React calls this on every render and compares by identity. */
export function getSnapshot(): Board {
  if (cache === null) cache = read();
  return cache;
}

export function getServerSnapshot(): Board {
  return EMPTY;
}

/** Every posted attempt for one player, oldest first. */
export function attemptsFor(board: Board, player: string): Attempt[] {
  return board[player] ?? [];
}

export function attemptsLeft(board: Board, player: string): number {
  return Math.max(0, MAX_ATTEMPTS - attemptsFor(board, player).length);
}

/** The time that counts: the faster of the posted runs. */
export function bestFor(board: Board, player: string): number | null {
  const times = attemptsFor(board, player).map((a) => a.time);
  return times.length ? Math.min(...times) : null;
}

/**
 * Commits a run and notifies every subscriber. Refuses a third attempt and an
 * implausible time rather than trusting the caller — this is the one place a
 * result becomes permanent.
 */
export function postTime(player: string, time: number): void {
  const board = getSnapshot();
  const existing = attemptsFor(board, player);
  if (existing.length >= MAX_ATTEMPTS) return;
  if (!(time >= PLAUSIBLE.min && time <= PLAUSIBLE.max)) return;

  write({
    ...board,
    [player]: [...existing, { time, at: new Date().toISOString() }],
  });
}

/** Players sorted by their counting time, unposted players last. */
export function standings(
  board: Board,
  players: string[],
): { player: string; best: number | null; posted: number }[] {
  return players
    .map((player) => ({
      player,
      best: bestFor(board, player),
      posted: attemptsFor(board, player).length,
    }))
    .sort((a, b) => {
      if (a.best == null && b.best == null) return 0;
      if (a.best == null) return 1;
      if (b.best == null) return -1;
      return a.best - b.best;
    });
}
