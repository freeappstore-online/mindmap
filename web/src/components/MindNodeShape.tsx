import { useEffect, useRef } from "react";
import type { LaidOutNode } from "../types/mindmap";
import { LAYOUT, nodeHeight, nodeWidth } from "../lib/layout";
import { colorFor } from "../lib/colors";

interface Props {
  laid: LaidOutNode;
  isRoot: boolean;
  isSelected: boolean;
  isMatch: boolean;
  isEditing: boolean;
  dark: boolean;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
  onSelect: () => void;
  onBeginEdit: () => void;
  onCommitEdit: (text: string) => void;
  onCancelEdit: () => void;
}

export default function MindNodeShape({
  laid,
  isRoot,
  isSelected,
  isMatch,
  isEditing,
  dark,
  onPointerDown,
  onSelect,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
}: Props) {
  const { node, x, y } = laid;
  const w = nodeWidth(node.text, isRoot);
  const h = nodeHeight(node.text, isRoot);
  const c = colorFor(node.color, dark);
  const corner = isRoot ? 14 : 10;

  const lines = node.text.split("\n");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      editorRef.current.select();
    }
  }, [isEditing]);

  return (
    <g
      data-mm-node={node.id}
      transform={`translate(${x}, ${y})`}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onBeginEdit();
      }}
      style={{ cursor: isEditing ? "text" : "grab" }}
    >
      {/* Selection halo */}
      {(isSelected || isMatch) && (
        <rect
          x={-w / 2 - 4}
          y={-h / 2 - 4}
          width={w + 8}
          height={h + 8}
          rx={corner + 4}
          ry={corner + 4}
          fill="none"
          stroke={isMatch ? "#facc15" : "var(--accent)"}
          strokeWidth={isMatch ? 3 : 2.5}
          strokeDasharray={isMatch ? "6 4" : ""}
        />
      )}

      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={corner}
        ry={corner}
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth={isRoot ? 2.5 : 1.5}
      />

      {isEditing ? (
        <foreignObject x={-w / 2 + 8} y={-h / 2 + 4} width={w - 16} height={h - 8}>
          <textarea
            ref={editorRef}
            defaultValue={node.text}
            onBlur={(e) => onCommitEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onCommitEdit((e.target as HTMLTextAreaElement).value);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit();
              } else if (e.key === "Tab") {
                e.preventDefault();
                onCommitEdit((e.target as HTMLTextAreaElement).value);
              }
            }}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: c.text,
              fontSize: isRoot ? 17 : 14,
              fontWeight: isRoot ? 700 : 500,
              fontFamily: "Manrope, system-ui, sans-serif",
              textAlign: "center",
              resize: "none",
              lineHeight: "20px",
              padding: 0,
            }}
          />
        </foreignObject>
      ) : (
        <g pointerEvents="none">
          {node.icon ? (
            <text
              x={-w / 2 + 10}
              y={2}
              fontSize={isRoot ? 18 : 14}
              dominantBaseline="middle"
              textAnchor="start"
            >
              {node.icon}
            </text>
          ) : null}
          {lines.map((line, i) => (
            <text
              key={i}
              x={node.icon ? -w / 2 + 30 : 0}
              y={-((lines.length - 1) * 10) + i * 20 + 1}
              dominantBaseline="middle"
              textAnchor={node.icon ? "start" : "middle"}
              fontSize={isRoot ? 17 : 14}
              fontWeight={isRoot ? 700 : 500}
              fontFamily="Manrope, system-ui, sans-serif"
              fill={c.text}
            >
              {line || " "}
            </text>
          ))}
        </g>
      )}

      {/* Collapse indicator (small chevron at end of node) */}
      {node.collapsed && !isRoot && (
        <circle
          cx={w / 2 - 6}
          cy={h / 2 - 6}
          r={5}
          fill={c.stroke}
          stroke={c.fill}
          strokeWidth={1}
        />
      )}
    </g>
  );
}

export { LAYOUT };
