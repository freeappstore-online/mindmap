import type { MindMap, MindMapIndexEntry } from "../types/mindmap";

const INDEX_KEY = "mindmap.index.v1";
const MAP_PREFIX = "mindmap.map.v1.";
const ACTIVE_KEY = "mindmap.active.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listMaps(): MindMapIndexEntry[] {
  const entries = safeParse<MindMapIndexEntry[]>(
    localStorage.getItem(INDEX_KEY),
    [],
  );
  // Sort by updatedAt desc.
  return [...entries].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadMap(id: string): MindMap | null {
  const raw = localStorage.getItem(MAP_PREFIX + id);
  return safeParse<MindMap | null>(raw, null);
}

export function saveMap(map: MindMap): void {
  const updated: MindMap = { ...map, updatedAt: Date.now() };
  localStorage.setItem(MAP_PREFIX + map.id, JSON.stringify(updated));
  const index = listMaps().filter((e) => e.id !== map.id);
  index.push({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function deleteMap(id: string): void {
  localStorage.removeItem(MAP_PREFIX + id);
  const index = listMaps().filter((e) => e.id !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  const active = localStorage.getItem(ACTIVE_KEY);
  if (active === id) localStorage.removeItem(ACTIVE_KEY);
}

export function renameMap(id: string, name: string): void {
  const map = loadMap(id);
  if (!map) return;
  saveMap({ ...map, name });
}

export function getActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id: string | null): void {
  if (id === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}
