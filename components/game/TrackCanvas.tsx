"use client";

import { useEffect, useRef } from "react";

/**
 * The canvas element and nothing else: sizing, device-pixel scaling, and a
 * handle back to the 2D context. Drawing lives in lib/drawTrack.ts and the
 * frame loop lives in the parent, so this file never has an opinion about the
 * game.
 *
 * Sizing a canvas is fiddlier than it looks, and both easy approaches fail
 * here:
 *
 *   - `h-full` is a percentage height, which needs a definite containing
 *     block. The parent is a flex item sized by `flex-1`, so it resolves to
 *     zero and the backing store is created zero-tall.
 *   - `absolute inset-0` does not stretch a *replaced* element. With
 *     `width: auto` a canvas falls back to its intrinsic size — the width and
 *     height attributes — so writing those attributes grows the element that
 *     the resize observer is watching, and it doubles on every pass.
 *
 * So: measure a plain wrapper div, which does stretch, and give the canvas an
 * explicit pixel size. Nothing then depends on the canvas's own layout, and
 * the feedback loop cannot form.
 */
export function TrackCanvas({
  onContext,
}: {
  /** Called with the context and CSS-pixel size on mount and on every resize. */
  onContext: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Held in a ref so the resize observer never needs re-subscribing when the
  // parent re-renders with a new closure. Assigned in an effect rather than
  // during render — a render can be thrown away, and a ref written by a
  // discarded render would point at a callback that never mounted.
  const cb = useRef(onContext);
  useEffect(() => {
    cb.current = onContext;
  });

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function size() {
      if (!box || !canvas || !ctx) return;
      const { width, height } = box.getBoundingClientRect();
      if (width < 1 || height < 1) return;

      // Cap DPR at 2: a 3x phone gains nothing visible here and pays for it in
      // fill rate on the one device class that can least afford it.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(width);
      const h = Math.round(height);

      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cb.current(ctx, w, h);
    }

    size();
    const ro = new ResizeObserver(size);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" aria-hidden="true" />
    </div>
  );
}
