import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ArchitectureFile, ArchitectureGroup, ArchitectureNode } from "../../lib/schemas";
import {
  applyArchitectureLayout,
  boxHeight,
  metricsForCanvas,
  plateLayoutMetrics,
  tightViewBox,
} from "../../generators/architectureLayout";
import { edgeRoute } from "./architectureRouting";
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

function groupColumns(
  nodes: ArchitectureNode[],
  groups: ArchitectureGroup[] | undefined,
  m: ReturnType<typeof plateLayoutMetrics>,
): Array<{ group: ArchitectureGroup | { id: string; title: string; tone?: string }; x: number; y: number; h: number }> {
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
    const minY = Math.min(...list.map((n) => n.y ?? 0));
    const maxY = Math.max(...list.map((n) => (n.y ?? 0) + boxHeight(n, m)));
    const g =
      meta.get(gid) ??
      ({
        id: gid,
        title: gid === "_ungrouped" ? "Stack" : gid.replace(/[-_]/g, " "),
        tone: list[0]?.tone,
      } as ArchitectureGroup);
    return { group: g, x: minX - m.bandW - 10, y: minY - 4, h: maxY - minY + 8 };
  });
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
  selectedId?: string | null;
  animateEdges?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const raw = el.getBoundingClientRect().width;
      const cap =
        typeof window !== "undefined" ? Math.max(160, window.innerWidth - 32) : raw;
      const w = Math.min(raw, cap);
      if (w > 48) setCanvasW(Math.round(w));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = useMemo(() => {
    const fallback =
      typeof window !== "undefined" ? Math.min(720, Math.max(200, window.innerWidth - 32)) : 640;
    return metricsForCanvas(file, canvasW > 48 ? canvasW : fallback);
  }, [file, canvasW]);
  const laidOut = useMemo(() => applyArchitectureLayout(file, m), [file, m]);
  const nodes = laidOut.nodes;
  const viewBox = tightViewBox(nodes, m);
  const legendTones = [...new Set(nodes.map((n) => toneId(n.tone)))].slice(0, 6);
  const legendW = legendTones.length * 108 + 24;
  const vbParts = viewBox.split(/\s+/).map(Number);
  const vbMaxX = vbParts[0] + vbParts[2];
  const wide = vbParts[2] > canvasW * 1.05;

  return (
    <div
      ref={hostRef}
      className={wide ? "arch-diagram-viewport arch-diagram-viewport--scroll" : "arch-diagram-viewport"}
    >
      <Diagram label={`Architecture ${file.figureId ?? "diagram"}`} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        <rect
          x={vbParts[0] + 6}
          y={m.legendY - 8}
          width={legendW}
          height={24}
          fill="var(--canvas, #fbfbfb)"
          opacity="0.94"
          rx={2}
        />
        <Legend x={vbParts[0] + 14} y={m.legendY + 2} items={legendTones.map((tone) => ({ tone, label: tone }))} size={m.titleSize} />

        {groupColumns(nodes, laidOut.groups, m).map(({ group, x, y, h }, i) => (
          <VBand
            key={group.id + i}
            x={x}
            y={y}
            h={h}
            name={group.title.slice(0, 12).toUpperCase()}
            tone={toneId(group.tone)}
            size={m.titleSize - 1}
          />
        ))}

        <g className="arch-diagram__edges">
          {laidOut.edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const { points } = edgeRoute(from, to, m);
            return <Flow key={`${edge.from}-${edge.to}-${i}`} points={points} animate={animateEdges} delay={i * 0.15} />;
          })}
        </g>

        <g className="arch-diagram__nodes">
          {nodes.map((node) => {
            const h = boxHeight(node, m);
            const partId = pick ? node.id : undefined;
            const isData = node.tone === "data";
            const common = {
              x: node.x ?? 0,
              y: node.y ?? 0,
              w: m.boxW,
              h,
              title: node.label.toUpperCase(),
              lines: [] as string[],
              partId,
              selected: selected?.(node.id),
              onSelect: pick,
              tone: toneId(node.tone),
              titleSize: m.titleSize,
              subSize: m.subSize,
            };
            return isData ? <Store key={node.id} {...common} /> : <Box key={node.id} {...common} />;
          })}
        </g>

        {file.figureId ? (
          <T x={vbMaxX - 14} y={m.legendY + 12} anchor="end" fill={tones.paper.title} size={m.titleSize}>
            {file.figureId}
          </T>
        ) : null}
      </Diagram>
    </div>
  );
}