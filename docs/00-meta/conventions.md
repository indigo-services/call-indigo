# Documentation conventions

**Kind:** living · **Owner:** the repo · **Asserted by:** `tests/docs.mjs`

The rules for writing a document in this repository. They are short because they are
the ones that have actually been broken.

---

## 1. Every claim is checkable

Inherited from [`../20-development/standards.md` §1](../20-development/standards.md#1-evidence-based-development).

- **[M] — measured.** Read out of this workspace. Carries the path or the command.
- **[P] — proposed.** Does not exist yet. Always carries an open question, and the
  question carries a recommendation.

> Where the repo and this document disagree, **the repo wins and the document is the
> bug.**

## 2. Declare the document's kind

Every document opens with a one-line front-matter block:

```
**Kind:** derived | dated | living · **Owner:** … · **Last verified:** YYYY-MM-DD at <sha>
```

| Kind | Rule | What goes wrong | Examples |
|---|---|---|---|
| **Derived** | Generated from the tree by a script. Never hand-edited. Regenerating is the only way to change it. | It goes *stale*, visibly — regenerating produces a diff. | [`../60-reference/routes.md`](../60-reference/routes.md), [`doc-map.md`](./doc-map.md), [`claims.json`](./claims.json), the [wiki](https://github.com/indigo-services/call-indigo/wiki) |
| **Dated** | Hand-written. Carries `Last verified:` with a date and a commit. | It goes stale **visibly** — a reader can see the date. | [`../60-reference/admin-gate.md`](../60-reference/admin-gate.md), every `plan-*` and `prd/*` |
| **Living** | Hand-written, asserted against the tree by a check. | It **fails the suite**. Drift is a red build, not a surprise. | `README.md`'s status block, [`../20-development/standards.md`](../20-development/standards.md), this file |

**A `living` claim that is written as if it were `dated` is the defect this whole
system exists to prevent.** It has no date, so it never looks stale, and no
assertion, so it never fails. Two documents in this repo stated `67 checks` for 60
checks' worth of releases for exactly that reason.

**The `Last verified:` line is mandatory for `dated` documents** and is checked by
`tests/docs.mjs`. A dated document without one is a living document pretending to be
safe.

## 3. A number carries its producer

> **`<value>` checks** — `npm run test:only`, `<date>`, at `<sha>`.

Never a bare number. Three components, all required:

| Component | Why |
|---|---|
| **The value** | the claim |
| **The command** | so a reader can re-run it |
| **The date and commit** | so a reviewer can see the claim expire |

A reader can re-run the command. A reviewer can see when the claim was last true.
This is `standards.md` §1 applied to a count, and it is the only form of the claim
that survives a release.

**Corollary 1 — the fix for a stale number is not to write the new number.** Writing
the current value dates the defect; the next round makes it wrong again. The fix is to
attach the producer so the claim is self-invalidating, and — where the value is
load-bearing — to assert it ([`claims.json`](./claims.json), `tests/docs.mjs`).

**Corollary 2 — a *living* document states no value at all.** It has no date to expire
it, so a count in it is a claim about *now* that nothing can catch — and **naming a
producer does not save it**, it only makes it look verified. Measured 2026-09-27: this
file and [`patterns.md`](../20-development/patterns.md) both asserted a count beside
`npm run test:only` for a milestone after it had stopped being true. `tests/docs.mjs`
check 8 now rejects a count in a living document outright. Point at the command instead.

## 4. Keep one copy

If a fact is stated in two documents, one of them **links** to the other. Never
restate.

This is not tidiness. The founding rule — *the repo wins, the document is the bug* —
assumes there is **one** document to be wrong. Two copies means two things to keep in
step, and the second one is always the one that rots.

The practical test: if you are about to write a table that already exists somewhere,
write a link instead. `CONTRIBUTING.md` is the worked example — it is 66 lines of
pointers and contains almost no content of its own.

## 5. Naming

| Thing | Convention | Example |
|---|---|---|
| A domain | `NN-name/`, two digits, audience-led | `20-development/` |
| A domain index | `README.md` inside the domain | `30-operations/README.md` |
| A plan | `plan-<topic>-<YYYY-MM-DD>.md` | `plan-client-feedback-2026-09-26.md` |
| A PRD | `phase-<n>-<slug>.md` | `phase-2-repo-standards-and-ci.md` |
| An ADR | `NNNN-<slug>.md`, four digits, never renumbered | `0001-evidence-based-documentation.md` |
| A devlog entry | `YYYY-MM-DD.md`, one per substantive session | `2026-09-27.md` |
| A template | `<kind>.md` in `00-meta/templates/` | `templates/adr.md` |

**Why the numbers on domains.** They force a stable sidebar order and let a new domain
be inserted without renaming anything. They are *not* a hierarchy — nothing imports
across domains, and a domain is free to reference another by relative path.

## 6. Links

- **Relative links only** for anything inside the repo. An absolute
  `https://github.com/.../blob/main/...` link breaks on a branch, a fork, and the
  wiki.
- **Every link is checked** by `tests/docs.mjs` against the working tree. A link to a
  file that does not exist fails the suite.
- **A link into the wiki is not a link into the repo.** The wiki is derived
  ([`../60-reference/`](../60-reference/README.md) P4); link to it only to *offer* the
  rendered form, never as the only path to a fact.

## 7. The templates

Five templates live in [`templates/`](./templates/). Use them; do not invent a shape.

| Template | Use for | Key sections |
|---|---|---|
| [`plan.md`](./templates/plan.md) | A piece of work with a scope and a risk | Evidence · Findings · Plan · Risks · Open questions (each with a recommendation) · Definition of done |
| [`prd.md`](./templates/prd.md) | A release | Problem · Scope (in/out) · Requirements with acceptance criteria · Non-goals · Open questions |
| [`adr.md`](./templates/adr.md) | An irreversible decision | Context · Decision · Consequences · Alternatives rejected · Reversibility |
| [`runbook.md`](./templates/runbook.md) | A procedure under pressure | Trigger · Preconditions · Steps · Verification · Rollback · What to tell people |
| [`devlog.md`](./templates/devlog.md) | A session | What was asked · What was measured · What changed · What was tried and abandoned · What is next |

**The one section people skip and should not** is *what was tried and abandoned*. It is
the expensive thing to rediscover, and it is the only part of a session that the
`CHANGELOG.md` and the git log cannot reconstruct.

---

**Last verified:** 2026-09-27 at `2f009a2`
