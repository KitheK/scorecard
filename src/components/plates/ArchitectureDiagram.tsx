import type { ArchitectureFile, ArchitectureGroup, ArchitectureNode } from "../../lib/schemas";
import { PLATE_BOX_H, PLATE_BOX_W, PLATE_STORE_H, viewBoxForNodes } from "../../generators/architectureLayout";
import { Box, Diagram, Flow, Legend, Store, T, VBand, tones, type ToneId } from "./kit";

function toneId(tone?: string): ToneId {
  const map: Record<string, ToneId> = {
    client: "client",
    edge: "edge",
    service: "service",
    agent: "agent",
    data: "store",
    store: "store",
    bus: "bus",
    external: "outside",
    runtime: "service",
  };
  return map[tone ?? ""] ?? "service";
}

function nodeBox(node: ArchitectureNode): { x: number; y: number; w: number; h: number } {
  const h = node.tone === "data" ? PLATE_STORE_H : PLATE_BOX_H;
  return { x: node.x ?? 0, y: node.y ?? 0, w: PLATE_BOX_W, h };
}

function subline(node: ArchitectureNode): string[] {
  if (node.path) {
    const short = node.path.length > 22 ? `(${node.path.split("/").pop()})` : `(${node.path})`;
    return [short];
  }
  if (node.detail?.role && node.detail.role !== node.label) return [`(${node.detail.role})`];
  return [];
}

function groupColumns(
  nodes: ArchitectureNode[],
  groups: ArchitectureGroup[] | undefined,
): Array<{ group: ArchitectureGroup | { id: string; title: string; tone?: string }; x: number; h: number }> {
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
  const meta = new Map((groups ?? []).map((g) => [g.id, g]));
  return order.map((gid) => {
    const list = byGroup.get(gid)!;
    const xs = list.map((n) => n.x ?? 0);
    const minX = Math.min(...xs);
    const ys = list.map((n) => (n.y ?? 0) + (n.tone === "data" ? PLATE_STORE_H : PLATE_BOX_H));
    const maxY = Math.max(...ys);
    const minY = Math.min(...list.map((n) => n.y ?? 0));
    const g =
      meta.get(gid) ??
      ({
        id: gid,
        title: gid === "_ungrouped" ? "STACK" : gid.toUpperCase(),
        tone: list[0]?.tone,
      } as ArchitectureGroup);
    return { group: g, x: minX - 28, h: maxY - minY + 8 };
  });
}

function center(node: ArchitectureNode): [number, number] {
  const b = nodeBox(node);
  return [b.x + b.w / 2, b.y + b.h / 2];
}

export function ArchitectureDiagramSvg({
  file,
  pick,
  selected,
  animateEdges = true,
}: {
  file: ArchitectureFile;
  pick?: (id: string) => void;
  selected?: (id: string) => boolean;
  animateEdges?: boolean;
}) {
  const viewBox = viewBoxForNodes(file.nodes);
  const legendTones = [...new Set(file.nodes.map((n) => toneId(n.tone)))].slice(0, 6);

  return (
    <Diagram label={`Architecture ${file.figureId ?? "diagram"}`} viewBox={viewBox}>
      <Legend
        x={48}
        y={12}
        items={legendTones.map((tone) => ({ tone, label: tone }))}
      />

      {groupColumns(file.nodes, file.groups).map(({ group, x, h }, i) => {
        const minY = Math.min(...(file.nodes.filter((n) => (n.group ?? "_ungrouped") === group.id).map((n) => n.y ?? 0)));
        return (
          <VBand key={group.id + i} x={x} y={minY - 4} h={h + 8} name={group.title.slice(0, 14).toUpperCase()} tone={toneId(group.tone)} />
        );
      })}

      {file.nodes.map((node) => {
        const b = nodeBox(node);
        const lines = subline(node);
        const partId = pick ? node.id : undefined;
        const isData = node.tone === "data";
        const common = {
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
          title: node.label.toUpperCase(),
          lines,
          partId,
          selected: selected?.(node.id),
          onSelect: pick,
          tone: toneId(node.tone),
        };
        return isData ? <Store key={node.id} {...common} /> : <Box key={node.id} {...common} />;
      })}

      {file.edges.map((edge, i) => {
        const from = file.nodes.find((n) => n.id === edge.from);
        const to = file.nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        const [x1, y1] = center(from);
        const [x2, y2] = center(to);
        const mid: [number, number] = [(x1 + x2) / 2, (y1 + y2) / 2 - 8];
        return (
          <Flow
            key={`${edge.from}-${edge.to}-${i}`}
            points={[
              [x1, y1],
              [x2, y2],
            ]}
            label={edge.label}
            labelAt={edge.label ? mid : undefined}
            animate={animateEdges}
            delay={i * 0.15}
          />
        );
      })}

      {file.figureId ? (
        <T x={Number(viewBox.split(/\s+/)[2] ?? 720) - 12} y={22} anchor="end" fill={tones.paper.title} size={10}>
          {file.figureId}
        </T>
      ) : null}
    </Diagram>
  );
}