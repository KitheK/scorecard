# Scorecard

**Descriptive project manuals for any codebase.**  
What was built, what works, what doesn’t, and how to run it — in about two minutes on the Scorecard page. **Never a grade.**

License: **[CC BY-NC 4.0](LICENSE)** — © Kithe; free for non-commercial use with attribution. Commercial use needs a separate license.

Reference Full manual: [Libretto](https://github.com/KitheK/libretto) · live [/make](https://499team1.com/make)

---

## Install the plugin (30 seconds)

### Cursor (local test — do this before marketplace submit)

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.cursor\plugins\local" | Out-Null
Copy-Item -Recurse -Force . "$env:USERPROFILE\.cursor\plugins\local\scorecard"
```

macOS / Linux:

```bash
mkdir -p ~/.cursor/plugins/local
cp -R . ~/.cursor/plugins/local/scorecard
```

Reload Cursor (**Developer: Reload Window**). Confirm **scorecard** under Customize → Skills.

### Cursor Marketplace / community

1. Repo: https://github.com/KitheK/scorecard  
2. Community: [cursor.directory/plugins/new](https://cursor.directory/plugins/new)  
3. Official (after local verify): [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)

Manifests: `.cursor-plugin/plugin.json` · root `plugin.json` · skill `skills/scorecard/SKILL.md` · `logo.svg`

### Claude Code / Codex

Copy `skills/scorecard/` into `.claude/skills/scorecard/` or `.agents/skills/scorecard/`.

---

## One prompt after install

> Use the scorecard skill on this repo. Infer first, confirm with me, scaffold `./scorecard`, then hand off to Write mode.

---

## What you get

| Piece | Role |
|-------|------|
| **Agent skill** | Interview → scan → scaffold → provenance-tagged JSON |
| **Site kit** | Vite + React app; Lite / Standard / Full |
| **Write mode** | Diary editing in the browser (`npx scorecard dev`) |
| **CLI** | `check` · `dev` · `build` · `export` · `refresh` |

### Always on the Scorecard page

- The job · brief vs outcome · status per feature · built vs borrowed · proof · run-it · next

### Honesty (provenance)

| Tag | Meaning |
|-----|---------|
| `confirmed` | Author verified in Write → Review (agent never sets this) |
| `inferred` | Evidence-backed (path or commit) |
| `draft` | Unreviewed agent text |

---

## Kit setup (once per project)

Requires **Node 20+**.

```bash
# Inside the project you are documenting — after the skill scaffolds, or manually:
git clone --depth 1 https://github.com/KitheK/scorecard.git scorecard
cd scorecard
npm install
npx scorecard check
npx scorecard dev
```

| Command | Purpose |
|---------|---------|
| `npx scorecard dev` | Local Write mode (do not expose publicly) |
| `npx scorecard build` | Static `dist/` — no Write / save |
| `npx scorecard export` | Printable export + README badge snippet |
| `npx scorecard refresh` | Reminder to re-scan via the skill |
| `npx scorecard check` | Validate content / provenance rules |

### Sizes

| Size | For |
|------|-----|
| **Lite** | Hackathons, small assignments |
| **Standard** | Most projects |
| **Full** | Long-lived / multi-service (Libretto-scale) |

---

## Marketplace notes

- Submit **community** listing first for feedback; official Cursor Marketplace is curated and stricter.
- This repo is the public artifact (plugin + kit). Libretto stays the demo site only.
- License is **CC BY-NC 4.0** (you keep ownership; others may use non-commercially). Some official marketplaces prefer OSI open-source licenses — if a review rejects on license grounds, that is the tradeoff.

---

## Security

See [SECURITY.md](SECURITY.md). Redact secrets before writing content; production builds omit Write mode.
