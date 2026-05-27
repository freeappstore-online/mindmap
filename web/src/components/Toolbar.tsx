import { useState } from "react";

interface Props {
  mapName: string;
  view: "map" | "outline";
  searchTerm: string;
  onBack: () => void;
  onRename: (name: string) => void;
  onSearch: (term: string) => void;
  onToggleView: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onFitScreen: () => void;
}

export default function Toolbar({
  mapName,
  view,
  searchTerm,
  onBack,
  onRename,
  onSearch,
  onToggleView,
  onExportPNG,
  onExportJSON,
  onFitScreen,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(mapName);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      data-mm-ui
      className="px-3 sm:px-4 py-2 border-b flex items-center gap-2 z-10"
      style={{
        background: "var(--panel)",
        borderColor: "var(--line)",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="p-2 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: "var(--ink)" }}
        aria-label="Back to maps"
        title="Back to maps"
      >
        ←
      </button>

      {editingName ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRename(nameDraft.trim() || mapName);
            setEditingName(false);
          }}
          className="flex-shrink-0"
        >
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              onRename(nameDraft.trim() || mapName);
              setEditingName(false);
            }}
            className="px-2 py-1 rounded border text-sm font-semibold"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line-strong)",
              color: "var(--ink)",
              width: "16rem",
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNameDraft(mapName);
            setEditingName(true);
          }}
          className="text-sm font-semibold truncate hover:underline px-2 py-1 rounded"
          style={{ color: "var(--ink)", maxWidth: "16rem" }}
          title="Rename"
        >
          {mapName}
        </button>
      )}

      <div className="flex-1" />

      <input
        type="search"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="px-3 py-1.5 rounded-lg border text-sm w-40 sm:w-56"
        style={{
          background: "var(--paper)",
          borderColor: "var(--line-strong)",
          color: "var(--ink)",
        }}
      />

      <button
        type="button"
        onClick={onToggleView}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
        style={{
          background: "var(--paper)",
          borderColor: "var(--line-strong)",
          color: "var(--ink)",
        }}
        title="Toggle outline view"
      >
        {view === "map" ? "Outline" : "Mind map"}
      </button>

      <button
        type="button"
        onClick={onFitScreen}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold border hidden sm:inline-block"
        style={{
          background: "var(--paper)",
          borderColor: "var(--line-strong)",
          color: "var(--ink)",
        }}
        title="Fit to screen"
      >
        Fit
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
          style={{
            background: "var(--paper)",
            borderColor: "var(--line-strong)",
            color: "var(--ink)",
          }}
        >
          Export ▾
        </button>
        {menuOpen && (
          <>
            {/* Click-away */}
            <div
              className="fixed inset-0 z-20"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-lg border shadow-md z-30"
              style={{
                background: "var(--panel)",
                borderColor: "var(--line)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportPNG();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: "var(--ink)" }}
              >
                Export as PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportJSON();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 border-t"
                style={{ color: "var(--ink)", borderColor: "var(--line)" }}
              >
                Export as JSON
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
