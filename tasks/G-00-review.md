# G-00 review (K05)

Standard: the G-00 row and "The look (G-00)" in `22 Pilot plan.md`; studio SKILL.md stage 4; principles and teardowns. Rounds stop when a finding repeats or after round 3.

## Round 1, 25 Nov: fresh-context reviewer, whole output

Check run by the reviewer first: `25 of 25 checks passed through stage 4`. 72 findings. Disposition:

**Fixed (in the spec, the mock, tokens.css, DESIGN.md, PICK.md, references/README.md, 3-shortlist.md):** 1 (pick and why now in the spec), 3 and 4 (README: a "superseded" section; both feel sentences in the spec), 5 (new names flagged in the spec as not yet seen by him; "Mirror Duel" label on the Scorecard), 8 (Share, streak, next card on the Scorecard; screenshot retaken), 9 (Scorecard leads with one line), 10 (one mark and one colour per thing), 11 (+66, not 83), 12 and 13 (doors and read rotations by weekday, no clash), 14 (finished beads spread evenly), 15 (84%), 16 (largest share; ties), 17 (30% left), 18 (three scores), 19 ("finished"), 20 (share format rule), 22 (Hunch over points available; ties), 23 (seed fixes form, event and starting guess), 24 (thresholds for doors, Repeat 0, Fix rescaling, p at finish, fixture closing, under-5 rival), 25 (tier cuts), 26 (week = weeks since launch), 27 (7 cards), 28 (persona text), 29 (copy), 30 (note under the stage-3 pick), 31 (T20 wording; Consensus in Open risks), 32 (decision now [own] with a test), 33 (T18 dropped; [own] with a test), 34 (path left out, reason given), 35 (P02 added), 36 (fact lines from the day's numbers only; rule in spec and DESIGN.md), 37 and 38 (the mock loads tokens.css through aliases; wrong is #b42318 on screen), 39 to 45 (tokens.css now holds every colour, weight, size scale, radius, shadow, line and space; build rounds to the nearest token), 47 (crowd is slate, not Count blue), 48 (matched = right), 49 (Don't 3 rewritten; bunting without state colours; yellow is you, your step, today), 50 (bar in --wrong; knot and pin neutral), 51 (✗ added), 52 (sand reveal two series; Don't 2 rewritten), 53 (--line and --line-thin), 54 (names table complete; chair drawn), 55 (all value kinds), 56 (Stop mark is a notch), 57 (round results in plain ink), 58 (repair any time the next day), 59 (absence costs the team nothing), 61 (place fixed at finish), 62 ("she" removed), 63 and 64 (the spec now states the server data and the anonymous device ID; proving the flows is deferred, below), 65 (private groups show no member's own scores), 66 (opt-in wording), 67 ("readers" removed from the photo), 69 (trophy drawn; field report on the week card), 70 (per-event row on the Scorecard), 72 (full quote), 7 (README now records his strongest reference, the agent's reading).

**Partly fixed:** 60. Fix the crowd's starting guess is now fixed by the seed. Scoring against the crowd so far stays, as the decision "fixed at finish" [own] with a test; listed in Open risks as "Answers move with the time you play".

**Rejected:** 21 and 68, because he asked for "placing yourself on a distribution" in those words (round 6; quote now in G-00.md). 71, a misreading: "can keep count" was about the Count event, which stays.

**Deferred, with the task named:** 46 (motion values checked at the G-02 phone step); 63, 64 (server data flows proven in G-03).

**Reported as a deviation, not fixed:** 2. The plan allows at most two rounds of picking. There were six; rounds 5 and 6 changed the look as well as the crowd step (Draw it decluttered, Claim it tidied, the photo redone), all at his request. Reported to him for a ruling.

**Not fixable:** 6 (no screenshot of the Lovable spike exists; noted in README).

Fix diff for round 2: `tasks/G-00-fix-r1.diff`, 916 lines.

## Round 2, 25 Nov: fresh-context reviewer, fix diff only

Check run first: `25 of 25 checks passed through stage 4`. 30 findings. Disposition:

**Fixed:** 1 (banner one line, trophy moved clear), 2 (result bar fits; ink text on `--right`, white on `--wrong`), 3 (labels match the weekday table; Fix shows Stop's boxes), 4 ("biggest share"), 5 (Find yourself axis "beat 0%" to "beat 100%"), 6 (Hot Seat label ink), 7 ("`--ink` on `--chalk`"), 8 (Scorecard mark: the two score tiles), 9 (tables set events and forms; seed sets the rest; fakes made at your finish, kind and amount by seed), 10 (Hot Seat drawn once, at first open anywhere), 11 (Reading defined by nearer the real crowd or everyone else's average read; "starting guess" throughout), 12 (week card provisional until Sunday's last reset), 13 (weeks Monday to Sunday, week 1 holds launch; mock now week 7; weekly Hunch defined), 14 (behind and level; fixture closes at the later reset), 15 (private duels show only who won; the duel at finish counts), 16 (opt-in wording lists all that is shown), 17 (✓ at overlap 70+; bucket must be empty), 18 ("50% finished there"), 19 (week lines and persona reworded; team Nerve defined), 20 (emoji reason attributed to the agent), 22 ("Flag" listed as unseen; Mirror Duel removed from that list), 23 (README), 24 (bookkeeping above), 26 (halfway rounds up; door panel and sand box radii tokenised), 27 (Do 4 matches the mock), 28 (unused rule removed; knob not gold; weekday strip in `--sand`), 29 ("beat N%" chips; tile sentences; Hands is now the rounded average, which is what the mock shows; knot rule stated), 30 (reported as a deviation, above).

**Rejected:** 21, a misreading: "placing yourself on a distribution" is his verbatim wording; the full quote is now in G-00.md. 25, as stated: the token rule binds build code (design-check.sh, G-01); the mock may write values literally, every one of which is in tokens.css (the reviewer's own script found none missing); DESIGN.md now says so.

Fix diff for round 3: `tasks/G-00-fix-r2.diff`.

## Round 3, 25 Nov: fresh-context reviewer, fix diff only (the last round)

Check run first: `25 of 25 checks passed through stage 4`. 24 findings; three repeat earlier ones (14, 18, 24), so the rounds stop here (K05).

**Fixed:** 1 (place defined as where your Hands ranks; Claim it, the Hot Seat and the beads use place), 2 (beads now 5 in 100 each: 80% planted above the middle, 50% finished there, exactly), 3 (persona matches the Reading rule), 4 (Stop read three times a week), 5 (card number is days since launch plus one), 6 (week card marked provisional), 7 (opt-in lists place), 8 (hidden when no one qualifies), 9 (duels drawn at the close; a duel "so far" at your finish), 10 (knot kept between 5 and 95), 11 (fakes sentence agrees), 12 (chips at `--line`; tokens comments match DESIGN.md), 13 (THURSDAY), 14 (Find yourself rebuilt: your result marked on the event's own axis, a 0–100% slider for the share behind you, the reveal draws the real spread), 15 (Pick screen no longer clipped), 16 (banner at 13px, a token size), 17 (Fix copy fits Stop; stale comment), 18 (DESIGN.md and tokens.css now say every colour is in tokens; sizes round), 19 (knob is `--wood-dark`; `--sand` is the Read of the day), 20 (Find yourself ✓ within 10 points), 21 (fewer than four days: no tier, "joined this week"), 22 (trophy beside the front row; "biggest share" throughout), 23 (task file numbers), 24 (the deviation is now stated in PICK.md and G-00.md and reported to him).

**Left, after three rounds:**
- 22, part: "beat 100%" would wrap in a Scorecard chip; the chip width is settled in G-02.
- 16, part: the banner fits at 13px with little room; recheck at the G-02 phone step.
- Carried from round 1: 46 (motion, G-02), 63 and 64 (data flows, G-03), 60 part (answers move with the time you play; Open risks).
- For G-01: `design-check.sh` must skip `design/directions/`, whose mock-ups write colour values literally.
- No fresh review of the round-3 fixes (the rule stops at round 3).
