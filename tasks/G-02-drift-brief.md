# G-02 drift: brief for a fresh session

Size: spike (analysis only, labelled). No code, no mock-ups, no change to the spec or the game. The output is one written analysis; he decides what happens next.

Asked by him, 26 Nov, after the G-02 phone step, in a fresh chat "before diving into anything new, also looking at what we originally discussed and decided".

## The question

Why did Fieldcard drift from what he heard as an interesting, novel concept into "generic minigames" that feel "a bit boring"? Where in the chain was each interesting part lost, diluted or deferred, and by whose call?

## His words (verbatim)

After playing the G-02 card on his phone:
> Decent, and you designed what you intended with the most recent plan. However, overall I think has drifted and to be colloquial lobotomised an interesting, novel game concept into a generic minigame that feels a bit boring.

Asked which part lost it (a: the five events are generic and most of the time; b: the crowd reading is too small and late; c: the crowd feels fake):
> a is true, b the crowd reading events feel slightly disconnected, low stakes rather tahn really interesting, the methods for crowd reading games aren't too interesting perhaps try some of the other options. Also just feel it drifted, and is worth looking at why doen't feel like itnersting novel concept but jsut generic minigames thing.

His earlier lines on what he wanted are quoted in `tasks/G-00.md` (each round's answer, verbatim) and include: "like perceptle but what if it was a guess/analysis of crowd behaviour, me vs the world and how to gauge it"; "a social experiment kind of vibe"; "something that everyone will see go, wow interesting let me try"; rankings that are "novel, engaging, bring people back, fun"; "you aren't very good at choosing options but are alright at generating".

## Read, in this order (all in full)

1. The run folder, `~/Developer/vaults/Bleddyn Vault/OUTPUTS/Daily games/rank-the-dailies/`: `1-scan.md` (the brief and what it found), `3-shortlist.md` (the four concepts and his pick), `2b-call-candidates.jsonl` and `3b-call-shortlist.md`, `3c-architecture.md`, `2c-angle-candidates.jsonl` and `3d-angles.md`, `4-spec.md`. Skim `2-candidates.jsonl` for the original 84.
2. `~/Developer/daily-game/tasks/G-00.md` (his answers round by round, the rulings, R8 which set G-02's scope) and `design/PICK.md`.
3. The picked mock-up `~/Developer/daily-game/design/directions/b-final-run.html` and the earlier rounds in `design/directions/` (open them in a browser or read the markup).
4. `~/Developer/vaults/Bleddyn Vault/OUTPUTS/Agentic engineering/Build method/22 Pilot plan.md`, Build 1 (the G-00, G-02 and G-04 rows).
5. `~/Developer/daily-game/tasks/G-02.md` (scope, rulings R1 to R14, the review, the phone step).
6. The live build, https://bleddynmott.github.io/fieldcard/ , or the code in `src/`, to see what a player actually gets and for how long.
7. The studio skill's `references/teardowns.md` (T20 Consensus, T25 Perceptle, T26 Krillion) and `references/principles.md`, for what the comparables do.

The plan and the Lovable prompt of 24 Nov are in a claude.ai chat, not in the vault; say where that gap matters.

## What to produce

`~/Developer/daily-game/tasks/G-02-drift.md`, at most about two screens, then a short message to him:

1. **The concept as first heard.** In his words and the shortlist's, what made it interesting: name the parts (for example the call before each hole, reading the field, two results from one sitting, half of it landing later).
2. **The chain.** For each of those parts, where it went at each stage: scan → shortlist → his pick → rounds 2 to 6 → `4-spec.md` → G-00 R8 (the G-02 scope cut) → G-02 build. Mark each step kept, diluted, moved later, or dropped, with the file and line, and whose call it was (his, the agent's, the method's).
3. **Why it reads as generic now.** The causes, ranked, each with evidence: for example the share of the card's time spent on stand-alone events against crowd reading; whether the crowd matters while playing; what is at stake in a read; the simulated crowd; what the deferred layers (Hot Seat, four reads, teams, Sunday) carried.
4. **Crowd-reading forms not yet tried.** From `2-candidates.jsonl`, `2b-call-candidates.jsonl` and `2c-angle-candidates.jsonl`: the ideas never shown to him, grouped, one line each, with their ids. Do not rank or pick; he asked for options.
5. **What would have to be true** for the card to feel like the concept again, stated as tests a design could be checked against, not as a design.
6. **The method.** What in the process let this happen (for example a per-screen look check that cannot see a scope cut), one line each, added to `~/Developer/daily-game/.method/candidates.md` if new.

Rules: quote, do not paraphrase, when citing him. Say "not found" rather than guess. Do not start new designs, mock-ups or code; that waits for his answer to this. Stage files by name if you commit, and run `bash scripts/ci-checks.sh` before any commit.
