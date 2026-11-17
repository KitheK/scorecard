import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { GraphInput } from "./architecture";

const CANDIDATE_PATHS = [
  "package.json",
  "README.md",
  "src/App.tsx",
  "src/main.tsx",
  "bin/scorecard.js",
  "skills/scorecard/SKILL.md",
  "content/manual.json",
  "vite.config.ts",
];

/** Bounded repo scan → graph hints for `buildArchitecture`. */
export function scanArchitectureGraph(root: string = process.cwd()): GraphInput {
  const nodes: GraphInput["nodes"] = [];
  const edges: GraphInput["edges"] = [];

  const add = (id: string, label: string, path: string, group: string, tone: GraphInput["nodes"][0]["tone"]) => {
    if (!existsSync(join(root, path))) return;
    nodes.push({ id, label, path, group, tone });
  };

  add("pkg", "Package", "package.json", "tooling", "runtime");
  add("app", "App shell", "src/App.tsx", "client", "client");
  if (!nodes.some((n) => n.id === "app")) add("app", "App shell", "src/main.tsx", "client", "client");
  add("cli", "CLI", "bin/scorecard.js", "tooling", "runtime");
  add("skill", "Agent skill", "skills/scorecard/SKILL.md", "authoring", "service");
  add("content", "Content JSON", "content/manual.json", "data", "data");
  add("vite", "Vite config", "vite.config.ts", "tooling", "runtime");

  add("generators", "Generators", "src/generators/architecture.ts", "generators", "service");

  for (const p of CANDIDATE_PATHS) {
    if (nodes.some((n) => n.path === p)) continue;
    if (existsSync(join(root, p))) {
      const id = p.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "").slice(0, 24);
      nodes.push({ id, label: p, path: p, group: "repo", tone: "service" });
    }
  }

  const byId = new Set(nodes.map((n) => n.id));
  const link = (from: string, to: string, label: string) => {
    if (byId.has(from) && byId.has(to)) edges.push({ from, to, label });
  };

  link("skill", "content", "fills");
  link("content", "app", "drives");
  link("cli", "app", "serves");
  link("pkg", "app", "scripts");
  link("skill", "pkg", "documents");
  if (byId.has("architecture")) {
    link("architecture", "app", "plates");
  }

  let overview: string | undefined;
  try {
    const readme = readFileSync(join(root, "README.md"), "utf8").slice(0, 2000);
    const line = readme
      .split(/\n+/)
      .map((l) => l.trim())
      .find(
        (l) =>
          l &&
          !l.startsWith("#") &&
          !l.startsWith("<") &&
          !l.startsWith("!") &&
          !l.startsWith("[") &&
          l.length > 20,
      );
    if (line) overview = line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").slice(0, 200);
  } catch {
    overview = "Components inferred from repository layout.";
  }

  return { root, overview, nodes, edges };
}