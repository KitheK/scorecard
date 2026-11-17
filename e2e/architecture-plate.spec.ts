import { test, expect, type Page } from "@playwright/test";

type PlateCheck = {
  ok: boolean;
  errors: string[];
  minFontPx: number;
};

async function checkPlate(page: Page, plateSelector: string): Promise<PlateCheck> {
  return page.evaluate((sel) => {
    const errors: string[] = [];
    const frame = document.querySelector(sel) as HTMLElement | null;
    if (!frame) return { ok: false, errors: ["frame missing"], minFontPx: 0 };

    const svg = frame.querySelector("svg.arch-diagram") as SVGSVGElement | null;
    if (!svg) return { ok: false, errors: ["diagram svg missing"], minFontPx: 0 };

    const vb = svg.viewBox.baseVal;
    const scale = svg.clientWidth > 0 ? svg.clientWidth / vb.width : 1;

    const nodeBoxes = [...frame.querySelectorAll(".diagram-hit")].flatMap((g) => {
      const shapes = g.querySelectorAll("rect, ellipse");
      return [...shapes].map((el) => (el as SVGGraphicsElement).getBBox());
    });
    for (const b of nodeBoxes) {
      if (b.x < vb.x - 2 || b.y < vb.y - 2 || b.x + b.width > vb.x + vb.width + 2 || b.y + b.height > vb.y + vb.height + 2) {
        errors.push(`node box outside viewBox (${b.x.toFixed(0)},${b.y.toFixed(0)})`);
      }
    }

    const nodeTexts = [...frame.querySelectorAll(".diagram-hit text")];
    const boxes = nodeTexts.map((t) => {
      const el = t as SVGTextElement;
      const clipped = el.closest("[clip-path]") ?? el;
      const b = clipped.getBBox();
      const scale = svg.clientWidth > 0 ? svg.clientWidth / vb.width : 1;
      return { t, b, screen: { w: b.width * scale, h: b.height * scale } };
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].t.getBoundingClientRect();
        const b = boxes[j].t.getBoundingClientRect();
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        const overlap = w > 12 && h > 12;
        if (overlap) {
          errors.push(`text overlap: "${boxes[i].t.textContent?.slice(0, 12)}" × "${boxes[j].t.textContent?.slice(0, 12)}"`);
        }
      }
    }

    const meetScale = svg.clientWidth > 0 ? svg.clientWidth / vb.width : 1;
    const minFontPx =
      nodeTexts.length === 0
        ? 0
        : Math.min(
            ...nodeTexts.map((t) => {
              const el = t as SVGTextElement;
              const fs = parseFloat(el.getAttribute("font-size") ?? "0");
              if (fs > 0) return fs * meetScale;
              return el.getBoundingClientRect().height;
            }),
          );
    if (minFontPx < 11) errors.push(`min font ${minFontPx.toFixed(1)}px < 11px`);

    const art = frame.querySelector(".nv-frame__art svg");
    const pathCount = art ? art.querySelectorAll("path, use").length : 0;
    if (pathCount < 12) errors.push(`frame ornament incomplete (path/use count ${pathCount})`);

    const body = frame.querySelector(".nv-frame__body") as HTMLElement | null;
    const diagram = frame.querySelector(".arch-diagram-viewport") as HTMLElement | null;
    const rail = frame.querySelector(".detail-rail") as HTMLElement | null;
    if (body && diagram && body.scrollWidth > body.clientWidth + 4) {
      errors.push("diagram escapes frame body horizontally");
    }

    const minFrameW = Math.min(260, window.innerWidth - 32);
    const minFrameH = window.innerWidth < 420 ? 140 : 160;
    if (frame.offsetHeight < minFrameH || frame.offsetWidth < minFrameW) errors.push("frame dimensions too small");

    return { ok: errors.length === 0, errors, minFontPx };
  }, plateSelector);
}

async function openArch(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("#arch").scrollIntoViewIfNeeded();
  await page.waitForSelector(".architecture-plate__nouveau svg.arch-diagram", { timeout: 15_000 });
  await page.waitForFunction(() => {
    const art = document.querySelector(".architecture-plate__nouveau .nv-frame__art svg");
    return art && art.querySelectorAll("path, use").length >= 12;
  });
  await page.waitForFunction(() => {
    const host = document.querySelector(".interactive-plate__canvas .arch-diagram-viewport") as HTMLElement | null;
    const svg = document.querySelector(".architecture-plate__nouveau svg.arch-diagram") as SVGSVGElement | null;
    if (!host || !svg || svg.clientWidth < 80) return false;
    return Math.abs(host.getBoundingClientRect().width - svg.clientWidth) < 12;
  });
  await page.waitForTimeout(200);
}

for (const [name, width] of [
  ["1280", 1280],
  ["390", 390],
] as const) {
  test(`kit architecture plate @ ${name}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openArch(page, "/");
    const result = await checkPlate(page, "#arch .architecture-plate__nouveau");
    expect(result.errors, result.errors.join("; ")).toEqual([]);
    expect(result.minFontPx).toBeGreaterThanOrEqual(11);
  });

  test(`team demo plate @ ${name}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openArch(page, "/demos/team");
    const result = await checkPlate(page, "#arch .architecture-plate__nouveau");
    expect(result.errors, result.errors.join("; ")).toEqual([]);
    expect(result.minFontPx).toBeGreaterThanOrEqual(11);
  });
}