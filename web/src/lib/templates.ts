import type { MindMap, MindNode, NodeColor } from "../types/mindmap";
import { newId } from "./id";

interface TemplateBranch {
  text: string;
  color: NodeColor;
  icon?: string;
  children?: TemplateBranch[];
}

interface TemplateSpec {
  id: string;
  name: string;
  rootText: string;
  rootIcon: string;
  branches: TemplateBranch[];
}

const SPECS: TemplateSpec[] = [
  {
    id: "blank",
    name: "Blank",
    rootText: "New Mind Map",
    rootIcon: "💡",
    branches: [],
  },
  {
    id: "project-plan",
    name: "Project Plan",
    rootText: "Project",
    rootIcon: "🚀",
    branches: [
      {
        text: "Goals",
        color: "blue",
        icon: "🎯",
        children: [
          { text: "Outcome 1", color: "blue" },
          { text: "Outcome 2", color: "blue" },
        ],
      },
      {
        text: "Timeline",
        color: "amber",
        icon: "📅",
        children: [
          { text: "Milestone 1", color: "amber" },
          { text: "Milestone 2", color: "amber" },
        ],
      },
      {
        text: "Team",
        color: "emerald",
        icon: "👥",
        children: [
          { text: "Lead", color: "emerald" },
          { text: "Members", color: "emerald" },
        ],
      },
      {
        text: "Risks",
        color: "rose",
        icon: "⚠️",
        children: [
          { text: "Risk 1", color: "rose" },
          { text: "Mitigation", color: "rose" },
        ],
      },
    ],
  },
  {
    id: "book-outline",
    name: "Book Outline",
    rootText: "Book Title",
    rootIcon: "📚",
    branches: [
      {
        text: "Part 1",
        color: "violet",
        icon: "1️⃣",
        children: [
          { text: "Chapter 1", color: "violet" },
          { text: "Chapter 2", color: "violet" },
          { text: "Chapter 3", color: "violet" },
        ],
      },
      {
        text: "Part 2",
        color: "teal",
        icon: "2️⃣",
        children: [
          { text: "Chapter 4", color: "teal" },
          { text: "Chapter 5", color: "teal" },
        ],
      },
      {
        text: "Part 3",
        color: "fuchsia",
        icon: "3️⃣",
        children: [
          { text: "Chapter 6", color: "fuchsia" },
          { text: "Epilogue", color: "fuchsia" },
        ],
      },
    ],
  },
  {
    id: "decision-tree",
    name: "Decision Tree",
    rootText: "Decision?",
    rootIcon: "🧭",
    branches: [
      {
        text: "Option A",
        color: "emerald",
        icon: "🅰️",
        children: [
          { text: "Pros", color: "emerald" },
          { text: "Cons", color: "rose" },
        ],
      },
      {
        text: "Option B",
        color: "blue",
        icon: "🅱️",
        children: [
          { text: "Pros", color: "emerald" },
          { text: "Cons", color: "rose" },
        ],
      },
      {
        text: "Criteria",
        color: "slate",
        icon: "⚖️",
        children: [
          { text: "Cost", color: "slate" },
          { text: "Speed", color: "slate" },
          { text: "Quality", color: "slate" },
        ],
      },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    rootText: "Topic",
    rootIcon: "🧠",
    branches: [
      { text: "Idea 1", color: "blue", icon: "💡" },
      { text: "Idea 2", color: "violet", icon: "💡" },
      { text: "Idea 3", color: "emerald", icon: "💡" },
      { text: "Idea 4", color: "amber", icon: "💡" },
      { text: "Idea 5", color: "rose", icon: "💡" },
      { text: "Idea 6", color: "teal", icon: "💡" },
    ],
  },
  {
    id: "swot",
    name: "SWOT Analysis",
    rootText: "SWOT",
    rootIcon: "📊",
    branches: [
      {
        text: "Strengths",
        color: "emerald",
        icon: "💪",
        children: [
          { text: "Strength 1", color: "emerald" },
          { text: "Strength 2", color: "emerald" },
        ],
      },
      {
        text: "Weaknesses",
        color: "rose",
        icon: "🩹",
        children: [
          { text: "Weakness 1", color: "rose" },
          { text: "Weakness 2", color: "rose" },
        ],
      },
      {
        text: "Opportunities",
        color: "blue",
        icon: "🌱",
        children: [
          { text: "Opportunity 1", color: "blue" },
          { text: "Opportunity 2", color: "blue" },
        ],
      },
      {
        text: "Threats",
        color: "amber",
        icon: "⚡",
        children: [
          { text: "Threat 1", color: "amber" },
          { text: "Threat 2", color: "amber" },
        ],
      },
    ],
  },
];

export function listTemplates(): { id: string; name: string }[] {
  return SPECS.map((s) => ({ id: s.id, name: s.name }));
}

export function createFromTemplate(templateId: string, mapName: string): MindMap {
  const spec = SPECS.find((s) => s.id === templateId) ?? SPECS[0]!;
  const rootId = newId();
  const nodes: Record<string, MindNode> = {};
  nodes[rootId] = {
    id: rootId,
    text: spec.rootText,
    parentId: null,
    order: 0,
    color: "blue",
    icon: spec.rootIcon,
  };
  const addBranch = (b: TemplateBranch, parentId: string, order: number): void => {
    const id = newId();
    nodes[id] = {
      id,
      text: b.text,
      parentId,
      order,
      color: b.color,
      icon: b.icon ?? "",
    };
    (b.children ?? []).forEach((child, i) => addBranch(child, id, i));
  };
  spec.branches.forEach((b, i) => addBranch(b, rootId, i));
  const now = Date.now();
  return {
    id: newId(),
    name: mapName,
    rootId,
    nodes,
    createdAt: now,
    updatedAt: now,
  };
}
