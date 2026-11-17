import type { FontPackManifest, ThemeJson } from "../lib/schemas";
import { resolvedFaceIds, resolveThemeFaces, stackCssFamily } from "../lib/fontCatalog";
import { resolveFontPack } from "../lib/fontPacks";

const STYLE_ID = "scorecard-font-pack-faces";

function faceRule(face: FontPackManifest["faces"]["display"], url: string): string {
  const weight = face.weight != null ? `font-weight: ${face.weight};\n` : "";
  const style = face.style ? `font-style: ${face.style};\n` : "";
  return `@font-face {
  font-family: "${face.family}";
  src: url("${url}") format("woff2");
  font-display: swap;
  ${weight}${style}}`;
}

export function applyFontPackFaces(faces: FontPackManifest["faces"]) {
  const unique = new Map<string, FontPackManifest["faces"]["display"]>();
  for (const face of Object.values(faces)) {
    unique.set(face.woff2, face);
  }
  const rules = [...unique.values()].map((face) => faceRule(face, face.woff2)).join("\n");
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = rules;
}

export function applyTheme(theme: ThemeJson, packOverride?: FontPackManifest) {
  const root = document.documentElement;
  const pack = packOverride ?? resolveFontPack(theme);
  const faces = resolveThemeFaces(theme, pack);
  const faceIds = resolvedFaceIds(theme, pack);
  applyFontPackFaces(faces);

  root.style.setProperty("--canvas", theme.tokens.canvas);
  root.style.setProperty("--ink", theme.tokens.ink);
  root.style.setProperty("--action", theme.tokens.action);
  root.style.setProperty("--rule", theme.tokens.rule);
  root.style.setProperty("--muted", theme.tokens.muted);
  root.style.setProperty("--font-display", stackCssFamily(faceIds.display));
  root.style.setProperty("--font-body", stackCssFamily(faceIds.body));
  root.style.setProperty("--font-ui", stackCssFamily(faceIds.ui));
  root.style.setProperty("--font-mono", stackCssFamily(faceIds.mono));
  root.dataset.scheme = theme.scheme;
  root.dataset.tone = theme.tone;
  root.dataset.fontPack = pack.packId;
  root.dataset.ornamentPalette = theme.ornaments.ornamentPalette;
}