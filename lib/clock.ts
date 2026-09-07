/**
 * A once-a-second tick, shared by everything that counts down.
 *
 * An external store rather than component state because "now" is exactly that:
 * a value that lives outside React and changes on its own. It also sidesteps
 * the two traps a naive countdown falls into — setting state synchronously
 * inside an effect, and reading the clock during render, which produces server
 * HTML that cannot match the client and throws the tree away.
 *
 * One interval serves every subscriber, and it stops when the last one leaves,
 * so a countdown scrolled out of existence is not still waking the tab.
 */

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

export function subscribeToClock(onChange: () => void): () => void {
  listeners.add(onChange);
  if (timer === null) {
    timer = setInterval(() => {
      now = Date.now();
      for (const listener of listeners) listener();
    }, 1000);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Memoised: React compares this by identity on every render. */
export function getClock(): number {
  return now;
}

/**
 * There is no meaningful "now" at build time — this site is a static export,
 * so a real timestamp here would be frozen at whenever the deploy ran. Zero is
 * a sentinel the countdown renders as dashes until the client takes over.
 */
export function getServerClock(): number {
  return 0;
}
