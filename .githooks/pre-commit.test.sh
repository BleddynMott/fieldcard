#!/usr/bin/env bash
# Tests for pre-commit. Run: bash assets/hooks/pre-commit.test.sh
# Builds a real throwaway repository and stages real files: the hook judges the index.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/pre-commit"
# the patterns file sits beside this test in the bundle, and under .claude/hooks/ once installed
PATTERNS="$HERE/secret-patterns"; [ -f "$PATTERNS" ] || PATTERNS="$HERE/../.claude/hooks/secret-patterns"
[ -f "$PATTERNS" ] || { echo "secret-patterns not found beside the test or in .claude/hooks/"; exit 1; }
pass=0; fail=0
sandbox=$(mktemp -d); trap 'rm -rf "$sandbox"' EXIT
b64url () { printf '%s' "$1" | base64 | tr '+/' '-_' | tr -d '=\n'; }
JWT_SVC="$(b64url '{"alg":"HS256"}').$(b64url '{"role":"service_role"}').$(b64url 'signature-bytes-here')"
JWT_ANON="$(b64url '{"alg":"HS256"}').$(b64url '{"role":"anon"}').$(b64url 'signature-bytes-here')"
PW="Pass""word"

setup () {
  rm -rf "${sandbox:?}/repo"; mkdir -p "$sandbox/repo/.claude/hooks" "$sandbox/repo/src" "$sandbox/repo/docs/handouts" "$sandbox/repo/secrets"
  cd "$sandbox/repo" || exit 1
  git init -q; git config user.email t@example.com; git config user.name Test
  cp "$PATTERNS" .claude/hooks/secret-patterns
  printf '.env\nsecrets/\n' > .gitignore
  echo "code" > src/a.ts; echo "SECRET=x" > .env; echo "k" > secrets/key.txt
}
check () {  # $1 expected $2 label
  out=$("$HOOK" 2>&1 >/dev/null); code=$?
  got=$([ $code -ne 0 ] && echo BLOCK || echo allow)
  if [ "$got" = "$1" ]; then r="ok   "; pass=$((pass+1)); else r="WRONG"; fail=$((fail+1)); fi
  printf '  %s expected=%-5s got=%-5s  %s\n' "$r" "$1" "$got" "$2"
  [ "$got" = BLOCK ] && [ -n "${SHOW:-}" ] && printf '        refusal: %s\n' "$(printf '%s' "$out" | head -1)"
}

echo "=== must BLOCK: an ignored path reached the index ==="
setup; git add -f .env;                       SHOW=1 check BLOCK "git add -f .env"
setup; git add -f secrets/key.txt;            check BLOCK "git add -f secrets/key.txt"
setup; git add -f ./secrets/../secrets/key.txt 2>/dev/null; check BLOCK "path spelled with ./ and .."
setup; ( git add -f Secrets/key.txt 2>/dev/null || git add -f secrets/key.txt ); check BLOCK "differently-cased path on a case-insensitive filesystem"
setup; printf 'k\n' > "secrets/clé.txt"; git add -f "secrets/clé.txt"; check BLOCK "accented filename (git C-quotes it)"
echo "=== must BLOCK: credential-shaped content ==="
setup; printf "const k = '%s'\n" "$JWT_SVC" > src/k.ts; git add src/k.ts; SHOW=1 check BLOCK "service_role JWT in a source file"
setup; printf "%s: correcthorse\n" "$PW" > docs/handouts/demo.md; git add docs/handouts/demo.md; SHOW=1 check BLOCK "password label with a value in a handout"
setup; printf "<td>%s</td><td>correcthorse</td>\n" "$PW" > docs/handouts/demo.html; git add docs/handouts/demo.html; check BLOCK "HTML label/value cell pair"
setup; printf "log in as demo@site.test with the %s shown\n" "$PW" > docs/handouts/demo.md; git add docs/handouts/demo.md; check BLOCK "email next to password label in a handout"
setup; printf "url = %s\n" "postgresql""://app:""hunter22x""@db.example.net/app" > src/db.ts; git add src/db.ts; check BLOCK "postgres URL with a password"
setup; rm .claude/hooks/secret-patterns; git add src/a.ts; check BLOCK "patterns file missing → refuse (fail closed)"

echo "=== must ALLOW ==="
setup; git add src/a.ts;                      check allow "ordinary source file"
setup; git add -A;                            check allow "git add -A stages nothing ignored"
setup; git add .gitignore src/a.ts;           check allow ".gitignore itself"
setup; printf "const k = '%s'\n" "$JWT_ANON" > src/k.ts; git add src/k.ts; check allow "anon-role JWT (publishable)"
setup; printf "%s: {{demo-password}}\n" "$PW" > docs/handouts/demo.md; git add docs/handouts/demo.md; check allow "placeholder value in a handout"
setup; printf "%s: ______\n" "$PW" > docs/handouts/demo.md; git add docs/handouts/demo.md; check allow "blank to fill in by hand"
setup; printf "type L = { %s: string }\n" "$PW" > src/t.ts; git add src/t.ts; check allow "password: string in a type (not a document path)"
setup; printf "a saved %s lets anyone holding the tablet sign back in\n" "$PW" > docs/guide.md; git add docs/guide.md; check allow "prose about passwords, no delimiter"
setup; printf "Enter user@example.com and your %s\n" "$PW" > docs/guide.md; git add docs/guide.md; check allow "example.com in the pair rule allowlist"
setup; printf "url = postgresql://postgres:postgres@127.0.0.1:54322/postgres\n" > src/db.ts; git add src/db.ts; check allow "local default postgres URL"
setup;                                        check allow "nothing staged"

echo; echo "  passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
