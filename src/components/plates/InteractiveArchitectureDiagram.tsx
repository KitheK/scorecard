import { useSyncExternalStore } from "react";
import type { ArchitectureFile } from "../../lib/schemas";
import { ArchitectureDiagramSvg } from "./ArchitectureDiagram";
import { DetailRail } from "./DetailRail";
import { InteractivePlate } from "./InteractivePlate";
import { TopologyPanel } from "./TopologyPanel";

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type InteractiveArchitectureDiagramProps = {
  file: ArchitectureFile;
  /** Compact layout for home hero (smaller rail gap). */
  compact?: boolean;
  defaultNodeId?: string | null;
  showTopology?: boolean;
};

export function InteractiveArchitectureDiagram({
  file,
  compact,
  defaultNodeId,
  showTopology = true,
}: InteractiveArchitectureDiagramProps) {
  const motionReduced = useSyncExternalStore(subscribeReducedMotion, reducedMotion, () => false);
  const defaultPart = defaultNodeId ?? file.nodes[0]?.id ?? null;

  return (
    <div className={compact ? "interactive-architecture interactive-architecture--compact" : "interactive-architecture"}>
      <InteractivePlate
        defaultPart={defaultPart}
        renderRail={(partId) => <DetailRail file={file} partId={partId} />}
      >
        {({ pick, selected }) => (
          <ArchitectureDiagramSvg file={file} pick={pick} selected={selected} animateEdges={!motionReduced} />
        )}
      </InteractivePlate>
      {showTopology ? <TopologyPanel file={file} /> : null}
    </div>
  );
}