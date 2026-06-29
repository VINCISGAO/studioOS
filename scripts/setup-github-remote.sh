#!/usr/bin/env bash
# Connect this repo to a private GitHub remote and push.
# Usage:
#   GITHUB_REPO=your-org/studioos-private bash scripts/setup-github-remote.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .git ]]; then
  git init
  git branch -M main
  echo "Initialized git repository"
fi

echo "==> Checking tracked secrets"
if git ls-files --error-unmatch .env .env.local 2>/dev/null; then
  echo "ERROR: .env files are tracked. Run: git rm --cached .env .env.local"
  exit 1
fi

REPO="${GITHUB_REPO:-}"
if [[ -z "$REPO" ]]; then
  echo "Set GITHUB_REPO=owner/private-repo-name then re-run"
  echo "Or manually: git remote add origin git@github.com:OWNER/REPO.git"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "git@github.com:${REPO}.git"
else
  git remote add origin "git@github.com:${REPO}.git"
fi

echo "==> Remote origin"
git remote -v

echo ""
echo "Next:"
echo "  git add -A"
echo "  git commit -m \"chore: project safety infrastructure and current codebase\""
echo "  git push -u origin main"
echo ""
echo "Create private repo first:"
echo "  gh repo create ${REPO} --private --source=. --remote=origin --push"
