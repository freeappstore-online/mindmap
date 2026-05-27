import type { MindMap, MindNode } from "../types/mindmap";
import { colorFor } from "../lib/colors";

interface Props {
  map: MindMap;
  selectedId: string | null;
  searchTerm: string;
  dark: boolean;
  onSelect: (id: string) => void;
  onSetText: (id: string, text: string) => void;
  onAddChild: (id: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
}

interface TreeNode {
  node: MindNode;
  children: TreeNode[];
}

function buildTree(map: MindMap): TreeNode {
  const byParent = new Map<string, MindNode[]>();
  for (const n of Object.values(map.nodes)) {
    if (n.parentId === null) continue;
    const arr = byParent.get(n.parentId) ?? [];
    arr.push(n);
    byParent.set(n.parentId, arr);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.order - b.order);
  const rec = (id: string): TreeNode => {
    const node = map.nodes[id];
    if (!node) throw new Error(`missing ${id}`);
    const kids = byParent.get(id) ?? [];
    return { node, children: kids.map((k) => rec(k.id)) };
  };
  return rec(map.rootId);
}

export default function OutlinerView({
  map,
  selectedId,
  searchTerm,
  dark,
  onSelect,
  onSetText,
  onAddChild,
  onAddSibling,
  onDelete,
}: Props) {
  const tree = buildTree(map);
  const term = searchTerm.trim().toLowerCase();
  return (
    <div
      className="w-full h-full overflow-auto"
      style={{ background: "var(--paper)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-6">
        <OutlineRow
          tree={tree}
          depth={0}
          rootId={map.rootId}
          selectedId={selectedId}
          matchTerm={term}
          dark={dark}
          onSelect={onSelect}
          onSetText={onSetText}
          onAddChild={onAddChild}
          onAddSibling={onAddSibling}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

interface RowProps {
  tree: TreeNode;
  depth: number;
  rootId: string;
  selectedId: string | null;
  matchTerm: string;
  dark: boolean;
  onSelect: (id: string) => void;
  onSetText: (id: string, text: string) => void;
  onAddChild: (id: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
}

function OutlineRow({
  tree,
  depth,
  rootId,
  selectedId,
  matchTerm,
  dark,
  onSelect,
  onSetText,
  onAddChild,
  onAddSibling,
  onDelete,
}: RowProps) {
  const { node, children } = tree;
  const isRoot = node.id === rootId;
  const isSelected = selectedId === node.id;
  const isMatch = matchTerm !== "" && node.text.toLowerCase().includes(matchTerm);
  const c = colorFor(node.color, dark);

  return (
    <div>
      <div
        className="flex items-start gap-2 py-1 px-2 rounded-md group"
        style={{
          marginLeft: depth * 20,
          background: isSelected
            ? "color-mix(in oklab, var(--accent) 10%, transparent)"
            : isMatch
              ? "color-mix(in oklab, #facc15 18%, transparent)"
              : "transparent",
        }}
        onClick={() => onSelect(node.id)}
      >
        <div
          className="mt-1.5 w-3 h-3 rounded-sm flex-shrink-0"
          style={{ background: c.fill, border: `1px solid ${c.stroke}` }}
          aria-hidden
        />
        {node.icon && (
          <span className="mt-0.5 text-base" aria-hidden>
            {node.icon}
          </span>
        )}
        <textarea
          value={node.text}
          onChange={(e) => onSetText(node.id, e.target.value)}
          onFocus={() => onSelect(node.id)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              onAddChild(node.id);
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (isRoot) onAddChild(node.id);
              else onAddSibling(node.id);
            } else if ((e.key === "Backspace" || e.key === "Delete") && node.text === "" && !isRoot) {
              e.preventDefault();
              onDelete(node.id);
            }
          }}
          rows={1}
          className="flex-1 bg-transparent outline-none text-sm resize-none py-0.5"
          style={{
            color: "var(--ink)",
            fontWeight: isRoot ? 700 : 500,
            fontSize: isRoot ? 18 : 14,
            fontFamily: isRoot ? '"Fraunces", Georgia, serif' : "inherit",
          }}
        />
      </div>
      {!node.collapsed &&
        children.map((c) => (
          <OutlineRow
            key={c.node.id}
            tree={c}
            depth={depth + 1}
            rootId={rootId}
            selectedId={selectedId}
            matchTerm={matchTerm}
            dark={dark}
            onSelect={onSelect}
            onSetText={onSetText}
            onAddChild={onAddChild}
            onAddSibling={onAddSibling}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}
