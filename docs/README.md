# Documentation — the index

**Kind:** index · **Owner:** the repo · **Asserted by:** `tests/docs.mjs`

**This is the front door.** If you are looking for a document and do not know its name,
start here.

This repository's engineering culture is evidence-based (`20-development/standards.md`
§1): every claim in a document must be checkable, and where the repo and a document
disagree, **the repo wins and the document is the bug**. This index is the map of where
those claims live.

| | |
|---|---|
| **Library** | `docs/` — **57 documents**, in seven numbered domains |
| **Front door** | this file |
| **Start here instead if you are new** | [`../README.md`](../README.md) at the repo root |
| **Read it as a website** | [**The project wiki**](https://github.com/indigo-services/call-indigo/wiki) — this directory, rendered. **A mirror: edit here, never there.** |
| **Every document, by kind** | `00-meta/doc-map.md` — generated |

---

## 0. Five ways in

If you only read five things, these are the five, in order:

1. `20-development/standards.md` §1 — the evidence rule, which governs everything else.
2. `20-development/patterns.md` — ten traps this repo has already paid for.
3. `20-development/architecture.md` — the four seams.
4. `40-project/tasks.md` — what is actually open.
5. `30-operations/deployment.md` — how it ships, and the author gate.

*(These are code spans, not links, on purpose: every document is linked **exactly once**
in §1 below, and `tests/docs.mjs` fails if that stops being true.)*

---

## 1. The library

**Every document under `docs/`, by domain.** The *Kind* column is what the document
declares for itself — see `00-meta/conventions.md` §2.

### 00 — Meta: how the documentation works

| Document | Kind | Answers |
|---|---|---|
| [`00-meta/README.md`](./00-meta/README.md) | index | What this domain is, and the one rule it exists to serve |
| [`00-meta/conventions.md`](./00-meta/conventions.md) | living | The evidence rule, the document kinds, naming, the freshness contract |
| [`00-meta/doc-map.md`](./00-meta/doc-map.md) | derived | Every document with its kind — **generated** from each document's own front matter |
| [`00-meta/claims.json`](./00-meta/claims.json) | derived | **The claim registry** — every asserted number, with the command that produces it |
| [`00-meta/docs-butler.md`](./00-meta/docs-butler.md) | living | The docs butler — visual asset agent specification |
| [`00-meta/templates/plan.md`](./00-meta/templates/plan.md) | template | A plan: findings, phases, risks, open questions with recommendations |
| [`00-meta/templates/prd.md`](./00-meta/templates/prd.md) | template | A release: problem, scope, requirements with acceptance criteria |
| [`00-meta/templates/adr.md`](./00-meta/templates/adr.md) | template | A decision that is expensive to reverse |
| [`00-meta/templates/runbook.md`](./00-meta/templates/runbook.md) | template | A procedure for a person under pressure |
| [`00-meta/templates/devlog.md`](./00-meta/templates/devlog.md) | template | A session, including what was tried and abandoned |

### 10 — Onboarding: day one to first merged change

| Document | Kind | Answers |
|---|---|---|
| [`10-onboarding/README.md`](./10-onboarding/README.md) | index | The product in one paragraph, and the four things a new reader assumes and should not |
| [`10-onboarding/setup.md`](./10-onboarding/setup.md) | living | Clone → dev server → all four gates green. Includes the five most common failures |
| [`10-onboarding/glossary.md`](./10-onboarding/glossary.md) | living | The product words, and the words that are local to this repo |

### 20 — Development: how to build here

| Document | Kind | Answers |
|---|---|---|
| [`20-development/README.md`](./20-development/README.md) | index | What this domain is, and the three things that break most often |
| [`20-development/standards.md`](./20-development/standards.md) | living | **The rules.** Evidence, branches, commits, PR flow, gates, component policy, file layout, release process, pitfalls |
| [`20-development/architecture.md`](./20-development/architecture.md) | living | The four seams: routing, the data layer, the chrome, the auth gate |
| [`20-development/patterns.md`](./20-development/patterns.md) | living | The house patterns, and the anti-pattern each one kills |
| [`20-development/testing.md`](./20-development/testing.md) | living | How the verification suite works, and **what it cannot see** |
| [`20-development/design-tokens.md`](./20-development/design-tokens.md) | living | `src/index.css` in full: palette, scrims, per-page primaries, the contrast bars |
| [`20-development/css-pipeline.md`](./20-development/css-pipeline.md) | living | Tailwind v4, the preflight drift, and why a parity failure is usually 1–2px |

### 30 — Operations: DevOps

| Document | Kind | Answers |
|---|---|---|
| [`30-operations/README.md`](./30-operations/README.md) | index | The short version of how this ships |
| [`30-operations/deployment.md`](./30-operations/deployment.md) | dated | Vercel, the SPA rewrite, the **deploy-author gate**, and how to prove a deploy shipped |
| [`30-operations/environments.md`](./30-operations/environments.md) | dated | Local / preview / production, and what genuinely differs |
| [`30-operations/observability.md`](./30-operations/observability.md) | dated | What we can see, what we cannot, and why there is no analytics |
| [`30-operations/runbook-incident.md`](./30-operations/runbook-incident.md) | dated | The site is wrong, down, or serving something unintended |
| [`30-operations/security.md`](./30-operations/security.md) | dated | The posture index, and the six gaps ranked |

### 40 — Project: management, roadmap, decisions

| Document | Kind | Answers |
|---|---|---|
| [`40-project/README.md`](./40-project/README.md) | index | **The two `T`-numbering schemes that collide**, and what is live right now |
| [`40-project/roadmap.md`](./40-project/roadmap.md) | dated | The five documentation phases, and PRD §16.2's F1–F12 |
| [`40-project/tasks.md`](./40-project/tasks.md) | dated | **The live punch list** — client T2/T5–T7, plus the engineering tasks |
| [`40-project/artifacts.md`](./40-project/artifacts.md) | dated | Where generated things live, and what may be deleted |
| [`40-project/client-disclosure.md`](./40-project/client-disclosure.md) | dated | **The client-facing full disclosure** — what was built, what it does with visitor data, what is licensed from whom, and what is still open |
| [`40-project/proposal-backend-and-lead-handling-2026-09-29.md`](./40-project/proposal-backend-and-lead-handling-2026-09-29.md) | dated | **The client-facing proposal** — a real backend and multi-form lead handling ($1,000), with an optional product/service checkout ($1,500); scope, price, risks, acceptance criteria |
| [`40-project/decisions/README.md`](./40-project/decisions/README.md) | index | The ADR index and its convention |
| [`40-project/decisions/0001-evidence-based-documentation.md`](./40-project/decisions/0001-evidence-based-documentation.md) | dated | Why the repo wins over the document |
| [`40-project/decisions/0002-client-side-admin-gate.md`](./40-project/decisions/0002-client-side-admin-gate.md) | dated | Why the gate is client-side, and what it is not |
| [`40-project/decisions/0003-localstorage-behind-an-async-seam.md`](./40-project/decisions/0003-localstorage-behind-an-async-seam.md) | dated | Why `api.ts` is async over a synchronous backend |
| [`40-project/decisions/0004-numbered-documentation-domains.md`](./40-project/decisions/0004-numbered-documentation-domains.md) | dated | Why this directory is numbered, and what it cost |
| [`40-project/prd/phase-1-truth-and-index.md`](./40-project/prd/phase-1-truth-and-index.md) | dated | **v2.0.rc2** — make the docs true, give `docs/` a front door |
| [`40-project/prd/phase-2-repo-standards-and-ci.md`](./40-project/prd/phase-2-repo-standards-and-ci.md) | dated | **v2.1.0** — `.github/`, hygiene files, the gates enforced on PR |
| [`40-project/prd/phase-3-docs-library.md`](./40-project/prd/phase-3-docs-library.md) | dated | **v2.2.0** — the numbered-domain library, fully populated |
| [`40-project/prd/phase-4-wiki-publication.md`](./40-project/prd/phase-4-wiki-publication.md) | dated | Continuous — the wiki, generated from this directory |
| [`40-project/prd/phase-5-observability-and-automation.md`](./40-project/prd/phase-5-observability-and-automation.md) | dated | Continuous — freshness assertions, link checks, a deploy log |
| [`40-project/plans/plan-docs-refactor-2026-09-27.md`](./40-project/plans/plan-docs-refactor-2026-09-27.md) | dated | The refactor: findings F1–F10, target structure, five phases |
| [`40-project/plans/plan-client-feedback-2026-09-25.md`](./40-project/plans/plan-client-feedback-2026-09-25.md) | dated | Round-2 client feedback: plan, evidence, risks, outcome |
| [`40-project/plans/plan-client-feedback-2026-09-26.md`](./40-project/plans/plan-client-feedback-2026-09-26.md) | dated | Round-3 client feedback: plan and evidence |

### 50 — Sessions: the human/agent I/O protocol

| Document | Kind | Answers |
|---|---|---|
| [`50-sessions/README.md`](./50-sessions/README.md) | index | Why the devlog exists, and what it is not |
| [`50-sessions/protocol.md`](./50-sessions/protocol.md) | living | How a session starts, and **what it must leave behind** |
| [`50-sessions/agent-io.md`](./50-sessions/agent-io.md) | living | The contract: inputs, outputs, artifact paths, and the four rules agents get wrong |
| [`50-sessions/devlog/2026-09-27.md`](./50-sessions/devlog/2026-09-27.md) | dated | The documentation milestone — including what was tried and abandoned |

### 60 — Reference: look-it-up material

| Document | Kind | Answers |
|---|---|---|
| [`60-reference/README.md`](./60-reference/README.md) | index | What this domain is, and why `routes.md` is the odd one out |
| [`60-reference/routes.md`](./60-reference/routes.md) | derived | Every route, its page file and its line count — **generated** |
| [`60-reference/data-layer.md`](./60-reference/data-layer.md) | dated | `api → backend → localStorage` in full: surface, namespace, seed, failure modes |
| [`60-reference/admin-gate.md`](./60-reference/admin-gate.md) | dated | The gate: threat model, rotation, verification, risk register |
| [`60-reference/dashboard-scope.md`](./60-reference/dashboard-scope.md) | dated | Where the build departs from `PRD.md` §5.2 / §9.1, and why |
| [`60-reference/component-exceptions.md`](./60-reference/component-exceptions.md) | dated | The PRD §7.5 exception record for `ColourSwatch` |
| [`60-reference/parity.md`](./60-reference/parity.md) | dated | PRD §13: what parity meant, what changed, the harness still missing |
| [`60-reference/third-party-assets.md`](./60-reference/third-party-assets.md) | dated | **The rights register** — what this repo carries that belongs to someone else |

---

## 2. Outside `docs/`

These live where convention puts them, not where the library does. They are listed here
so this index is a complete map.

| Document | Location | Answers |
|---|---|---|
| [`README.md`](../README.md) | repo root | The starting point: what this is, how to run it, the index of project knowledge |
| [`PRD.md`](../PRD.md) | repo root | The founding product requirements (v2.0.rc1). **Stays at the root** — §16.2's F-items are cited from across the tree |
| [`CHANGELOG.md`](../CHANGELOG.md) | repo root | The release record, Keep a Changelog format. **Stays at the root** — the filename is the convention |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | repo root | Pointers into the rules, and what we will not merge |
| [`SECURITY.md`](../SECURITY.md) | repo root | How to report, and why most of what looks like a vulnerability is documented behaviour |
| [`LICENSE`](../LICENSE) | repo root | Proprietary — Indigo Home & Facility Services |
| [`THIRD-PARTY-NOTICES.md`](../THIRD-PARTY-NOTICES.md) | repo root | The public attribution register, with the MIT appendix |
| [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | repo root | The short version, and the one house rule |
| [`tests/README.md`](../tests/README.md) | `tests/` | A pointer into `20-development/testing.md`, plus the four things to know before trusting a green run |
| [`archive/README.md`](../archive/README.md) | `archive/` | What is archived, and why it was archived rather than deleted |

---

## 3. How to write a document here

Three rules, and they are the ones that have been broken. The full version is
`00-meta/conventions.md`.

- **Every claim is checkable**, and **every number carries its producer** — the value,
  the command, and the date. Never a bare `127`.
- **Declare the document's kind** — `derived`, `dated`, or `living`. A `living` claim
  written as if it were `dated` is how this library got into trouble.
- **Keep one copy.** If a fact is stated twice, one of them links to the other.

Five templates live in `00-meta/templates/`. Use them; do not invent a shape.

## 4. Section redirects

**`docs/README.md` was the developer flow standards until 2026-09-27.** It is now this
index, and the standards moved to `20-development/standards.md`. **The twelve section
numbers are unchanged**, so a citation to `docs/README.md §n` written before the move
still resolves by content:

| Old citation | Now |
|---|---|
| `docs/README.md` §1 | `20-development/standards.md` §1 — evidence-based development |
| `docs/README.md` §2 | `20-development/standards.md` §2 — branch strategy |
| `docs/README.md` §3 | `20-development/standards.md` §3 — commit conventions |
| `docs/README.md` §4 | `20-development/standards.md` §4 — PR flow |
| `docs/README.md` §5 | `20-development/standards.md` §5 — testing & verification |
| `docs/README.md` §6 | `20-development/standards.md` §6 — component policy |
| `docs/README.md` §7 | `20-development/standards.md` §7 — design tokens |
| `docs/README.md` §8 | `20-development/standards.md` §8 — CSS pipeline |
| `docs/README.md` §9 | `20-development/standards.md` §9 — file organisation |
| `docs/README.md` §10 | `20-development/standards.md` §10 — release process |
| `docs/README.md` §11 | `20-development/standards.md` §11 — working with the archive |
| `docs/README.md` §12 | `20-development/standards.md` §12 — common pitfalls |

**Citations to `docs/README.md` inside `CHANGELOG.md` are left as written** — the
changelog is a dated record and its links were correct on the day they were written.
This table is how a reader following one of them arrives at the right content.

**The documents that moved in Phase 3** are listed in
`40-project/plans/plan-docs-refactor-2026-09-27.md` §3, with their new homes.

## 5. What is missing

This library is now accurate **and** complete against the plan's target structure. What
remains is automation, not documentation:

| Missing | Why it matters | Tracked |
|---|---|---|
| **The wiki drift check** | The sync is manual, so a stale wiki is silent | `40-project/tasks.md` **E6** |
| **The deploy log** | Release history is prose in `CHANGELOG.md` | `40-project/tasks.md` **E4** |
| **PRD §13.2 re-measured** | It is the only acceptance test §13 ever specified, and F10 is blocked on it | `40-project/tasks.md` **E3** |
| **A dependency-vulnerability gate** | Dependabot opens PRs; nothing fails a build on an advisory | `40-project/tasks.md` **E7** |
