import { useState } from "react";
import type { MindMapIndexEntry } from "../types/mindmap";
import { listTemplates } from "../lib/templates";

interface Props {
  index: MindMapIndexEntry[];
  onOpen: (id: string) => void;
  onCreate: (name: string, templateId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function MapChooser({ index, onOpen, onCreate, onDelete, onRename }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("Untitled mind map");
  const [newTemplate, setNewTemplate] = useState("blank");

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <header
        className="px-6 py-5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "var(--accent)", color: "white" }}
            aria-hidden
          >
            🧠
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Mind Map</h1>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Brainstorm visually. Save locally.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "var(--accent)", color: "white" }}
        >
          + New mind map
        </button>
      </header>

      <main className="flex-1 overflow-auto px-6 py-6 max-w-5xl mx-auto w-full">
        {showNew ? (
          <NewMapForm
            name={newName}
            templateId={newTemplate}
            onName={setNewName}
            onTemplate={setNewTemplate}
            onCancel={() => setShowNew(false)}
            onCreate={() => {
              onCreate(newName.trim() || "Untitled mind map", newTemplate);
              setShowNew(false);
              setNewName("Untitled mind map");
              setNewTemplate("blank");
            }}
          />
        ) : null}

        {index.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl border border-dashed"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="text-5xl mb-3" aria-hidden>
              💡
            </div>
            <h2 className="text-lg font-semibold">No mind maps yet</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Create your first one to start brainstorming.
            </p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {index.map((e) => (
              <MapRow
                key={e.id}
                entry={e}
                onOpen={() => onOpen(e.id)}
                onDelete={() => {
                  if (confirm(`Delete "${e.name}"? This cannot be undone.`)) onDelete(e.id);
                }}
                onRename={(name) => onRename(e.id, name)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function NewMapForm({
  name,
  templateId,
  onName,
  onTemplate,
  onCancel,
  onCreate,
}: {
  name: string;
  templateId: string;
  onName: (s: string) => void;
  onTemplate: (s: string) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  const templates = listTemplates();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate();
      }}
      className="rounded-xl border p-5 mb-6"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <h2 className="text-base font-semibold mb-3">Create a new mind map</h2>
      <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
        Name
      </label>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm mb-4"
        style={{
          background: "var(--paper)",
          borderColor: "var(--line-strong)",
          color: "var(--ink)",
        }}
      />
      <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
        Template
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTemplate(t.id)}
            className="px-3 py-2 rounded-lg border text-sm text-left transition-colors"
            style={{
              borderColor: templateId === t.id ? "var(--accent)" : "var(--line)",
              background:
                templateId === t.id ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--paper)",
              color: "var(--ink)",
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-sm font-medium border"
          style={{
            borderColor: "var(--line-strong)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent)", color: "white" }}
        >
          Create
        </button>
      </div>
    </form>
  );
}

function MapRow({
  entry,
  onOpen,
  onDelete,
  onRename,
}: {
  entry: MindMapIndexEntry;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  return (
    <li
      className="rounded-xl border p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRename(name.trim() || entry.name);
            setEditing(false);
          }}
        >
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              onRename(name.trim() || entry.name);
              setEditing(false);
            }}
            className="w-full px-2 py-1 rounded border text-sm font-semibold"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line-strong)",
              color: "var(--ink)",
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="text-left text-base font-semibold truncate hover:underline"
          style={{ color: "var(--ink)" }}
        >
          {entry.name}
        </button>
      )}
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Updated {new Date(entry.updatedAt).toLocaleString()}
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onOpen}
          className="px-2 py-1 rounded text-xs font-medium border"
          style={{
            borderColor: "var(--line-strong)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="px-2 py-1 rounded text-xs font-medium border"
          style={{
            borderColor: "var(--line-strong)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-2 py-1 rounded text-xs font-medium border ml-auto"
          style={{
            borderColor: "var(--line-strong)",
            background: "var(--paper)",
            color: "var(--error)",
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
