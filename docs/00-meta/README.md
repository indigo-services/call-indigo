# 00 — Meta: how the documentation works

**This domain is about the documentation, not the product.** Read it if you are
writing or reviewing a document; skip it if you are trying to build something.

| Document | Kind | Answers |
|---|---|---|
| [`conventions.md`](./conventions.md) | living | The evidence rule, document kinds, front-matter, naming, the freshness contract |
| [`doc-map.md`](./doc-map.md) | derived | Every document: domain, owner, kind, last-verified signal |
| [`claims.json`](./claims.json) | derived | The claim registry — every asserted number, with the command that produces it |
| [`templates/`](./templates/) | — | `plan.md` · `prd.md` · `adr.md` · `runbook.md` · `devlog.md` |

---

## The one rule

> **Every claim in a document must be checkable, and where the repo and a document
> disagree, the repo wins and the document is the bug.**

That rule is inherited from [`../20-development/standards.md` §1](../20-development/standards.md#1-evidence-based-development)
and it is the whole reason this domain exists. The rule has been broken four times
in this repo's history, always in the same shape:

| # | The defect | Where |
|---|---|---|
| 1 | A guard could not see the thing it claimed to check | the `v1.0.1` mobile-card claim in `CHANGELOG.md` |
| 2 | A number had no producer attached, so it stayed wrong for 60 checks | `README.md`, `docs/README.md` |
| 3 | A file contradicted itself 50 lines apart | `docs/README.md` §4 vs §5 |
| 4 | A code comment described behaviour the router does not have | `src/admin/routes.ts` |

The remedy for #2 is [`conventions.md` §3](./conventions.md#3-a-number-carries-its-producer);
the remedy for #1 and #4 is the **negative control** — a check that is run against a
fixture containing the defect and confirmed to fail. A check that only ever sees the
correct input cannot tell a real fix from a vacuous one.

## The freshness contract

Every document declares one of three **kinds**, and the kind determines how it can go
wrong ([`conventions.md` §2](./conventions.md#2-declare-the-documents-kind)):

- **Derived** — generated from the tree. Cannot be wrong; it can only be stale, and
  staleness is visible because regenerating changes the file.
- **Dated** — hand-written, carries `Last verified:` with a date and a commit. Goes
  stale **visibly**.
- **Living** — hand-written and asserted by the suite. Fails the build when it drifts.

**A living claim written as if it were dated is how this library got into trouble.**
A claim with no date and no assertion can be wrong forever without anyone noticing —
which is precisely what happened to the check count.
