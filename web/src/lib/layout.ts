import type { LaidOutNode, MindMap, MindNode } from "../types/mindmap";

// Layout constants (SVG coordinate units).
export const LAYOUT = {
  /** Horizontal step between depth levels. */
  levelGap: 200,
  /** Vertical spacing between sibling nodes (their centers). */
  siblingGap: 56,
  /** Approximate per-character width for label sizing. */
  charWidth: 8.5,
  /** Node corner padding. */
  nodePadX: 16,
  nodePadY: 10,
  nodeMinW: 80,
  nodeH: 40,
  rootNodeH: 56,
} as const;

export function nodeWidth(text: string, isRoot: boolean): number {
  const lines = text.split("\n");
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const baseW = Math.max(LAYOUT.nodeMinW, longest * LAYOUT.charWidth + LAYOUT.nodePadX * 2);
  return isRoot ? baseW + 20 : baseW;
}

export function nodeHeight(text: string, isRoot: boolean): number {
  const lines = Math.max(1, text.split("\n").length);
  const base = isRoot ? LAYOUT.rootNodeH : LAYOUT.nodeH;
  return base + (lines - 1) * 20;
}

interface Child {
  node: MindNode;
  children: Child[];
}

function buildTree(map: MindMap): Child {
  const childrenOf = new Map<string, MindNode[]>();
  for (const n of Object.values(map.nodes)) {
    if (n.parentId === null) continue;
    const arr = childrenOf.get(n.parentId) ?? [];
    arr.push(n);
    childrenOf.set(n.parentId, arr);
  }
  for (const arr of childrenOf.values()) {
    arr.sort((a, b) => a.order - b.order);
  }
  const rec = (id: string): Child => {
    const node = map.nodes[id];
    if (!node) throw new Error(`Missing node ${id}`);
    const kids = childrenOf.get(id) ?? [];
    if (node.collapsed) return { node, children: [] };
    return { node, children: kids.map((k) => rec(k.id)) };
  };
  return rec(map.rootId);
}

/**
 * Compute the total vertical span (in pixels) of a subtree, assuming each leaf consumes
 * `siblingGap`. Internal nodes consume the max of (their own height, their children's span).
 */
function subtreeSpan(t: Child): number {
  if (t.children.length === 0) return LAYOUT.siblingGap;
  const sum = t.children.reduce((s, c) => s + subtreeSpan(c), 0);
  return Math.max(sum, LAYOUT.siblingGap);
}

/** Layout a side (children all on +1 or -1 horizontal direction). */
function layoutSide(
  children: Child[],
  rootX: number,
  rootY: number,
  direction: 1 | -1,
  out: LaidOutNode[],
  depth: number,
): void {
  // Total vertical extent we need.
  const totalSpan = children.reduce((s, c) => s + subtreeSpan(c), 0);
  let cursorY = rootY - totalSpan / 2;
  for (const child of children) {
    const span = subtreeSpan(child);
    const childCenterY = cursorY + span / 2;
    const childX = rootX + direction * LAYOUT.levelGap;
    const manual = child.node.manualX !== undefined && child.node.manualY !== undefined;
    const x = manual ? (child.node.manualX as number) : childX;
    const y = manual ? (child.node.manualY as number) : childCenterY;
    out.push({ node: child.node, x, y, subtreeHeight: span, depth });
    if (child.children.length > 0) {
      layoutSide(child.children, x, y, direction, out, depth + 1);
    }
    cursorY += span;
  }
}

/**
 * Compute laid-out positions for every visible node in the map.
 * - Root is at (0, 0) (or its manual override).
 * - Top-level children are split between right side (even indices) and left side (odd) for balance.
 *   Children inherit their parent's side.
 */
export function layoutMap(map: MindMap): LaidOutNode[] {
  const tree = buildTree(map);
  const out: LaidOutNode[] = [];
  const rootNode = tree.node;
  const rootX = rootNode.manualX ?? 0;
  const rootY = rootNode.manualY ?? 0;
  out.push({ node: rootNode, x: rootX, y: rootY, subtreeHeight: subtreeSpan(tree), depth: 0 });

  // Balance: alternate first-level children between right and left to keep the canvas balanced.
  const right: Child[] = [];
  const left: Child[] = [];
  tree.children.forEach((c, i) => {
    if (i % 2 === 0) right.push(c);
    else left.push(c);
  });
  layoutSide(right, rootX, rootY, 1, out, 1);
  layoutSide(left, rootX, rootY, -1, out, 1);
  return out;
}

/** Compute the bounding box of every laid-out node (including width). Returns SVG coords. */
export function laidOutBounds(
  laid: LaidOutNode[],
  rootId: string,
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (laid.length === 0) return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const l of laid) {
    const isRoot = l.node.id === rootId;
    const w = nodeWidth(l.node.text, isRoot);
    const h = nodeHeight(l.node.text, isRoot);
    minX = Math.min(minX, l.x - w / 2);
    maxX = Math.max(maxX, l.x + w / 2);
    minY = Math.min(minY, l.y - h / 2);
    maxY = Math.max(maxY, l.y + h / 2);
  }
  return { minX, minY, maxX, maxY };
}
