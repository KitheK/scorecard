# WS1 performance audit — manual shell (frontend + kit backend)

**Scope:** Reading chrome, layout, Nouveau ornaments, and the static preview app. Not WS2 interview POST latency or WS3 diagram layout (separate streams).

## Frontend — what affects time-to-interactive

| Area | Current behaviour | Delay / cost |
|------|-------------------|--------------|
| **Theme tokens** | `applyTheme()` sets CSS variables on `<html>` when `theme.json` or reading LIGHT/DARK changes | O(1); no reflow beyond paint |
| **Reading theme** | Stored in `sessionStorage` (`scorecard.readingTheme`); reapplied with kit tokens so DARK is not overridden on re-render | Fixes prior bug where inline light tokens won over `data-theme` |
| **TOC drawer** | Sidebar off-canvas until hamburger opens; route change closes drawer (`useEffect` on `pathname`) | No layout cost while closed; `transform` transition 160ms |
| **Page enter** | `PageEnter` key resets with route (~420ms opacity transform) | Skipped when `prefers-reduced-motion: reduce` |
| **Chapter ruler** | Passive `scroll` listener updates readout | Cheap; disabled on narrow viewports via CSS |
| **Nouveau motifs** | `import.meta.glob` + per-motif dynamic JSON (`useMotif.ts`); cached after first load | First footer/plate frame may wait on network chunks (see build output); subsequent visits hit cache |
| **NouveauFrieze / Frame** | `useInView` + optional `animate`; respects `footAnimate` and reduced-motion in `nouveau.css` | Animation work deferred until in view |
| **Vite bundle** | Main chunk ~550KB gzip ~177KB (ornament data split into multiple assets) | Largest single cost on cold load |
| **Content** | `loadContent()` sync import of JSON at startup | Small vs ornaments |

## Backend (kit CLI) — relevant to this workstream

| Piece | Role | Timing notes |
|-------|------|----------------|
| **`bin/scorecard.js check`** | Synchronous JSON validation + path checks | No network; suitable for CI |
| **`bin/scorecard.js dev`** | Spawns Vite on `127.0.0.1`, polls until HTTP ready before opening browser | Avoids “dead tab” race |
| **`vite-plugin-scorecard-save`** | Write-mode POST (WS2) | Not used by manual shell |
| **Production `build`** | Static `dist/`; no server-side render | Preview is client-only React |

There is no application server in WS1; perceived delays are almost entirely **first-load JS/CSS** and **motif JSON fetch**.

## Optimizations already in place (WS1)

1. **Motif code-splitting** — ornaments load on demand per variant, not in the main bundle.
2. **Drawer-first TOC** — persistent sidebar removed on desktop; fewer pixels and no wasted margin reflow.
3. **Passive scroll** — chapter ruler handler uses `{ passive: true }`.
4. **Reduced motion** — page-enter and sidebar transition disabled under `prefers-reduced-motion`.
5. **Sticky chrome bar** — theme + hamburger without extra React trees.

## Gaps and recommended next steps (this workstream)

| Priority | Item | Rationale |
|----------|------|-----------|
| P1 | **Lazy route Friaze** — defer `FootFrieze` import until below fold or idle | Cuts first paint work on summary route |
| P1 | **Verify dark/light in CI** — Playwright assert `--canvas` computed style after DARK click | Prevents regression of inline-token override |
| P2 | **Optional `prefers-reduced-motion` for Nouveau** — tie `footAnimate` to OS setting automatically | Less main-thread SVG work |
| P2 | **Preconnect fonts** — `index.html` link rel preconnect to self `/fonts` | Small LCP win |
| P3 | **Document bundle budget** in `vite.config` `chunkSizeWarningLimit` + manual chunks for `/write` only | Write mode is dev-only; split from reader |

## Cross-workstream (not WS1)

- **WS4 home essay** — additional plates; use same lazy motif pattern.
- **WS5 font packs** — font-face loading strategy affects LCP; keep single default pack on first paint.
- **WS2 interview** — form bundle separate route; already code-split by React Router if mounted at `/interview`.

---

*Audit for stacked PR on WS1 (focus mode TOC + working reading theme + platform copy).*