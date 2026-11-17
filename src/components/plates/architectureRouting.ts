import type { ArchitectureNode } from "../../lib/schemas";
import type { PlateMetrics } from "../../generators/architectureLayout";
import { boxHeight } from "../../generators/architectureLayout";

export function nodeRect(node: ArchitectureNode, m: PlateMetrics) {
  const h = boxHeight(node, m);
  return { x: node.x ?? 0, y: node.y ?? 0, w: m.boxW, h };
}

/** Spine-friendly anchors: exit right, enter left when columns increase; else vertical. */
export function edgeRoute(
  from: ArchitectureNode,
  to: ArchitectureNode,
  m: PlateMetrics,
): { points: Array<[number, number]>; labelAt: [number, number] } {
  const a = nodeRect(from, m);
  const b = nodeRect(to, m);
  const dx = b.x - a.x;

  let p1: [number, number];
  let p2: [number, number];

  if (dx > m.boxW * 0.4) {
    p1 = [a.x + a.w, a.y + a.h / 2];
    p2 = [b.x, b.y + b.h / 2];
  } else if (dx < -m.boxW * 0.4) {
    p1 = [a.x, a.y + a.h / 2];
    p2 = [b.x + b.w, b.y + b.h / 2];
  } else if (b.y > a.y) {
    p1 = [a.x + a.w / 2, a.y + a.h];
    p2 = [b.x + b.w / 2, b.y];
  } else {
    p1 = [a.x + a.w / 2, a.y];
    p2 = [b.x + b.w / 2, b.y + b.h];
  }

  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const ex = p2[0] - p1[0];
  const ey = p2[1] - p1[1];
  const len = Math.hypot(ex, ey) || 1;
  const off = 14;
  const labelAt: [number, number] = [mx + (-ey / len) * off, my + (ex / len) * off - 2];

  return { points: [p1, p2], labelAt };
}