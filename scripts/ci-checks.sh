#!/usr/bin/env bash
# ci-checks.sh: CI's lines (the `checks` job runs exactly this). Run locally before any review.
# Each suite prints its total and any WRONG line; the script stops at the first failure.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
suite () { local out; if out=$(bash "$@" 2>&1); then printf '%s\n' "$out" | tail -1; else printf '%s\n' "$out" | grep -E 'WRONG|FAIL|passed:' || printf '%s\n' "$out" | tail -20; return 1; fi; }

echo "== hook tests"
suite .claude/hooks/block-secrets.test.sh
suite .githooks/pre-commit.test.sh

echo "== capture"
suite .method/bin/test_capture.sh

echo "== method lines"
bash .method/bin/lines-check.sh
home="${METHOD_LINES_HOME:-$HOME/Developer/vaults/Bleddyn Vault/AGENT/Method/lines.md}"
if [ -z "${CI:-}" ] && [ -f "$home" ]; then bash .method/bin/lines-check.sh --home "$home"; fi

echo "== pre-commit is switched on (local only)"
if [ -z "${CI:-}" ]; then
  [ "$(git config --get core.hooksPath || true)" = ".githooks" ] || { echo "FAIL pre-commit is off: run  git config core.hooksPath .githooks" >&2; exit 1; }
  echo "on"
else echo "skipped in CI"; fi

echo "== design"
suite scripts/design-check.test.sh
bash scripts/design-check.sh

echo "== the task's named checks"
if [ -f scripts/task-checks.sh ]; then bash scripts/task-checks.sh
elif [ -f package.json ] || [ -d src ]; then echo "FAIL a stack exists but scripts/task-checks.sh does not" >&2; exit 1
else echo "none yet (G-02 adds the harness)"; fi

echo "== lockfile audit"
if [ -f package-lock.json ]; then
  npm install --package-lock-only --ignore-scripts --no-audit --no-fund
  git diff --exit-code -- package-lock.json
  npm audit --omit=dev --audit-level=high
elif [ -f package.json ] || ls pnpm-lock.yaml yarn.lock bun.lockb >/dev/null 2>&1; then
  echo "FAIL a package manifest exists without package-lock.json (this project uses npm)" >&2; exit 1
else
  echo "no package manifest yet (G-02 adds the stack)"
fi

echo "ci-checks: all passed"
