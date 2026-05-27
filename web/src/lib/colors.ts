import type { NodeColor } from "../types/mindmap";

interface ColorPair {
  fill: string;
  stroke: string;
  text: string;
  fillDark: string;
  strokeDark: string;
  textDark: string;
}

const PALETTE: Record<NodeColor, ColorPair> = {
  blue: {
    fill: "#dbeafe",
    stroke: "#2563eb",
    text: "#1e3a8a",
    fillDark: "#1e3a8a",
    strokeDark: "#60a5fa",
    textDark: "#dbeafe",
  },
  violet: {
    fill: "#ede9fe",
    stroke: "#7c3aed",
    text: "#4c1d95",
    fillDark: "#4c1d95",
    strokeDark: "#a78bfa",
    textDark: "#ede9fe",
  },
  rose: {
    fill: "#ffe4e6",
    stroke: "#e11d48",
    text: "#881337",
    fillDark: "#881337",
    strokeDark: "#fb7185",
    textDark: "#ffe4e6",
  },
  amber: {
    fill: "#fef3c7",
    stroke: "#d97706",
    text: "#78350f",
    fillDark: "#78350f",
    strokeDark: "#fbbf24",
    textDark: "#fef3c7",
  },
  emerald: {
    fill: "#d1fae5",
    stroke: "#059669",
    text: "#064e3b",
    fillDark: "#064e3b",
    strokeDark: "#34d399",
    textDark: "#d1fae5",
  },
  teal: {
    fill: "#ccfbf1",
    stroke: "#0d9488",
    text: "#134e4a",
    fillDark: "#134e4a",
    strokeDark: "#2dd4bf",
    textDark: "#ccfbf1",
  },
  slate: {
    fill: "#e2e8f0",
    stroke: "#475569",
    text: "#0f172a",
    fillDark: "#1e293b",
    strokeDark: "#94a3b8",
    textDark: "#e2e8f0",
  },
  fuchsia: {
    fill: "#fae8ff",
    stroke: "#c026d3",
    text: "#701a75",
    fillDark: "#701a75",
    strokeDark: "#e879f9",
    textDark: "#fae8ff",
  },
};

export function colorFor(c: NodeColor, dark: boolean): ColorPair {
  const p = PALETTE[c];
  if (!dark) return p;
  return {
    ...p,
    fill: p.fillDark,
    stroke: p.strokeDark,
    text: p.textDark,
    fillDark: p.fillDark,
    strokeDark: p.strokeDark,
    textDark: p.textDark,
  };
}

export function colorHex(c: NodeColor, kind: "fill" | "stroke" | "text", dark: boolean): string {
  return colorFor(c, dark)[kind];
}
