import type { FontPackManifest, ThemeJson } from "../lib/schemas";
import { resolveFontPack } from "../lib/fontPacks";

const STYLE_ID = "scorecard-font-pack-faces";

const DISPLAY_LEGACY: Record<ThemeJson["fonts"]["display"], string> = {
  paleologue: '"Libretto Paléologue", Georgia, serif',
  "paleologue-poster": '"Libretto Paléologue Poster", "Libretto Paléologue", Georgia, serif',
};

function pickDisplayFamily(pack: FontPackManifest, theme: ThemeJson): string {
  if (pack.packId === "libretto-default") {
    return DISPLAY_LEGACY[theme.fonts.display] ?? `"${pack.faces.display.family}", Georgia, serif`;
  }
  return `"${pack.faces.display.family}", Georgia, serif`;
}

function faceRule(face: FontPackManifest["faces"]["display"], url: string): string {
  const weight = face.weight != null ? `font-weight: ${face.weight};\n` : "";
  const style = face.style ? `font-style: ${face.style};\n` : "";
  return `@font-face {
  font-family: "${face.family}";
  src: url("${url}") format("woff2");
  font-display: swap;
  ${weight}${style}}`;
}

const LIBRETTO_OUTLINE: FontPackManifest["faces"]["display"] = {
  family: "Libretto Paléologue",
  woff2: "/fonts/LibrettoPaleologue-Regular.woff2",
};

export function applyFontPackFaces(pack: FontPackManifest, theme?: ThemeJson) {
  const displayFace =
    pack.packId === "libretto-default" && theme?.fonts.display === "paleologue"
      ? LIBRETTO_OUTLINE
      : pack.faces.display;
  const rules = [displayFace, pack.faces.body, pack.faces.ui, pack.faces.mono]
    .map((face) => faceRule(face, face.woff2))
    .join("\n");
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
  applyFontPackFaces(pack, theme);

  root.style.setProperty("--canvas", theme.tokens.canvas);
  root.style.setProperty("--ink", theme.tokens.ink);
  root.style.setProperty("--action", theme.tokens.action);
  root.style.setProperty("--rule", theme.tokens.rule);
  root.style.setProperty("--muted", theme.tokens.muted);
  root.style.setProperty("--font-display", pickDisplayFamily(pack, theme));
  root.style.setProperty("--font-body", `"${pack.faces.body.family}", Georgia, serif`);
  root.style.setProperty("--font-ui", `"${pack.faces.ui.family}", system-ui, sans-serif`);
  root.style.setProperty("--font-mono", `"${pack.faces.mono.family}", ui-monospace, monospace`);
  root.dataset.scheme = theme.scheme;
  root.dataset.tone = theme.tone;
  root.dataset.fontPack = pack.packId;
  root.dataset.ornamentPalette = theme.ornaments.ornamentPalette;
}