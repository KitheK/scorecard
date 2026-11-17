import type { ArchitectureFile, ArchitectureGroup, ArchitectureNode } from "../lib/schemas";

export type PlateMetrics = {
  boxW: number;
  boxH: number;
  storeH: number;
  colGap: number;
  rowGap: number;
  bandW: number;
  marginX: number;
  marginY: number;
  legendY: number;
  titleSize: number;
  subSize: number;
};

export function plateLayoutMetrics(nodeCount: number): PlateMetrics {
  if (nodeCount <= 6) {
    return {
      boxW: 156,
      boxH: 64,
      storeH: 76,
      colGap: 88,
      rowGap: 16,
      bandW: 26,
      marginX: 52,
      marginY: 44,
      legendY: 10,
      titleSize: 12,
      subSize: 11,
    };
  }
  if (nodeCount <= 10) {
    return {
      boxW: 140,
      boxH: 58,
      storeH: 70,
      colGap: 72,
      rowGap: 14,
      bandW: 26,
      marginX: 48,
      marginY: 46,
      legendY: 10,
      titleSize: 12,
      subSize: 10,
    };
  }
  return {
    boxW: 128,
    boxH: 54,
    storeH: 66,
    colGap: 56,
    rowGap: 12,
    bandW: 24,
    marginX: 44,
    marginY: 48,
    legendY: 10,
    titleSize: 11,
    subSize: 10,
  };
}

/** @deprecated use plateLayoutMetrics */
export const PLATE_BOX_W = 128;
export const PLATE_BOX_H = 54;
export const PLATE_STORE_H = 66;

export function boxHeight(node: ArchitectureNode, m: PlateMetrics): number {
  return node.tone === "data" ? m.storeH : m.boxH;
}

export function applyArchitectureLayout(file: ArchitectureFile): ArchitectureFile {
  const layout = file.layout ?? "spine-lr";
  const nodes = file.nodes.map((n) => ({ ...n }));
  const m = plateLayoutMetrics(nodes.length);

  if (layout === "spine-lr") {
    const order: string[] = [];
    const byGroup = new Map<string, ArchitectureNode[]>();
    for (const n of nodes) {
      const g = n.group ?? "_ungrouped";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(n);
    }

    const colHeights = order.map((gid) => {
      const list = byGroup.get(gid)!;
      return list.reduce((sum, n, i) => sum + boxHeight(n, m) + (i > 0 ? m.rowGap : 0), 0);
    });
    const maxColH = Math.max(...colHeights, m.boxH);

    let colX = m.marginX + m.bandW + 8;
    for (const gid of order) {
      const list = byGroup.get(gid)!;
      const colH = colHeights[order.indexOf(gid)] ?? m.boxH;
      let y = m.marginY + Math.max(0, (maxColH - colH) / 2);
      for (const n of list) {
        const h = boxHeight(n, m);
        n.x = colX;
        n.y = y;
        y += h + m.rowGap;
      }
      colX += m.boxW + m.colGap;
    }
  } else if (layout === "layered") {
    const layers: Record<string, number> = { client: 0, edge: 1, runtime: 2, service: 2, data: 3, external: 4 };
    const byLayer = new Map<number, ArchitectureNode[]>();
    for (const n of nodes) {
      const tone = n.tone ?? "service";
      const layer = layers[tone] ?? 2;
      if (!byLayer.has(layer)) byLayer.set(layer, []);
      byLayer.get(layer)!.push(n);
    }
    const layerKeys = [...byLayer.keys()].sort((a, b) => a - b);
    let y = m.marginY;
    for (const layer of layerKeys) {
      const list = byLayer.get(layer)!;
      let x = m.marginX + m.bandW;
      const rowH = Math.max(...list.map((n) => boxHeight(n, m)));
      for (const n of list) {
        n.x = n.x ?? x;
        n.y = n.y ?? y;
        x += m.boxW + m.colGap;
      }
      y += rowH + m.rowGap * 2;
    }
  } else if (layout === "radial") {
    const cx = 400;
    const cy = 240;
    const r = Math.min(160, 48 + nodes.length * 20);
    nodes.forEach((n, i) => {
      const a = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      const h = boxHeight(n, m);
      n.x = n.x ?? Math.round(cx + r * Math.cos(a) - m.boxW / 2);
      n.y = n.y ?? Math.round(cy + r * Math.sin(a) - h / 2);
    });
  }

  return { ...file, nodes, layout };
}

export function tightViewBox(nodes: ArchitectureNode[], m: PlateMetrics): string {
  if (!nodes.length) return "0 0 640 300";
  let minX = Infinity;
  let minY = m.legendY;
  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    const x = n.x ?? 0;
    const y = n.y ?? 0;
    const h = boxHeight(n, m);
    minX = Math.min(minX, x - m.bandW - 14);
    minY = Math.min(minY, y - 6);
    maxX = Math.max(maxX, x + m.boxW + 20);
    maxY = Math.max(maxY, y + h + 20);
  }
  const pad = 8;
  let w = maxX - minX + pad;
  let top = Math.min(minY, m.legendY) - 4;
  let h = Math.max(maxY - minY + pad, 220);
  const targetH = Math.max(h, w * 0.42);
  if (targetH > h) {
    top -= (targetH - h) / 2;
    h = targetH;
  }
  return `${minX - pad / 2} ${top} ${w} ${h + 8}`;
}

export function viewBoxForNodes(nodes: ArchitectureNode[]): string {
  return tightViewBox(nodes, plateLayoutMetrics(nodes.length));
}

export function inferGroupsFromNodes(nodes: ArchitectureNode[]): ArchitectureGroup[] {
  const seen = new Map<string, ArchitectureGroup>();
  for (const n of nodes) {
    if (!n.group || seen.has(n.group)) continue;
    const title = n.group.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    seen.set(n.group, { id: n.group, title, tone: n.tone });
  }
  return [...seen.values()];
}