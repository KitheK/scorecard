#!/usr/bin/env bash
# Apply labels / optional approval from Rose verdict. Never merges.
set -euo pipefail

PR="${1:?PR number required}"
REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

MARKER="${ROSE_VERDICT_MARKER:-Rose-Verdict:}"

maybe_ready_to_merge() {
  local pr=$1
  local repo=$2
  local is_draft merge_state failing
  is_draft=$(gh pr view "$pr" --repo "$repo" --json isDraft -q .isDraft)
  merge_state=$(gh pr view "$pr" --repo "$repo" --json mergeStateStatus -q .mergeStateStatus)
  if [ "$is_draft" = "true" ]; then
    echo "Draft PR; not labeling ready-to-merge"
    return 0
  fi
  case "$merge_state" in
    BEHIND|DIRTY|DRAFT|BLOCKED|UNSTABLE|UNKNOWN)
      echo "mergeStateStatus=$merge_state; not labeling ready-to-merge"
      return 0
      ;;
  esac
  failing=$(gh pr checks "$pr" --repo "$repo" 2>/dev/null | grep -E 'fail|cancel' || true)
  if [ -n "$failing" ]; then
    echo "CI not all green; not labeling ready-to-merge"
    return 0
  fi
  gh pr edit "$pr" --repo "$repo" --add-label "ready-to-merge" || true
  echo "Labeled ready-to-merge"
}

verdict=""
if [ -f review-verdict.txt ]; then
  v=$(tr -d '[:space:]' < review-verdict.txt | tr '[:lower:]' '[:upper:]')
  case "$v" in
    PASS) verdict=PASS ;;
    CHANGES|FAIL) verdict=CHANGES ;;
  esac
fi

if [ -z "$verdict" ]; then
  while IFS= read -r comment_body; do
    while IFS= read -r line; do
      case "$line" in
        *"${MARKER} PASS"*) verdict=PASS; break 2 ;;
        *"${MARKER} CHANGES"*) verdict=CHANGES; break 2 ;;
      esac
    done <<< "$comment_body"
  done < <(gh api "repos/${REPO}/issues/${PR}/comments" --paginate -q '.[] | .body' 2>/dev/null | tac || true)
fi

if [ -z "$verdict" ]; then
  echo "::error::No Rose verdict found on PR #${PR}"
  exit 1
fi

PR_ASSIGNEE="${PR_ASSIGNEE:-KitheK}"

if [ "$verdict" = PASS ]; then
  gh pr edit "$PR" --repo "$REPO" --add-label "review:pass" --remove-label "review:changes" || true
  if gh pr review "$PR" --repo "$REPO" --approve --body "Rose-Verdict: PASS (approved via Actions as ${PR_ASSIGNEE})." 2>/dev/null; then
    echo "Approved PR #${PR}"
  else
    echo "Note: could not approve (GH_PAT may lack approve scope); labels still applied."
  fi
  maybe_ready_to_merge "$PR" "$REPO"
  exit 0
fi

gh pr edit "$PR" --repo "$REPO" --add-label "review:changes" --remove-label "review:pass" --remove-label "ready-to-merge" || true
echo "::error::Rose-Verdict: CHANGES"
exit 1