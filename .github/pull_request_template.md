## Issue

Closes #

Agents: follow root `AGENTS.md` (Vitest for new behaviour, `scripts/ci-local.sh`, skill sync, no workflow edits). Agent PRs are **draft**, take the `overnight-agent` label, and must not edit `.github/workflows/`. Setup: `.github/agents/README.md`.

## Test evidence

Command and failing output before the fix (must name the new test):

```
```

Command and passing output after:

```
```

## UI (if applicable)

Before/after screenshots for Nouveau/Libretto visual changes, or N/A.

## Review

- [ ] CI green (`Tests / tests`, vitest, build, `scorecard-kit check`, skill mirror check)
- [ ] Acceptance criteria from the linked issue are met
- [ ] Skill mirrors synced if `skills/scorecard/` changed
- [ ] Rose `rose-review` check run after green tests (PASS or addressed CHANGES)