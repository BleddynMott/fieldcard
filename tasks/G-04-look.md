# G-04 The look, for a dare game

## Summary (read this first)

**Round 1 was rejected, 27 Nov.** His words: "Really poor. The 2 new ones look, you just like stuck together a bunch of shapes, or like I could just make it in Figma with a flat background and shapes just stuck on top. The themes don't really make sense and are quite boring". Round 1's summary is kept below as written.

**Round 2, his words, 27 Nov:** "i like E the most, but D does the best job at getting that idae of real people and a crowd behind it".

**Round 3, his words, 27 Nov:** "Currently i think E is better, because I think the tactile quality of the big yellow lights clicking on as your result builds would be interesting. Also think there's avenue in future to have like the spotlight on the crowd seraching over it.. I think the poeople models used in G don't fit the vibe fo the game asthey've been pulled from the other which is the main issue as to why it doesn't look good. Could be clearer about how we present people in cinema seats as an option"

**Open now:** `design/directions/look-g04-r4.html`. E's studio, kept. Three ways to show people in cinema seats on Stop (2H from the stage with only players seated, 2J a full house with a searching spotlight, 2K from your own seat), a home with searching spotlights (1H) and big lamps for Hold your day (3H). Type the ids you want, e.g. `2H, 1H, 3H`, or `none` and what is wrong. My recommendation: `2H, 1H, 3H`.

**Round 3 page:** `design/directions/look-g04-r3.html`. G is E's studio with D's people in it, beside E on the same three screens (ids 1E to 3G). Type `G` or `E`, a mix by id (e.g. `G, but 3E`), or `none` and what is wrong. My recommendation: G.

**Round 2 page:** `design/directions/look-g04-r2.html` (in a browser, at desktop width). Three new looks on three screens each (home, Stop with the crowd, Hold your day), ids 1D to 3F.

| | look | the place | why it fits | weakest point |
|---|---|---|---|---|
| D | **The Field** | his Sports day lawn, from standing height in low sun | the dare is leaving the pack; the crowd are people standing where they stopped | the people are small on a phone; nearest to what he already has |
| E | **Studio night** | a quiz-show studio, seen from the audience | bank or double and "we asked 100 people" are already a quiz show's moves | bulbs and curtains are a familiar picture; drops the sports-day world |
| F | **First light** | starlings over the field at dawn | follow the flock or break from it; birds on wires are a crowd on a line | "Hold your day" has no rope in it; Stop, Count, Repeat and Pair have no reason to be birds |

**My recommendation: D.** It keeps the look he picked, and it is the only one where every screen so far shows the stake as where you stand against real people. 2F is the best single picture on the page.

**What you type** (one line):
1. `D` (my recommendation), `E` or `F`: that look gets the other four screens
2. a mix by id, e.g. `D, but 2F`
3. `none`, and what is wrong

**Not run:** no K05 review of round 2. Round 1 had its one review; round 2 is a redraw after his rejection and he is at the keyboard to judge it. Say `review` if you want one before picking.

---

### Round 1 summary (rejected)

**Open:** `design/directions/look-g04.html` (in a browser, at desktop width). Three looks for the dare game, each drawn on the same seven screens with the same numbers. Compare along a row; every screen has an id (1A to 7C).

| | look | in one line | strongest screen | weakest point |
|---|---|---|---|---|
| A | **Finals day** | Sports day, evolved: the stake is a rosette, the crowd are heads | 4A, two rosettes for a double | the least changed, and still the most boxes |
| B | **For keeps** | playground marbles, chalk on tarmac: one blue marble is one player, your yellow marbles are your points | 4B, marbles in the bag or in the ring | chalk type and glossy marbles could tip into a stock look; its rope is only a line |
| C | **The Ridge** | a climb in two inks: the crowd is the mountain, bold is higher | 5C, the rope up the face; 7C's big number | the mountain is the crowd on only three screens of seven; 1C is the most generic picture on the page |

**My recommendation: B,** and carry two things over from C: the rope drawn upward (5C) and the scorecard's order (7C). B is the only look where the theme is the scoring on most screens, which is your reason for liking Krillion. The fresh review reached the same answer on its own.

**What you type** (one line):
1. `B` — my recommendation (I would then redraw B with an upward rope and 7C's scorecard order)
2. `A` or `C` — that look as drawn
3. a mix by id, e.g. `B, but 5C and 7C`
4. `none`, and what is wrong

**Not done, on purpose:** `design/tokens.css`, `DESIGN.md` and `PICK.md` are unchanged; nothing in `src/`, `tests/` or `../daily-game-rules` was touched. The pick gets its own task to move tokens.

**Left open after the one review** (full list in the Log): the keep-or-switch screen shows no stake; no look shows modelled players paler; the scorecard still carries about 20 numbers; whether Dare's scorecard should show Hunch at all is yours to rule.

---

Size: project, and why: it may replace the picked look (`design/PICK.md`). No interview: he was away overnight and said not to stop. His brief, the references and his earlier notes stand in for it; my rulings are at the bottom.

His ask, 27 Nov, in short: the game is now a dare/betting game (Dare) beside a crowd-reading branch (Read). "The current Sports day look may no longer fit Dare. I want a possible overhaul." Brainstorm, converge to three, draw them on one page, review once, commit, stop for his pick.

Named check, fixed before work:
1. The principles (§1) and each direction cite his words from `design/references/README.md` or `design/PICK.md`.
2. 4 to 6 themes are brainstormed, each tied to the game; Sports day, evolved, is one of them (§3).
3. Three directions are drawn on ONE page, `design/directions/look-g04.html`: what is shared appears once, then one row per screen with ids. Seven screens each: home, Stop with the crowd's pile, Count's keep-or-switch, double-or-bank, Hold your day, the graph read reveal, scorecard.
4. New colours and typefaces sit in a proposal block on the page. `design/tokens.css` is not changed.
5. Only `design/` and this file change. `src/`, `tests/` and `../daily-game-rules` are untouched.
6. One K05 review in a fresh context, graded against his words in `README.md` and `PICK.md`; CI's lines first.
7. `bash scripts/ci-checks.sh` passes.
8. He picks, in his words.

Signed:
Merge:
User can now: compare three looks for the dare game on one page and pick by id.

## 1. What the look must do for this game

Each line is checkable on a drawn screen.

| # | principle | from |
|---|---|---|
| P1 | **The stake is a thing you can see,** not a sentence. What is on the line has one shape, the same on every screen, and it visibly grows or shrinks. | his Nerve condition 1, "so understandable that the stakes are really clear" (G-00c restart point) |
| P2 | **The crowd is on the board,** as material in the play area: a pile, a hill, a line of hands. One colour, always. Never a number in a caption only. | his brief: "the crowd on the board"; G-00c C1 (my summary of the dare, not his words); DESIGN.md state marks |
| P3 | **You are one colour, always,** and nothing else is that colour. | DESIGN.md: `--you` |
| P4 | **The reveal happens on the picture you answered on,** at most four marks, built in order. | F4 (G-00c §2); DESIGN.md Don't 2 |
| P5 | **Minimal text.** A word budget per screen, counted: 20 words for a play screen, 25 for the graph reveal, 50 for the scorecard. Numbers, ids and the app name do not count. | "each page has so many sentences and numbers and words that it's so hard to engage with" (26 Nov) |
| P6 | **One job per screen:** one question, one gesture. | DESIGN.md Do 1; Perceptle, "no distractions" |
| P7 | **The theme is the scoring.** The world's own picture says what bold means and what it pays, so the rule needs no sentence. | Krillion: "got a sort of theme, that shows throughout it" |
| P8 | **A design language, not boxes.** A few shapes, repeated. No card inside a card, no grid of equal tiles. | Extraplot: "simple but clean and still has a design language"; Lovable: "design language of just boxes"; direction C: "looks like its arranged in excel" |
| P9 | **The end screen reads in one look:** one big number, one sentence, then one row per event. | Perceptle: "The end is really smart way of showing results clearly and intuitvely" |
| P10 | **Its own niche.** Not a copy of a reference's style. | "a is a direct krillion knock off"; "needs its own niche" |

## 2. His inspirations: the reason, not the style

| reference | his words | the reason taken | not taken |
|---|---|---|---|
| Krillion | "Fun design, got a sort of theme, that shows throughout it" | one metaphor carries the scoring on every screen (P7) | pixel type, navy and cyan, the dive itself |
| Extraplot | "simple but clean and still has a design language" | few shapes, each pressable thing looks pressable (P8) | its olive and orange, its pills |
| Perceptle | "simple, easy to play and focus in on the games. makes sense with no distractions. The end is really smart way of showing results clearly and intuitvely" | one thing per screen (P6); the end screen's order (P9) | near-black and cyan, monospace; he also said "not as fun" |
| Sports day (his pick) | "it's clear, stylised , themed and clear" | still the bar to beat: any new look must be as clear | — |
| Lovable (disliked) | "a theme that was really boring, design language of just boxes. Was very clearly ai generated" | avoid: equal boxes, default gradients, a theme that is only a colour | — |

## 3. Themes brainstormed: what is the world where you dare against a crowd?

| id | theme | the world | how it carries the scoring | verdict |
|---|---|---|---|---|
| T1 | **Finals day** (Sports day, evolved) | the same sports day, now with prizes | a rosette is what is on the line; the crowd are heads on the bank | **drawn as A.** The baseline he already likes |
| T2 | **For keeps** (playground marbles) | break time, chalk on tarmac, playing marbles for keeps | one blue marble is one player; your yellow marbles are your points, and you put them in the ring | **drawn as B** |
| T3 | **The Ridge** (alpine print) | a climb | bold is high; the crowd is the mountain, so a pile is literally a hill | **drawn as C** |
| T4 | Casino table | chips on felt | chips are the clearest stake there is | cut: the look is a casino, which is a well-worn look and carries age-rating risk in app stores. This is my judgment, not his words; B is also a betting game, in a playground |
| T5 | Fairground | stalls, the high striker, tickets | tickets won; the bell for a double | cut: busy by nature, against "no distractions". Not drawn, so this is a judgment |
| T6 | Floodlit final | sports day at night, the crowd as lights in the stand | the big scoreboard | cut: dark with one bright accent sits close to Perceptle, and it is the same world as A. Not drawn, so this is a judgment. B is dark too; it differs by having objects, not one accent |
| T7 | High wire | a stunt show poster | how far out you walk | cut: fits Stop and the rope only; Count and the graph have no place on a wire. C has a milder form of the same fault (see the review) |

**Why these three.** They differ in kind, not only colour: A is outlined paper cut-outs, B is a dark tactile surface with objects on it, C is a flat two-ink print. Each has one answer to P1 (the stake) and one to P2 (the crowd):

| | A Finals day | B For keeps | C The Ridge |
|---|---|---|---|
| the stake (P1) | a rosette with the number on it | yellow marbles you can count | how high your flag stands |
| the crowd (P2) | heads on the bank | blue marbles, one each | the mountain |
| bold means | a bigger rosette | more marbles in the ring | higher |
| the rope | a tug-of-war rope | a skipping rope chalked on the ground | a climbing rope up a face |
| type | Bowlby One, Outfit (kept) | Caveat Brush for chalk, Outfit | Big Shoulders Display, Outfit |

## 4. What the page draws

`design/directions/look-g04.html`. Dare's card for one day, the same numbers in all three looks, so only the look differs:
- Card 43, Fri 27 Nov. Events: Stop, Count, Repeat, Pair.
- Stop: the field's stops piled on the notch; a hit pays 5 at the thin edges and 1 under the peak, a miss 0 (V1).
- Count: you said 23 blind; everyone's hill peaks at 27; keep or switch (Q1, shared into Dare).
- Double or bank on Count: right +10 or +20; wrong 0 or −10 (V2).
- Hold your day: 64 points on the rope at ×1.6 = 102; it snaps where half let go, and a snap leaves half, 32 (V4).
- The graph read, draw day, on Stop's track: the notch, everyone's stops, everyone's guesses, yours (Q3). "61% stopped late."
- Scorecard: 102, then Hands and Hunch, a row per event, the rope.

## Log

- 27 Nov, overnight. Branch `g04-look` off `g02-card`. Read `CLAUDE.md`, `design/references/README.md`, `design/PICK.md`, `design/DESIGN.md`, G-00c round 4 and Rulings, G-00d. Wrote §1 to §4.
- 27 Nov. Drew `design/directions/look-g04.html`: 21 screens. Each row was rendered at 1300 px in headless Chrome and looked at; overlaps and clipping fixed before review.
- 27 Nov. **K05 review, one round, fresh context** (CI first, by the reviewer: `ci-checks: all passed`). Standard given: `README.md`, `PICK.md`, `DESIGN.md`, his brief verbatim, his standing feedback, G-00c round 4 and G-00d. It was told to report everything. **67 findings.** Its verdict: B fits the dare game best; A is safe and the most boxed; C is handsome but its metaphor breaks.
  - **Taken, on the page (35):**
    - Stop: the payout moved inside the notch and written as points, 5 · 1 · 5 (1, 2); A's marker is yellow (17); the third go reads the same in all three (40).
    - Count: "Everyone says 27" was false on its own picture, now "Most say 27" (5); your mark stands under the line, clear of the crowd's column (47); 3C's buttons are even (56).
    - Double: 4A is two rosettes of 10, no blank disc, no divider (28, 48).
    - Rope: it runs off the screen (12); the snap and the 32 you would keep are drawn on it (11); 5C's gap closed (13); one marble is one point everywhere, so 5B and 7B show 102 (6).
    - Graph: your line is visibly off the real pile, to match 78 (8); B's marbles are one each, not doubled (7); everyone's guess is drawn in the crowd's colour, dotted (22); the notch is no longer drawn in the "wrong" colour in B and C (21); 6A's "you" is yellow (18); 6C's "Why?" is not yellow (19); 6C's dot sits on the ground and its label is on the mountain (10, 54); lines no longer lost in 6B (53).
    - Scorecard: one sentence under the big number (34, 36); 7A lost its outer card and its two tiles, and its rosette is larger (27, 35); "snapped at ×2.4" (14); Pair banked is 10, matching row 4 (15); the header reads the same in all three (41); 7C's flag clears the step bar (50).
    - Home: 1A's rosette removed, so the rosette only ever means the stake (20).
    - Page text: the type samples now show at size (43); the proposal block says B and C drop the event colours, names C's limit and lists the guess colour (23, 24, 44).
    - This file: the summary written (39); P2's source corrected, since the quoted line was mine and not his (59); T4's unsupported "school-age audience" removed, and T5 to T7 marked as judgments (61, 62, 63).
  - **Also changed after the first render, before review:** yellow on the Play, Next and Share buttons in B and C, and 1C's sun, because yellow is the player only.
  - **Left, with the reason (his to overrule):**
    - 3: no look shows modelled players paler. The page draws a full field. C cannot show it at all with a solid mountain; that counts against C.
    - 4: keep-or-switch shows no stake. In Dare the stake is set at the tap that follows (row 4). Whether the stake should already sit on your answer here is a design question for the look he picks.
    - 9: the yellow dot for your own result stays in the reveal. `DESIGN.md` Don't 2 counts it inside "you", and G-00d keeps it.
    - 16: Hands and Hunch on Dare's scorecard. G-00d moved the graph read into Dare, so Hunch has a source there; the wording of its sentence is his to rule.
    - 25, 26: C has no "right" colour; the step bar shows during events. Both wait for the picked look's own task.
    - 29, 30, 31, 33, 57, 58: taste findings on single screens (1C generic; B's marbles and chalk near a stock look; 1B's marks in a grid; 2C's hill reads as a spire; 1A's heads read as beads; A's and B's ropes read as sliders). They are in the summary table as each look's weak point, not redrawn, so that he judges the looks as first drawn.
    - 32, 38: B is dark like the cut T6; rows 4, 5 and 7 have no crowd on the board (V2 and V4 hide the field during play).
    - 34: the scorecard has fewer sentences now, but still about 20 numbers.
    - 37, 45, 46, 49, 51, 52, 55: within budget or minor (payouts printed twice on 4A and 4C; buttons separate from the pictures; 5C's caption crosses the cliff edge; 7C's ground and flag height; chalk filter roughens button text).
    - 60: **named check 1 is only partly met.** P1, P2, P4 and P5 cite G-00c, `DESIGN.md` or his 26 Nov note, not `README.md` or `PICK.md`. The check is left as written.
    - 64, 66: rulings 5 and 2 below are mine and stand until he rules.
    - 65, 67: no change needed.
  - **One round only,** as he asked. No second round was run on the fix.
- 27 Nov. CI after the fixes: `ci-checks: all passed`. Committed on `g04-look`. Waiting for his pick.
- 27 Nov, round 2. He rejected round 1 (his words are in the Summary). What I took from it: (a) B and C were flat fills with primitives on top, with no light, depth or drawn detail; (b) marbles and a mountain were pictures chosen first and tied to the game afterwards. Round 2 answers both: each look is one lit place with depth, and the crowd is the subject of the picture. Themes were chosen by asking where a crowd already shows itself on a line: people queuing on a field, an audience voting, birds on wires.
- 27 Nov, round 2. Drew `design/directions/look-g04-r2.html`: D The Field, E Studio night, F First light, on home, Stop and Hold your day. Checked by rendering each row in headless Chrome and reading the screenshots. Fixed: gradient ids shared between phones, the notch off-centre from its queues in 2D, the flock's shape in 1F.
- 27 Nov, round 3. His words on round 2 are in the Summary. Drew `design/directions/look-g04-r3.html`: G, the studio with drawn people. Home: the stands are full and face out, and you are a person in the spot. Stop: only players sit in the stands, each above the bulb they stopped on. Hold your day: a lit staircase; whoever let go stays on their step. Checked by rendering each row and reading the screenshots; fixed the people standing in front of the wrong step's number.
- 27 Nov, round 4. His words on round 3 are in the Summary. E is the look; G's ink-outlined people are dropped. Drew `design/directions/look-g04-r4.html`: people as lit head-and-shoulders in red cinema seats, drawn without outlines in the studio's light; a player is someone holding a lit teal card. Checked by rendering each row and reading the screenshots.

## Rulings

Mine, under K03, because he was away. All reversible; his to overrule.

1. **Three directions means A is one of the three.** He asked for Sports day, evolved, among the themes, not necessarily among the drawn three. It is drawn because a page of only new looks would leave nothing to compare the overhaul against.
2. **The page's card is Stop, Count, Repeat, Pair.** C6's card has two rotating V3 events (Long jump, Hide and Seek). They have no marks in `DESIGN.md`, and this task is the look, so it draws only events that have marks. No new mark is invented here.
3. **The scorecard's numbers are for the look only.** Dare's point values are not set anywhere yet (15, 20, 14, 15; ×1.6). They add up, and nothing else is claimed for them.
4. **`--you` stays yellow and `--crowd` stays one colour in every direction** (P2, P3). B and C move the exact shades for their grounds; the shades are in the page's proposal block.
5. **"Shared screens once"** is read as: what all three looks share (the screen order, each screen's job, its words and numbers, the state marks) is stated once at the top of the page. No whole screen is identical across looks, since the look is the thing compared.
6. **Names of the looks** (Finals day, For keeps, The Ridge) are working labels for this page. The game stays Fieldcard and the event names stay.
7. **Not done here:** `tokens.css`, `DESIGN.md` and `PICK.md` are unchanged. Whichever look he picks gets its own task to move the tokens and redraw the reference screenshots.
8. **The page is a local file, not published anywhere.**
9. **Round 2 draws three screens, not seven.** Round 1 spent 21 screens on looks he rejected at a glance. Home, Stop and Hold your day are enough to judge a look; the pick gets the other four.
10. **Round 2 drops A, B and C.** He called the two new ones poor and did not ask for A again. D is Sports day carried forward, so the picked look is still on the page.
11. **Screen 3 shows the players who have already let go, where they let go.** This is new and is a game rule, not only a look: it tells the player how close the snap is. His to rule on; the look does not depend on it.
12. **Round 2's type is new in E and F** (Bungee and Doto; Fraunces). D uses Bowlby One and Outfit, already picked. None is in `tokens.css`.
13. **Round 3 compares G with E only.** He named E as the one he likes and D as the source of the people; F was not mentioned, so it is not redrawn.
14. **G's crowd is teal in three shades,** read as one colour against the studio's reds. Skin and hair vary so they read as people; clothes do not.
15. **Round 4 treats E as picked for the studio, not yet for every screen.** He said "currently" E is better. The crowd's treatment is still open, so `PICK.md` and `tokens.css` stay unchanged.
16. **The crowd's one colour is the teal of the cards they hold.** Hair, skin and clothes vary so they read as people; none of those carries meaning.
17. **The searching spotlight is drawn still** (2J, 1H). He called it a future avenue; no motion is specified here.
