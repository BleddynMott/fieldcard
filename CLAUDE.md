<!-- method-lines:start v0 2026-11-25 -->
1. **Done (K01).** Say a change is done only with the output of the check named in its task, run on the real target, pasted or cited by run. If the check did not run, say "not run" and why.
2. **Replies (K03).** If you need me, end with a numbered list of exactly what I type, each with your recommendation. Stop only for something that cannot be undone or that I have not granted; otherwise write your ruling in the task file and carry on.
3. **Size (N01).** Before starting, state the size: trivial (do it, run the check), small (short design in chat, one review), project (interview, short spec, named checks, review), or spike (throwaway, labelled). Access rules, schema, sign-in and clinical logic are never trivial. Log any size I override.
4. **Review (K05).** After a small or project change, start one fresh-context review yourself; the reviewer runs CI's lines first. Later rounds read the fix diff only. Stop when a finding repeats or after round 3, and list what is left.
<!-- method-lines:end -->

## This project

- Fieldcard: a once-a-day phone game in a sports-day look. Build 1 of the build method. No stack yet; G-02 adds it.
- Each task is a file in `tasks/`, carrying the lines `Signed:`, `Merge:` and `User can now:`.
- Every colour, typeface, size, radius, spacing, shadow, line and duration value lives in `design/tokens.css` only.
- CI's lines: `bash scripts/ci-checks.sh`. Run them before any review and before saying a change is done.
- Stage files by name. `git add -A`, `.`, `*` and `-f` are refused by the secrets hook; so are credential-shaped strings.
- `.method/raw/` holds his prompts and is never committed.
