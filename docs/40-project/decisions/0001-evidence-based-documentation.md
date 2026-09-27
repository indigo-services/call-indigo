# ADR 0001 — The repo wins, and the document is the bug

**Kind:** dated · **Status:** accepted · **Date:** 2026-09-27 (formalised; practised
earlier) · **Deciders:** the repo

---

## Context

This codebase has an accurate *code* culture and, historically, an inaccurate
*documentation* one. The suite grew to triple digits and code was measured before it
was changed, while three documents in the tree asserted things that had stopped being
true weeks earlier.

The specific failures were not random. They were the same shape every time:

1. `CHANGELOG.md` claimed the Emergency card rendered on mobile. The markup gained
   `max-md:static`, but `index.css` still hid `.navy-box` with `display: none
   !important` below 991px — **the stylesheet won**, and the changelog could not see it.
2. `README.md` said `/admin` had no authentication. It had had a gate for a day. The
   guard that was supposed to catch that claim scanned **`src/` only** — and the README
   is not in `src/`.
3. Two documents stated `67 checks` for **60 checks' worth of releases**. The number had
   no command attached to it, so nothing failed when it drifted.

The common defect: **an assertion that cannot see the thing it claims to check passes
forever.**

## Decision

**Every claim in a document must be checkable, and where the repo and a document
disagree, the repo wins and the document is the bug.**

Three mechanisms make that enforceable rather than aspirational:

1. **[M] / [P] marking.** Every claim is either measured (with the path or command) or
   proposed (with an open question that carries a recommendation).
2. **A number carries its producer** — value, command, date, commit. See
   [`../../00-meta/conventions.md` §3](../../00-meta/conventions.md#3-a-number-carries-its-producer).
3. **Document kinds** — *derived* (generated), *dated* (carries `Last verified:`), or
   *living* (asserted by the suite). A living claim written as if it were dated is the
   defect this ADR exists to prevent.

## Consequences

**What this buys**

- A wrong document is a bug with a fix, not a matter of opinion.
- A disagreement about a number is settled by running the command.
- Stale claims **expire visibly** — a dated document shows its date, and a living one
  fails the build.

**What this costs**

- **Every document is more work to write.** A claim needs its evidence, and a table
  needs a command per row.
- **The suite owns more.** Some documents now fail the build, so a doc change can be a
  red gate — which is the point, and is also occasionally inconvenient.
- **It is a culture, not a tool.** Nothing stops someone writing a bare number; the ADR
  only makes it a named defect when it is found.

**What it forecloses**

- **Optimistic documentation.** "The docs are roughly right" is no longer an acceptable
  state.
- **A second copy of a fact.** *Keep one copy* is a consequence of this decision: the
  rule assumes there is one document to be wrong.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Documentation as prose, reviewed by reading** | This is what was already happening, and it produced three stale claims. Review does not catch a number that was right when it was written. |
| **Generate everything from the tree** | Not everything is derivable. The threat model, the *why* behind a rejection, and the record of what was tried are all judgement. |
| **Assert nothing; date everything** | A dated claim still requires a human to notice the date. Three of the four failures survived a release cycle. |

## Reversibility

**Expensive.** This is not a convention that can be dropped in one commit — it is the
rule the rest of the library is written against, and the mechanisms (the claim registry,
`tests/docs.mjs`, the templates) exist to serve it. Reversing it would leave those
asserting a rule nobody follows, which is worse than either state.
