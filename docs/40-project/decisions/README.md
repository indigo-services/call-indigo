# Decisions — ADRs

**Kind:** index · **Owner:** the repo

One file per decision that is **expensive to reverse**. If reversing it is a one-line
change, it does not need an ADR — it needs a code comment.

| # | Decision | Status | Reversibility |
|---|---|---|---|
| [`0001`](./0001-evidence-based-documentation.md) | The repo wins, and the document is the bug | accepted | Expensive — it is the culture |
| [`0002`](./0002-client-side-admin-gate.md) | A client-side gate on `/admin`, and saying out loud what it is not | accepted | Expensive — it is the *shape* the demo rests on |
| [`0003`](./0003-localstorage-behind-an-async-seam.md) | `localStorage` behind an async API seam | accepted | Moderate — that is the point of the seam |
| [`0004`](./0004-numbered-documentation-domains.md) | Numbered documentation domains, audience-led | accepted | Cheap — but it invalidates every citation, so it is made once |

**Format:** [`../../00-meta/templates/adr.md`](../../00-meta/templates/adr.md).
**Convention:** four-digit numbers, **never renumbered**. A superseded ADR is marked
superseded and kept, not deleted — the record of *why* something was believed is worth
more than a tidy list.
