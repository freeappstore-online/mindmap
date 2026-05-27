import type { MindNode, NodeColor } from "../types/mindmap";
import { NODE_COLORS } from "../types/mindmap";
import { colorFor } from "../lib/colors";

interface Props {
  node: MindNode;
  isRoot: boolean;
  dark: boolean;
  onSetText: (id: string, text: string) => void;
  onSetColor: (id: string, color: NodeColor) => void;
  onSetIcon: (id: string, icon: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddChild: (id: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
  onResetPosition: (id: string) => void;
}

const ICON_CHOICES = [
  "",
  "💡",
  "🎯",
  "✅",
  "⭐",
  "🚀",
  "🔥",
  "📌",
  "📅",
  "🧠",
  "📊",
  "⚠️",
  "❤️",
  "💬",
  "📝",
  "🔑",
  "💰",
  "🌱",
  "🎨",
  "🛠️",
  "📚",
  "🧭",
  "⚖️",
  "🏆",
];

export default function NodeInspector({
  node,
  isRoot,
  dark,
  onSetText,
  onSetColor,
  onSetIcon,
  onToggleCollapse,
  onAddChild,
  onAddSibling,
  onDelete,
  onResetPosition,
}: Props) {
  const hasManual = node.manualX !== undefined && node.manualY !== undefined;

  return (
    <aside
      data-mm-ui
      className="w-72 h-full border-l flex flex-col overflow-hidden"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      key={node.id}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="text-[11px] uppercase font-semibold tracking-wider" style={{ color: "var(--muted)" }}>
          {isRoot ? "Root node" : "Node"}
        </div>
        <div className="text-sm font-semibold mt-1 truncate">{node.text || "Untitled"}</div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-5">
        <section>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
            Text
          </label>
          <textarea
            value={node.text}
            onChange={(e) => onSetText(node.id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line-strong)",
              color: "var(--ink)",
              resize: "vertical",
            }}
          />
        </section>

        <section>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Color
          </div>
          <div className="grid grid-cols-4 gap-2">
            {NODE_COLORS.map((c) => {
              const p = colorFor(c, dark);
              const active = node.color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSetColor(node.id, c)}
                  className="h-9 rounded-lg border-2 transition-transform"
                  style={{
                    background: p.fill,
                    borderColor: active ? p.stroke : "transparent",
                    outline: active ? `2px solid var(--accent)` : "none",
                    outlineOffset: -3,
                  }}
                  aria-label={c}
                  title={c}
                />
              );
            })}
          </div>
        </section>

        <section>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Icon
          </div>
          <div className="grid grid-cols-6 gap-2">
            {ICON_CHOICES.map((ic, i) => {
              const active = node.icon === ic;
              return (
                <button
                  key={`${ic}-${i}`}
                  type="button"
                  onClick={() => onSetIcon(node.id, ic)}
                  className="h-9 rounded-lg border text-base flex items-center justify-center"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line-strong)",
                    background: active ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--paper)",
                  }}
                  aria-label={ic ? `Icon ${ic}` : "No icon"}
                  title={ic || "No icon"}
                >
                  {ic || "∅"}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "white" }}
          >
            + Add child (Tab)
          </button>
          {!isRoot && (
            <button
              type="button"
              onClick={() => onAddSibling(node.id)}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium border"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line-strong)",
                color: "var(--ink)",
              }}
            >
              + Add sibling (Enter)
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleCollapse(node.id)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium border"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line-strong)",
              color: "var(--ink)",
            }}
          >
            {node.collapsed ? "Expand children" : "Collapse children"}
          </button>
          {hasManual && (
            <button
              type="button"
              onClick={() => onResetPosition(node.id)}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium border"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line-strong)",
                color: "var(--ink)",
              }}
            >
              Reset to auto-layout
            </button>
          )}
        </section>

        {!isRoot && (
          <section>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${node.text}" and all its children?`)) onDelete(node.id);
              }}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium border"
              style={{
                background: "var(--paper)",
                borderColor: "var(--line-strong)",
                color: "var(--error)",
              }}
            >
              Delete node (Del)
            </button>
          </section>
        )}
      </div>
    </aside>
  );
}
