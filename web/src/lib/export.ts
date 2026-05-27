import type { MindMap } from "../types/mindmap";

export function exportJSON(map: MindMap): void {
  const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(map.name)}.mindmap.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Serialize the given SVG element to a PNG with a transparent-style background matching the
 * current theme.
 */
export async function exportPNG(svgEl: SVGSVGElement, name: string, bg: string): Promise<void> {
  const cloned = svgEl.cloneNode(true) as SVGSVGElement;
  // Ensure XML namespace.
  cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  cloned.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Inline a bg rect to capture the theme color.
  const viewBox = (svgEl.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);
  const vbX = viewBox[0] ?? 0;
  const vbY = viewBox[1] ?? 0;
  const vbW = viewBox[2] ?? svgEl.clientWidth;
  const vbH = viewBox[3] ?? svgEl.clientHeight;

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", String(vbX));
  rect.setAttribute("y", String(vbY));
  rect.setAttribute("width", String(vbW));
  rect.setAttribute("height", String(vbH));
  rect.setAttribute("fill", bg);
  cloned.insertBefore(rect, cloned.firstChild);

  const xml = new XMLSerializer().serializeToString(cloned);
  const svg64 = window.btoa(unescape(encodeURIComponent(xml)));
  const dataUrl = `data:image/svg+xml;base64,${svg64}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to rasterize SVG"));
    img.src = dataUrl;
  });

  // 2x device pixel ratio for crisper export.
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(vbW * scale));
  canvas.height = Math.max(1, Math.round(vbH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, vbW, vbH);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(name)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      resolve();
    }, "image/png");
  });
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mindmap"
  );
}
