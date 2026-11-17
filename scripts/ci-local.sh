#!/usr/bin/env bash
# Local gate matching .github/workflows/tests.yml (minus npm ci if node_modules exists).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  npm ci
fi

npm test
npm run build
npm run check

node scripts/sync-agent-skills.mjs
if ! git diff --quiet -- skills/scorecard .claude/skills/scorecard .agents/skills/scorecard .github/skills/scorecard .github/agents/scorecard.agent.md; then
  echo "::error::Skill mirrors out of sync. Commit sync output or run sync-agent-skills.mjs."
  git diff --stat -- skills/scorecard .claude .agents .github/skills .github/agents
  exit 1
fi

echo "ci-local: ok"