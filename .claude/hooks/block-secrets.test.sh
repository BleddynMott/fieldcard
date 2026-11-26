#!/usr/bin/env bash
# Tests for block-secrets.sh. Run: bash assets/hooks/block-secrets.test.sh
# Bad inputs are assembled from parts so this file never contains a credential shape itself.
set -uo pipefail
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/block-secrets.sh"
pass=0; fail=0
b64url () { printf '%s' "$1" | base64 | tr '+/' '-_' | tr -d '=\n'; }
JWT_SVC="$(b64url '{"alg":"HS256","typ":"JWT"}').$(b64url '{"iss":"supabase","role":"service_role","iat":1}').$(b64url 'signature-bytes-here')"
JWT_ANON="$(b64url '{"alg":"HS256","typ":"JWT"}').$(b64url '{"iss":"supabase","role":"anon","iat":1}').$(b64url 'signature-bytes-here')"
PW="Pass""word"; PK="-----BEGIN RSA PRIVATE"" KEY-----"; SBS="sb_""secret_""abcdefghijklmnop"; SBP="sb_""publishable_""abcdefghijklmnop"

t () {  # $1 expected  $2 label  $3 tool  $4 json tool_input
  out=$(printf '{"tool_name":"%s","tool_input":%s}' "$3" "$4" | "$HOOK" 2>&1 >/dev/null); code=$?
  got=$([ $code -eq 2 ] && echo BLOCK || echo allow)
  if [ "$got" = "$1" ]; then r="ok   "; pass=$((pass+1)); else r="WRONG"; fail=$((fail+1)); fi
  printf '  %s expected=%-5s got=%-5s  %s\n' "$r" "$1" "$got" "$2"
  [ "$got" = BLOCK ] && [ -n "${SHOW:-}" ] && printf '        refusal: %s\n' "$(printf '%s' "$out" | head -1)"
}
bash_in () { jq -cn --arg c "$1" '{command:$c}'; }
write_in () { jq -cn --arg p "$1" --arg c "$2" '{file_path:$p,content:$c}'; }
edit_in () { jq -cn --arg p "$1" --arg c "$2" '{file_path:$p,old_string:"x",new_string:$c}'; }

echo "=== rule 1 must BLOCK: mass or forced staging ==="
SHOW=1 t BLOCK "git add -A" Bash "$(bash_in 'git add -A')"
t BLOCK "git add --all" Bash "$(bash_in 'git add --all && git commit -m x')"
t BLOCK "git add ." Bash "$(bash_in 'git add .')"
t BLOCK "git add -f ignored path" Bash "$(bash_in 'git add -f .env')"
t BLOCK "git add -Af" Bash "$(bash_in 'git add -Af docs/')"
t BLOCK "compound: cd && git add -A" Bash "$(bash_in 'cd repo && git add -A')"
t BLOCK "git -C repo add -A" Bash "$(bash_in 'git -C repo add -A')"
t BLOCK "git add src/ -A (flag after path)" Bash "$(bash_in 'git add src/ -A')"
t BLOCK "git add ./" Bash "$(bash_in 'git add ./')"
t BLOCK "git add *" Bash "$(bash_in 'git add *')"
t BLOCK "git add ../" Bash "$(bash_in 'git add ../')"
echo "=== rule 2 must BLOCK: credential shapes ==="
SHOW=1 t BLOCK "service_role JWT in a command" Bash "$(bash_in "export SUPABASE_KEY=$JWT_SVC")"
t BLOCK "service_role JWT in Write content (src path)" Write "$(write_in src/config.ts "const key = '$JWT_SVC'")"
t BLOCK "private key block in Edit" Edit "$(edit_in src/x.ts "$PK")"
t BLOCK "sb_secret_ key in a command" Bash "$(bash_in "curl -H 'apikey: $SBS' https://x")"
PGURL="postgresql""://app:""hunter22x""@db.example.net/app"
t BLOCK "postgres URL with password" Bash "$(bash_in "psql $PGURL")"
SHOW=1 t BLOCK "password label + value in a docs handout (Write)" Write "$(write_in docs/handout.md "Email: demo@site.test
$PW: correcthorse")"
t BLOCK "password label + value written to docs via heredoc" Bash "$(bash_in "cat > docs/pilot.md <<'X'
$PW: correcthorse
X")"
t BLOCK "email next to password label in docs (pair)" Write "$(write_in docs/pilot/signin.md "Sign in as demo@site.test and use the $PW you were given")"
t BLOCK "AWS access key id in content" Write "$(write_in src/a.ts "id = 'AKIA""ABCDEFGHIJKLMNOP'")"

echo "=== must ALLOW ==="
t allow "git add by path" Bash "$(bash_in 'git add src/a.ts docs/x.md')"
t allow "git add ./src/a.ts (a named path under ./)" Bash "$(bash_in 'git add ./src/a.ts')"
t allow "git add -p (interactive flag has no A or f)" Bash "$(bash_in 'git add -p src/a.ts')"
t allow "prose in -m mentions git add -A" Bash "$(bash_in 'git commit -m "docs: never use git add -A"')"
t allow "prose in --message= mentions the rule" Bash "$(bash_in 'git commit --message="hook blocks git add ."')"
t allow "heredoc commit message mentions git add -A" Bash "$(bash_in "$(printf 'git commit -F - <<%sMSG%s\nchore: forbid git add -A\nMSG\n' "'" "'")")"
t allow "anon-role JWT (publishable by design)" Bash "$(bash_in "export VITE_KEY=$JWT_ANON")"
t allow "sb_publishable_ key" Bash "$(bash_in "export VITE_KEY=$SBP")"
t allow "local supabase default postgres URL" Bash "$(bash_in 'psql postgresql://postgres:postgres@127.0.0.1:54322/postgres')"
t allow "password label with a placeholder in docs" Write "$(write_in docs/handout.md "$PW: {{demo-password}}")"
t allow "password label with fill-in blank in docs" Write "$(write_in docs/handout.md "$PW: ______")"
t allow "password: string in a TypeScript type (src path)" Write "$(write_in src/types.ts "type Login = { email: string; $PW: string }")"
t allow "password: z.string() in a schema (src path)" Edit "$(edit_in src/schema.ts "$PW: z.string().min(8),")"
t allow "grep for the word password" Bash "$(bash_in "grep -rn \"$PW:\" src/")"
t allow "example.com email near password in docs" Write "$(write_in docs/guide.md "Enter user@example.com and your $PW")"
t allow "reading .env" Bash "$(bash_in 'cat .env')"
t allow "unrelated command" Bash "$(bash_in 'npm run test')"
out=$(printf '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | PATH=/nonexistent /bin/bash "$HOOK" 2>&1 >/dev/null); code=$?
if [ $code -eq 2 ]; then echo "  ok    jq missing → refuse (fail closed)"; pass=$((pass+1)); else echo "  WRONG jq missing"; fail=$((fail+1)); fi


echo "=== rule 1b must BLOCK: switching off the pre-commit control (G-01) ==="
t BLOCK "git commit --no-verify" Bash "$(bash_in 'git commit --no-verify -m x')"
t BLOCK "git commit -n" Bash "$(bash_in 'git commit -n -m x')"
t BLOCK "git -c core.hooksPath=/dev/null commit" Bash "$(bash_in 'git -c core.hooksPath=/dev/null commit -m x')"
t BLOCK "git config --unset core.hooksPath" Bash "$(bash_in 'git config --unset core.hooksPath')"
t allow "git commit -m with an n in the message" Bash "$(bash_in 'git commit -m "no new lines"')"
echo "=== added token shapes must BLOCK (G-01) ==="
GHP="github""_pat_""11ABCDEFG0123456789abcdefghij"; ANT="sk-""ant-""api03-abcdefghijklmnopqrstuv"; STL="sk_""live_""abcdefghijklmnop1234"; SBP="sb""p_""0123456789abcdefghij0123"
t BLOCK "github fine-grained token" Write "$(write_in src/a.ts "const t='$GHP'")"
t BLOCK "anthropic key" Write "$(write_in src/a.ts "const t='$ANT'")"
t BLOCK "stripe live key" Write "$(write_in src/a.ts "const t='$STL'")"
t BLOCK "supabase access token" Write "$(write_in src/a.ts "const t='$SBP'")"
echo "=== other writing tools are scanned (G-01) ==="
t BLOCK "private key via NotebookEdit" NotebookEdit "$(jq -cn --arg c "$PK" '{notebook_path:"n.ipynb",new_source:$c}')"
t BLOCK "private key via MultiEdit" MultiEdit "$(jq -cn --arg c "$PK" '{file_path:"src/x.ts",edits:[{old_string:"a",new_string:$c}]}')"

echo; echo "  passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
