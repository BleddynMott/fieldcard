---
paths:
  - "src/**"
  - "config/**"
  - "design/**"
  - "public/**"
  - "*.html"
  - "static/**"
  - "*.config.*"
---
# Interface work in Fieldcard

- Every colour, typeface, size, radius, spacing, shadow, line and duration is a `var(--…)` from `design/tokens.css`. Never write a raw value.
- Names, marks and colours of each game and step, and the state marks, are the ones in `design/DESIGN.md`. Do not invent new ones.
- The player is always `--you` yellow; everyone else is `--crowd`; event colours are never used for a state.
- Other players are "everyone" or "the crowd", never "readers". Every score shown has a sentence saying what it means.
- One job per screen: one question, one gesture, one reveal, one fact line built from the day's numbers.
- Run `bash scripts/design-check.sh` and paste its last line before saying the work is done.
- Do not restyle anything outside the task you are on.
