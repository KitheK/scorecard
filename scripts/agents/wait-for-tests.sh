#!/usr/bin/env bash
# Wait for the Tests workflow job on a PR. Writes ci_ok to GITHUB_OUTPUT.
set -euo pipefail

PR="${1:?PR number required}"
REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

CHECK_PATTERN="${TESTS_CHECK_PATTERN:-Tests / tests}"
MAX_WAIT_SEC="${TESTS_MAX_WAIT_SEC:-1800}"
POLL_SEC="${TESTS_POLL_SEC:-20}"

deadline=$((SECONDS + MAX_WAIT_SEC))
ci_ok=false
fail_name=""

while [ "$SECONDS" -lt "$deadline" ]; do
  if ! checks=$(gh pr checks "$PR" --repo "$REPO" 2>/dev/null); then
    sleep "$POLL_SEC"
    continue
  fi

  if echo "$checks" | grep -qE 'pending|in progress|queued'; then
    sleep "$POLL_SEC"
    continue
  fi

  if echo "$checks" | grep -qE 'fail|cancel'; then
    fail_name=$(echo "$checks" | grep -E 'fail|cancel' | head -1 | awk '{print $1}')
    ci_ok=false
    break
  fi

  if echo "$checks" | grep -q "$CHECK_PATTERN"; then
    if echo "$checks" | grep "$CHECK_PATTERN" | grep -qE 'pass|success'; then
      ci_ok=true
      break
    fi
  else
    # No named test check yet — if every line is pass/skip, treat as green
    if ! echo "$checks" | grep -qvE 'pass|success|skipping'; then
      ci_ok=true
      break
    fi
  fi

  sleep "$POLL_SEC"
done

if [ -n "$fail_name" ]; then
  printf '%s' "$fail_name" > /tmp/ci-fail-name.txt
elif [ "$ci_ok" = false ]; then
  printf '%s' "$CHECK_PATTERN" > /tmp/ci-fail-name.txt
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "ci_ok=$ci_ok" >> "$GITHUB_OUTPUT"
fi
exit 0