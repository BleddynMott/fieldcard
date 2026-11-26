#!/usr/bin/env bash
# design-check.sh: the look's checks (22 Pilot plan, Build 1, "The look"; G-01, hardened after review).
# Fails (exit 1) when:
#   1. a colour value or a typeface value appears in build files outside design/tokens.css:
#      hex (#rgb, #rrggbb, #rgba, #rrggbbaa, 0xrrggbb), colour functions (rgb, hsl, hwb, lab, lch,
#      oklab, oklch, color, color-mix, any case), CSS named colours in colour properties, and
#      font-family / font: / fontFamily / ctx.font values that are not var(--...);
#   2. a reference screenshot in design/reference/ is missing, not a PNG, or not 390 px wide;
#   3. config/games.json (once G-02 adds it) is unreadable, has no games, or has a game without a
#      non-blank name, a non-blank mark, and a colour that is a token defined in tokens.css;
#   4. design/DESIGN.md is over 60 lines, or design/tokens.css is missing or holds no tokens.
# Not scanned (not build code): design/directions/ (mock-ups), design/references/, design/reference/,
# tasks/, scripts/, .method/, .claude/, .githooks/, .git/, node_modules/, dist/ (built output, G-02 R9).
# Usage: bash scripts/design-check.sh [repo-root]
set -uo pipefail
root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$root" || { echo "design-check: cannot enter $root" >&2; exit 2; }
fail=0
say () { printf '%s\n' "$*" >&2; }

# 4b. tokens.css exists and defines tokens
if [ ! -f design/tokens.css ]; then say "FAIL design/tokens.css is missing"; fail=1
elif ! grep -qE '^[[:space:]]*--[a-z0-9-]+[[:space:]]*:' design/tokens.css; then say "FAIL design/tokens.css defines no tokens"; fail=1; fi

# 1. colour and typeface values outside tokens.css
hex='(#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})([^0-9a-zA-Z_-]|$))|(\b0x[0-9a-fA-F]{6}\b)'
func='\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)[[:space:]]*\('
named='(color|background(-color)?|fill|stroke|border(-[a-z]+)*|outline(-color)?|caret-color|accent-color|text-decoration-color|column-rule-color|theme_color|background_color|stop-color|flood-color|lighting-color)[[:space:]"'"'"']*[:=][[:space:]"'"'"']*([^;}"'"'"']*[^a-z-])?(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)([^a-z-]|$)'
font='(font-family|fontFamily|font-family:|(^|[^a-z-])font)[[:space:]"'"'"']*[:=][[:space:]]*[^;}]*'
found_any=0
while IFS= read -r -d '' f; do
  found_any=1
  hits=$(grep -nE "$hex" "$f" 2>/dev/null; grep -niE "$func" "$f" 2>/dev/null; grep -niE "$named" "$f" 2>/dev/null)
  [ -n "$hits" ] && { say "FAIL colour value outside tokens.css in $f:"; say "$(printf '%s\n' "$hits" | head -3)"; fail=1; }
  # a typeface value: any font declaration whose value names something other than var(--...) tokens
  fonts=$(grep -noiE "$font" "$f" 2>/dev/null | while IFS= read -r line; do
            val=$(printf '%s' "$line" | sed -E 's/^[0-9]+://; s/^[^:=]*[:=][[:space:]]*//; s/var\(--[a-z0-9-]+\)//g; s/[[:space:],;"'"'"'`]//g; s/!important//')
            case "$val" in (''|inherit|initial|unset|revert|revert-layer) ;; (*) printf '%s\n' "$line" ;; esac  # CSS-wide keywords name no typeface
          done | head -3)
  [ -n "$fonts" ] && { say "FAIL typeface value outside tokens.css in $f:"; say "$fonts"; fail=1; }
done < <(find . \( -type f -o -type l \) \( -iname '*.css' -o -iname '*.scss' -o -iname '*.sass' -o -iname '*.less' -o -iname '*.pcss' \
          -o -iname '*.html' -o -iname '*.htm' -o -iname '*.svelte' -o -iname '*.vue' -o -iname '*.astro' -o -iname '*.svg' \
          -o -iname '*.js' -o -iname '*.mjs' -o -iname '*.cjs' -o -iname '*.ts' -o -iname '*.mts' -o -iname '*.cts' -o -iname '*.tsx' -o -iname '*.jsx' \
          -o -iname '*.json' -o -iname '*.webmanifest' \) \
        -not -path './design/tokens.css' -not -path './design/directions/*' -not -path './design/references/*' \
        -not -path './design/reference/*' -not -path './tasks/*' -not -path './.method/*' -not -path './.claude/*' \
        -not -path './.githooks/*' -not -path './.github/*' -not -path './scripts/*' -not -path './.git/*' -not -path '*/node_modules/*' -not -path './dist/*' \
        -not -name 'package.json' -not -name 'package-lock.json' -not -name 'tsconfig*.json' -print0 2>/dev/null)

# 2. reference screenshots: present, PNG, 390 px wide
for shot in 1-event-stop-mid-play 2-after-fifth-event-spot-it 3-scorecard; do
  p="design/reference/$shot.png"
  if [ ! -s "$p" ]; then say "FAIL reference screenshot missing: $p"; fail=1; continue; fi
  sig=$(head -c 16 "$p" | od -An -tx1 | tr -d ' \n')
  if [ "${sig:0:16}" != "89504e470d0a1a0a" ] || [ "${sig:24:8}" != "49484452" ]; then say "FAIL not a PNG: $p"; fail=1; continue; fi
  w=$(head -c 20 "$p" | tail -c 4 | od -An -tu1 | tr -s ' \n' ' ' | awk '{print $1*16777216+$2*65536+$3*256+$4}')
  [ "$w" = "390" ] || { say "FAIL $p is $w px wide, not 390"; fail=1; }
done

# 3. games config
if [ -f config/games.json ]; then
  if ! command -v jq >/dev/null 2>&1; then say "FAIL jq is needed to read config/games.json"; fail=1
  elif ! jq -e '(.games | type) == "array" and (.games | length) > 0' config/games.json >/dev/null 2>&1; then
    say "FAIL config/games.json is unreadable or has no non-empty \"games\" array"; fail=1
  else
    bad=$(jq -r '.games[] | select(((.name // "") | test("\\S") | not) or ((.mark // "") | test("\\S") | not) or ((.colour // "") | test("^var\\(--[a-z0-9-]+\\)$") | not)) | (.id // .name // "?")' config/games.json)
    [ -n "$bad" ] && { say "FAIL games without a name, a mark or a colour token: $bad"; fail=1; }
    for tok in $(jq -r '.games[].colour // empty' config/games.json | sed -E 's/^var\((--[a-z0-9-]+)\)$/\1/'); do
      grep -qE "^[[:space:]]*$tok[[:space:]]*:" design/tokens.css || { say "FAIL colour $tok is not defined in tokens.css"; fail=1; }
    done
  fi
else
  echo "design-check: no config/games.json yet (G-02 adds it); check 3 not applicable"
fi

# 4. DESIGN.md length (counts a last line without a newline)
if [ -f design/DESIGN.md ]; then
  n=$(awk 'END{print NR}' design/DESIGN.md)
  [ "$n" -gt 60 ] && { say "FAIL design/DESIGN.md is $n lines; the limit is 60"; fail=1; }
else say "FAIL design/DESIGN.md is missing"; fail=1; fi

[ "$fail" -eq 0 ] && echo "design-check: pass" || echo "design-check: FAIL" >&2
exit "$fail"
