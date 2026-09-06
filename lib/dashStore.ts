/**
 * Where posted 40 times live.
 *
 * An attempt has two halves: `startAttempt` spends it the instant an official
 * run begins, and `completeAttempt` fills in the time if the runner finishes.
 * Splitting it that way is what makes "declare before you run" hold — see the
 * note on the Attempt type.
 *
 * V1 keeps all of it in `localStorage`, which means it is per-device: times do
 * not reach anyone else, and clearing site data hands back both attempts. That
 * is a placeholder, not the design. Everything the rest of the app needs goes
 * through the exported functions here, so moving to a real shared store is a
 * change to this file and nothing else.
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

/**
 * An attempt is spent when the run *starts*, not when it finishes, so `time`
 * is null until the runner crosses the line. Abandoning an official run —
 * quitting a bad start, closing the tab, a browser crash — leaves the attempt
 * on the board with no time, which is the whole point: if bailing were free,
 * a player could keep restarting until they liked their start and "declare
 * before you run" would mean nothing.
 */
export type Attempt = { time: number | null; at: string };
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

/**
 * The time that counts: the faster of the *finished* runs. Attempts still in
 * flight or abandoned carry no time and must be filtered out — `Math.min`
 * would quietly coerce a null to zero and hand back a world record.
 */
export function bestFor(board: Board, player: string): number | null {
  const times = attemptsFor(board, player)
    .map((a) => a.time)
    .filter((t): t is number => t != null);
  return times.length ? Math.min(...times) : null;
}

/**
 * Spends an attempt, before a single stride is taken. Returns false when the
 * player has none left, so the caller can refuse to start the run.
 *
 * This is deliberately the irreversible half. Everything after it — the run
 * itself, whether it is ever completed — only decides what time fills the slot
 * that has already been claimed.
 */
export function startAttempt(player: string): boolean {
  const board = getSnapshot();
  const existing = attemptsFor(board, player);
  if (existing.length >= MAX_ATTEMPTS) return false;

  write({
    ...board,
    [player]: [...existing, { time: null, at: new Date().toISOString() }],
  });
  return true;
}

/**
 * Records a finishing time against the attempt already in flight, which is
 * always the most recently started one. It fills that slot rather than
 * appending, so a finish can never create an attempt `startAttempt` did not
 * authorise.
 *
 * Only the last attempt is eligible, and only while it is still unfinished.
 * Searching backwards for any pending slot would let a completed run reach
 * past itself and fill in an *earlier abandoned* attempt — quietly undoing the
 * bail that this whole two-phase split exists to make permanent.
 */
export function completeAttempt(player: string, time: number): void {
  if (!(time >= PLAUSIBLE.min && time <= PLAUSIBLE.max)) return;

  const board = getSnapshot();
  const existing = attemptsFor(board, player);
  const last = existing.length - 1;
  if (last < 0 || existing[last].time != null) return;

  const next = existing.slice();
  next[last] = { ...next[last], time };
  write({ ...board, [player]: next });
}

/** Attempts that were started and never finished. */
export function abandonedBy(board: Board, player: string): number {
  return attemptsFor(board, player).filter((a) => a.time == null).length;
}

/**
 * Players sorted by their counting time, anyone without one last. `used`
 * counts attempts spent, finished or not, because that is what the player has
 * left to spend.
 */
export function standings(
  board: Board,
  players: string[],
): { player: string; best: number | null; used: number; abandoned: number }[] {
  return players
    .map((player) => ({
      player,
      best: bestFor(board, player),
      used: attemptsFor(board, player).length,
      abandoned: abandonedBy(board, player),
    }))
    .sort((a, b) => {
      if (a.best == null && b.best == null) return 0;
      if (a.best == null) return 1;
      if (b.best == null) return -1;
      return a.best - b.best;
    });
}
