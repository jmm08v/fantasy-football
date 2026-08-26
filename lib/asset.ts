/**
 * Prefixes a path in `public/` with the deployment base path.
 *
 * Next rewrites its own `_next/*` URLs for `basePath` automatically, but a
 * literal string like "/media/hero.mp4" is invisible to it — that one would
 * 404 on GitHub Pages while working perfectly in local dev. Route every
 * `public/` asset through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
