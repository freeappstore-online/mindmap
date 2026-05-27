import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LaidOutNode, MindMap } from "../types/mindmap";
import { laidOutBounds, layoutMap, nodeHeight, nodeWidth } from "../lib/layout";
import { colorFor } from "../lib/colors";
import MindNodeShape from "./MindNodeShape";
import { useViewport } from "../hooks/useViewport";

interface Props {
  map: MindMap;
  selectedId: string | null;
  searchTerm: string;
  dark: boolean;
  onSelect: (id: string | null) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (siblingId: string) => void;
  onDelete: (id: string) => void;
  onSetText: (id: string, text: string) => void;
  onSetManualPosition: (id: string, x: number | undefined, y: number | undefined) => void;
  /** Receives a function that returns the live SVG element — for export. */
  registerSvgRef: (ref: { current: SVGSVGElement | null }) => void;
  /** Receives fit-to-screen function. */
  registerFitFn: (fn: () => void) => void;
}

export default function MindMapCanvas({
  map,
  selectedId,
  searchTerm,
  dark,
  onSelect,
  onAddChild,
  onAddSibling,
  onDelete,
  onSetText,
  onSetManualPosition,
  registerSvgRef,
  registerFitFn,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { vp, zoomIn, zoomOut, resetZoom, centerOn, fitTo, bind } = useViewport();
  const [editingId, setEditingId] = useState<string | null>(null);

  const laid = useMemo<LaidOutNode[]>(() => layoutMap(map), [map]);
  const laidById = useMemo(() => {
    const m = new Map<string, LaidOutNode>();
    for (const l of laid) m.set(l.node.id, l);
    return m;
  }, [laid]);

  // Search matching.
  const matches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return new Set<string>();
    const out = new Set<string>();
    for (const n of Object.values(map.nodes)) {
      if (n.text.toLowerCase().includes(term)) out.add(n.id);
    }
    return out;
  }, [map.nodes, searchTerm]);

  // Auto-center first match.
  useEffect(() => {
    if (matches.size === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const firstId = Array.from(matches)[0];
    if (!firstId) return;
    const l = laidById.get(firstId);
    if (!l) return;
    centerOn(l.x, l.y, container);
    onSelect(firstId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Expose svg ref to parent.
  useEffect(() => {
    registerSvgRef(svgRef);
  }, [registerSvgRef]);

  // Expose fit-to-screen.
  useEffect(() => {
    const fn = () => {
      const c = containerRef.current;
      if (!c) return;
      fitTo(laidOutBounds(laid, map.rootId), c, 80);
    };
    registerFitFn(fn);
  }, [fitTo, laid, map.rootId, registerFitFn]);

  // Initial fit on mount.
  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current) return;
    if (!containerRef.current) return;
    fitTo(laidOutBounds(laid, map.rootId), containerRef.current, 80);
    didInitialFit.current = true;
  }, [fitTo, laid, map.rootId]);

  // Keyboard handling.
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // Don't hijack when editing in a textarea / input outside of editor mode.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const inField =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
      if (inField) {
        if (editingId === null && e.key === "Escape") onSelect(null);
        return;
      }
      if (!selectedId) return;
      const sel = map.nodes[selectedId];
      if (!sel) return;

      if (e.key === "Tab") {
        e.preventDefault();
        onAddChild(selectedId);
        return;
      }
      if (e.key === "Enter") {
        if (selectedId === map.rootId) {
          e.preventDefault();
          onAddChild(selectedId);
          return;
        }
        e.preventDefault();
        onAddSibling(selectedId);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId === map.rootId) return;
        e.preventDefault();
        onDelete(selectedId);
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        setEditingId(selectedId);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = navigate(selectedId, e.key, map, laidById);
        if (next) onSelect(next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, laidById, map, onAddChild, onAddSibling, onDelete, onSelect, selectedId]);

  // Bind pan/zoom to container.
  const setContainer = useCallback(
    (el: HTMLDivElement | null) => {
      containerRef.current = el;
      bind(el);
    },
    [bind],
  );

  // Drag-to-position
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    moved: boolean;
    startSvgX: number;
    startSvgY: number;
    nodeStartX: number;
    nodeStartY: number;
  } | null>(null);

  const screenToSvg = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return { x: (sx - vp.tx) / vp.scale, y: (sy - vp.ty) / vp.scale };
    },
    [vp.scale, vp.tx, vp.ty],
  );

  const onNodePointerDown = useCallback(
    (id: string, e: React.PointerEvent<SVGGElement>) => {
      if (e.button !== 0) return;
      if (editingId === id) return;
      const l = laidById.get(id);
      if (!l) return;
      const svg = screenToSvg(e.clientX, e.clientY);
      dragRef.current = {
        id,
        pointerId: e.pointerId,
        moved: false,
        startSvgX: svg.x,
        startSvgY: svg.y,
        nodeStartX: l.x,
        nodeStartY: l.y,
      };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [editingId, laidById, screenToSvg],
  );

  // Global handlers for drag finalize.
  useEffect(() => {
    const onMove = (e: PointerEvent): void => {
      const d = dragRef.current;
      if (!d) return;
      const svg = screenToSvg(e.clientX, e.clientY);
      const dx = svg.x - d.startSvgX;
      const dy = svg.y - d.startSvgY;
      if (!d.moved && Math.hypot(dx, dy) < 4) return;
      d.moved = true;
      // Show drag in real-time via manual position override.
      onSetManualPosition(d.id, d.nodeStartX + dx, d.nodeStartY + dy);
    };
    const onUp = (): void => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onSetManualPosition, screenToSvg]);

  // SVG viewBox: we keep viewBox at the container size in screen px and apply a single
  // group transform for pan/zoom. This makes export easy.
  const [size, setSize] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={setContainer}
      className="relative w-full h-full overflow-hidden"
      style={{ background: "var(--paper)", touchAction: "none" }}
    >
      <svg
        ref={svgRef}
        className="mm-svg block"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="mm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle
              cx={1}
              cy={1}
              r={1}
              fill={dark ? "#262626" : "#e5e7eb"}
            />
          </pattern>
        </defs>
        {/* Grid extends well beyond viewport */}
        <rect
          x={-2000}
          y={-2000}
          width={Math.max(size.w, 4000) + 4000}
          height={Math.max(size.h, 4000) + 4000}
          fill="url(#mm-grid)"
        />

        <g transform={`translate(${vp.tx}, ${vp.ty}) scale(${vp.scale})`}>
          {/* Edges first so they render behind nodes. */}
          {laid.map((l) => {
            if (!l.node.parentId) return null;
            const parent = laidById.get(l.node.parentId);
            if (!parent) return null;
            return (
              <EdgeCurve
                key={`e-${l.node.id}`}
                fromX={parent.x}
                fromY={parent.y}
                fromW={nodeWidth(parent.node.text, parent.node.id === map.rootId)}
                fromH={nodeHeight(parent.node.text, parent.node.id === map.rootId)}
                toX={l.x}
                toY={l.y}
                toW={nodeWidth(l.node.text, false)}
                toH={nodeHeight(l.node.text, false)}
                color={colorFor(l.node.color, dark).stroke}
              />
            );
          })}

          {laid.map((l) => (
            <MindNodeShape
              key={l.node.id}
              laid={l}
              isRoot={l.node.id === map.rootId}
              isSelected={selectedId === l.node.id}
              isMatch={matches.has(l.node.id) && selectedId !== l.node.id}
              isEditing={editingId === l.node.id}
              dark={dark}
              onPointerDown={(e) => onNodePointerDown(l.node.id, e)}
              onSelect={() => onSelect(l.node.id)}
              onBeginEdit={() => setEditingId(l.node.id)}
              onCommitEdit={(text) => {
                onSetText(l.node.id, text);
                setEditingId(null);
              }}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </g>
      </svg>

      {/* Zoom controls */}
      <div
        data-mm-ui
        className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-lg border shadow-sm"
        style={{
          background: "var(--panel)",
          borderColor: "var(--line)",
        }}
      >
        <button
          type="button"
          onClick={zoomIn}
          className="w-9 h-9 flex items-center justify-center text-base font-semibold"
          style={{ color: "var(--ink)" }}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="w-9 h-9 flex items-center justify-center text-base font-semibold"
          style={{
            color: "var(--ink)",
            borderTop: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
          }}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="w-9 h-9 flex items-center justify-center text-[10px] font-semibold"
          style={{ color: "var(--ink)" }}
          aria-label="Reset zoom"
        >
          1:1
        </button>
      </div>

      {/* Footer hints */}
      <div
        data-mm-ui
        className="absolute bottom-4 left-4 text-xs px-3 py-2 rounded-lg border"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(8px)",
          borderColor: "var(--line)",
          color: "var(--muted)",
        }}
      >
        Tab add child · Enter add sibling · Del remove · F2 edit · Arrows navigate · Drag empty space to pan
      </div>
    </div>
  );
}

function EdgeCurve({
  fromX,
  fromY,
  fromW,
  fromH,
  toX,
  toY,
  toW,
  toH,
  color,
}: {
  fromX: number;
  fromY: number;
  fromW: number;
  fromH: number;
  toX: number;
  toY: number;
  toW: number;
  toH: number;
  color: string;
}) {
  // Anchor: edge of parent rect facing the child, and edge of child rect facing the parent.
  const fx = toX > fromX ? fromX + fromW / 2 : fromX - fromW / 2;
  const tx = toX > fromX ? toX - toW / 2 : toX + toW / 2;
  const fy = fromY;
  const ty = toY;
  // Smooth cubic bezier: control points horizontally midway between parent and child.
  const mid = (fx + tx) / 2;
  const d = `M ${fx} ${fy} C ${mid} ${fy}, ${mid} ${ty}, ${tx} ${ty}`;
  // Suppress unused vars used for future spacing tweaks.
  void fromH;
  void toH;
  return <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />;
}

/**
 * Spatial navigation: move selection to the nearest node in the requested cardinal direction.
 * Uses the rendered layout (laidById) so it respects manual drag positions.
 */
function navigate(
  fromId: string,
  key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
  map: MindMap,
  laidById: Map<string, LaidOutNode>,
): string | null {
  const from = laidById.get(fromId);
  if (!from) return null;
  let best: { id: string; score: number } | null = null;
  for (const l of laidById.values()) {
    if (l.node.id === fromId) continue;
    const dx = l.x - from.x;
    const dy = l.y - from.y;
    const align = (() => {
      switch (key) {
        case "ArrowRight":
          if (dx <= 0) return null;
          return dx + Math.abs(dy) * 1.5;
        case "ArrowLeft":
          if (dx >= 0) return null;
          return -dx + Math.abs(dy) * 1.5;
        case "ArrowDown":
          if (dy <= 0) return null;
          return dy + Math.abs(dx) * 1.5;
        case "ArrowUp":
          if (dy >= 0) return null;
          return -dy + Math.abs(dx) * 1.5;
      }
    })();
    if (align === null) continue;
    if (!best || align < best.score) best = { id: l.node.id, score: align };
  }
  if (best) return best.id;
  // Fallback to hierarchical movement.
  const node = map.nodes[fromId];
  if (!node) return null;
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return node.parentId;
  }
  return null;
}
