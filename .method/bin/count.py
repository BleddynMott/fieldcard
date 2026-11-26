#!/usr/bin/env python3
"""count.py  (Build method, proposal route, step A, draft v0, 25 Nov 2026)

No model. Reads .method/raw/events.jsonl and prints:
  1. per session: prompts typed, inferred interrupts, stops, K01 and K03 flags
  2. signatures seen in two or more sessions (the promotion threshold)
A signature is: a short prompt's wording; or event + tool + the start of the
error text. The error field names are guesses until real events are read
(see 24 Proposal route, "unverified"); the raw payload is kept so this can be
corrected without losing history.

usage: count.py <events.jsonl> [--min-sessions N] [--json]
"""
import collections, json, re, sys

ERR_KEYS = ("error", "reason", "message", "tool_response", "stderr")
FAIL_EVENTS = ("PostToolUseFailure", "PermissionDenied", "StopFailure")


def norm(s, n=80):
    s = re.sub(r"\d+", "N", str(s).lower())
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n]


def signature(ev):
    p = ev.get("payload") or {}
    e = ev.get("event")
    if e == "UserPromptSubmit":
        text = p.get("prompt")
        if isinstance(text, str) and len(text) <= 60:
            return "prompt: " + norm(text, 60)
        return None
    if e in FAIL_EVENTS:
        tool = p.get("tool_name") or ""
        ti = p.get("tool_input") if isinstance(p.get("tool_input"), dict) else {}
        cmd = norm(ti.get("command", ""), 40) if ti else ""
        err = next((p[k] for k in ERR_KEYS if p.get(k)), "")
        return "%s: %s | %s | %s" % (e, tool, cmd, norm(err))
    return None


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    min_sessions = int(argv[argv.index("--min-sessions") + 1]) if "--min-sessions" in argv else 2
    sessions = collections.OrderedDict()
    sigs = collections.defaultdict(lambda: {"sessions": set(), "n": 0, "first": None})
    bad = 0
    with open(argv[1], encoding="utf-8") as f:
        for i, raw in enumerate(f, 1):
            try:
                ev = json.loads(raw)
            except Exception:
                bad += 1
                continue
            sid = ev.get("session") or "none"
            s = sessions.setdefault(sid, {"prompts": 0, "interrupts": 0, "stops": 0, "failures": 0,
                                         "done_without_run": 0, "ask_without_list": 0,
                                         "open": False, "model": None})
            e = ev.get("event")
            s["model"] = ev.get("model") or (ev.get("payload") or {}).get("model") or s["model"]
            if e == "UserPromptSubmit":
                if s["open"]:
                    s["interrupts"] += 1
                s["prompts"] += 1
                s["open"] = True
            if e == "Stop":
                s["stops"] += 1
                s["open"] = False
                fl = ev.get("flags") or {}
                if fl.get("says_done") and not fl.get("cites_run"):
                    s["done_without_run"] += 1
                if fl.get("asks") and not fl.get("ends_numbered"):
                    s["ask_without_list"] += 1
            if e in FAIL_EVENTS:
                s["failures"] += 1
            sig = signature(ev)
            if sig:
                d = sigs[sig]
                d["sessions"].add(sid)
                d["n"] += 1
                d["first"] = d["first"] or i
    crossed = [(k, v) for k, v in sigs.items() if len(v["sessions"]) >= min_sessions]
    crossed.sort(key=lambda kv: (-len(kv[1]["sessions"]), -kv[1]["n"]))
    if "--json" in argv:
        print(json.dumps({"sessions": {k: {x: y for x, y in v.items() if x != "open"} for k, v in sessions.items()},
                          "crossed": [{"signature": k, "sessions": len(v["sessions"]), "events": v["n"],
                                       "first_line": v["first"]} for k, v in crossed],
                          "unparsed_lines": bad}, indent=1))
        return 0
    print("sessions: %d   unparsed lines: %d" % (len(sessions), bad))
    print("session | model | prompts | interrupts | stops | failures | done w/o run | ask w/o list")
    for k, v in sessions.items():
        print("%s | %s | %d | %d | %d | %d | %d | %d" % (k[:8], v["model"], v["prompts"], v["interrupts"],
              v["stops"], v["failures"], v["done_without_run"], v["ask_without_list"]))
    print("\nsignatures in >= %d sessions: %d" % (min_sessions, len(crossed)))
    for k, v in crossed:
        print("%d sessions, %d events, first at line %d: %s" % (len(v["sessions"]), v["n"], v["first"], k))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
