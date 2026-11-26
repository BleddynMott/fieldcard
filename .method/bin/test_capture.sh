#!/usr/bin/env bash
# Planted-fault test for capture.py and count.py. Synthetic payloads only.
# usage: test_capture.sh   (run from the folder holding capture.py and count.py)
set -u
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"; export CLAUDE_PROJECT_DIR="$tmp/proj"; mkdir -p "$CLAUDE_PROJECT_DIR"
log="$CLAUDE_PROJECT_DIR/.method/raw/events.jsonl"
pass=0; fail=0
ok(){ if [ "$1" = "$2" ]; then pass=$((pass+1)); echo "pass  $3"; else fail=$((fail+1)); echo "FAIL  $3 (got '$1', want '$2')"; fi; }
run(){ out="$(printf '%s' "$1" | python3 "$here/capture.py" 2>&1)"; rc=$?; }

# 1 a normal prompt is kept whole, silently, exit 0
run '{"hook_event_name":"UserPromptSubmit","session_id":"s1","prompt":"continue"}'
ok "$rc" 0 "prompt: exit 0"; ok "$out" "" "prompt: prints nothing"
ok "$(wc -l < "$log" | tr -d ' ')" 1 "prompt: one line appended"
# 2 empty stdin, 3 non-JSON stdin: still exit 0, still silent, still a line
run ''; ok "$rc" 0 "empty stdin: exit 0"; ok "$out" "" "empty stdin: silent"
run 'not json {'; ok "$rc" 0 "non-JSON: exit 0"; ok "$out" "" "non-JSON: silent"
ok "$(wc -l < "$log" | tr -d ' ')" 3 "three lines after three events"
# 4 secrets are masked before writing
# (the fixtures are assembled from parts so this file passes the repository's own secret scan)
PGURL="postgres""://bob:""hunter2""@db.example.com:5432/x"; JWT="eyJhbGciOiJIUzI1NiJ9"".""eyJyb2xlIjoic2VydmljZV9yb2xlIn0"".abcdefghijk"
run '{"hook_event_name":"UserPromptSubmit","session_id":"s1","prompt":"use '"$PGURL"' and '"$JWT"'"}'
ok "$(grep -c 'hunter2' "$log")" 0 "database password not written"
ok "$(grep -c 'eyJhbGciOiJIUzI1NiJ9' "$log")" 0 "JWT not written"
ok "$(grep -c '<url-with-credentials>' "$log")" 1 "URL mask present"
# 5 long tool output is cut, the prompt is not
big="$(python3 -c 'print("x"*5000)')"
run "{\"hook_event_name\":\"PostToolUseFailure\",\"session_id\":\"s1\",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"npm test\"},\"error\":\"Exit code 1 $big\"}"
ok "$(tail -1 "$log" | python3 -c 'import sys,json; print(len(json.loads(sys.stdin.read())["payload"]["error"]) < 500)')" True "long error cut"
run "{\"hook_event_name\":\"UserPromptSubmit\",\"session_id\":\"s1\",\"prompt\":\"$big\"}"
ok "$(tail -1 "$log" | python3 -c 'import sys,json; print(len(json.loads(sys.stdin.read())["payload"]["prompt"]))')" 5000 "long prompt kept whole"
# 6 Stop flags: done without a run; ask without a numbered list; and the clean forms
run '{"hook_event_name":"Stop","session_id":"s1","last_assistant_message":"All done, the feature is complete."}'
ok "$(tail -1 "$log" | python3 -c 'import sys,json; f=json.loads(sys.stdin.read())["flags"]; print(f["says_done"], f["cites_run"])')" "True False" "done without run flagged"
run '{"hook_event_name":"Stop","session_id":"s1","last_assistant_message":"Done.\n```\n$ npm test\n12 passed\n```"}'
ok "$(tail -1 "$log" | python3 -c 'import sys,json; f=json.loads(sys.stdin.read())["flags"]; print(f["says_done"], f["cites_run"])')" "True True" "done with run not flagged"
run '{"hook_event_name":"Stop","session_id":"s2","last_assistant_message":"Which database should I use?"}'
ok "$(tail -1 "$log" | python3 -c 'import sys,json; f=json.loads(sys.stdin.read())["flags"]; print(f["asks"], f["ends_numbered"])')" "True False" "ask without list flagged"
run '{"hook_event_name":"Stop","session_id":"s2","last_assistant_message":"Which database?\n1. `a` SQLite (recommended)\n2. `b` Postgres"}'
ok "$(tail -1 "$log" | python3 -c 'import sys,json; f=json.loads(sys.stdin.read())["flags"]; print(f["asks"], f["ends_numbered"])')" "True True" "ask with list not flagged"
# 6b the model is read from the transcript tail at Stop; a missing transcript changes nothing
printf '%s\n' '{"type":"assistant","message":{"model":"claude-old-1"}}' '{"type":"assistant","message":{"model":"claude-fable-5-2","content":"x"}}' > "$tmp/t.jsonl"
run "{\"hook_event_name\":\"Stop\",\"session_id\":\"s3\",\"transcript_path\":\"$tmp/t.jsonl\",\"last_assistant_message\":\"ok\"}"
ok "$(tail -1 "$log" | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()).get("model"))')" "claude-fable-5-2" "model read from transcript tail (last value wins)"
run "{\"hook_event_name\":\"Stop\",\"session_id\":\"s3\",\"transcript_path\":\"$tmp/none.jsonl\"}"
ok "$rc" 0 "missing transcript: exit 0"; ok "$(tail -1 "$log" | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()).get("model"))')" "None" "missing transcript: model None"
# 7 an unwritable project folder: still exit 0, still silent
CLAUDE_PROJECT_DIR=/proc/nope run '{"hook_event_name":"Stop","session_id":"s9"}'
out2="$(printf '{}' | CLAUDE_PROJECT_DIR=/proc/nope python3 "$here/capture.py" 2>&1)"; ok "$?" 0 "unwritable folder: exit 0"; ok "$out2" "" "unwritable folder: silent"
# 8 count.py: a signature in two sessions crosses; one in a single session does not
run '{"hook_event_name":"UserPromptSubmit","session_id":"s2","prompt":"Continue"}'
run '{"hook_event_name":"UserPromptSubmit","session_id":"s2","prompt":"only said once"}'
run '{"hook_event_name":"PostToolUseFailure","session_id":"s1","tool_name":"Bash","tool_input":{"command":"npm test"},"error":"Exit code 1 at line 12"}'
run '{"hook_event_name":"PostToolUseFailure","session_id":"s2","tool_name":"Bash","tool_input":{"command":"npm test"},"error":"Exit code 1 at line 44"}'
c="$(python3 "$here/count.py" "$log")"
ok "$(printf '%s' "$c" | grep -c 'prompt: continue')" 1 "repeated prompt crosses the threshold"
ok "$(printf '%s' "$c" | grep -c 'only said once')" 0 "single-session prompt does not"
ok "$(printf '%s' "$c" | grep -c 'PostToolUseFailure: Bash')" 1 "repeated failure crosses (digits normalised)"
ok "$(printf '%s' "$c" | grep -c '^s1 ')" 1 "session s1 row present"
ok "$(printf '%s' "$c" | grep -c '^s3 | claude-fable-5-2')" 1 "count.py shows the model for s3"
printf '%s\n' "$c"
echo "---"; echo "passed $pass, failed $fail"; [ "$fail" = 0 ]
