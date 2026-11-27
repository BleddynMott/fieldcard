# Fieldcard design

**Pick:** B, Sports day (25 Nov 2026, `PICK.md`). Picked screens: `directions/b-final-run.html`, which loads `tokens.css`. Every value lives in `tokens.css`; build code uses `var(--…)` only.

**The look in one line:** a school sports day on warm paper: thick ink outlines, chunky display type, buttons with a hard bottom edge, the lawn, the track, wooden doors, a pinned team photo.

## Names, marks, colours

| name | mark | colour token |
|---|---|---|
| Fieldcard | the sign board | `--ink` on `--chalk` |
| The Hot Seat | a figure on a chair | `--ink` |
| Stop · Count · Repeat · Pair · Sort | notch on a line · three dots · looped arrow · two rings · rising bars | `--stop` · `--count` · `--repeat` · `--pair` · `--sort` |
| Spot it | three doors | `--wood` |
| Read of the day | the weekday strip | `--sand` |
| Claim it | the flag | `--flag` |
| Scorecard (Hands, Hunch, Flag) | the two score tiles | `--hunch-bg` |
| Mirror Duel | the rope | `--rope` |
| The Class Photo | the pinned print | `--lawn` |

## State marks

- Right: ✓ on `--right` (also where your read matched the crowd). Wrong: ✗ on `--wrong`.
- You: `--you`, always: your figure, your flag, the step you are on, today in the weekday strip.
- Everyone else: `--crowd` in a reveal, `--figure` in the photo. Medals: `--gold`, `--silver`, `--bronze`.
- Event results during the round are plain ink: no colour for good or bad.
- Kits: `--kit-1` to `--kit-4` (navy, clay, teal, plum) dress Count's figures and Pair's shapes (G-02); never a state, a person or an event.
- Share text is words and numbers only: "Hands 57 · Hunch 82", "Flag 70, finished 57 · −26".

## Do

1. One job per screen: one question, one gesture, one reveal, one fact line.
2. Build every fact line from the day's numbers ("61% stopped late"). One line of why may follow it ("People wait to see the marker arrive"), in the "Why?" chip (G-00d).
3. Call other players "everyone" or "the crowd".
4. Outline cards, buttons, boards, doors and chips in `--line`; beads, bib dots and small marks in `--line-thin`; hard shadows from `--shadow-*`.
5. Show the step bar after the events, so the player knows which of the three reads they are on.

## Don't

1. Don't use the word "readers", or show any score without a sentence saying what it means.
2. Don't show more than four marks in one reveal: the truth, everyone's play, everyone's guesses, and you (your guess and your result). Build them in that order (G-00d).
3. Don't use an event colour for a state or a person, or `--right`, `--wrong` and `--you` for anything but their meaning.
4. Don't add a colour, typeface, size, radius, spacing, shadow, line or duration outside `tokens.css`.
5. Don't restyle a screen outside the task that owns it.

## Notes

- The mock-ups may write values literally. Every colour they use is in `tokens.css`; their sizes, radii and line widths round to the nearest token in the build, halfway values up. The token rule binds build code, checked by `design-check.sh` from G-01, which must skip `design/directions/`.
- Bowlby One and Outfit (400, 600, 800) are loaded from Google Fonts in the mock-ups; the build self-hosts them (G-02).
- Motion tokens were set by the agent, not taken from the still mock-ups; they are checked at the G-02 phone step.
- Figures, marks, doors and the photo are inline SVG. No image files.
