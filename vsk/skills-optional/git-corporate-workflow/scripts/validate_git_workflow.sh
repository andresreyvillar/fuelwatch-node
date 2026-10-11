#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: validate_git_workflow.sh [--base <branch>] [--all] [--no-secret-scan]

Checks:
  - Branch name matches corporate conventions
  - No direct work on protected branches (develop, stage, main/master)
  - Commit messages follow semantic prefix format
  - Secret-like strings are not present in diffs (optional)

Options:
  --base <branch>     Base branch for PR checks (default: develop)
  --all               Scan all tracked files for secrets (slow)
  --no-secret-scan    Skip secret scanning
  --help              Show this help
USAGE
}

base_branch="develop"
scan_all=0
scan_secrets=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      base_branch="${2:-}"
      shift 2
      ;;
    --all)
      scan_all=1
      shift
      ;;
    --no-secret-scan)
      scan_secrets=0
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
 done

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2
  exit 2
fi

errors=0
warnings=0

current_branch="$(git rev-parse --abbrev-ref HEAD)"
protected_branches=(develop stage main master)

for b in "${protected_branches[@]}"; do
  if [[ "$current_branch" == "$b" ]]; then
    echo "ERROR: direct work on protected branch '$b' is not allowed." >&2
    errors=$((errors + 1))
  fi
 done

branch_ok=0
jira_pattern='[A-Z][A-Z0-9]+-[0-9]+'
slug_pattern='[a-z0-9]+(-[a-z0-9]+)*'

if [[ "$current_branch" =~ ^release/[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  branch_ok=1
elif [[ "$current_branch" =~ ^(feature|bugfix|hotfix)/$jira_pattern-$slug_pattern$ ]]; then
  branch_ok=1
elif [[ "$current_branch" =~ ^$jira_pattern-$slug_pattern$ ]]; then
  branch_ok=1
fi

if [[ $branch_ok -ne 1 ]]; then
  echo "ERROR: branch name '$current_branch' does not match expected patterns." >&2
  echo "  Expected: feature/ABC-123-scope, bugfix/ABC-123-scope, hotfix/ABC-123-scope, release/1.2.3" >&2
  errors=$((errors + 1))
fi

commit_regex='^(feat|fix|docs|chore|refactor|test)(\(.+\))?: .+'
commit_range=""
if git show-ref --verify --quiet "refs/heads/$base_branch" || git show-ref --verify --quiet "refs/remotes/origin/$base_branch"; then
  commit_range="$base_branch..HEAD"
fi

if [[ -n "$commit_range" ]]; then
  commits="$(git log --format=%s "$commit_range" || true)"
else
  commits="$(git log -n 20 --format=%s || true)"
  if [[ -z "$commits" ]]; then
    echo "WARN: no commits found to validate." >&2
    warnings=$((warnings + 1))
  else
    echo "WARN: base branch '$base_branch' not found; validating last 20 commits instead." >&2
    warnings=$((warnings + 1))
  fi
fi

if [[ -n "$commits" ]]; then
  while IFS= read -r msg; do
    if [[ -n "$msg" ]] && [[ ! "$msg" =~ $commit_regex ]]; then
      echo "ERROR: commit message does not match format: $msg" >&2
      errors=$((errors + 1))
    fi
  done <<< "$commits"
fi

if [[ $scan_secrets -eq 1 ]]; then
  secret_patterns='(password|passwd|api[_-]?key|secret|token|private[_-]?key|access[_-]?key)'
  matches=""

  if [[ $scan_all -eq 1 ]]; then
    if command -v rg >/dev/null 2>&1; then
      matches="$(rg -n -i --no-messages -e "$secret_patterns" -- "$(git ls-files)" || true)"
    else
      matches="$(git ls-files | xargs grep -n -i -E "$secret_patterns" 2>/dev/null || true)"
    fi
  else
    diff_content="$(git diff --no-color -U0 || true)
$(git diff --no-color -U0 --cached || true)"
    if command -v rg >/dev/null 2>&1; then
      matches="$(printf '%s\n' "$diff_content" | rg -n -i --no-messages -e "$secret_patterns" - || true)"
    else
      matches="$(printf '%s\n' "$diff_content" | grep -n -i -E "$secret_patterns" || true)"
    fi
  fi

  if [[ -n "$matches" ]]; then
    echo "ERROR: potential secrets detected:" >&2
    echo "$matches" >&2
    errors=$((errors + 1))
  fi
fi

if [[ $errors -gt 0 ]]; then
  echo "Validation failed with $errors error(s) and $warnings warning(s)." >&2
  exit 1
fi

echo "Validation passed with $warnings warning(s)."
exit 0
