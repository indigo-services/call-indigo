# ADR 0004 — Numbered documentation domains, audience-led

**Kind:** dated · **Status:** accepted · **Date:** 2026-09-27 ·
**Last verified:** 2026-09-27 at `2f009a2` · **Deciders:** the repo

---

## Context

`docs/` held six documents and no index. `docs/README.md` — the file a reader opens when
they want the index — was **not an index**: it was twelve sections of developer process.
Three of the six documents (`admin-gate.md`, `component-exceptions.md`, and both
`plan-*` files) were reachable **only by knowing they already existed**.

The documentation plan's Q1 asked whether the restructure was worth its churn:

> *"The repo has 6 documents. Six files do not need numbered domains; they need an
> index. The restructure earns its cost somewhere around 15–20 documents."*

By the time Phase 3 began, the count was **21 documents** — onboarding, architecture,
operations, project and sessions had all been written into the plan. The question had
answered itself, and the plan's own recommendation said to re-evaluate at exactly this
point.

## Decision

**Organise `docs/` into seven numbered domains, grouped by *who is reading*, with one
front door.**

```
docs/README.md              ← THE INDEX. Front door. Every doc, by domain and by question
docs/00-meta/               How the docs work
docs/10-onboarding/         Day one → first merged change
docs/20-development/        How to build here
docs/30-operations/         DevOps
docs/40-project/            Project management
docs/50-sessions/           The human/agent I/O protocol
docs/60-reference/          Look-it-up material
```

**The numbers force a stable sidebar order and let a new domain be inserted without
renaming anything.** They are not a hierarchy: nothing imports across domains, and a
domain references another by relative path.

**`PRD.md` and `CHANGELOG.md` do not move.** `PRD.md` is the founding spec that §16.2's
F-items are cited from across the tree; `CHANGELOG.md` is the release record and its
*path* is a convention (Keep a Changelog). Both gain a pointer from the index rather
than a relocation — relocating either would break every existing citation for no gain.

## Consequences

**What this buys**

- **One front door.** A reader who does not know the tree has exactly one file to open.
- **An audience-shaped tree.** "Which document answers my question?" is answerable from
  the directory name, which is the question a reader actually has.
- **`docs/README.md` becomes free** to be the index, and the developer standards move to
  `20-development/standards.md` with their section numbers unchanged — so a citation to
  `docs/README.md §5` still resolves by content, via a redirect table.

**What this costs**

- **Every existing citation into `docs/` is invalidated at once.** Measured: ~13
  citations across `README.md`, `CHANGELOG.md`, the reference docs and `standards.md`.
  This is the churn the plan's Q1 was worried about, and it is real.
- **A reader must learn the scheme.** Seven directories is a map to hold in your head.
- **The wiki regenerates.** Phase 4's output is a function of this structure, which is
  why Phase 4 depends on Phase 3.

**What it forecloses**

- **A flat `docs/`.** Adding a 22nd document to a flat directory is where the original
  problem started.
- **A `docs/README.md` that is also the standards.** The two roles are now separate
  files, and the redirect table is how the old citations survive.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Keep it flat, add an index** | Correct at 6 documents. At 21 the index becomes a wall of links with no grouping, and the reader still has to guess from a filename. |
| **Two-level without numbers** (`development/`, `operations/`, `project/`) | The plan's own fallback, for a tree under ~12 documents. The numbers are there to force sidebar order — and 21 files in five unnumbered groups is where that starts to matter. |
| **Move `PRD.md` and `CHANGELOG.md` into `docs/`** | Breaks every citation to them, for a tidier tree. The plan's rule is to make the change that has a payoff, not the one that is symmetrical. |
| **One document per domain, kept short** | The domains answer different questions; merging them produces a document nobody finishes. |

## Reversibility

**Cheap to do, expensive to undo — which is why it is made once, deliberately.**

Moving files back is a `git mv`. What is *not* cheap is that every citation written
between now and then assumes this structure, and the wiki is generated from it. The plan
handles this with a **redirect table in `docs/README.md`** mapping the old
`docs/README.md §n` citations to their new homes — so the change is made once, with a
plan, rather than opportunistically.

**This is the reason the restructure was Phase 3 and not Phase 1.** Phase 1 was
deliberately small *because* this change invalidates citations: a corrections pass
should not move the files it is correcting.
