import { describe, expect, it } from "vitest";
import { validateArchitecture } from "../lib/schemas";
import { applyArchitectureLayout, viewBoxForNodes } from "./architectureLayout";
import { buildArchitecture, scanArchitectureGraph } from "./architecture";
import { fitLines } from "../components/plates/kit";

describe("architecture layout", () => {
  it("assigns coordinates on spine-lr", () => {
    const arch = buildArchitecture({
      nodes: [
        { id: "a", label: "A", group: "g1" },
        { id: "b", label: "B", group: "g1" },
        { id: "c", label: "C", group: "g2" },
      ],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
    });
    expect(arch.nodes.every((n) => n.x !== undefined && n.y !== undefined)).toBe(true);
    expect(validateArchitecture(arch, () => true, { minNodes: 3, minEdges: 2, requireInteractiveFields: true })).toEqual(
      [],
    );
  });

  it("scan + build from this repo", () => {
    const arch = buildArchitecture(scanArchitectureGraph(process.cwd()));
    expect(arch.nodes.length).toBeGreaterThanOrEqual(3);
    expect(arch.edges.length).toBeGreaterThanOrEqual(2);
    expect(arch.mermaid).toContain("flowchart");
    const vb = viewBoxForNodes(arch.nodes);
    expect(vb).toMatch(/^0 0 \d+ \d+$/);
    const relaid = applyArchitectureLayout(arch);
    expect(relaid.layout).toBe("spine-lr");
  });
});

describe("label fitting", () => {
  it("wraps long parenthetical labels", () => {
    const { lines, size } = fitLines("(OpenAI API)", 72, 10);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(lines.join(" ")).toContain("OpenAI");
    expect(size).toBeLessThanOrEqual(10);
  });
});