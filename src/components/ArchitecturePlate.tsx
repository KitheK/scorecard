import type { Palette } from "./nouveau/core";
import { NouveauFrame, type FrameVariant } from "./nouveau";
import { useContent } from "../lib/ContentContext";
import { Claim } from "./Claim";

export function ArchitecturePlate() {
  const { architecture, theme } = useContent();
  const frame = theme.ornaments.plateFrame;
  const palette: Palette = theme.ornaments.ornamentPalette === "plate" ? "plate" : "libretto";
  const animate = theme.scheme !== "plain" && frame !== "none";

  const body = (
    <div className="architecture-plate-body">
      {architecture.overview ? <Claim claim={architecture.overview} /> : null}
      <ul>
        {architecture.nodes.map((n) => (
          <li key={n.id}>
            <strong>{n.label}</strong>
            {n.path ? <span className="mono"> — {n.path}</span> : null}
          </li>
        ))}
      </ul>
      {architecture.mermaid ? (
        <pre className="mermaid-block" aria-label="Mermaid export fallback">
          {architecture.mermaid}
        </pre>
      ) : null}
    </div>
  );

  if (frame === "none") {
    return <div className="frame-wrap architecture-plate-frame">{body}</div>;
  }

  const variant = frame as FrameVariant;

  return (
    <NouveauFrame variant={variant} palette={palette} animate={animate} className="architecture-plate-frame" gap={12}>
      {body}
    </NouveauFrame>
  );
}