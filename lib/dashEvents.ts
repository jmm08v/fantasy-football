/**
 * The one message the site chrome sends the game.
 *
 * It lives alone in its own module on purpose: the menu lives in the root
 * layout and renders on every page, so importing it from the game component
 * would drag the simulation, the renderer and the store into the bundle for
 * pages that never show a track.
 *
 * A window event rather than shared state, because the two are not related by
 * the component tree — the chrome is a sibling of the page, not a parent — and
 * a context spanning them would exist solely to carry this one signal.
 */
export const DASH_RESET = "dash:reset";
