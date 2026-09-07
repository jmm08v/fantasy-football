/**
 * Where posted 40 times live: one Postgres table, shared by everyone.
 *
 * An attempt still has two halves — claimed when the run starts, filled in
 * when the runner crosses the line — but both halves are now rows the whole
 * league can see, and the rules are enforced by the database rather than by
 * this file. See lib/dashApi.ts for what Postgres refuses and what it does
 * not.
 *
 * The shape below is unchanged from the localStorage version on purpose: the
 * pure helpers at the bottom, and every component reading them, work exactly
 * as before. Only where the rows come from has moved.
 */

import { fetchRows, finishRow, startRow, type Row } from "./dashApi";

/** Two posted runs each, best one counts. Enforced by a trigger, not here. */
export const MAX_ATTEMPTS = 2;

export type Attempt = { time: number | null; at: string };
export type Board = Record<string, Attempt[]>;

export type Snapshot = {
  board: Board;
  /** False until the first fetch lands, so an empty board is not read as
   *  "nobody has run yet" while the request is still in flight. */
  loaded: boolean;
  error: string | null;
};

const EMPTY: Snapshot = { board: {}, loaded: false, error: null };
const SERVER: Snapshot = { board: {}, loaded: false, error: null };

let snapshot: Snapshot = EMPTY;
const listeners = new Set<() => void>();
let poll: ReturnType<typeof setInterval> | null = null;

/** The attempt this device has in flight, so finishing can name its row. */
let inFlight: number | null = null;

function emit(next: Snapshot): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

function toBoard(rows: Row[]): Board {
  const board: Board = {};
  for (const row of rows) {
    (board[row.player] ??= []).push({
      time: row.seconds == null ? null : Number(row.seconds),
      at: row.started_at,
    });
  }
  return board;
}

export async function refresh(): Promise<void> {
  try {
    emit({ board: toBoard(await fetchRows()), loaded: true, error: null });
  } catch {
    // Keep whatever was last shown rather than blanking the board on one
    // failed poll — a dropped request is not news that everyone's times are
    // gone.
    emit({ ...snapshot, loaded: true, error: "Can't reach the board" });
  }
}

/**
 * Everyone watching the board sees everyone else's runs land, which is the
 * whole point of it being shared. Eight seconds is often enough to feel live
 * during a session and rare enough to be free.
 */
export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (poll === null) {
    void migrateLocalTimes().then(refresh);
    poll = setInterval(() => void refresh(), 8000);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && poll !== null) {
      clearInterval(poll);
      poll = null;
    }
  };
}

export function getSnapshot(): Snapshot {
  return snapshot;
}

export function getServerSnapshot(): Snapshot {
  return SERVER;
}

/** Claims an attempt. False means the server refused — usually the cap. */
export async function startAttempt(player: string): Promise<boolean> {
  const id = await startRow(player);
  if (id == null) {
    await refresh();
    return false;
  }
  inFlight = id;
  await refresh();
  return true;
}

/** Records a time against the attempt this device claimed. */
export async function completeAttempt(player: string, time: number): Promise<void> {
  if (inFlight == null) return;
  const id = inFlight;
  inFlight = null;
  await finishRow(id, Number(time.toFixed(2)));
  await refresh();
}

/**
 * One-time lift of times run before the board was shared.
 *
 * They were stranded on whoever's phone recorded them, and re-running is not
 * a fair ask of someone who already went. Each is replayed as a claim and a
 * finish, so it costs an attempt exactly as it would have at the time. The
 * flag is per-device because the times are: two people migrating do not
 * collide, and the attempt cap in Postgres is what stops a double lift from
 * inflating anyone's count.
 */
const MIGRATED_FLAG = "hutt-hutt-dash-migrated-v1";
/**
 * v2 only. v1 holds attempts from before the league-wide reset, which were
 * deliberately discarded — lifting them here would quietly undo that reset
 * and hand people back times they were told they had lost.
 */
const LOCAL_KEY = "hutt-hutt-dash-v2";

async function migrateLocalTimes(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MIGRATED_FLAG)) return;

    const times: { player: string; time: number }[] = [];
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const board = JSON.parse(raw) as Board;
      for (const [player, attempts] of Object.entries(board)) {
        for (const attempt of attempts) {
          if (attempt.time != null) times.push({ player, time: attempt.time });
        }
      }
    }

    // Mark before uploading, not after: a failure partway through should not
    // leave a device that re-lifts the same times on every reload.
    window.localStorage.setItem(MIGRATED_FLAG, new Date().toISOString());

    for (const { player, time } of times) {
      const id = await startRow(player);
      if (id != null) await finishRow(id, Number(time.toFixed(2)));
    }
  } catch {
    // Migration is a courtesy. Never let it stop the board from loading.
  }
}

/* ------------------------------------------------------------------ *
 * Pure helpers over a Board. Unchanged from the local version.
 * ------------------------------------------------------------------ */

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
