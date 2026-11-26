#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash|Write|Edit): refuse the two moves that published credentials.
#
# Lineage. Pattern inherited from rapid-triage `.claude/hooks/block-learning-vault.sh`:
#   - a command-string filter that fails closed without jq;
#   - heredoc bodies and -m/--message values are stripped before matching, so prose that
#     mentions a rule is never blocked (a hook that cries wolf gets turned off);
#   - the string filter is the fast path; `.githooks/pre-commit` reads the index and is the control.
# Rules (both new, replacing the vault-specific one):
#   1. `git add -A`, `--all`, `.`, `./`, `..`, `*`, `-f`/`--force` are refused: every live credential the security
#      sweep found sat in untracked, un-ignored files one `git add -A` from publication [A6; §4.5].
#   2. credential-shaped strings are refused in the command, in Write content and in Edit
#      replacements; shapes live in `secret-patterns` next to this file [A6; §4.1 row 30].
#      Label/pair shapes (from rapid-triage's .gitleaks.toml) apply only to document-shaped paths.
#      A JWT is blocked only when its payload carries role "service_role"; publishable keys pass.

set -uo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "block-secrets.sh needs jq and cannot find it; refusing to run unchecked." >&2
  exit 2
fi

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
patterns="$here/secret-patterns"
[ -f "$patterns" ] || { echo "block-secrets.sh: $patterns is missing; refusing to run unchecked." >&2; exit 2; }

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')
content=$(printf '%s' "$payload" | jq -r '[.tool_input.content, .tool_input.new_string, .tool_input.new_source, (.tool_input.edits // [] | map(.new_string) | join("\n"))] | map(select(. != null)) | join("\n")')
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')

rule () { grep -E "^$1\|" "$patterns" | cut -d'|' -f2-; }
# an allowlist with no rules yields an empty pattern, and `grep -E ""` matches everything; substitute a pattern that matches nothing
allow () { local r; r=$(rule "$1" | paste -sd'|' -); printf '%s' "${r:-(?!)^\\b\\B}"; }
docs_shaped='(^|[^A-Za-z0-9_.-])docs/|\.(md|markdown|html|htm|txt|csv|rtf)$'

# ---- rule 1: mass or forced staging ----
if [ "$tool" = "Bash" ]; then
  args="${command%%<<*}"
  args=$(printf '%s' "$args" \
    | sed -E -e "s/-m[[:space:]]*'[^']*'//g" -e 's/-m[[:space:]]*"[^"]*"//g' \
             -e "s/--message=?[[:space:]]*'[^']*'//g" -e 's/--message=?[[:space:]]*"[^"]*"//g')
  git_add='(^|[;&|(]|[[:space:]])git([[:space:]]+[^[:space:];&|]+)*[[:space:]]+(add|stage)([[:space:]]+[^[:space:];&|]+)*[[:space:]]+(-[a-zA-Z]*[Af][a-zA-Z]*|--all|--force|\.|\./|\.\.|\.\./|\*|:/)([[:space:]]|$|[;&|)])'
  if printf '%s' "$args" | grep -qE "$git_add"; then
    cat >&2 <<'REASON'
Blocked: `git add -A`, `--all`, `.`, `./`, `..`, `*` and `-f` are not used in this project.

Every credential that has leaked from a studio project sat in an untracked or ignored file and was one mass-stage away from publication. Stage the paths you changed by name:
    git add <path> [<path> ...]
REASON
    exit 2
  fi
fi

# ---- rule 1b: skipping or switching off the pre-commit control (G-01 review) ----
if [ "$tool" = "Bash" ]; then
  nv='(^|[;&|(]|[[:space:]])git([[:space:]]+[^[:space:];&|]+)*[[:space:]]+(commit|merge|am|rebase|cherry-pick|revert)([[:space:]]+[^[:space:];&|]+)*[[:space:]]+(--no-verify|-[a-zA-Z]*n[a-zA-Z]*)([[:space:]]|$|[;&|)])'
  hp='core\.hookspath|--no-verify'
  if printf '%s' "$args" | grep -qiE "$nv" || printf '%s' "$args" | grep -qiE "$hp"; then
    cat >&2 <<'REASON'
Blocked: the pre-commit hook is the control that reads what is staged. `--no-verify`, `-n`, and any
change to core.hooksPath switch it off. Commit normally; if the hook refuses, fix what it names.
REASON
    exit 2
  fi
fi

# ---- rule 2: credential-shaped strings ----
texts=""
scan_labels=false
case "$tool" in
  Bash) texts="$command"; printf '%s' "$command" | grep -qE "$docs_shaped" && scan_labels=true ;;
  Write|Edit|MultiEdit|NotebookEdit) texts="$content"; file_path=${file_path:-$(printf '%s' "$payload" | jq -r '.tool_input.notebook_path // ""')}; printf '%s' "$file_path" | grep -qE "$docs_shaped" && scan_labels=true ;;
  *) exit 0 ;;
esac
[ -z "$texts" ] && exit 0

found=""
# tokens: any match not on the token allowlist
while IFS= read -r re; do
  m=$(printf '%s' "$texts" | grep -oiE -e "$re" | head -1 || true)
  if [ -n "$m" ] && ! printf '%s' "$m" | grep -qiE -e "$(allow allow-token)"; then
    found="token: ${m:0:12}…"; break
  fi
done < <(rule token)

# jwt: block only when the payload names service_role
if [ -z "$found" ]; then
  while IFS= read -r re; do
    for m in $(printf '%s' "$texts" | grep -oiE -e "$re"); do
      seg=$(printf '%s' "$m" | cut -d. -f2 | tr '_-' '/+')
      while [ $(( ${#seg} % 4 )) -ne 0 ]; do seg="$seg="; done
      decoded=$(printf '%s' "$seg" | base64 -d 2>/dev/null || true)
      if printf '%s' "$decoded" | grep -q '"role" *: *"service_role"'; then
        found="jwt with role service_role"; break 2
      fi
    done
  done < <(rule jwt)
fi

# labels and pairs: document-shaped paths only
if [ -z "$found" ] && [ "$scan_labels" = true ]; then
  allow_label=$(allow allow-label)
  while IFS= read -r re; do
    while IFS= read -r m; do
      [ -z "$m" ] && continue
      value=$(printf '%s' "$m" | sed -E 's/^.*(:|=|<[^>]*>)[[:space:]]*\**[[:space:]]*["'"'"'>]?//')
      if ! printf '%s' "$value" | grep -qiE -e "$allow_label"; then
        found="a credential label with a value (${m:0:20}…)"; break 2
      fi
    done < <(printf '%s' "$texts" | grep -oiE -e "$re")
  done < <(rule label)
fi
if [ -z "$found" ] && [ "$scan_labels" = true ]; then
  allow_pair=$(allow allow-pair)
  while IFS= read -r re; do
    m=$(printf '%s' "$texts" | tr '\n' ' ' | grep -oiE -e "$re" | head -1 || true)
    if [ -n "$m" ] && ! printf '%s' "$m" | grep -qiE -e "$allow_pair"; then
      found="an email address next to a password label"; break
    fi
  done < <(rule pair)
fi

if [ -n "$found" ]; then
  cat >&2 <<REASON
Blocked: this $tool input contains $found.

Credentials never go into commands, files, handouts or fixtures. Put the value in an environment variable or the project's secret store and reference it by name. If a real credential has already been exposed, rotate it today and record it in the task file.
REASON
  exit 2
fi
exit 0
