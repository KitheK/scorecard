---
name: scorecard
description: >
  Use when asked to summarise, document, present, or build a Scorecard / project
  manual / diary site for what a repository built; when the user wants Lite,
  Standard, or Full descriptive docs with Write mode; or when scaffolding a
  scorecard app from an interview. Also use when they mention provenance,
  built-vs-borrowed, or npx scorecard.
---

# Scorecard

Descriptive project manuals only. Never grade. Never invent metrics or contributions. Never set `provenance: confirmed` (only the author via Write mode).

## Hard rules

- Infer first, ask second (confirm-or-correct).
- Batches of 3–5 questions; skip is valid → tag `draft` / `inferred`.
- Content is JSON under `content/`, never hand-written TypeScript manuals.
- Honour “no ornaments” via the **plain** scheme — do not abandon the kit for Inter.
- “Just fill it in, I trust you” → still `draft`.
- Re-runs update only `generated`; propose diffs for `authored`.
- Run redaction before writing files; env **names** only, never values.

## Ordered workflow

1. Stage A (profile) — see `interview.md`
2. Bounded repo scan — see `references/analysis.md`
3. Stages B–D at chosen depth
4. Stage E look & feel — link specimens / `npx scorecard look`; or E6 defaults
5. Propose size Lite|Standard|Full; apply module gates from `references/project-profiles.md`
6. **Scaffold the kit into the target project** (stranger-safe — no Libretto monorepo required):
   - Prefer: clone the kit once, then copy into `./scorecard` inside the project being documented:
     ```bash
     git clone --depth 1 https://github.com/KitheK/scorecard.git /tmp/scorecard-kit
     cp -R /tmp/scorecard-kit ./scorecard
     # Keep kit app files; drop plugin-only clutter from the copy if present:
     # (optional) remove ./scorecard/skills ./scorecard/plugin.json ./scorecard/.cursor-plugin
     cd scorecard && npm install
     ```
   - Windows PowerShell: `git clone --depth 1 https://github.com/KitheK/scorecard.git $env:TEMP\scorecard-kit` then `Copy-Item -Recurse $env:TEMP\scorecard-kit .\scorecard`
   - If `./scorecard` already exists, reuse it — do not wipe `authored` content.
   - Write `theme.json` (or confirm existing) from Stage E / `references/theme-presets.md`.
7. Fill `scorecard/content/*.json` with provenance tags (`confirmed` only via later Write → Review).
8. Redaction pass + from `scorecard/`: `npx scorecard check`
9. Hand off: `cd scorecard && npx scorecard dev` → opens Write mode. Author finishes in the browser.

## References

- `interview.md`
- `references/schema.md`
- `references/theme-presets.md`
- `references/project-profiles.md`
- `references/analysis.md`

## Reference Full manual

[Libretto](https://github.com/KitheK/libretto) / live [499team1.com/make](https://499team1.com/make) — example Full Scorecard-shaped site, not a dependency.
