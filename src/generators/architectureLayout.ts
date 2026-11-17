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

const BASE_SMALL = {
  boxW: 178,
  boxH: 76,
  storeH: 86,
  colGap: 132,
  rowGap: 22,
  bandW: 28,
  marginX: 36,
  marginY: 52,
  legendY: 14,
  titleSize: 12,
  subSize: 11,
};

const BASE_MED = {
  boxW: 148,
  boxH: 66,
  storeH: 78,
  colGap: 88,
  rowGap: 18,
  bandW: 26,
  marginX: 40,
  marginY: 48,
  legendY: 12,
  titleSize: 12,
  subSize: 11,
};

const BASE_LARGE = {
  boxW: 132,
  boxH: 56,
  storeH: 68,
  colGap: 64,
  rowGap: 14,
  bandW: 24,
  marginX: 36,
  marginY: 48,
  legendY: 12,
  titleSize: 11,
  subSize: 10,
};

export function plateLayoutMetrics(nodeCount: number): PlateMetrics {
  if (nodeCount <= 4) return { ...BASE_SMALL };
  if (nodeCount <= 8) return { ...BASE_MED };
  return { ...BASE_LARGE };
}

export function estimateSpineWidth(nodeCount: number, m: PlateMetrics): number {
  const groups = Math.min(4, Math.max(2, Math.ceil(nodeCount / 2)));
  return m.marginX + m.bandW + 10 + groups * m.boxW + Math.max(0, groups - 1) * m.colGap + 40;
}

function scalePlateMetrics(base: PlateMetrics, scale: number): PlateMetrics {
  if (Math.abs(scale - 1) < 0.03) return { ...base, titleSize: 12, subSize: 11 };
  const boxW = Math.max(56, Math.round(base.boxW * scale));
  return {
    ...base,
    boxW,
    boxH: Math.max(44, Math.round(base.boxH * scale)),
    storeH: Math.max(50, Math.round(base.storeH * scale)),
    colGap: Math.max(28, Math.round(base.colGap * scale)),
    rowGap: Math.max(12, Math.round(base.rowGap * scale)),
    bandW: Math.max(18, Math.round(base.bandW * scale)),
    marginX: Math.round(base.marginX * scale),
    marginY: Math.round(base.marginY * scale),
    titleSize: 12,
    subSize: 11,
  };
}

function meetFontPx(file: ArchitectureFile, scale: number, canvasWidthPx: number): { font: number; vbW: number } {
  const base = plateLayoutMetrics(file.nodes.length);
  const m = scalePlateMetrics(base, scale);
  const laid = applyArchitectureLayout(file, m);
  const vbParts = tightViewBox(laid.nodes, m).split(/\s+/).map(Number);
  const vbW = vbParts[2];
  const target = Math.max(120, canvasWidthPx - 8);
  const meet = target / Math.max(vbW, 1);
  return { font: m.titleSize * meet, vbW };
}

/** Scale metrics so `meet` keeps node titles ≥11px; small graphs fill the canvas width. */
export function metricsForCanvas(file: ArchitectureFile, canvasWidthPx: number): PlateMetrics {
  const base = plateLayoutMetrics(file.nodes.length);
  const MIN_FONT = 11.15;
  const target = Math.max(120, canvasWidthPx - 8);
  const small = file.nodes.length <= 4;
  const narrow = canvasWidthPx < 420 && file.nodes.length >= 6;
  let lo = 0.28;
  let hi = small ? 2.8 : 1.22;
  if (narrow) {
    lo = 0.55;
    hi = 0.95;
  }

  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const { font, vbW } = meetFontPx(file, mid, canvasWidthPx);
    const readable = font >= MIN_FONT - 0.15;
    if (small) {
      if (!readable) hi = mid;
      else if (vbW > target * 1.04) hi = mid;
      else lo = mid;
    } else if (readable) lo = mid;
    else hi = mid;
  }

  let scale = lo;
  for (let guard = 0; guard < 24; guard++) {
    const { font } = meetFontPx(file, scale, canvasWidthPx);
    if (font >= MIN_FONT - 0.1) break;
    scale -= 0.035;
    if (scale < 0.16) break;
  }
  if (small) {
    const { vbW } = meetFontPx(file, scale, canvasWidthPx);
    if (vbW < target * 0.82) {
      for (let s = scale; s <= hi; s += 0.04) {
        const probe = meetFontPx(file, s, canvasWidthPx);
        if (probe.font < MIN_FONT - 0.15 || probe.vbW > target * 1.06) break;
        scale = s;
        if (probe.vbW >= target * 0.9) break;
      }
    }
  }

  let m = scalePlateMetrics(base, scale);
  for (let pass = 0; pass < 4; pass++) {
    let titleSize = 12;
    const laid0 = applyArchitectureLayout(file, m);
    const vbW0 = tightViewBox(laid0.nodes, m)
      .split(/\s+/)
      .map(Number)[2];
    const meet0 = target / Math.max(vbW0, 1);
    if (titleSize * meet0 < MIN_FONT + 0.25) {
      titleSize = Math.min(24, Math.ceil((MIN_FONT + 1.1) / Math.max(meet0, 0.001)));
    }
    if (small && canvasWidthPx < 420) {
      titleSize = Math.max(
        14,
        titleSize,
        Math.min(26, Math.ceil(12.6 / Math.max(meet0, 0.001))),
      );
    }
  const rowGap = Math.max(m.rowGap, Math.round(titleSize * 2.25));
    const colGap = Math.max(m.colGap, Math.round(titleSize * (narrow ? 4.4 : 2.6)), narrow ? 120 : 0);
    const boxH = Math.max(m.boxH, Math.round(titleSize * 3.9));
    const storeH = Math.max(m.storeH, Math.round(titleSize * 4.4));
    m = { ...m, titleSize, subSize: Math.max(10, titleSize - 1), rowGap, colGap, boxH, storeH };
    const laid = applyArchitectureLayout(file, m);
    const vbW = tightViewBox(laid.nodes, m)
      .split(/\s+/)
      .map(Number)[2];
    const meet = target / Math.max(vbW, 1);
    if (m.titleSize * meet >= MIN_FONT - 0.1) break;
  }
  if (small && canvasWidthPx < 240) {
    m = { ...m, colGap: Math.max(m.colGap, Math.round(m.titleSize * 4.8)) };
  }
  for (let fix = 0; fix < 4; fix++) {
    const laidFinal = applyArchitectureLayout(file, m);
    const vbFinal = tightViewBox(laidFinal.nodes, m)
      .split(/\s+/)
      .map(Number)[2];
    const meetFinal = (canvasWidthPx - 8) / Math.max(vbFinal, 1);
    if (m.titleSize * meetFinal >= 11.05) break;
    const bumped = Math.min(30, Math.ceil(11.35 / Math.max(meetFinal, 0.001)));
    m = { ...m, titleSize: bumped, subSize: Math.max(10, bumped - 1) };
  }
  return m;
}

/** @deprecated */
export const PLATE_BOX_W = 132;
export const PLATE_BOX_H = 56;
export const PLATE_STORE_H = 68;

export function boxHeight(node: ArchitectureNode, m: PlateMetrics): number {
  return node.tone === "data" ? m.storeH : m.boxH;
}

export function applyArchitectureLayout(file: ArchitectureFile, m = plateLayoutMetrics(file.nodes.length)): ArchitectureFile {
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

    const colHeights = order.map((gid) => {
      const list = byGroup.get(gid)!;
      return list.reduce((sum, n, i) => sum + boxHeight(n, m) + (i > 0 ? m.rowGap : 0), 0);
    });
    const maxColH = Math.max(...colHeights, m.boxH);

    let colX = m.marginX + m.bandW + 10;
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

const PAD = { left: 12, right: 20, top: 8, bottom: 24 };

export function tightViewBox(nodes: ArchitectureNode[], m: PlateMetrics): string {
  if (!nodes.length) return "0 0 640 280";
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    const x = n.x ?? 0;
    const y = n.y ?? 0;
    const h = boxHeight(n, m);
    minX = Math.min(minX, x - m.bandW - PAD.left);
    minY = Math.min(minY, y - 6);
    maxX = Math.max(maxX, x + m.boxW + PAD.right);
    maxY = Math.max(maxY, y + h + PAD.bottom);
  }
  minY = Math.min(minY, m.legendY - 10);
  const w = maxX - minX;
  const h = maxY - minY;
  return `${minX - PAD.left / 2} ${minY} ${w + PAD.left} ${h + PAD.bottom}`;
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