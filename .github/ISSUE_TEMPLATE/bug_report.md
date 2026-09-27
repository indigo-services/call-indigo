---
name: Bug report
about: Something behaves differently from what the documentation says it does
title: ""
labels: bug
assignees: ""
---

<!--
  Read this first: this project's rule is that a claim is only worth making if it is
  checkable (docs/20-development/standards.md §1). A bug report is a claim, so the
  fields below are the evidence, not ceremony.
-->

## What happens

<!-- Observed behaviour. -->

## What should happen

<!--
  Expected behaviour, AND where that expectation comes from — a document, a section of
  the PRD, a screenshot, or a client instruction. If it comes from nowhere, say so:
  "I expected X but nothing states X" is a valid and useful report.
-->

## Where

| | |
|---|---|
| Route | `/` · `/residential` · `/commercial` · `/contact` · `/admin/…` |
| Viewport | <!-- e.g. 1920 / 1440 / 1199 / 991 / 768 / 390 --> |
| Browser | |

## How to reproduce

1.
2.
3.

## Is it covered by the suite?

- [ ] I ran `npm test` — it passes, so this is something the suite **cannot see**
      (layout, animation, the sign-in gate, dashboard CRUD — see
      `docs/20-development/testing.md` for the list)
- [ ] I ran `npm test` — it **fails**, and the failure output is below
- [ ] I did not run it

```
<!-- paste relevant output -->
```

## Does the documentation already describe this?

<!--
  A bug may be a document that is wrong rather than code that is wrong — the repo wins,
  and the document is the bug (docs/20-development/standards.md §1). If a doc and the
  build disagree, say which one you believe and why.
-->
