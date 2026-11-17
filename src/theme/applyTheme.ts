import type { ThemeJson } from "../lib/schemas";

export type ReadingTheme = "light" | "dark";

export const READING_THEME_STORAGE_KEY = "scorecard.readingTheme";

const DISPLAY: Record<ThemeJson["fonts"]["display"], string> = {
  paleologue: '"Libretto Paléologue", Georgia, serif',
  "paleologue-poster": '"Libretto Paléologue Poster", "Libretto Paléologue", Georgia, serif',
};

const DARK_READING_TOKENS: ThemeJson["tokens"] = {
  canvas: "#0b1118",
  ink: "#f1f3f6",
  action: "#5b8cff",
  rule: "rgba(241, 243, 246, 0.22)",
  muted: "#9aa3ad",
};

export function readStoredReadingTheme(): ReadingTheme {
  if (typeof window === "undefined") return "light";
  const stored = window.sessionStorage.getItem(READING_THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function applyTheme(theme: ThemeJson, reading: ReadingTheme = "light") {
  const root = document.documentElement;
  const tokens = reading === "dark" ? { ...theme.tokens, ...DARK_READING_TOKENS } : theme.tokens;
  root.style.setProperty("--canvas", tokens.canvas);
  root.style.setProperty("--ink", tokens.ink);
  root.style.setProperty("--action", tokens.action);
  root.style.setProperty("--rule", tokens.rule);
  root.style.setProperty("--muted", tokens.muted);
  root.style.setProperty("--font-display", DISPLAY[theme.fonts.display]);
  root.style.setProperty("--font-body", '"Newsreader", Georgia, serif');
  root.style.setProperty("--font-ui", '"Source Sans 3", system-ui, sans-serif');
  root.style.setProperty("--font-mono", '"Departure Mono", ui-monospace, monospace');
  root.dataset.scheme = theme.scheme;
  root.dataset.tone = theme.tone;
  root.dataset.ornamentPalette = theme.ornaments.ornamentPalette;
  root.dataset.theme = reading;
}