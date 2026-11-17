# Agent contracts (Scorecard)

Rules live in [`AGENTS.md`](../../AGENTS.md). Prompts live in [`prompts/`](prompts/). **GitHub Actions owns the gates** (CI wait, `rose-review` check, draft-PR expectations). **Which model runs the prompt** is selected by the repo variable `AGENT_PROVIDER`.

| `AGENT_PROVIDER` | Coding agent (`agent-now` / overnight) | Rose (reviewer) |
| --- | --- | --- |
| `cursor` (default) | Cursor automation reads the hand-off comment and opens the draft PR | Automation posts a PR **comment** review; Actions waits for `Rose-Verdict:` |
| `grok` | Same hand-off as `cursor` | Same verdict-comment contract |
| `claude` | `anthropics/claude-code-action` in Actions | Claude runs the review inside Actions |

```bash
gh variable set AGENT_PROVIDER --body cursor   # or grok, or claude
```

## Owner setup (required once)

### Repository secrets

| Secret | Required when | Purpose |
| --- | --- | --- |
| `GH_PAT` | Recommended always | Personal access token for `PR_ASSIGNEE` so assignees, PR comments, and approvals appear as the human owner—not `github-actions[bot]`. Scopes: `repo`, `read:org` if needed for org repos. Used as `GH_TOKEN` in workflows. |
| `CLAUDE_CODE_OAUTH_TOKEN` | `AGENT_PROVIDER=claude` | OAuth token for [Claude Code Action](https://github.com/anthropics/claude-code-action). |
| `GITHUB_TOKEN` | (built-in) | Fallback if `GH_PAT` is unset; comments appear as the Actions bot and **cannot** approve as the owner. |

Do not commit secret values. Add them under **Settings → Secrets and variables → Actions → Secrets**.

### Repository variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `ENABLE_ROSE_REVIEW` | `true` | Opt in to the Rose review gate on every PR (any base branch). |
| `ENABLE_OVERNIGHT_AGENT` | `true` | Opt in to the nightly issue picker. |
| `AGENT_PROVIDER` | `cursor` | `cursor`, `grok`, or `claude`. |
| `PR_ASSIGNEE` | `KitheK` | GitHub login assigned to new PRs and used for approval attribution. |

```bash
gh variable set ENABLE_ROSE_REVIEW --body true
gh variable set ENABLE_OVERNIGHT_AGENT --body true   # optional
gh variable set PR_ASSIGNEE --body KitheK
```

### Labels to create

Create these labels in the repo (colors arbitrary):

- `agent-now`, `overnight-queue`, `overnight-agent`, `needs-human`
- `review:pass`, `review:changes`, `ready-to-merge`

### Branch protection (recommended)

On `master`: require status checks **Tests / tests** and **Rose review / rose-review** before merge. Do **not** grant workflows permission to bypass. Agents **never merge**; humans merge after `ready-to-merge` and review.

### Cursor / Grok automation

When `AGENT_PROVIDER` is `cursor` or `grok`, Actions only posts a **hand-off comment** on the PR or issue. Configure your Cursor Cloud Agent (or Grokbot) to watch the repo and:

1. Detect hand-offs containing `Rose hand-off` or `Coding agent — work now` / `Overnight hand-off`.
2. Run the referenced prompt plus root `AGENTS.md`.
3. For Rose: post **one** `gh pr comment` ending with `Rose-Verdict: PASS` or `Rose-Verdict: CHANGES`.

No extra Cursor API secret is required beyond `GH_PAT` for `gh` in the agent environment—the same pattern as Dyno.

## Ask the coding agent to work **now**

Three equivalent triggers ([`agent.yml`](../workflows/agent.yml)):

1. **Actions:** **Coding agent** → **Run workflow** → issue number.
2. **Comment:** `/agent` or `/agent now` on the issue (members only).
3. **Label:** add `agent-now`.

```bash
gh workflow run "Coding agent" -f issue_number=3
gh issue comment 3 --body "/agent now"
```

## Rose review flow

1. PR opened or updated (including PRs stacked on feature branches—no base-branch filter).
2. [`rose-review.yml`](../workflows/rose-review.yml) waits for green [`tests.yml`](../workflows/tests.yml).
3. Provider runs [`prompts/rose-review.md`](prompts/rose-review.md).
4. [`enforce-rose-verdict.sh`](../../scripts/agents/enforce-rose-verdict.sh) applies `review:pass` or `review:changes`, may approve as `PR_ASSIGNEE`, and sets `ready-to-merge` only when CI is green, verdict PASS, not draft, and merge state is clean.

**Re-run Rose on an existing PR** (e.g. #2–#5 after enabling):

```bash
gh workflow run "Rose review" -f pr_number=4
```

Or push a new commit to the PR branch.

## Machine contract for Rose

1. Follow [`prompts/rose-review.md`](prompts/rose-review.md) and `AGENTS.md`.
2. Post **one** PR **conversation comment** (`gh pr comment`, not request-changes).
3. End with `Rose-Verdict: PASS` or `Rose-Verdict: CHANGES` on its own line.
4. Never merge or push to protected branches. Do not approve from the prompt—Actions approves on PASS.

## Machine contract for coding agents

Follow [`prompts/coding-agent.md`](prompts/coding-agent.md) or [`prompts/overnight-agent.md`](prompts/overnight-agent.md): one draft PR, assign `PR_ASSIGNEE`, `overnight-agent` label, Vitest evidence, no workflow edits, `needs-human` if stuck.

## Issue labels for agents

| Label | Use |
| --- | --- |
| `overnight-queue` | Issue is eligible for the nightly scheduler |
| `agent-now` | Implement this issue immediately |
| `needs-human` | Agent must stop until a human replies |
| `overnight-agent` | PR was created by an agent (keep draft until you mark ready for review) |

Add clear acceptance criteria in the issue body so Rose can score Met/Partly/Not met.