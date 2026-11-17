import { describe, expect, it } from "vitest";
import { applyFontPackFaces } from "../theme/applyTheme";
import { BUILTIN_FONT_PACKS, resolveFontPack, withFontPack } from "./fontPacks";
import { themePresets } from "./schemas";

describe("font packs", () => {
  it("resolves built-in libretto-default", () => {
    const theme = themePresets("libretto");
    const pack = resolveFontPack({ ...theme, fontPackId: "libretto-default" });
    expect(pack.packId).toBe("libretto-default");
    expect(pack.faces.display.woff2).toContain("Libretto");
  });

  it("withFontPack switches editorial-plain", () => {
    const next = withFontPack(themePresets("libretto"), "editorial-plain");
    expect(next.fontPackId).toBe("editorial-plain");
    expect(BUILTIN_FONT_PACKS["editorial-plain"].faces.display.family).toBe("Newsreader");
  });

  it("applyFontPackFaces emits @font-face rules", () => {
    if (typeof document === "undefined") return;
    applyFontPackFaces(BUILTIN_FONT_PACKS["editorial-plain"]);
    const el = document.getElementById("scorecard-font-pack-faces");
    expect(el?.textContent).toContain("Newsreader");
    expect(el?.textContent).toContain("woff2");
  });
});