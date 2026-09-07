/**
 * Who is claiming this run.
 *
 * A player gates an official run behind a four-digit PIN — the last four of
 * their phone number, so there is nothing new to remember.
 *
 * WHERE THE PINS LIVE MATTERS, AND THEY ARE NOT IN THIS REPO.
 *
 * The site is a static export on a public repository. Any check performed in
 * the browser needs its answers in the browser, so a committed list of the
 * league's last-four digits would be readable by anyone on the internet and
 * would stay in git history permanently. Hashing that list would not help:
 * four digits is ten thousand possibilities, and every hash can be enumerated
 * instantly. So PINs are enrolled by each player on their first official run
 * and stored only as a hash, on their own device.
 *
 * That means this is a claim of identity, not proof of it — the same standing
 * as the attempt counter next to it, and for the same reason. Both become real
 * the moment there is a server to check them, and lib/dashStore.ts and this
 * file are the two seams where that swap happens. Until then it stops the
 * accidents (running as whoever the picker was left on) rather than the
 * determined.
 */

/**
 * Reset alongside the board, and deliberately so. A PIN enrolled during
 * testing would otherwise survive the wipe, and since nobody can look a hash
 * up and the UI exposes no way to clear one, whoever held it would be locked
 * out of their own attempts with no recovery. Everyone re-enrols on their
 * first official run, which is a prompt rather than a problem.
 */
const KEY = "hutt-hutt-dash-pins-v2";

export const PIN_LENGTH = 4;

/** player → SHA-256 of a salted PIN. The PIN itself is never stored. */
type Pins = Record<string, string>;

function read(): Pins {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pins) : {};
  } catch {
    return {};
  }
}

function write(pins: Pins): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pins));
  } catch {
    // Storage refused. The player will simply be asked to set a PIN again.
  }
}

/**
 * The player name is mixed in so the same four digits produce a different
 * hash for each person — otherwise two players sharing a last-four would be
 * visibly identical in storage.
 */
async function digest(player: string, pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`hutt-hutt:40:${player}:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/** Whether this device has ever seen a PIN for this player. */
export function hasPin(player: string): boolean {
  return Boolean(read()[player]);
}

export async function enrollPin(player: string, pin: string): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const pins = read();
  write({ ...pins, [player]: await digest(player, pin) });
  return true;
}

export async function verifyPin(player: string, pin: string): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const stored = read()[player];
  if (!stored) return false;
  return stored === (await digest(player, pin));
}

/**
 * Forgetting a PIN would otherwise lock a player out of their own attempts
 * with no way back, since nobody can look the hash up. Clearing it costs
 * nothing today because the PIN is only a claim; when a server holds the
 * truth this should become a commissioner action instead.
 */
export function clearPin(player: string): void {
  const pins = read();
  delete pins[player];
  write(pins);
}
