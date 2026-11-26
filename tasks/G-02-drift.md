# G-02 drift: why Fieldcard became "generic minigames"

Spike (analysis only, labelled). No design, mock-up or code. Written 26 Nov 2026 from the sources in `G-02-drift-brief.md`, all read in full, plus his own messages as typed, from `.method/raw/events.jsonl` (on his Mac only, never committed; cited as raw, with the UTC time). Line numbers: `scan` = `1-scan.md`, `short` = `3-shortlist.md`, `3b`, `3c`, `3d` and `spec` = `4-spec.md` (all in the run folder); `22` = `22 Pilot plan.md`.

**In one line:** the card that got built is Perceptle's shape (five perceptual events of about 20 s each, with Count among them) followed by a 20-second quiz about a simulated crowd. Three things caused it. The 24 Nov architecture made the five minigames the core and the crowd an add-on. The crowd was then taken out of the events and put once at the end. And R8 deferred every part that gave a read stakes or a real person.

## 1. The concept as first heard

- **Reading the crowd is the game.** His words: "like perceptle but what if it was a guess/analysis of crowd behaviour, me vs the world and how to gauge it" (raw 15:43, 25 Nov). In the same message: "Not just I'm sititng here thinking how well i'm going to do" and "slightly loses from the USP of this game, which we need to refine as I think was cleraer at the start". He had already noticed the drift on 25 Nov.
- **The read woven into play.** In M03 Field par you call the field over or under par "before each hole" (short:6).
- **Two results from one sitting, ranked apart:** "how they played and how well they read everyone else" (short:13).
- **Half of it lands later** (short:13).
- **Me against the world, with sides.** A week-long contest between sides (short:28, 35), then "joining a 'team' by university or location ... location vs location battles" (raw 15:52).
- **A social experiment:** "becoming more of a social expeirment kind of vibe" (raw 17:16). Reveals that teach something about people (3b:5, test 5).
- **First impression:** "something that everything will see go, wow interesting let me try and can fly to top of rankings based on our orignla alaysis of these games nad pyshology etc" (raw 15:43).

## 2. The chain

K = kept, D = diluted, L = moved later, X = dropped (from what he gets in G-02).

| part | shortlist / pick | rounds 2–6 | `4-spec.md` | G-00 R8 | G-02 build |
|---|---|---|---|---|---|
| Reading is the game | K: short:6 | K: 3b:3 | **D**: spec:201 says it is the point, but spec:117 gives events about 2 min against reads of about 20 s. Agent's call | K | **D**: Spot it + Pour, about 20 s |
| Read woven into play | K: M03, before each hole | **D** then **X**. Round 2: before-each-event calls rejected for being about yourself (his call, raw 15:43). Round 3: reads moved to after each event (3b:8, 19). 3c:5–12, 47–48: once per run. The agent applied his "some of these could be parts of the overall app rather than repeated 5 times eg at end could plant your flag" (raw 15:52) to every read, after already suggesting "one event a day, not all five" (`b-round3-crowd.html:180`) | **X**: "no comparison during the round" (spec:31). Agent's call | — | **X** |
| Two results ranked apart | K: short:13 | K: Hands and Hunch (round 6) | K: spec:68–69 | K | **D**: Hunch is 80 of 90 points from one 15-s read, ranked against 400 seeded players (G-02:46) |
| Half lands later | K: short:13 | K: team fixture at day close (3c:26–30) | **D**: "Fixed at finish" (spec:25) makes every result immediate. Only the duel close (spec:73) and the Hot Seat result (spec:27) wait. Agent's call, from G-00 review findings 24 and 61 | **L**: duel → G-04c, Hot Seat → G-04b (G-00:71–79) | **X**: nothing is unresolved at the Scorecard |
| Me against the world, sides | K: A11 The column | K: R3 House cup → fixtures → Mirror Duels (3d:34) | K: spec:72–73 | **L**: G-04c | **X**: "the world" is a seeded model |
| Social experiment | — | K: round 3 fact "Most people match colour before they check the angle" (`b-round3-crowd.html:165`); round 6 "People wait to see the marker arrive" (`b-round6-run.html:182`); Hot Seat, character, field report | **D**: fact lines "never from a claim about why" (spec:126; reviewer finding 36, fixed by the agent) | **L**: Hot Seat G-04b, Sunday G-04d | **X**: the facts come from a simulated crowd and are labelled as simulated |
| Novel rankings | — | K: 7-day reader rank, team table (3c:32–37) | K: Hunch, weekly table, Class Photo | **L**: G-04c, G-04d | **D**: one daily percentile, the same form as Perceptle's "beats N%" (teardowns T25) |

Whose calls. **His:** the five-game base is in his first brief, mode 2 (scan:3). He chose "Do the shared core with all four as interactions" (raw 15:12, 25 Nov). He rejected self-prediction (raw 15:43). He wrote the "not repeated 5 times" note. He signed R8. **The agent's:** applying "once" to every read, "no comparison during the round", fixed-at-finish, numbers-only fact lines, proposing R8, and not saying the cut left only the generic part (the agent's own words, G-02:87). **The method's:** `22`:41 sets G-02 as "five mini-games from one date seed" and `22`:43 makes everything else "one interaction layer per task", both written before the spec existed. Stages 5–7 of the studio skill never ran (`6-critique.md` and `7-playtest.md` are blank templates).

## 3. Why it reads as generic now (ranked)

1. **The card is Perceptle plus a coda.** T25: "five perceptual events a day, each about 20 seconds ... Count ... Two minutes. One score." The spec's own length estimate (spec:117, unmeasured, Hot Seat removed): events about 2 min out of about 2 min 45 s, about 73%. The two crowd reads take about 20 s, about 12%. Claim it (10 s) is about yourself. While you play, the crowd is absent by rule (spec:31). The spec named this risk and sent it to a clone critic that never ran: "The niche. Against Perceptle: its players see five tiny events and a percentile, and Count still overlaps its Count" (spec:220).
2. **The crowd is not real, so the game cannot teach anything about people.** 400 players are generated from the card's seed, each with a skill (G-02:46). Every fact is the agent's model, and every reveal says so. The rule against "why" lines (spec:126) is correct for a model, and it removed the lines that carried the "wow". Spec risk 1 predicted the result: "a fact that feels invented kills the 'wow'" (spec:218). Under the plan, the real crowd arrives only in G-03, after the phone step.
3. **Nothing rides on a read.** A read earns points toward a daily percentile. No named person, no team, nothing that lands later, nothing anyone else sees. Every part that carried stakes was deferred by R8: the Hot Seat, the duel and rope, the weekly table, the Sunday character (G-00:71–79). The one step with real stakes, Claim it (−2 × the gap), asks about yourself, the axis he rejected on 25 Nov. His words today: "low stakes rather tahn really interesting".
4. **The reads are chart-matching.** Spot it is a three-band tap (spec:38–44). Pour the sand fills a five-box histogram (spec:58–61). The concrete form, "which shape fooled the most people" (3b:8), survives only as the coarse doors. His words today: "the methods for crowd reading games aren't too interesting".
5. **The cut was signed without being seen as a cut.** R8 went to him as one of several items. He asked "What am i asnwering from" Is there a draft for me to see?" (raw 18:29), then signed everything at once: "Yes six is ok, names are fine, everything else is fine, continue" (raw 18:30; G-00:91). The proposal listed what each later layer would add. It did not say what the card would be without them.

**Where the claude.ai gap matters.** The 24 Nov plan and the Lovable prompt are not in the vault (`22`:33). They decide two questions: (a) whether "the shared core" meant the five minigames or the crowd read, which is the root of cause 1; and (b) what he meant by "our orignla alaysis of these games nad pyshology" and "our orignal discussion" (raw 15:43). Both: not found.

## 4. Crowd-reading forms never shown to him

The full list, grouped, one line each, is in the appendix below. "Shown" means drawn in a mock-up or named in `3-shortlist.md`, `3b-call-shortlist.md` or `3d-angles.md`. Counts: 36 of 72 in `2b`, 3 of 48 in `2c` (T8, L2, L6), and 25 lines in `2` that read the crowd's play (H04 and M01 were named only as skipped clones, short:3). Not ranked.

## 5. What would have to be true

Each is a test a design can be checked against.

1. **Delete test.** Remove every crowd screen. If what is left is a complete game, the design fails.
2. Within the first 60 seconds of a card, the player makes a decision whose right answer depends on other people, not on the screen.
3. At least half of the card's measured time is spent reading people, or the reading happens inside the events, not after them.
4. A read changes something besides a points total: a result a named or ranked other sees, a team, or a result that is still open when the Scorecard shows.
5. Every reveal states a fact about real people that testers believe. With a thin crowd, the design still works honestly, for example by reading yesterday's real crowd. Spec:218's test, run before the build is judged.
6. Read cold by someone who knows Perceptle, the one-line rules do not get the answer "so it's Perceptle with a quiz".
7. Something is unresolved when you close the card and brings you back to it (his "keeps you coming back", raw 15:53).
8. On simulated players, Hunch is close to independent of Hands, so a slow player can reach the top on reading alone.
9. The first build he plays contains at least the first three parts of section 1, even if crude.

## 6. The method

Lines 2 to 7 are added to `.method/candidates.md`. Line 1 is already there.

1. The look check, one word per screen, could not see a scope cut. Already a candidate (26 Nov).
2. `22`:41 and `22`:43 fixed the build order (generic base first, concept as layers) before the design existed. A first playable should hold what makes the game different, not what the others depend on technically.
3. The first gate ("one mini-game taken to matches") spent his first play on Stop's difficulty and button. The first slice taken to "matches" should be the step that makes the game different.
4. Studio stages 5–7 (prototype, the four critics, the playtest plan) were skipped between spec and code, though spec:219–220 sent two risks to them. Build should not start while an open risk names a stage that has not run.
5. Each round edited the last screen against his last note. No round restated the concept's parts, even after he said the USP "was cleraer at the start". Each shaping round should list the named parts and mark which this round keeps.
6. Every review was graded against the spec, so a loss of concept could not show up as a finding. Finding 36 removed the "why" lines. One review per shaping task should be graded against his first words.
7. A scope cut was signed in a batch. A cut should be asked alone, with a sentence on what the player will still feel.

## Appendix: never-shown crowd-reading ideas (ids from the three files)

**The crowd inside the event (read while playing)**
- QA11 Stop sweeps again as a crowd ghost; stop on the crowd's moment, not the notch
- QE08 Repeat cells glow where earlier players failed; call the day's most-missed step before playing
- QE06 Sort's blobs are the five events, sized by how many have failed each so far
- QE03 Watch an earlier player's Stop replay and tap where their marker will stop
- A10 Walls stand where yesterday's players crashed; where you crash may become tomorrow's wall
- L2 Heat of Five: before each event, call which of you and four fixed ghosts wins it
- E06 Watch three previous players' replays, pick the top one, then play
- O03 Guess the previous player's score from their silent replay, then play
- O11 Watch five strangers' runs with scores hidden, play, then order all six
- E10 Challenge one event's throne holder and call how many challengers you would survive

**The board comes back: where people broke**
- QA07 Tap the flash in the day's longest Repeat sequence where most players first broke
- QB07 Stop the replay at the length where half the crowd had dropped out
- QD08 Shade the nine Repeat tiles by each one's fail rate
- QK11 Trace the typical player's first three taps on the Pair board
- QD12 Place each Sort blob at the average slot players left it in (e.g. 2.6)
- L6 Watch a real player's finger hover over Pair; tap when they commit, say if they got it

**Read real individuals**
- QB04 Five real result cards: tap the exact middle player of the crowd
- QK09 Five ghost Repeat replays, taps only: strike out the four not in the top tenth
- H10 Two strangers' result grids: tap who finished higher
- M11 Judge two strangers' replays round by round, 10–9, before scores show
- A09 Match five strangers' result grids to the puzzle each came from
- E09 Catch the one score a previous player faked; fake one of yours for the next

**Compare events through the crowd**
- QA03 / QB01 Tap the event that floored the most players
- QA02 Raise five columns to the share who got each event clean
- QA10 Balance the five events on a seesaw weighted by how hard each was for the crowd
- QM10 Sheepdog: guide five sheep through gates from hardest event to easiest
- QK08 Order the events by how long people froze before their first touch
- QM07 Blind tasting: name which event each crowd histogram came from
- A08 Balance five tokens, each weighing the share who failed that game

**One crowd number, staged**
- QB02 / QD01 Slider: share who got Count exact / hit the Stop notch at least once
- QD02 Guess the crowd's average Count answer (scored to the crowd, not the truth)
- QD03 / QD04 / QD06 The median's Repeat length / Sort time / Pair time (hold the starter's pistol)
- QD05 Pin the crowd's average stopping point
- QB03 Drag a runner to where the average player's total landed
- QM01 Price Is Right: closest bid without going over, against four rival bids
- QM09 / M09 Curling stones onto the crowd's median / the share who beat a game
- QM11 Set nine fielders where the crowd's Stop taps will land
- E01 Slide to the median, knowing your own scores just moved it
- M05 Cut a loaf into the shares who got 5, 4, 3, 2, 0–1 right
- QK05 Split the Sort pie by kind of mistake
- A02 / A06 / A12 Bar to the crowd's typical result / rubber-line hump / find your own dot in everyone's cloud
- E12 Reshape a histogram that starts as the average of earlier drawings; scored at midnight

**Sub-crowds and patterns**
- QK07 Link each Count habit to the Stop habit it goes with
- QD09 The hour of day when players scored best on Stop
- QB12 Morning crowd against evening crowd: plant the rope's flag on the margin
- QB11 Pick the one newsletter headline that will be true by midnight
- T8 Call the margin of a fixture you are not in

**Strategy and markets**
- E05 Bet 100 chips on which event ends the day with the lowest average; prices move as people buy
- QE01 Guess each event's final average, seeing the running average of earlier guesses
- QE04 Drop your dot for the midnight median among earlier players' dots, visible to later ones
- A05 / H05 Play or pick the door, or game, the fewest others will choose
- A07 Tap which of four ghost routes most players drew
- C07 Build a gauntlet for tomorrow's players; score by how close its clear rate lands to 50%
- M04 Hold up a 0–10 card for how hard each event was; the panel's extremes are thrown off
- M12 Relay: run your leg, then call the next stranger's split
