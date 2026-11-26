#!/usr/bin/env bash
# Planted-fault tests for design-check.sh (K04: a check is in force once it has refused a planted fault).
# Each case copies the repository's design/ into a temporary root, plants one fault, and expects the
# check to fail; the clean copy must pass.
set -uo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; repo="$(cd "$here/.." && pwd)"
check="$here/design-check.sh"
pass=0; fail=0
fresh () { d=$(mktemp -d); cp -R "$repo/design" "$d/design"; printf '%s' "$d"; }
expect () {  # $1 expected (pass|fail)  $2 label  $3 root
  if bash "$check" "$3" >/dev/null 2>&1; then got=pass; else got=fail; fi
  if [ "$got" = "$1" ]; then pass=$((pass+1)); r="ok   "; else fail=$((fail+1)); r="WRONG"; fi
  printf '  %s expected=%-4s got=%-4s  %s\n' "$r" "$1" "$got" "$2"
  rm -rf "$3"
}

d=$(fresh); expect pass "clean copy of design/" "$d"

d=$(fresh); mkdir -p "$d/src"; printf '.title { color: #%s; }\n' "ff0000" > "$d/src/app.css"
expect fail "planted fault 1: a colour value outside tokens.css" "$d"

d=$(fresh); rm "$d/design/reference/3-scorecard.png"
expect fail "planted fault 2: a missing reference screenshot" "$d"

d=$(fresh); mkdir -p "$d/src"; printf '.x { font-family: Arial, sans-serif; }\n' > "$d/src/app.css"
expect fail "a typeface value outside tokens.css" "$d"

d=$(fresh); mkdir -p "$d/src"; printf '.x { color: var(--ink); font-family: var(--font-body); }\n' > "$d/src/app.css"
expect pass "token references only" "$d"

d=$(fresh); mkdir -p "$d/config"; printf '{"games":[{"id":"stop","name":"Stop","mark":"notch","colour":"var(--stop)"},{"id":"count","name":"Count","colour":"var(--count)"}]}\n' > "$d/config/games.json"
expect fail "a game without a mark" "$d"

d=$(fresh); mkdir -p "$d/config"; printf '{"games":[{"id":"stop","name":"Stop","mark":"notch","colour":"var(--nope)"}]}\n' > "$d/config/games.json"
expect fail "a game colour that is not a token" "$d"

d=$(fresh); for i in $(seq 1 61); do echo "line $i"; done > "$d/design/DESIGN.md"
expect fail "DESIGN.md over 60 lines" "$d"

d=$(fresh); printf 'not a png' > "$d/design/reference/1-event-stop-mid-play.png"
expect fail "a reference that is not a PNG" "$d"


# hardening after the G-01 review: each of these passed before and must now fail
plant () {  # $1 label  $2 relative path  $3 content
  d=$(fresh); mkdir -p "$d/$(dirname "$2")"; printf '%s\n' "$3" > "$d/$2"; expect fail "$1" "$d"
}
plant "named colour"                      "src/a.css"        ".x { color: red; }"
plant "upper-case RGB()"                  "src/a.css"        ".x { color: RGB(1,2,3); }"
plant "oklch()"                           "src/a.css"        ".x { color: oklch(0.7 0.1 30); }"
plant "color-mix() with a named colour"   "src/a.css"        ".x { background: color-mix(in srgb, var(--ink), white); }"
plant "JS 0xRRGGBB"                       "src/a.ts"         "const c = 0xff0000;"
plant "font: shorthand"                   "src/a.css"        ".x { font: 16px Arial; }"
plant "token plus a raw fallback font"    "src/a.css"        ".x { font-family: var(--font-body), Comic Sans MS; }"
plant "JS fontFamily"                     "src/a.ts"         "el.style.fontFamily = \"Arial\";"
plant "canvas ctx.font"                   "src/a.ts"         "ctx.font = \"16px Arial\";"
plant "an SVG fill"                       "src/icon.svg"     "<svg><rect fill=\"#ff0000\"/></svg>"
plant "a JSON theme colour"               "config/theme.json" "{\"bg\":\"#ff0000\"}"
plant "a web manifest theme_color"        "public/site.webmanifest" "{\"theme_color\":\"#123456\"}"
plant "a path with a space"               "src/my app.css"   ".x { color: #00ff00; }"
plant "malformed games.json"              "config/games.json" "{not json"
plant "an empty games list"               "config/games.json" "{\"games\":[]}"
plant "a blank game name"                 "config/games.json" "{\"games\":[{\"id\":\"s\",\"name\":\" \",\"mark\":\"notch\",\"colour\":\"var(--stop)\"}]}"

d=$(fresh); for i in $(seq 1 61); do printf 'line %s' "$i"; [ "$i" -lt 61 ] && printf '\n'; done > "$d/design/DESIGN.md"
expect fail "DESIGN.md of 61 lines with no final newline" "$d"
d=$(fresh); : > "$d/design/tokens.css"; expect fail "an empty tokens.css" "$d"
d=$(fresh); { printf '\x89PNG\r\n\x1a\n'; printf 'junk junk junk'; } > "$d/design/reference/2-after-fifth-event-spot-it.png"
expect fail "a PNG signature followed by junk" "$d"

d=$(fresh); mkdir -p "$d/src"; printf '#add-button { font: var(--size-m) var(--font-body); color: var(--ink); }\n' > "$d/src/ok.css"
expect pass "an id selector and token-only font shorthand" "$d"

# G-02 R9: built output in dist/ is skipped; the same value in src/ is still refused
d=$(fresh); mkdir -p "$d/dist/assets"; printf '.x { color: #%s; }\n' "ff0000" > "$d/dist/assets/index.css"
expect pass "a colour in built output (dist/) is skipped" "$d"
d=$(fresh); mkdir -p "$d/dist" "$d/src/dist"; printf '.x { color: #%s; }\n' "ff0000" > "$d/src/dist/a.css"
expect fail "a colour in src/dist/ is still refused (only the root dist/ is skipped)" "$d"

d=$(fresh); mkdir -p "$d/src"; printf 'button { font: inherit; }\n' > "$d/src/reset.css"
expect pass "a CSS-wide keyword (font: inherit) names no typeface" "$d"
plant "a keyword followed by a typeface"  "src/a.css"        ".x { font-family: inherit, Arial; }"

printf '\n  passed: %d   failed: %d\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
