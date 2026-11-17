# Scorecard

**Descriptive project manuals for any codebase.**  
What was built, what works, what doesn’t, and how to run it — readable in about two minutes. **Never a grade.**

MIT licensed · [github.com/KitheK/scorecard](https://github.com/KitheK/scorecard)

---

## What it does

Scorecard turns a repository into a short site that tells the truth about the work:

- **The job** — one sentence for whom and what  
- **Brief vs outcome** — intent against what actually shipped  
- **Status per feature** — works / partial / stubbed / cut, plus the biggest gap  
- **Built vs borrowed** — authored work vs libraries, templates, APIs, starters  
- **Proof** — demo, screenshot, test, or metric (only when real)  
- **Run it** — setup steps and a 60-second demo script  
- **Next** — what you’d do with more time  

An **agent skill** interviews you (infer-first, confirm-or-correct), scans the repo with bounds, scaffolds a Vite kit, and fills JSON with **provenance** tags. You finish in **Write mode** — a diary editor in the browser — then publish a static build. Agents never mark claims `confirmed`; only you do, in Review.

Sizes: **Lite** (one page) · **Standard** (chapters when earned) · **Full** (long-lived / multi-service). Empty plates stay gated so a weekend hackathon never gets a fake branch history.

---

## Why it needs to exist

READMEs and slide decks flatten finished work into either hype or silence. Course markers, hackathon judges, teammates, and future-you need the same thing: a honest map of what is real, what is mocked, and how to run it — without a score, a leaderboard, or a performance review.

AI coding tools make it easy to *generate* docs that sound finished. Scorecard exists so those tools are steered toward **evidence and provenance** instead of invented polish: draft until you confirm, inferred only with a path or commit, authored content never silently overwritten on refresh.

---

## Who it’s for

| Audience | Why Scorecard fits |
|----------|--------------------|
| **Students & coursework** | Rubric / requirements map with paths; partials stay partial |
| **Hackathon teams** | Lite page + 90-second demo script; stubs called out |
| **Solo builders** | Personal CLIs and side projects without overselling |
| **Small teams** | Shared ownership areas; no invented individual glory |
| **Anyone using Claude, Codex, Copilot, Cursor, or similar** | Same skill workflow; install into that agent’s skill/agent folder |

Reference Full manual: [Libretto](https://github.com/KitheK/libretto) · live [499team1.com/make](https://499team1.com/make)

---

## In-app demos (dogfood)

The kit ships **working Scorecard pages for specific repo shapes** — open them inside the product, don’t imagine them from docs.

```bash
npm install
npx scorecard demos
```

Opens `/demos`:

| Demo | Repo shape |
|------|------------|
| **Hackathon weekend** | Greenfield demo; mocked bank sync |
| **Personal CLI** | Solo tool; brittle edges called out |
| **Course assignment** | Rubric map; partial persistence |
| **Team product** | Multi-owner areas; no fake metrics |
| **No README** | Sparse repo; draft-heavy until author voice |

Deep links: `/demos/hackathon`, `/demos/personal-cli`, `/demos/assignment`, `/demos/team`, `/demos/no-readme`.

---

## How the pieces fit

| Piece | Role |
|-------|------|
| **Skill** (`skills/scorecard`) | Interview → scan → scaffold → provenance-tagged JSON |
| **Kit** (this app) | Renders the manual; Lite / Standard / Full |
| **Write mode** | `npx scorecard dev` → edit like a diary, Confirm in Review |
| **CLI** | `check` · `dev` · `demos` · `build` · `export` · `refresh` · `look` |

### Provenance

| Tag | Meaning |
|-----|---------|
| `confirmed` | You verified it in Write → Review (agents never set this) |
| `inferred` | Evidence-backed (file path or commit) |
| `draft` | Unreviewed agent text |

---

## Use with your agent

Canonical skill: [`skills/scorecard/`](skills/scorecard/). Copy that folder into the path your tool loads:

| Tool | Install path |
|------|----------------|
| **Claude Code** | `.claude/skills/scorecard/` |
| **Codex** | `.agents/skills/scorecard/` |
| **GitHub Copilot** | `.github/skills/scorecard/` (agent: `.github/agents/scorecard.agent.md`) |
| **Cursor** | `.cursor/plugins/local/scorecard/` (or this repo as a plugin root) |

This repo already mirrors the skill into `.claude/`, `.agents/`, and `.github/` so clones work out of the box. Re-sync after editing the canonical skill:

```bash
node scripts/sync-agent-skills.mjs
```

**Example prompt (any of those tools):**

> Use the scorecard skill on this repo. Infer first, confirm with me, scaffold `./scorecard`, then hand off to Write mode.

---

## Kit commands

Requires **Node 20+**.

```bash
npm install
npx scorecard check
npx scorecard demos    # see dogfood packs
npx scorecard dev      # Write mode
npx scorecard build    # static dist/ (no Write / save)
```

To document *another* project, scaffold a `scorecard/` kit into that project (skill step 6) or clone this repo beside it and fill `content/*.json`.

---

## Security

See [SECURITY.md](SECURITY.md). Redact secrets before writing content; production builds omit Write mode.
