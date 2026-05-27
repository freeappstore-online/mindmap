import { useCallback, useEffect, useMemo, useState } from "react";
import type { MindMap, MindMapIndexEntry, MindNode, NodeColor } from "../types/mindmap";
import { newId } from "../lib/id";
import {
  deleteMap as storeDeleteMap,
  getActiveId,
  listMaps,
  loadMap,
  renameMap as storeRenameMap,
  saveMap,
  setActiveId,
} from "../lib/storage";
import { createFromTemplate } from "../lib/templates";

export interface MindMapStore {
  /** Currently open mind map, null if user is in the chooser. */
  map: MindMap | null;
  /** Index of all saved maps. */
  index: MindMapIndexEntry[];
  /** Currently selected node id (null = root selected or nothing). */
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  /** Map chooser actions. */
  openMap: (id: string) => void;
  createMap: (name: string, templateId: string) => void;
  removeMap: (id: string) => void;
  renameMapAction: (id: string, name: string) => void;
  closeMap: () => void;

  /** Node operations — all act on the active map. */
  addChild: (parentId: string) => string | null;
  addSibling: (siblingId: string) => string | null;
  deleteNode: (id: string) => void;
  setText: (id: string, text: string) => void;
  setColor: (id: string, color: NodeColor) => void;
  setIcon: (id: string, icon: string) => void;
  toggleCollapse: (id: string) => void;
  setManualPosition: (id: string, x: number | undefined, y: number | undefined) => void;

  /** Replace whole map (used by template / imports). */
  replaceMap: (m: MindMap) => void;
}

function ensureRoot(map: MindMap): MindNode {
  const r = map.nodes[map.rootId];
  if (!r) throw new Error("Mind map root missing");
  return r;
}

export function useMindMapStore(): MindMapStore {
  const [index, setIndex] = useState<MindMapIndexEntry[]>(() => listMaps());
  const [map, setMap] = useState<MindMap | null>(() => {
    const active = getActiveId();
    if (!active) return null;
    return loadMap(active);
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => map?.rootId ?? null);

  // Persist whenever map changes.
  useEffect(() => {
    if (!map) return;
    saveMap(map);
    setIndex(listMaps());
  }, [map]);

  useEffect(() => {
    setActiveId(map?.id ?? null);
  }, [map?.id]);

  const openMap = useCallback((id: string) => {
    const m = loadMap(id);
    if (m) {
      setMap(m);
      setSelectedId(m.rootId);
    }
  }, []);

  const closeMap = useCallback(() => {
    setMap(null);
    setSelectedId(null);
    setIndex(listMaps());
  }, []);

  const createMap = useCallback((name: string, templateId: string) => {
    const m = createFromTemplate(templateId, name);
    setMap(m);
    setSelectedId(m.rootId);
  }, []);

  const removeMap = useCallback(
    (id: string) => {
      storeDeleteMap(id);
      setIndex(listMaps());
      if (map?.id === id) {
        setMap(null);
        setSelectedId(null);
      }
    },
    [map?.id],
  );

  const renameMapAction = useCallback(
    (id: string, name: string) => {
      storeRenameMap(id, name);
      setIndex(listMaps());
      if (map?.id === id) {
        setMap((prev) => (prev ? { ...prev, name } : prev));
      }
    },
    [map?.id],
  );

  const updateNodes = useCallback(
    (mut: (nodes: Record<string, MindNode>) => Record<string, MindNode>) => {
      setMap((prev) => {
        if (!prev) return prev;
        const nodes = mut(prev.nodes);
        return { ...prev, nodes, updatedAt: Date.now() };
      });
    },
    [],
  );

  const addChild = useCallback(
    (parentId: string): string | null => {
      if (!map) return null;
      const parent = map.nodes[parentId];
      if (!parent) return null;
      const siblings = Object.values(map.nodes).filter((n) => n.parentId === parentId);
      const maxOrder = siblings.reduce((m, s) => Math.max(m, s.order), -1);
      const id = newId();
      const node: MindNode = {
        id,
        text: "New idea",
        parentId,
        order: maxOrder + 1,
        color: parent.color,
        icon: "",
      };
      updateNodes((nodes) => ({ ...nodes, [id]: node }));
      setSelectedId(id);
      return id;
    },
    [map, updateNodes],
  );

  const addSibling = useCallback(
    (siblingId: string): string | null => {
      if (!map) return null;
      const sib = map.nodes[siblingId];
      if (!sib) return null;
      if (sib.parentId === null) {
        // Root has no siblings — add a child instead.
        return addChild(sib.id);
      }
      const peers = Object.values(map.nodes).filter((n) => n.parentId === sib.parentId);
      const maxOrder = peers.reduce((m, s) => Math.max(m, s.order), -1);
      const id = newId();
      const node: MindNode = {
        id,
        text: "New idea",
        parentId: sib.parentId,
        order: maxOrder + 1,
        color: sib.color,
        icon: "",
      };
      updateNodes((nodes) => ({ ...nodes, [id]: node }));
      setSelectedId(id);
      return id;
    },
    [map, updateNodes, addChild],
  );

  const deleteNode = useCallback(
    (id: string) => {
      if (!map) return;
      if (id === map.rootId) return; // Never delete root.
      // Compute all descendants.
      const childrenOf = new Map<string, string[]>();
      for (const n of Object.values(map.nodes)) {
        if (n.parentId) {
          const arr = childrenOf.get(n.parentId) ?? [];
          arr.push(n.id);
          childrenOf.set(n.parentId, arr);
        }
      }
      const toRemove = new Set<string>();
      const visit = (nid: string): void => {
        toRemove.add(nid);
        for (const c of childrenOf.get(nid) ?? []) visit(c);
      };
      visit(id);
      const target = map.nodes[id];
      const fallbackId = target?.parentId ?? map.rootId;
      updateNodes((nodes) => {
        const out: Record<string, MindNode> = {};
        for (const [k, v] of Object.entries(nodes)) {
          if (!toRemove.has(k)) out[k] = v;
        }
        return out;
      });
      setSelectedId(fallbackId);
    },
    [map, updateNodes],
  );

  const setText = useCallback(
    (id: string, text: string) => {
      updateNodes((nodes) => {
        const n = nodes[id];
        if (!n) return nodes;
        return { ...nodes, [id]: { ...n, text } };
      });
    },
    [updateNodes],
  );

  const setColor = useCallback(
    (id: string, color: NodeColor) => {
      updateNodes((nodes) => {
        const n = nodes[id];
        if (!n) return nodes;
        return { ...nodes, [id]: { ...n, color } };
      });
    },
    [updateNodes],
  );

  const setIcon = useCallback(
    (id: string, icon: string) => {
      updateNodes((nodes) => {
        const n = nodes[id];
        if (!n) return nodes;
        return { ...nodes, [id]: { ...n, icon } };
      });
    },
    [updateNodes],
  );

  const toggleCollapse = useCallback(
    (id: string) => {
      updateNodes((nodes) => {
        const n = nodes[id];
        if (!n) return nodes;
        return { ...nodes, [id]: { ...n, collapsed: !n.collapsed } };
      });
    },
    [updateNodes],
  );

  const setManualPosition = useCallback(
    (id: string, x: number | undefined, y: number | undefined) => {
      updateNodes((nodes) => {
        const n = nodes[id];
        if (!n) return nodes;
        const next: MindNode = { ...n };
        if (x === undefined || y === undefined) {
          delete next.manualX;
          delete next.manualY;
        } else {
          next.manualX = x;
          next.manualY = y;
        }
        return { ...nodes, [id]: next };
      });
    },
    [updateNodes],
  );

  const replaceMap = useCallback((m: MindMap) => {
    setMap(m);
    setSelectedId(m.rootId);
  }, []);

  // Make sure selected node still exists.
  useEffect(() => {
    if (!map) return;
    if (selectedId && !map.nodes[selectedId]) {
      setSelectedId(ensureRoot(map).id);
    }
  }, [map, selectedId]);

  return useMemo(
    () => ({
      map,
      index,
      selectedId,
      setSelectedId,
      openMap,
      createMap,
      removeMap,
      renameMapAction,
      closeMap,
      addChild,
      addSibling,
      deleteNode,
      setText,
      setColor,
      setIcon,
      toggleCollapse,
      setManualPosition,
      replaceMap,
    }),
    [
      map,
      index,
      selectedId,
      openMap,
      createMap,
      removeMap,
      renameMapAction,
      closeMap,
      addChild,
      addSibling,
      deleteNode,
      setText,
      setColor,
      setIcon,
      toggleCollapse,
      setManualPosition,
      replaceMap,
    ],
  );
}
