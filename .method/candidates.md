# Method candidates

Proposals to change the build method, noticed while building. One line each: date, what happened, what might change. A candidate needs a second session before it is proposed (`24 Proposal route.md`, ruling 3).

- 2026-11-25, G-00: the look took six rounds of picking against the plan's two; the extra rounds were spent on the game's core step, not the look. Candidate: let a shaping task re-open its stage-3 pick without counting against the look's round limit.
- 2026-11-25, G-00: fresh-context review found 72, 30 and 24 findings on a design task, with real faults in every round, including faults introduced by fixes. Candidate: none yet; evidence for keeping review rounds on design work.
- 2026-11-25, G-01: testing 'the hook blocks when its script is missing' locked the session out of Bash, Write and Edit until a scheduled restore fired, minutes late. Candidate: run that test in a throwaway copy of the repository, or with the restore outside the agent's process.
- 2026-11-25, G-01: K04 item 7 needed InstructionsLoaded, which the capture's nine events lack. Candidate: add InstructionsLoaded to mechanisms/settings.capture.json.
- 2026-11-26, G-01: three copied test fixtures (block-secrets.test.sh, pre-commit.test.sh in the delivery-workflow assets; test_capture.sh in mechanisms/) hold literal credential shapes, so a repository with the pre-commit hook refuses its own first commit. Candidate: assemble every fixture from parts at the source.
