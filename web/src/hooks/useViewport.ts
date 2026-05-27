import { useCallback, useEffect, useRef, useState } from "react";

export interface Viewport {
  /** Pan offset in screen px (translation). */
  tx: number;
  ty: number;
  /** Zoom scale, 1 = 100%. */
  scale: number;
}

export interface ViewportApi {
  vp: Viewport;
  setVp: (v: Viewport) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  /** Center the viewport on a given SVG coordinate (mind-map plane). */
  centerOn: (x: number, y: number, container: HTMLElement) => void;
  /** Fit the given bounds (in mind-map plane coords) into a container. */
  fitTo: (
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    container: HTMLElement,
    padding?: number,
  ) => void;
  /** Mount pan/wheel handlers on the given container ref. */
  bind: (el: HTMLElement | null) => void;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

export function useViewport(): ViewportApi {
  const [vp, setVp] = useState<Viewport>({ tx: 0, ty: 0, scale: 1 });
  const vpRef = useRef(vp);
  vpRef.current = vp;
  const elRef = useRef<HTMLElement | null>(null);

  const zoomBy = useCallback((factor: number, cx?: number, cy?: number) => {
    setVp((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
      if (next === prev.scale) return prev;
      if (cx === undefined || cy === undefined) {
        return { ...prev, scale: next };
      }
      // Zoom around (cx, cy) screen point: keep that point invariant.
      const k = next / prev.scale;
      return {
        scale: next,
        tx: cx - (cx - prev.tx) * k,
        ty: cy - (cy - prev.ty) * k,
      };
    });
  }, []);

  const zoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.2), [zoomBy]);
  const resetZoom = useCallback(() => setVp({ tx: 0, ty: 0, scale: 1 }), []);

  const centerOn = useCallback((x: number, y: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    setVp((prev) => ({
      ...prev,
      tx: rect.width / 2 - x * prev.scale,
      ty: rect.height / 2 - y * prev.scale,
    }));
  }, []);

  const fitTo = useCallback(
    (
      bounds: { minX: number; minY: number; maxX: number; maxY: number },
      container: HTMLElement,
      padding = 60,
    ) => {
      const rect = container.getBoundingClientRect();
      const w = bounds.maxX - bounds.minX;
      const h = bounds.maxY - bounds.minY;
      if (w <= 0 || h <= 0) return;
      const scale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Math.min((rect.width - padding * 2) / w, (rect.height - padding * 2) / h)),
      );
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      setVp({ scale, tx: rect.width / 2 - cx * scale, ty: rect.height / 2 - cy * scale });
    },
    [],
  );

  // Wheel + drag-to-pan bindings.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent): void => {
      // ctrl+wheel = browser zoom; we treat all wheel as zoom inside canvas.
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const dir = e.deltaY > 0 ? 1 / 1.1 : 1.1;
      zoomBy(dir, cx, cy);
    };

    let panning = false;
    let startX = 0;
    let startY = 0;
    let startTx = 0;
    let startTy = 0;

    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Element | null;
      // Only pan when clicking the empty canvas (not on a node).
      if (target && (target.closest("[data-mm-node]") || target.closest("[data-mm-ui]"))) return;
      panning = true;
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      startTx = vpRef.current.tx;
      startTy = vpRef.current.ty;
      el.classList.add("is-panning");
    };
    const onPointerMove = (e: PointerEvent): void => {
      if (!panning) return;
      setVp({
        scale: vpRef.current.scale,
        tx: startTx + (e.clientX - startX),
        ty: startTy + (e.clientY - startY),
      });
    };
    const onPointerUp = (e: PointerEvent): void => {
      if (!panning) return;
      panning = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignored */
      }
      el.classList.remove("is-panning");
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [zoomBy]);

  const bind = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
  }, []);

  return { vp, setVp, zoomIn, zoomOut, resetZoom, centerOn, fitTo, bind };
}
