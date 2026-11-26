#!/usr/bin/env bash
# lines-check.sh: the four method lines in CLAUDE.md must match their one home (setup item 6, G-01).
# The home, AGENT/Method/lines.md in his vault, is not in this repository, so CI compares CLAUDE.md's
# block with a recorded hash of the home's block (.method/lines.sha256). On his Mac, --home compares
# with the home itself and, with --write, records its hash.
# Usage: bash .method/bin/lines-check.sh [--home <path-to-lines.md> [--write]] [--claude <path>]
set -uo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
claude="$root/CLAUDE.md"; record="$root/.method/lines.sha256"; home=""; write=false
while [ $# -gt 0 ]; do
  case "$1" in
    --home) home="$2"; shift 2 ;;
    --write) write=true; shift ;;
    --claude) claude="$2"; shift 2 ;;
    *) echo "lines-check: unknown argument $1" >&2; exit 2 ;;
  esac
done
block () { awk '/<!-- method-lines:start/{on=1} on{print} /<!-- method-lines:end -->/{on=0}' "$1"; }
digest () { block "$1" | shasum -a 256 | cut -d' ' -f1; }

[ -f "$claude" ] || { echo "lines-check: FAIL $claude is missing" >&2; exit 1; }
[ -n "$(block "$claude")" ] || { echo "lines-check: FAIL no method-lines block in $claude" >&2; exit 1; }
have=$(digest "$claude")

if [ -n "$home" ]; then
  [ -f "$home" ] || { echo "lines-check: FAIL home $home is missing" >&2; exit 1; }
  want=$(digest "$home")
  [ "$write" = true ] && printf '%s\n' "$want" > "$record"
else
  [ -f "$record" ] || { echo "lines-check: FAIL $record is missing" >&2; exit 1; }
  want=$(tr -d ' \n' < "$record")
fi

if [ "$have" = "$want" ]; then echo "lines-check: pass (${have:0:12})"; exit 0; fi
echo "lines-check: FAIL the method lines in CLAUDE.md differ from their home (have ${have:0:12}, want ${want:0:12})" >&2
exit 1
