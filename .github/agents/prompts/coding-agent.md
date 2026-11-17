# Coding agent prompt (`agent-now`)

Implement GitHub issue `$ISSUE` in `$REPO`.

1. Read `AGENTS.md`, then the issue (`gh issue view $ISSUE --comments`).
   Skim `skills/scorecard/SKILL.md` if the issue touches documentation or content generation.
2. If labeled `needs-human`, or criteria are ambiguous: comment with questions, add `needs-human`, remove `agent-now`, stop.
3. Restate on the issue: what you will change, what you will not, which acceptance lines you will prove.
4. Branch `issue-$ISSUE-<short-name>` from current `master`.
   **Red first:** add Vitest tests from the issue; commit `test: ...`; they must fail for a real reason; capture output.
   **Green:** smallest TypeScript/React change that matches; commit `feat: ...` or `fix: ...`.
   If you edit `skills/scorecard/`, run `node scripts/sync-agent-skills.mjs` and commit mirror updates.
5. Before pushing, run `bash scripts/ci-local.sh` until it passes.
6. Open a **DRAFT** PR from `.github/pull_request_template.md`: `Closes #$ISSUE`, test evidence, notes.
   For UI work, attach screenshots (Nouveau/Libretto look).
   Label the PR `overnight-agent`. Assign to `$PR_ASSIGNEE` (default `KitheK`).
   Rose will review after green CI.
7. Comment on the issue with the PR link. Remove `agent-now` and `overnight-queue` from the issue.

Never push to `master`, never merge, never edit `.github/workflows/` or `scripts/agents/`, never enable auto-merge,
never bundle fonts without license files, never mark provenance `confirmed` without human intent.
If blocked: comment, add `needs-human`, stop.