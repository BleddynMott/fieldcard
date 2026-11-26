#!/usr/bin/env bash
# task-checks.sh: the current task's named checks that a machine can run (G-02).
# Called by scripts/ci-checks.sh. The harness (tests/harness.test.ts) covers, over 60 dates:
# same card for a date, no repeat, scores in range, one attempt a day.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
echo "-- install (npm ci)"
npm ci --no-audit --no-fund --loglevel=error
echo "-- types (svelte-check)"
npm run --silent check
echo "-- harness and unit tests (vitest)"
if out=$(npx vitest run --reporter=verbose 2>&1); then printf '%s\n' "$out" | grep -E '✓|Tests |Test Files'
else printf '%s\n' "$out" | tail -40; echo "FAIL vitest" >&2; exit 1; fi
echo "-- build"
npm run --silent build >/dev/null
echo "task-checks: pass"
