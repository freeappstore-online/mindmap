// Core data model for mind map documents.
// All coordinates are SVG coordinates in the unbounded mind-map plane.

export type NodeColor =
  | "blue"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "teal"
  | "slate"
  | "fuchsia";

export const NODE_COLORS: NodeColor[] = [
  "blue",
  "violet",
  "rose",
  "amber",
  "emerald",
  "teal",
  "slate",
  "fuchsia",
];

export interface MindNode {
  id: string;
  text: string;
  parentId: string | null;
  /** Stable left-to-right ordering among siblings. */
  order: number;
  color: NodeColor;
  /** Single grapheme (emoji) or empty. */
  icon: string;
  /** Optional manual position override; if set, auto-layout is bypassed for this subtree root. */
  manualX?: number;
  manualY?: number;
  /** Collapsed nodes hide their descendants. */
  collapsed?: boolean;
}

export interface MindMap {
  id: string;
  name: string;
  rootId: string;
  nodes: Record<string, MindNode>;
  createdAt: number;
  updatedAt: number;
}

export interface MindMapIndexEntry {
  id: string;
  name: string;
  updatedAt: number;
}

/** Computed layout for a node — derived, never persisted. */
export interface LaidOutNode {
  node: MindNode;
  x: number;
  y: number;
  /** Total width of subtree (for layout). */
  subtreeHeight: number;
  /** Depth from root (root = 0). */
  depth: number;
}
