#!/usr/bin/env bash
# Poll PR issue comments for the latest Rose-Verdict line (PASS | CHANGES).
set -euo pipefail

PR="${1:?PR number required}"
REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

MARKER="${ROSE_VERDICT_MARKER:-Rose-Verdict:}"
MAX_WAIT_SEC="${ROSE_VERDICT_MAX_WAIT_SEC:-2400}"
POLL_SEC="${ROSE_VERDICT_POLL_SEC:-30}"

find_verdict() {
  if [ -f review-verdict.txt ]; then
    local v
    v=$(tr -d '[:space:]' < review-verdict.txt | tr '[:lower:]' '[:upper:]')
    case "$v" in
      PASS) echo PASS; return 0 ;;
      CHANGES|FAIL) echo CHANGES; return 0 ;;
    esac
  fi
  local bodies
  bodies=$(gh api "repos/${REPO}/issues/${PR}/comments" --paginate -q '.[] | .body' 2>/dev/null || true)
  local line
  while IFS= read -r line; do
    case "$line" in
      *"${MARKER} PASS"*) echo PASS; return 0 ;;
      *"${MARKER} CHANGES"*) echo CHANGES; return 0 ;;
    esac
  done <<< "$bodies"
  return 1
}

deadline=$((SECONDS + MAX_WAIT_SEC))
verdict=""

while [ "$SECONDS" -lt "$deadline" ]; do
  if verdict=$(find_verdict); then
    break
  fi
  sleep "$POLL_SEC"
done

if [ -z "${verdict:-}" ]; then
  echo "::error::Timed out waiting for ${MARKER} PASS or CHANGES on PR #${PR}"
  exit 1
fi

printf '%s\n' "$verdict" > review-verdict.txt
echo "rose-verdict=$verdict"