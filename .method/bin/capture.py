#!/usr/bin/env python3
"""capture.py  (Build method, proposal route, draft v0, 25 Nov 2026)

Registered on Claude Code hook events. Appends one JSON line per event to
<project>/.method/raw/events.jsonl. It prints nothing and always exits 0, so
it can neither block a tool call nor add context to the session.

It does not depend on event-specific field names: the whole payload is kept,
with long strings cut. Two exceptions, both read if present and ignored if not:
  prompt                   kept up to PROMPT_MAX (the owner's words are the signal)
  last_assistant_message   flagged for K01 and K03 before it is cut
The raw file holds the owner's prompts. It must be git-ignored.
"""
import json, os, re, subprocess, sys, time

STR_MAX = 400
PROMPT_MAX = 20000
MASKS = [
    (re.compile(r"\b[a-z][a-z0-9+.-]*://[^\s:/@]+:[^\s@]+@\S+"), "<url-with-credentials>"),
    (re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}"), "<jwt>"),
    (re.compile(r"\b(sk|pk|rk|ghp|gho|github_pat|sbp|xox[abp])[-_][A-Za-z0-9_-]{16,}"), "<token>"),
]
DONE = re.compile(r"\b(done|complete|completed|finished|shipped|all (tests|checks) pass(ed)?)\b", re.I)
RUN = re.compile(r"(```|exit code|\b\d+ (passed|pass|tests?)\b|\brun id\b|^\s*\$ )", re.I | re.M)
NUMBERED = re.compile(r"(?m)^\s*1[.)]\s+\S")
MODEL = re.compile(r'"model"\s*:\s*"([^"]+)"')


def mask(s):
    for pat, rep in MASKS:
        s = pat.sub(rep, s)
    return s


def cut(v, limit=STR_MAX, key=None):
    if isinstance(v, str):
        v = mask(v)
        lim = PROMPT_MAX if key == "prompt" else limit
        return v if len(v) <= lim else v[:lim] + "<cut %d>" % (len(v) - lim)
    if isinstance(v, dict):
        return {k: cut(x, limit, k) for k, x in list(v.items())[:60]}
    if isinstance(v, list):
        return [cut(x, limit) for x in v[:30]]
    return v


def model_from_transcript(path):
    """SessionStart carries no model field (seen on 2.1.332, 25 Nov 2026), so read the
    last "model" value from the tail of the transcript. The transcript format is not
    a contract; a miss returns None and nothing else changes."""
    try:
        with open(path, "rb") as f:
            f.seek(0, 2)
            f.seek(max(0, f.tell() - 200000))
            found = MODEL.findall(f.read().decode("utf-8", "replace"))
        return found[-1] if found else None
    except Exception:
        return None


def git_head(cwd):
    try:
        out = subprocess.run(["git", "--no-optional-locks", "rev-parse", "--short", "HEAD"],
                             cwd=cwd, capture_output=True, text=True, timeout=2)
        return out.stdout.strip() or None
    except Exception:
        return None


def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
        if not isinstance(payload, dict):
            payload = {"_value": payload}
    except Exception:
        payload = {"_unparsed": raw[:STR_MAX]}
    event = payload.get("hook_event_name") or (sys.argv[1] if len(sys.argv) > 1 else "unknown")
    root = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
    line = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "event": event,
            "session": payload.get("session_id")}
    msg = payload.get("last_assistant_message")
    if isinstance(msg, str):
        tail = msg[-1500:]
        line["flags"] = {
            "says_done": bool(DONE.search(msg)),
            "cites_run": bool(RUN.search(msg)),
            "asks": "?" in msg[-600:],
            "ends_numbered": bool(NUMBERED.search(tail)),
            "chars": len(msg),
        }
    if event in ("SessionStart", "SessionEnd"):
        line["git_head"] = git_head(root)
    if event in ("Stop", "SessionEnd") and isinstance(payload.get("transcript_path"), str):
        line["model"] = model_from_transcript(payload["transcript_path"])
    line["payload"] = cut(payload)
    out_dir = os.path.join(root, ".method", "raw")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "events.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(line, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    try:
        main()
    except BaseException:
        pass
    sys.exit(0)
