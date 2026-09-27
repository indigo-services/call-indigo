# 40 — Project: management, roadmap, decisions

Where the work is tracked. Everything in this domain is **dated** — it describes an
intention at a moment, not a fact about the tree.

| Document | Kind | Answers |
|---|---|---|
| [`roadmap.md`](./roadmap.md) | dated | The five phases, their releases, and their exit criteria |
| [`tasks.md`](./tasks.md) | dated | **The live punch list** — client items T2/T5–T7, and PRD §16.2's F1–F12 |
| [`artifacts.md`](./artifacts.md) | dated | Where generated things live, and what may be deleted |
| [`client-disclosure.md`](./client-disclosure.md) | dated | **The client-facing full disclosure** — the unabridged position, for an audience that will not read this library |
| [`prd/`](./prd/) | dated | One PRD per phase — `phase-1` … `phase-5` |
| [`plans/`](./plans/) | dated | Client-feedback plans and the documentation refactor plan |
| [`decisions/`](./decisions/) | dated | ADRs — one file per decision that is expensive to reverse |

---

## 1. The two numbering schemes — read this first

> ⚠️ **There are two unrelated `T`-numbering schemes in this repository, and they
> collide.** This is a documentation hazard, not a feature.

| Scheme | Where it comes from | What `T2` means |
|---|---|---|
| **The client punch list** | `CHANGELOG.md` §"Client punch list v1.0.1", and the round-2/3 plan documents | *"Each service icon has a stack issue with the color"* — a client request awaiting a decision |
| **A phase PRD's tasks** | `40-project/prd/phase-N-*.md` §"Exit criteria" | That phase's own second task, unrelated to the client's |

**When you see `T2` in this domain, check which document you are in.** The client
punch list is the one that needs the client; the phase tasks are ours.

**A future cleanup should rename the phase tasks to `P1-T2` form.** Not done here,
because renaming them would invalidate the cross-references the phase PRDs already
make to each other.

## 2. The two F-numbering schemes

The same hazard, smaller: `PRD.md` §16.2 has **F1–F12**, and the documentation
refactor plan has its own **F1–F10** findings (`plan-docs-refactor-2026-09-27.md` §2).

| Scheme | What `F1` means |
|---|---|
| **PRD §16.2** | *"Authentication — login, session, route guard"* — deferred product work |
| **The docs plan §2** | *"The root README says there is no authentication. There is."* — a documentation defect |

**Context is the only disambiguator.** When citing, write *"PRD §16.2 F1"* or *"docs-plan F1"*.

## 3. What is live right now

| | |
|---|---|
| **Product version** | v2.0.rc1 (`package.json`) |
| **The build exceeds its own PRD** | The dashboard implements pages §9.3 marked as mockups. Reconciled in [`../60-reference/dashboard-scope.md`](../60-reference/dashboard-scope.md) |
| **Open client items** | **T2, T5, T6, T7** — each needs a decision from the client, not code |
| **Closed client items** | T3 (shipped), T4 (closed *for the prototype* — a public launch still needs real ToS/Privacy text) |
| **Open engineering** | PRD §16.2 F1, F2, F3, F4, F5, F7, F8, F9, F10, F12 |
| **Landed since the PRD** | **F6** — every sidebar page the PRD called a mockup is now a real page. **F11** — closed |
| **The docs milestone** | Phases 1–5 — see [`roadmap.md`](./roadmap.md) |
