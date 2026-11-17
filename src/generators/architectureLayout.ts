import type { ArchitectureFile, ArchitectureGroup, ArchitectureNode } from "../lib/schemas";

export const PLATE_BOX_W = 124;
export const PLATE_BOX_H = 52;
export const PLATE_STORE_H = 64;
const COL_GAP = 44;
const ROW_GAP = 10;
const MARGIN_X = 36;
const MARGIN_Y = 56;

function columnHeight(nodes: ArchitectureNode[], boxH: number): number {
  if (nodes.length === 0) return 0;
  return nodes.length * boxH + (nodes.length - 1) * ROW_GAP;
}

function boxHeight(node: ArchitectureNode): number {
  return node.tone === "data" ? PLATE_STORE_H : PLATE_BOX_H;
}

/** Assign `x`/`y` on nodes when omitted — v1 spine-lr primary. */
export function applyArchitectureLayout(file: ArchitectureFile): ArchitectureFile {
  const layout = file.layout ?? "spine-lr";
  const nodes = file.nodes.map((n) => ({ ...n }));

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
    let colX = MARGIN_X + 28;
    let maxH = 0;
    for (const gid of order) {
      const list = byGroup.get(gid)!;
      let y = MARGIN_Y;
      for (const n of list) {
        const h = boxHeight(n);
        n.x = n.x ?? colX;
        n.y = n.y ?? y;
        y += h + ROW_GAP;
      }
      maxH = Math.max(maxH, columnHeight(list, PLATE_BOX_H));
      colX += PLATE_BOX_W + COL_GAP;
    }
    void maxH;
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
    let y = MARGIN_Y;
    for (const layer of layerKeys) {
      const list = byLayer.get(layer)!;
      let x = MARGIN_X;
      const rowH = Math.max(...list.map(boxHeight));
      for (const n of list) {
        n.x = n.x ?? x;
        n.y = n.y ?? y;
        x += PLATE_BOX_W + COL_GAP;
      }
      y += rowH + ROW_GAP * 2;
    }
  } else if (layout === "radial") {
    const cx = 360;
    const cy = 220;
    const r = Math.min(140, 40 + nodes.length * 18);
    nodes.forEach((n, i) => {
      const a = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      n.x = n.x ?? Math.round(cx + r * Math.cos(a) - PLATE_BOX_W / 2);
      n.y = n.y ?? Math.round(cy + r * Math.sin(a) - boxHeight(n) / 2);
    });
  }

  return { ...file, nodes, layout };
}

export function viewBoxForNodes(nodes: ArchitectureNode[]): string {
  let maxX = 720;
  let maxY = 400;
  for (const n of nodes) {
    const x = n.x ?? 0;
    const y = n.y ?? 0;
    const h = boxHeight(n);
    maxX = Math.max(maxX, x + PLATE_BOX_W + MARGIN_X);
    maxY = Math.max(maxY, y + h + MARGIN_Y);
  }
  return `0 0 ${maxX} ${maxY}`;
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