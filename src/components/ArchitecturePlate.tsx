import { useContent } from "../lib/ContentContext";
import type { ArchitectureFile } from "../lib/schemas";
import { Claim } from "./Claim";
import { NouveauFrame, type FrameVariant } from "./nouveau";
import { InteractiveArchitectureDiagram } from "./plates";
import "./plates/architecture-plate.css";

export type ArchitecturePlateProps = {
  /** When omitted, uses bundle from ContentContext. */
  architecture?: ArchitectureFile;
  compact?: boolean;
  showOverview?: boolean;
  showTopology?: boolean;
};

function frameVariant(raw: string): FrameVariant {
  if (raw === "pavot30" || raw === "lys33" || raw === "halo01" || raw === "coins46") return raw;
  return "coins46";
}

export function ArchitecturePlate({
  architecture: architectureProp,
  compact,
  showOverview = true,
  showTopology = false,
}: ArchitecturePlateProps) {
  const { architecture: ctxArch, theme } = useContent();
  const architecture = architectureProp ?? ctxArch;
  const frame = frameVariant(theme.ornaments.plateFrame);
  const figureId = architecture.figureId ?? "ARCH_001";

  if (!architecture.nodes.length) {
    return (
      <div className="architecture-plate architecture-plate--empty panel">
        <p className="mono">Architecture diagram pending — run the agent architecture step.</p>
      </div>
    );
  }

  return (
    <figure className="architecture-plate plate">
      <p className="architecture-plate__label mono">{figureId}</p>
      {showOverview && architecture.overview ? (
        <div className="architecture-plate__overview">
          <Claim claim={architecture.overview} />
        </div>
      ) : null}
      <NouveauFrame variant={frame} animate={theme.ornaments.footAnimate} scale={compact ? 0.9 : 1} gap={12}>
        <InteractiveArchitectureDiagram file={architecture} compact={compact} showTopology={showTopology} />
      </NouveauFrame>
    </figure>
  );
}

/** @deprecated alias — WS4 should import `InteractiveArchitectureDiagram` from `./plates`. */
export { InteractiveArchitectureDiagram } from "./plates";