# Patterns

**Kind:** living · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

Each pattern below exists because the repo has **already paid** for its absence. The
`Kills` column names the anti-pattern; the `Paid for it` column says where.

---

## P1 — A guard is negative-controlled, or it is not a guard

**Kills:** an assertion that cannot see the thing it claims to check.

Run the check against a fixture that **contains** the defect and confirm it fails.
Only then trust it on a clean tree.

> A test that only shows the NEW code passing cannot tell a real fix from a vacuous
> one. **Assert the OLD formula FAILS the same cases.**

**Paid for it — three times.** The recurring defect of this codebase, named in the
memory as *"an assertion that cannot see the thing it claims to check passes
forever"*:

| # | The guard | What it could not see |
|---|---|---|
| 1 | The `v1.0.1` mobile-card claim | The card was hidden by a CSS rule in a *different* layer than the one the guard read |
| 2 | The in-`src/` authentication scanner | `README.md` — the scanner's scope was `src/`, so the one document that said "there is no authentication" was outside it |
| 3 | `tests/docs.mjs`'s own link check | *See P2 — this one is live and is the reason the check is written the way it is.* |

**The practical form:** every check in `tests/docs.mjs` and `tests/policy.mjs` has a
comment naming the fixture it was verified against. If you add a check without one,
you have added a claim, not a guard.

## P2 — A count is asserted, never described

**Kills:** a number that goes stale silently.

A suite returning `[]` for everything "passes". Assert an **exact count**, and pair
every negative check with a positive one.

```
✗  check("no orphan docs", () => orphans.length === 0 ? [] : …)
✓  check("no orphan docs", () => orphans.length === 0 && docs.length === 21 ? [] : …)
```

**Why the positive half matters:** if the file-globbing silently returns nothing —
a moved directory, a changed extension, a typo'd path — the negative check is
vacuously satisfied and reports success on a tree it never looked at. The positive
count is what catches that.

**Paired rule — scan `clean`, not `html`, for "the asset is gone" checks.** The
rendered `html` string still contains the markup; only the sanitised `clean` output
reflects removal.

**Paired rule — a new element can silently break an existing check by matching its
selector.** When that happens, **tighten the old check; never loosen the new one.**

## P3 — A number carries its producer

**Kills:** the bare number.

> **`<value>` checks** — `npm run test:only`, `<date>`, at `<sha>`.

Value, command, date, commit. A reader can re-run it; a reviewer can watch it expire.
See [`../00-meta/conventions.md` §3](../00-meta/conventions.md#3-a-number-carries-its-producer).

**A living document states no value at all** — it has no date to expire it, and naming a
producer beside the number does not save it, it only makes it look verified. This file
carried one for a milestone after it had stopped being true; `tests/docs.mjs` check 8 now
rejects the form outright.

**Paid for it:** two documents stated `67 checks` for 60 checks' worth of releases,
because the number had no producer attached and nothing failed when it drifted.

## P4 — Measure the claim before changing anything

**Kills:** arithmetic standing in for a render.

- **Arithmetic gives the margins; a crop says what the edge cuts.** Measuring an
  overlay over a photo means converting the band through the photo's **rendered**
  width, not its natural one — and passing the band's **top**, not its centre.
- **A sheet scaled to fit is a poor instrument for a crop.** A full-page screenshot
  scaled down hides exactly the misalignment you are looking for.
- **Do not detect a text wrap by comparing rect `top`s.** An `inline-block` is
  baseline-aligned, so its `top` differs from its neighbour's without wrapping.
  **Delete the suspect node and re-measure.** (Measured: the rotating word never
  wrapped; its *trailing period* did.)
- **Arithmetic is permission to render, never a decision.**

## P5 — Two layers can describe one behaviour, and the CSS wins

**Kills:** believing a class string, or a changelog, over the cascade.

The hero's Emergency card carried `max-md:static` while `index.css` at ≤991px set
`.navy-box` to `display: none`. The card therefore never appeared on a phone — and
`CHANGELOG.md` claimed it did.

**Grep both layers before believing either.** A Tailwind class in JSX and a media
query in `index.css` are two independent sources of truth about the same box, and the
one with higher specificity is the one that is real.

**One level up:** this is P1's shape again. The changelog's claim could not see the
CSS, so it passed.

## P6 — Touch a seam, not a call site

**Kills:** a change that reaches past the isolation it was given.

The four seams are [`architecture.md`](./architecture.md)'s subject. The rule in one
line: **if you find yourself editing more than one file to change one decision, you
have found a missing seam or broken an existing one.**

The specific prohibitions:

- A page importing `@/lib/data/backend` instead of `api`.
- A component declaring a brand hex instead of reading a token from `src/index.css`.
- A shadcn token mapped inside a component instead of in `:root`.
- A legal or brand string edited in `chrome-markup.ts` by hand — it is **generated**.

## P7 — The chrome is four copies

**Kills:** the assumption that a shared component is shared.

`SiteChrome.tsx` composes the chrome, but the three marketing pages carry their own
`BODY_HTML` copy of it. **A change in `chrome.ts` reaches one page of four.**

The verification: after changing chrome, check **all four** routes — `/`,
`/residential`, `/commercial`, `/contact` — and check the *generated*
`chrome-markup.ts` if you touched a brand or legal string.

## P8 — Two commits: the change, then the paperwork

**Kills:** a changelog entry that cannot cite what it describes.

1. The change commit — `feat(…)`, `fix(…)`, `docs(…)`. **Must not touch
   `CHANGELOG.md`.**
2. A separate `docs(changelog)` commit that records it and **cites the first commit's
   SHA**.

Commits go straight to `main`. The PR flow is documented in
[`standards.md` §4](./standards.md#4-pr-flow) and CI enforces the gates, but the
two-commit paperwork is what this repo actually practises.

## P9 — Edit one file sequentially

**Kills:** a silent lost write.

**Never batch parallel edits to the same file.** Each call reads, applies, writes;
concurrent writes race, and the last writer wins with the base *it* read — while every
call reports success.

**The race is on the FILE write, not the text region.** Measured: two edits to
*non-overlapping* regions of one file, in one message — the first was silently lost,
and the script then threw a `ReferenceError` at runtime.

Edit sequentially, then re-grep to confirm each change actually applied. Parallel
edits to *different* files are fine.

## P10 — Write bytes with an explicit newline

**Kills:** a whitespace diff that buries the real change.

A script writing text must pass `newline="\n"` and be verified by **counting bytes**,
not matching lines:

```bash
tr -cd '\r' | wc -c        # ✓ count bytes
grep -c $'\r'              # ✗ an unexpanded $'\r' is an EMPTY pattern — matches every line
```

Measured: a CRLF audit using `grep -c` reported 46/44/187/232 "CR lines" in blobs
containing **zero** CR bytes.

`.gitattributes` enforces `* text=auto eol=lf`, so the repo is LF everywhere. The
audit that proves it counts bytes.

---

## The anti-pattern list, in one table

| Don't | Because | Instead |
|---|---|---|
| Write a bare number | It cannot expire | Attach the producer (P3) |
| Assert only the new value | A vacuous check looks identical | Assert the old one fails too (P1) |
| `length === 0` as the only assertion | A broken glob passes | Pair it with an exact count (P2) |
| Compare rect `top`s to detect a wrap | `inline-block` is baseline-aligned | Delete the node and re-measure (P4) |
| Trust a class string | The CSS may contradict it | Grep both layers (P5) |
| Edit a call site | The seam existed for a reason | Touch the seam (P6) |
| Change `chrome.ts` and check home | It reaches one page of four | Check all four routes (P7) |
| Commit the changelog with the change | The entry cannot cite a SHA | Two commits (P8) |
| Parallel edits to one file | The write races; both report success | Sequential, then re-grep (P9) |
| `grep -c $'\r'` | An empty pattern matches everything | `tr -cd '\r' \| wc -c` (P10) |
