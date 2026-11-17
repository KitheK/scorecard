# Scorecard overhaul plan

**Status:** Planning only (this document).  
**Design bar:** [Libretto](https://github.com/KitheK/libretto) — reference source in `uploads/libretto-reference.zip` (extracted for this audit at `libretto-ref/libretto/`) and seven runtime screenshots under `libretto-work/verify/`.  
**Owner intent:** Generated guides must feel like Libretto; onboarding must engage via a local web form; architecture diagrams are mandatory; platform branding stays “Scorecard,” product title is “&lt;Project Name&gt; Guide”; font packs beyond Paléologue + Departure.

---

## 1. Audit — how Scorecard works today

### 1.1 Generation pipeline (agent + JSON)

| Stage | Current behaviour | Primary files |
|--------|-------------------|---------------|
| Launch | Agent reads skill; no kit UI for onboarding. CLI `npx scorecard-kit dev` opens **Write mode** at `/write`, not an interview. | `skills/scorecard/SKILL.md`, `bin/scorecard.js` (`cmdDev` → `/write`) |
| Interview | Markdown script: infer-first, batches of 3–5 **chat** questions; answers should land in `content/interview.json`. | `skills/scorecard/interview.md` |
| Repo scan | Bounded read of tree, README, manifests; architecture nodes must have valid paths. | `skills/scorecard/references/analysis.md` |
| Content fill | Agent writes `content/*.json` (never `confirmed`). Generators exist in kit but are **not invoked by CLI** — agents must import/call manually. | `src/generators/architecture.ts`, `timeline.ts`, `references/schema.md` |
| Validate | `npx scorecard-kit check` | `bin/scorecard.js` |
| Preview | Vite app loads JSON bundle | `src/lib/loadContent.ts`, `ContentContext.tsx` |

**Reproduced (this environment, 2026-11-17):**

- `npm install` + `vitest run` — 12 tests pass (`generators.test.ts`, `provenance.test.ts`).
- `npx vite --host 127.0.0.1 --port 5199` — site serves; default route is summary, not interview.
- `node bin/scorecard.js check` — passes; warns architecture paths like `scorecard/package.json` missing when running kit **as** the repo root (paths assume scaffolded `scorecard/` subfolder).
- Dogfood demos (`loadDogfood.ts`) inject **empty** `architecture: { nodes: [], edges: [] }` — no diagram in demo packs.

### 1.2 Generated site UX (kit UI)

| Area | Observation | Files |
|------|-------------|-------|
| **Routing** | `/` = single “Scorecard summary”; optional `/contents` + `/chapters/:slug`. No Libretto-style home essay, FAQ, or shot strip. | `src/App.tsx` |
| **Chrome** | Top bar brand **“SCORECARD”**; nav links only. No persistent sidebar TOC, scroll ruler, or mobile contents drawer. | `src/components/Layout.tsx` |
| **Summary page** | Hero `h1.display` = **“SCORECARD”**; sections as dashed-border `.panel` stacks (job, features, run, etc.). Functional but generic docs layout. | `src/pages/ScorecardPage.tsx`, `src/theme/theme.css` |
| **Contents** | Plain list inside panels; no word counts, row hover, or editorial standfirst. | `src/pages/ContentsPage.tsx` |
| **Chapters** | Blocks: `h2`, `p`, `architecture`, `timeline`, `status`, `run` only. Schema also defines `figure`, `live`, `decision`, etc. — **not rendered**. Prose is plain text (no link/italic parsing). | `src/pages/ChapterPage.tsx`, `src/lib/schemas.ts` |
| **Architecture** | `ArchitecturePlate` = bordered box + bullet list + **Mermaid in `<pre>`**; frame variant shown as text label only. **NouveauFrame never imported in app.** | `src/components/ArchitecturePlate.tsx` |
| **Timeline** | Plain text list in a mono box. | `src/components/TimelinePlate.tsx` |
| **Ornaments** | `FootFrieze` uses **static PNG** previews, not live `NouveauFrieze` SVG. Rail unused (`theme.ornaments.rail: "none"`). | `src/components/FootFrieze.tsx`, `src/components/nouveau/*` |
| **Naming** | `content/manual.json` title `"Scorecard"`; `index.html` title `Scorecard`; layout wordmark SCORECARD. | `content/manual.json`, `index.html` |

### 1.3 Interview & engagement

- `content/interview.json` in repo: profile filled, **`answers: {}`** — no captured Q&A.
- Skill text is thorough but **procedural** (Stage A–E codes), not narrative or project-specific hooks.
- No `/interview` route, no form UI, no POST handler for interview saves (only Write save plugin lists fixed JSON files: `vite-plugin-scorecard-save.ts`).
- Stage E “look” points at `look-gallery.html` and PNG specimens; not integrated into first-run flow.

### 1.4 Architecture diagrams

- `buildArchitecture()` produces validated nodes/edges + mermaid string (`src/generators/architecture.ts`).
- **No** SVG/React plate, no interactive picks, no `FIG_###` registry.
- Skill does not require a minimum node count or a dedicated architecture chapter block.
- Libretto counterpart: hand-authored `figures/plates.tsx` + `InteractivePlate` + `TopologyPanel` (~1200 lines of SVG).

### 1.5 Fonts & theme

- Single hard-coded stack: Paléologue (display), Newsreader, Source Sans 3, Departure (`theme.json`, `applyTheme.ts`, `schemas.ts` enums).
- Write → Look toggles scheme + two display variants + ornament IDs; **no font pack abstraction**.
- No path to add custom `@font-face` bundles or generated display faces.

### 1.6 Gap summary (maps to owner feedback)

1. **Formatting / design** — Kit is a narrow centered column with UI-sans section headers; Libretto is manual layout with sidebar, ruler, plates, mono labels, RichText, and motion fallbacks.
2. **Engaging launch** — Opens Write; interview is chat-only markdown.
3. **Web form** — Missing entirely.
4. **Naming** — Product titled “Scorecard” everywhere instead of “&lt;Project&gt; Guide”.
5. **Architecture diagrams** — Mermaid pre Block; demos empty; no framed FIG-style plates.
6. **Font packs** — Not modeled.

---

## 2. Libretto analysis — what to port

Screenshots (design bar):

| File | Shows |
|------|--------|
| `libretto-work/verify/01-home-live-light.png` | Home hero: pixel LIBRETTO wordmark, kicker, lede columns, compact architecture plate, stats band |
| `libretto-work/verify/03-home-live-assistant.png` | Desk interactives (theme toggle toy, assistant UI) |
| `libretto-work/verify/04-home-clips.png` | MotionClip figures with mono labels (THEME, ASSISTANT) |
| `libretto-work/verify/05-chapter02-live.png` | Sidebar TOC, scroll ruler readout, live embed frame with LIGHT/DARK chrome |
| `libretto-work/verify/06-chapter05-agent-think.png` | Chapter prose + assistant embed + blue mono figure label |
| `libretto-work/verify/07-chapter05-reduced-motion.png` | Static GIF fallback when motion reduced |

### 2.1 Layout & navigation

| Pattern | Libretto implementation | Scorecard today |
|---------|-------------------------|-----------------|
| Persistent sidebar TOC | `ManualLayout.tsx` — Roman parts, chapter links, `PixelWordmark`, mobile drawer | Top nav only |
| Contents page | Editorial header, word counts per chapter, `contents-row` grid | Minimal `ContentsPage` |
| Chapter chrome | Crumb mono line, WORDS count, standfirst, `hr.rule`, pager prev/next | Single column, mono part/number only |
| Scroll ruler | Fixed `.ruler` + `.ruler-readout` (`ChapterPage.tsx`) | None |
| Page enter | `PageEnter` wrapper | None |
| Home vs summary | `HomePage.tsx` — essay + plate + ShotStrip + DeskInteractives + inline contents | N/A (summary only) |

**CSS:** `libretto-ref/libretto/src/styles.css` — `--sidebar`, `.shell`, `.chapter`, `.plate`, `.shot`, `.desk-*`, reduced-motion rules.

### 2.2 Content blocks & richness

Libretto `Block` union (`content/manual.ts`):

- `p` with `RichText` (markdown links + `*emphasis*`)
- `figure` → `Plate` (numbered `FIG_###`, framed canvas, caption)
- `shot` → screenshot figure
- `desk` → `ThemeDeskToy` / `AssistantDeskToy` (project-specific; Scorecard may use generic embed/motion slots)
- `walk` → walkthrough component
- `h2` section breaks
- Per-chapter `sources[]` list

Scorecard `ManualBlock` is a superset but renderer implements ~half.

### 2.3 Dynamic / interactive behaviour

| Component | Role | Reference |
|-----------|------|-----------|
| `InteractivePlate` | Click-to-select parts; `DetailRail` + `TopologyPanel` | `figures/InteractivePlate.tsx` |
| `Plate` | Fig index, named sheet, figcaption | `components/Plate.tsx` |
| `MotionClip` | video → gif fallback; respects reduced motion | `desk/MotionClip.tsx` |
| `DeskInteractives` | Try-the-desk section on home | `desk/DeskInteractives.tsx` |
| Live embed chrome | Theme tabs, route label, RESET / FULL PAGE | Screenshots ch.02 |
| `ScrollStage` | Home scroll-linked staging | `components/ScrollStage.tsx` |

**Porting strategy for Scorecard:** Do not copy Conductor-specific desk toys wholesale. Port the **patterns**: framed plates, mono figure labels, motion with fallback, optional `live` block with honest “mock/embed” captioning, interactive architecture when data supports it.

### 2.4 Typography & colour

- Paper `#fbfbfb`, action `#103dff`, serif body (Newsreader), UI in Departure Mono at 11px for labels — matches Scorecard `theme.json` scheme `libretto` but **not** applied with Libretto spacing/line-height (`line-height: 1.8`, `--measure: 38rem`).

### 2.5 Architecture figure (FIG_001 bar)

`figures/plates.tsx` `Assembly` / `InteractivePlate`: uniform LR spine, blue wash boxes, legend, click for service detail. This is the target for **generated** architecture — not raw Mermaid text.

---

## 3. Numbered issues (prioritised)

Priority: **P0** = most visible / owner-critical; **P1** = important; **P2** = enables roadmap.

### P0 — Visual manual system (Libretto parity)

**Issue 1 — Manual shell layout**  
- **Problem:** Top-bar blog layout; no sidebar TOC, ruler, or chapter pager.  
- **Outcome:** Libretto-style `ManualLayout` for Standard/Full; Lite keeps simple summary.  
- **Acceptance:** Roman-part sidebar; active chapter highlight; scroll ruler on chapter routes; responsive contents drawer.  
- **Files:** New `src/components/ManualLayout.tsx` (port/adapt), `Layout.tsx`, `theme.css` / split `manual.css`, `App.tsx`.  
- **Deps:** Issue 10 (naming for wordmark text).

**Issue 2 — Contents & chapter typography**  
- **Problem:** Contents and chapters lack editorial hierarchy (standfirst, rule, word counts, contents rows).  
- **Outcome:** Match Libretto `ContentsPage` / `ChapterPage` header patterns.  
- **Acceptance:** Contents shows per-chapter word counts; chapters have crumbs, standfirst, prev/next pager, optional sources.  
- **Files:** `ContentsPage.tsx`, `ChapterPage.tsx`, `schemas.ts` (optional `sources` on chapters).  
- **Deps:** Issue 1.

**Issue 3 — Rich block renderer**  
- **Problem:** `ManualBlock` types unused; paragraphs lack links; no figures.  
- **Outcome:** Render `figure`, `live`, `decision`, `requirement`, `contribution`; RichText for `p`.  
- **Acceptance:** Dogfood manual uses at least one `figure` block; links render; unknown types fail check with clear error.  
- **Files:** `ChapterPage.tsx`, new `RichText.tsx`, `schemas.ts`, skill `references/schema.md`.  
- **Deps:** Issues 4–5 for figure content.

**Issue 4 — Wire Nouveau SVG ornaments into plates**  
- **Problem:** `NouveauFrame` / `NouveauFrieze` exist but UI uses PNG footers and CSS border on architecture.  
- **Outcome:** Plates and architecture use `NouveauFrame` with `theme.ornaments.plateFrame`.  
- **Acceptance:** Architecture and install/run sections show coins46-style frame (configurable); foot uses SVG frieze when not `plain`.  
- **Files:** `ArchitecturePlate.tsx`, `FootFrieze.tsx`, import nouveau in pages.  
- **Deps:** None.

**Issue 5 — Architecture diagram plates (not Mermaid pre)**  
- **Problem:** No real diagrams; owner反馈 pivotal.  
- **Outcome:** Generate `architecture.json` + optional `architecture-plate.json` (layout hints); render SVG plate in Libretto style with project-specific nodes.  
- **Acceptance:** Every Standard/Full generated site has ≥3 nodes, ≥2 edges, visible framed diagram on summary + architecture chapter; paths validated.  
- **Files:** `src/generators/architecture.ts`, new `src/components/plates/ArchitectureDiagram.tsx`, `figures/kit.tsx` (shared primitives, trimmed from Libretto), skill `analysis.md`, `architecture.json` schema extension.  
- **Deps:** Contract in §4.3.

**Issue 6 — Web interview form + agent handoff**  
- **Problem:** No local engagement surface; answers not structured.  
- **Outcome:** `/interview` multi-step form (Stages A–E); saves `interview.json`; exports `interview-handoff.json` for agent; CLI opens interview first on fresh scaffold.  
- **Acceptance:** User can complete form without chat; agent reads handoff file and continues scan/generate; refresh preserves authored answers.  
- **Files:** New `src/interview/*`, `vite-plugin-scorecard-save.ts`, `bin/scorecard.js` (`interview` command, `dev` opens interview if empty), `schemas.ts`.  
- **Deps:** Contract §4.1.

### P1 — Onboarding, naming, content quality

**Issue 7 — Engaging interview content (skill)**  
- **Problem:** Questions read like a checklist (A1, B3…).  
- **Outcome:** Mirror form copy: hooks tied to project kind, concrete examples, optional “story” prompts; still infer-first.  
- **Acceptance:** `interview.md` + form strings reviewed; at least one engaging prompt per stage; skip still valid.  
- **Files:** `skills/scorecard/interview.md`, mirrored `.github`/`.claude` skills, form UI copy.  
- **Deps:** Issue 6.

**Issue 8 — Product naming: “&lt;Project Name&gt; Guide”**  
- **Problem:** SCORECARD branding on generated sites.  
- **Outcome:** `manual.projectName` + `manual.title` = `"${projectName} Guide"`; display wordmark uses project name; “Scorecard” only in platform/footer credit.  
- **Acceptance:** Fresh generate from `my-app` shows “My App Guide”; grep generated content for user-visible “Scorecard” only in platform attribution lines.  
- **Files:** `schemas.ts`, `Layout.tsx`, `ScorecardPage.tsx`, `index.html` (dynamic title via React), skill SKILL.md scaffold instructions, all `content/*.json` templates.  
- **Deps:** Contract §4.2 (early).

**Issue 9 — Home / opening essay (Full)**  
- **Problem:** No Libretto-style orientation home.  
- **Outcome:** For `size: full`, `/` is manual home (essay + hero figure + stats); summary moves to `/scorecard` or section on home.  
- **Acceptance:** Full dogfood demonstrates home + plate; Lite unchanged.  
- **Files:** New `HomePage.tsx`, `App.tsx`, `manual.json` shape, skill module gates.  
- **Deps:** Issues 1, 5, 8.

**Issue 10 — Agent pipeline: mandatory architecture + manual blocks**  
- **Problem:** Skill doesn't require diagram or rich manual.  
- **Outcome:** SKILL workflow step: run `buildArchitecture` from scan; emit `figure` block referencing `ARCH_001`; gate Full on plate presence.  
- **Acceptance:** RED fixture includes architecture nodes; skill text names generator import path.  
- **Files:** `skills/scorecard/SKILL.md`, `references/analysis.md`, `fixtures/`.  
- **Deps:** Issue 5.

**Issue 11 — Motion / reduced-motion pattern**  
- **Problem:** No motion clips or reduced-motion fallback.  
- **Outcome:** Optional `motion` block type with webm/gif/poster; static fallback per Libretto.  
- **Acceptance:** One demo clip; `prefers-reduced-motion` shows poster/gif only.  
- **Files:** New `MotionClip.tsx` (port), `schemas.ts`, `ChapterPage.tsx`.  
- **Deps:** Issue 3.

### P2 — Font packs & extensibility

**Issue 12 — Font pack manifest**  
- **Problem:** Fonts enum-fixed; no swapping packs.  
- **Outcome:** `content/font-pack.json` or embedded in `theme.json`: `packId`, `display`, `body`, `ui`, `mono` with file paths; built-in `libretto-default` + stub `custom`.  
- **Acceptance:** Switching pack in Write/Look updates CSS vars; check validates files exist.  
- **Files:** `schemas.ts`, `applyTheme.ts`, `public/fonts/README`, `theme-presets.md`.  
- **Deps:** Contract §4.4.

**Issue 13 — Additional built-in font packs**  
- **Problem:** Only Paléologue pairing documented.  
- **Outcome:** At least one alternate pack (e.g. plain editorial: Newsreader display + same mono).  
- **Acceptance:** `look-gallery` and interview Stage E show pack previews.  
- **Files:** `public/fonts/`, `look-gallery.html`, presets doc.  
- **Deps:** Issue 12.

**Issue 14 — Custom / generated font pack path**  
- **Problem:** No workflow to add or generate fonts.  
- **Outcome:** Documented steps: drop WOFF2 + OFL license → manifest entry; optional agent step to propose Google/specimen pairing (no auto hosting of copyrighted outlines).  
- **Acceptance:** README section; `font-pack.json` `source: authored|generated`.  
- **Files:** docs, skill Stage E, Issue 12 manifest.  
- **Deps:** Issue 12.

**Issue 15 — Live embed block (honest)**  
- **Problem:** `live` block type unused; feature marked stubbed.  
- **Outcome:** Frame for iframe or static screenshot strip with Libretto chrome; caption requires provenance.  
- **Acceptance:** Team dogfood can show deploy URL or “screenshot only” embed.  
- **Files:** `ChapterPage.tsx`, new `LiveEmbed.tsx`, skill guidance.  
- **Deps:** Issues 1, 3.

---

## 4. Workstreams (parallel cloud agents)

Five workstreams with minimal merge overlap if contracts land first.

```
                    ┌─────────────────────────────────────┐
                    │ WS0: Contracts (½ day, one agent)    │
                    │ naming, interview, arch plate, fonts │
                    └─────────────────┬───────────────────┘
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   ┌──────────────┐           ┌──────────────┐            ┌──────────────┐
   │ WS1: Manual  │           │ WS2: Interview│            │ WS3: Arch    │
   │ shell + CSS  │           │ web form+CLI  │            │ generator +  │
   │              │           │               │            │ SVG plates   │
   └──────┬───────┘           └──────┬───────┘            └──────┬───────┘
          │                          │                          │
          └────────────┬─────────────┴──────────────┬───────────┘
                       ▼                              ▼
                ┌──────────────┐               ┌──────────────┐
                │ WS4: Blocks  │               │ WS5: Fonts   │
                │ + home page  │               │ + packs      │
                └──────────────┘               └──────────────┘
```

### WS0 — Contracts (must merge first)

Single PR touching only `docs/contracts/*.md` + `schemas.ts` **type additions** (no UI).

| Contract | Purpose |
|----------|---------|
| **§4.1 Interview handoff** | `interview.json` + `interview-handoff.json` |
| **§4.2 Project naming** | `manual.projectName`, title rule, `document.title` |
| **§4.3 Architecture plate** | Extended `architecture.json` + optional plate layout |
| **§4.4 Font pack manifest** | `FontPackManifest` shape |

### WS1 — Manual shell & global styles

- **Issues:** 1, 2, 4 (in part)  
- **Touches:** `Layout.tsx`, new `ManualLayout`, `theme.css` / `manual.css`, `FootFrieze`  
- **Avoid:** `ChapterPage` block switch (WS4), generators (WS3)

### WS2 — Interview web form & CLI

- **Issues:** 6, 7  
- **Touches:** `src/interview/`, `bin/scorecard.js`, `vite-plugin-scorecard-save.ts`, skills copy  
- **Avoid:** `ManualLayout` (WS1)

### WS3 — Architecture generator & diagram UI

- **Issues:** 5, 10  
- **Touches:** `src/generators/`, `src/components/plates/`, skills  
- **Avoid:** large CSS refactors (WS1)

### WS4 — Block renderer, RichText, home (Full)

- **Issues:** 3, 9, 11, 15  
- **Touches:** `ChapterPage.tsx`, `HomePage.tsx`, `schemas.ts` blocks, dogfood JSON  
- **Merge after:** WS1 shell + WS3 plate component API

### WS5 — Font packs

- **Issues:** 12, 13, 14  
- **Touches:** `applyTheme.ts`, `theme.json`, `WritePage` Look panel, `public/fonts/`  
- **Mostly independent** once §4.4 exists

### Build order

1. **WS0** contracts → merge to `master`  
2. **WS1 + WS2 + WS3** in parallel  
3. **WS4** integrates 1 + 3  
4. **WS5** parallel with 4 if capacity allows  
5. **Issue 8** naming can start in WS0/WS1 early (low conflict)

### Shared interfaces (detail)

#### 4.1 Interview answers / handoff JSON

```json
{
  "schemaVersion": 1,
  "submittedAt": "ISO-8601",
  "depth": "quick | standard | deep",
  "profile": {
    "kind": "team",
    "builders": "small team",
    "purpose": "handoff",
    "readerGoal": "run",
    "scale": "weeks",
    "projectName": "Conductor"
  },
  "answers": {
    "A1": { "value": "team", "provenance": "confirmed" },
    "B1": { "value": "One sentence job…", "provenance": "confirmed" },
    "E_scheme": { "value": "libretto", "provenance": "confirmed" }
  },
  "narrative": {
    "hook": "optional free text",
    "proudMoment": "optional"
  },
  "agentNotes": "Displayed only in handoff export"
}
```

- Form writes `content/interview.json`.  
- `POST /__scorecard/save` already pattern for Write; extend allowlist.  
- `interview-handoff.json` = slim export for agent (no PII beyond user entry).

#### 4.2 Naming contract

- `manual.projectName`: string (required on generate)  
- `manual.title`: always `"${projectName} Guide"`  
- `scorecard.json` may add `projectName` duplicate for summary hero.  
- Platform string: footer e.g. `Made with Scorecard` (mono, muted).

#### 4.3 Architecture plate data

Extend `architecture.json`:

```json
{
  "schemaVersion": 1,
  "figureId": "ARCH_001",
  "layout": "spine-lr | layered | radial",
  "nodes": [{ "id", "label", "group", "path?", "x?", "y?" }],
  "edges": [{ "from", "to", "label?" }],
  "groups": [{ "id", "title", "tone" }],
  "mermaid": "optional fallback for export/print"
}
```

- Generator fills nodes from repo scan; layout engine assigns coordinates if omitted.  
- Renderer: SVG + `NouveauFrame`; interactive selection optional v1.1.

#### 4.4 Font pack manifest

```json
{
  "schemaVersion": 1,
  "packId": "libretto-default",
  "label": "Paléologue · Departure",
  "license": "LICENSES/FONTS.txt",
  "faces": {
    "display": { "family": "Libretto Paléologue Poster", "woff2": "/fonts/..." },
    "body": { "family": "Newsreader", "woff2": "/fonts/..." },
    "ui": { "family": "Source Sans 3", "woff2": "/fonts/..." },
    "mono": { "family": "Departure Mono", "woff2": "/fonts/..." }
  }
}
```

- `theme.json` references `fontPackId` instead of inline enums (enums kept as shortcuts mapping to packs).

---

## 5. Open questions (owner)

1. **Full vs Standard home:** Should Standard gain a shortened home essay, or only Full gets Libretto-style `/`?
2. **Live embed scope:** Require iframe of deploy URL when present, or screenshot/motion-only for v1?
3. **Interactive architecture:** Is click-to-inspect detail rail required for v1, or static framed SVG enough?
4. **Interview form auth:** Local-only trust model OK (anyone with localhost can save), or need session token?
5. **Custom fonts:** Is “generate new font pack” limited to **selecting** open-licensed pairs, or actual outline generation (major scope)?
6. **Pixel wordmark:** Port Libretto `PixelWordmark` for all guides, or Paléologue display only?
7. **Conductor desk toys:** Generic “try a panel” placeholders per project, or skip desk block until project supplies assets?

---

## 6. Suggested verification (post-implementation)

| Check | Command / action |
|-------|------------------|
| Content validity | `npx scorecard-kit check` |
| Unit tests | `npm test` (extend plate + interview schema tests) |
| Visual | Compare side-by-side with Libretto screenshots; Playwright snapshots optional |
| Agent E2E | RED fixture: interview handoff → generate → architecture nodes ≥ 3 |
| Naming | Assert no `SCORECARD` hero in generated fixture |

---

## 7. References (quick index)

| Scorecard | Libretto (zip) |
|-----------|----------------|
| `src/pages/ScorecardPage.tsx` | `src/components/HomePage.tsx` |
| `src/components/Layout.tsx` | `src/components/ManualLayout.tsx` |
| `src/pages/ContentsPage.tsx` | `src/components/ContentsPage.tsx` |
| `src/pages/ChapterPage.tsx` | `src/components/ChapterPage.tsx` |
| `src/components/ArchitecturePlate.tsx` | `src/figures/plates.tsx`, `InteractivePlate.tsx` |
| `skills/scorecard/interview.md` | _(product interview is form + prose — no equivalent file)_ |
| `src/components/nouveau/NouveauFrame.tsx` | ornaments used in plates/frame CSS in `styles.css` |

---

*Plan authored by planning agent; no application code changed except this document.*