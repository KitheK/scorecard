# Agent rules (Scorecard)

All coding and review agents working in this repository must follow this file. It overrides taste and defaults.

**Stack:** TypeScript, React 19, Vite 6, Vitest, `npx scorecard-kit check`, static content under `content/`.

## Must fix (blocks merge)

1. **Linked issue.** Every implementation PR must include `Closes #N` (or `Fixes #N`) in the body and satisfy that issue’s acceptance criteria. Docs-only or repo-plumbing PRs may instead state acceptance criteria in the PR body.
2. **Tests for new behaviour.** New logic needs Vitest coverage that fails for a real reason before the fix and passes after. No tautological tests (asserting only what the implementation copies back with no independent check).
3. **CI green.** `npm test`, `npm run build`, and `npm run check` must pass. Run `bash scripts/ci-local.sh` before pushing.
4. **Plugin manifests and skill mirrors.** Canonical skill lives in `skills/scorecard/`. After editing it, run `node scripts/sync-agent-skills.mjs` so `.claude/`, `.agents/`, and `.github/skills/` stay identical. Keep `plugin.json`, `.cursor-plugin/plugin.json`, `.claude-plugin/plugin.json`, and marketplace JSON version/description aligned with `package.json` when those fields change.
5. **No drive-by scope.** Change only what the issue asks. Refactors and “while I’m here” edits need an issue or explicit owner approval in the PR.
6. **UI / Nouveau fidelity.** Visual changes must match the Libretto/Nouveau look (Libretto Paléologue display type, Pavot/Lys motifs, framed plates). PRs that touch `src/components/nouveau/`, `src/theme/`, or page layout must include **before/after screenshots** in the body or as PR comment attachments. Respect `prefers-reduced-motion` and keyboard/focus paths for interactive UI.
7. **Fonts and assets.** Do not bundle fonts without a redistributable license on file (`public/fonts/`, `LICENSES/`). Ornaments and previews must stay consistent with `LICENSES/ORNAMENTS.txt`.
8. **No agent workflow edits.** Coding agents must not modify `.github/workflows/` or `scripts/agents/`. Human owners or explicit “CI plumbing” issues only.

## Should fix (Rose may CHANGES on repeated neglect)

- Over-engineering (abstractions the issue did not require).
- Missing sync after skill edits.
- Large bundles without justification; prefer code-splitting when the issue targets perf.
- Provenance abuse: marking claims `confirmed` or inventing metrics (Scorecard never grades).

## Nice to have

- Narrower PRs, clearer commit messages (`test:`, `feat:`, `fix:`, `docs:`).
- Comments only for non-obvious business logic.

## Local CI (authors and agents)

```bash
bash scripts/ci-local.sh
```

Equivalent to CI: `npm ci`, `npm test`, `npm run build`, `npm run check`, and skill mirror drift check.

## Review gate (Rose)

Independent reviewer **Rose** runs on pull requests when `ENABLE_ROSE_REVIEW=true`. Rose reads this file and `.github/agents/prompts/rose-review.md`, posts one PR conversation comment ending with `Rose-Verdict: PASS` or `Rose-Verdict: CHANGES`. Actions applies labels and never merges protected branches.

## Issue labels for agents

| Label | Meaning |
| --- | --- |
| `agent-now` | Run the coding agent immediately on this issue |
| `overnight-queue` | Eligible for the nightly coding agent pick |
| `overnight-agent` | PR opened by an agent (stay draft until human marks ready) |
| `needs-human` | Agent is blocked; do not retry until a human responds |
| `review:pass` / `review:changes` | Set by Actions from Rose’s verdict |
| `ready-to-merge` | CI green, Rose PASS, not draft, branch up to date |

See `.github/agents/README.md` for secrets, variables, and triggers.