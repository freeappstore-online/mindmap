import { useCallback, useEffect, useRef, useState } from "react";
import { useMindMapStore } from "./hooks/useMindMapStore";
import { useDarkMode } from "./hooks/useDarkMode";
import MapChooser from "./components/MapChooser";
import Toolbar from "./components/Toolbar";
import MindMapCanvas from "./components/MindMapCanvas";
import OutlinerView from "./components/OutlinerView";
import NodeInspector from "./components/NodeInspector";
import { laidOutBounds, layoutMap } from "./lib/layout";
import { exportJSON, exportPNG } from "./lib/export";

type View = "map" | "outline";

export default function App() {
  const store = useMindMapStore();
  const dark = useDarkMode();
  const [view, setView] = useState<View>("map");
  const [searchTerm, setSearchTerm] = useState("");

  const svgHolderRef = useRef<{ current: SVGSVGElement | null }>({ current: null });
  const fitFnRef = useRef<() => void>(() => {});

  const registerSvgRef = useCallback((ref: { current: SVGSVGElement | null }) => {
    svgHolderRef.current = ref;
  }, []);
  const registerFitFn = useCallback((fn: () => void) => {
    fitFnRef.current = fn;
  }, []);

  // Reset search when map changes.
  useEffect(() => {
    setSearchTerm("");
  }, [store.map?.id]);

  if (!store.map) {
    return (
      <MapChooser
        index={store.index}
        onOpen={store.openMap}
        onCreate={store.createMap}
        onDelete={store.removeMap}
        onRename={store.renameMapAction}
      />
    );
  }

  const map = store.map;
  const selected = store.selectedId ? map.nodes[store.selectedId] : null;
  const selectedNode = selected ?? map.nodes[map.rootId]!;
  const isRoot = selectedNode.id === map.rootId;

  const handleExportPNG = async (): Promise<void> => {
    const svg = svgHolderRef.current.current;
    if (!svg) return;
    // Render the entire mind map (not just the visible viewport).
    const laid = layoutMap(map);
    const bounds = laidOutBounds(laid, map.rootId);
    const pad = 60;
    // Build a temporary off-screen SVG containing the full content for crisp export.
    const tmp = svg.cloneNode(true) as SVGSVGElement;
    const w = bounds.maxX - bounds.minX + pad * 2;
    const h = bounds.maxY - bounds.minY + pad * 2;
    tmp.setAttribute("width", String(w));
    tmp.setAttribute("height", String(h));
    tmp.setAttribute("viewBox", `${bounds.minX - pad} ${bounds.minY - pad} ${w} ${h}`);
    // Strip out the pan/zoom transform — the cloned <g> has it baked in.
    const g = tmp.querySelector("g[transform]");
    if (g) g.removeAttribute("transform");
    // Remove the screen-aligned background rect (grid) — replace with a clean bg.
    const grid = tmp.querySelector('rect[fill="url(#mm-grid)"]');
    if (grid) grid.remove();
    const bg = dark ? "#0f0f0f" : "#ffffff";
    await exportPNG(tmp, map.name, bg);
  };

  const handleExportJSON = (): void => {
    exportJSON(map);
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: "var(--paper)" }}>
      <Toolbar
        mapName={map.name}
        view={view}
        searchTerm={searchTerm}
        onBack={store.closeMap}
        onRename={(name) => store.renameMapAction(map.id, name)}
        onSearch={setSearchTerm}
        onToggleView={() => setView((v) => (v === "map" ? "outline" : "map"))}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onFitScreen={() => fitFnRef.current()}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          {view === "map" ? (
            <MindMapCanvas
              map={map}
              selectedId={store.selectedId}
              searchTerm={searchTerm}
              dark={dark}
              onSelect={store.setSelectedId}
              onAddChild={(id) => store.addChild(id)}
              onAddSibling={(id) => store.addSibling(id)}
              onDelete={store.deleteNode}
              onSetText={store.setText}
              onSetManualPosition={(id, x, y) => store.setManualPosition(id, x, y)}
              registerSvgRef={registerSvgRef}
              registerFitFn={registerFitFn}
            />
          ) : (
            <OutlinerView
              map={map}
              selectedId={store.selectedId}
              searchTerm={searchTerm}
              dark={dark}
              onSelect={store.setSelectedId}
              onSetText={store.setText}
              onAddChild={(id) => store.addChild(id)}
              onAddSibling={(id) => store.addSibling(id)}
              onDelete={store.deleteNode}
            />
          )}
        </div>
        <NodeInspector
          node={selectedNode}
          isRoot={isRoot}
          dark={dark}
          onSetText={store.setText}
          onSetColor={store.setColor}
          onSetIcon={store.setIcon}
          onToggleCollapse={store.toggleCollapse}
          onAddChild={(id) => store.addChild(id)}
          onAddSibling={(id) => store.addSibling(id)}
          onDelete={store.deleteNode}
          onResetPosition={(id) => store.setManualPosition(id, undefined, undefined)}
        />
      </div>
    </div>
  );
}
