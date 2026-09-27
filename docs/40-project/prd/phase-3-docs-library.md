# PRD — Phase 3: The Docs Library

**`/docs` becomes a library with domains, an owner per document, and a freshness contract**

**Kind:** dated · **Status:** shipped · **Release:** `v2.2.0`

| | |
|---|---|
| **Document** | `docs/prd/phase-3-docs-library.md` |
| **Phase** | 3 of 5 |
| **Release target** | **v2.2.0** |
| **Status** | Proposed — for review |
| **Date** | 2026-09-27 |
| **Base commit** | `2f009a2` + Phase 1 + Phase 2 |
| **Depends on** | Phase 1 (index), Phase 2 (CI to assert against) |
| **Blocks** | Phase 4 (the wiki mirrors this structure) |
| **Master plan** | `docs/plan-docs-refactor-2026-09-27.md` §3 |
| **Scope** | Restructure and populate `docs/`. **No product-behaviour change.** |

---

## 0. Evidence rule

**[M]** = measured, path or command given. **[P]** = proposed here, carries an open
question in §7.

---

## 1. Summary

Phase 1 gave `docs/` a front door over a flat directory of 6 files. That is the right
shape for 6 files. It is the wrong shape for the 25–30 documents this library needs
before it can answer the questions a new contributor, an operator, and an agent
actually ask.

Phase 3 introduces **numbered domains** — grouping by *who is reading* rather than by
document type — populates the domains that are currently empty, and moves the
existing reference documents into place **behind a redirect table** so no citation
dies.

**This phase is mostly writing, not moving.** Six existing files move; roughly
eighteen new ones are written. The move is the easy half and the dangerous half; the
redirect plan in §5 is what makes it safe.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal | Proven by |
|---|---|---|
| G1 | Every requested domain has a home and a populated document | §4's coverage table, every row non-empty |
| G2 | A reader with a question finds the answering document from the index in ≤2 hops | Link walk from `docs/README.md` |
| G3 | Every document declares its kind — derived, dated, or living — and its freshness signal | `00-meta/doc-map.md` |
| G4 | No citation dies in the move | Redirect table + a link check over the whole tree |
| G5 | A new session has a written protocol to follow | `50-sessions/protocol.md` exists and is referenced from the index |

### 2.2 Non-goals

| Out of scope | Why | Where |
|---|---|---|
| Generating the wiki | Phase 4 | — |
| Asserting freshness in the suite | Phase 5 | — |
| Rewriting `PRD.md` or `CHANGELOG.md` | Both stay at root by decision (master plan §3) | — |
| Deleting `overview.md` | Phase 1 Q1 deferred it here | §7 Q1 |

---

## 3. The target structure

```
docs/
├── README.md                     THE INDEX — front door, all domains, all audiences
│
├── 00-meta/                      How the docs work
│   ├── conventions.md            Evidence rule, front-matter, naming, the freshness
│   │                             contract, the template list
│   ├── doc-map.md                domain → doc → kind → owner → last-verified
│   └── templates/
│       ├── plan.md  prd.md  adr.md  runbook.md  devlog.md
│
├── 10-onboarding/
│   ├── README.md                 Ten-minute orientation
│   ├── setup.md                  Local setup, the four gates, first run
│   └── glossary.md               PRD Appendix B + the repo's own vocabulary
│
├── 20-development/
│   ├── standards.md              ← Phase 1 already created this
│   ├── architecture.md           The seams: routing, data layer, chrome
│   ├── patterns.md               House patterns + the anti-patterns each one kills
│   ├── testing.md                ← promoted from tests/README.md
│   ├── design-tokens.md          PRD §6, expanded
│   └── css-pipeline.md           PRD §8, expanded
│
├── 30-operations/
│   ├── deployment.md             Vercel, the SPA rewrite, the deploy-author gate
│   ├── environments.md           local / preview / production
│   ├── observability.md          What we can see, and what we cannot
│   ├── runbook-incident.md       Rollback, bad deploy, broken asset
│   └── security.md               Posture index → admin-gate.md, and the gaps
│
├── 40-project/
│   ├── roadmap.md                The five phases, releases, exit criteria
│   ├── tasks.md                  Live punch list (T2, T5–T7) + PRD §16.2 F-items
│   ├── prd/                      phase-1…phase-5 (Phase 1 created this)
│   ├── decisions/                ADRs, one file per irreversible decision
│   └── artifacts.md              Where generated things live; what may be deleted
│
├── 50-sessions/
│   ├── protocol.md               How a session starts, what it must leave behind
│   ├── agent-io.md               The contract: inputs, outputs, artifact paths
│   └── devlog/YYYY-MM-DD.md      One per substantive session
│
└── 60-reference/
    ├── routes.md                 Generated from src/App.tsx
    ├── data-layer.md             api → backend → localStorage, in full
    ├── admin-gate.md             ← MOVED
    ├── dashboard-scope.md        ← MOVED
    ├── component-exceptions.md   ← MOVED
    └── parity.md                 PRD §13, and the harness that is still missing
```

**Numbering rationale.** The prefixes exist to force a stable order in a sidebar and
to let a domain be inserted without renaming anything. They are not semantic. If the
document count stays under ~12, Phase 1 Q1's alternative — a two-level scheme without
numbers — is the better answer, and this PRD should be revised rather than followed.

---

## 4. Domain coverage

Every domain named in the original request, its home, and what the document must
contain. **A row with no document is an incomplete phase.**

| Domain | Home | Contents |
|---|---|---|
| **Structure** | `README.md` + `00-meta/doc-map.md` | The tree, and what lives where and why |
| **Organization** | `00-meta/doc-map.md` | domain → doc → kind → owner → freshness signal |
| **Timelines** | `40-project/roadmap.md` | Five phases, their releases, exit criteria, sequencing |
| **Patterns** | `20-development/patterns.md` | P1–P5 from the master plan, plus the code patterns (`useApiData`, the async seam, `routes.ts` as single source) and the anti-patterns each kills |
| **Protocols** | `50-sessions/protocol.md` | Session start/end contract; the two-commit paperwork convention |
| **Rules** | `20-development/standards.md`, `00-meta/conventions.md` | Dev flow; doc-writing |
| **Onboarding** | `10-onboarding/` | Orientation, setup, glossary |
| **Development** | `20-development/` | Standards, architecture, patterns, testing, tokens, CSS |
| **Sessions** | `50-sessions/` | Protocol, agent I/O, devlog |
| **Agent I/O** | `50-sessions/agent-io.md` | Inputs an agent may rely on; outputs it must leave; artifact paths; the `.preview/` rule; what is gitignored and must not be treated as durable |
| **DevOps** | `30-operations/` | Deployment, environments, observability, runbook, security |
| **Deployment** | `30-operations/deployment.md` | Vercel, the rewrite, the deploy-author gate, how to confirm a deploy |
| **Project management** | `40-project/` | Roadmap, tasks, PRDs, ADRs, artifacts |
| **Tasks** | `40-project/tasks.md` | T2, T5–T7; PRD §16.2 F1–F12 with status |
| **PRDs** | `40-project/prd/` | Phase 1–5 (Phase 1 created) |
| **Artifacts** | `40-project/artifacts.md` | Generated sheets, `dist/`, `.preview/`, `tests/.tmp/`, `overview.md`; what is durable vs disposable |
| **Devlog** | `50-sessions/devlog/` | Dated session records |
| **Changelog** | root `CHANGELOG.md` + an index pointer | One source. **Not duplicated into `docs/`.** |
| **Workproducts** | `40-project/artifacts.md` + `50-sessions/agent-io.md` | Where a deliverable lands, and who consumes it |

---

## 5. The move, and the redirect plan

Three files move. Each move invalidates citations, so each is handled explicitly.

| From | To | Live citations to re-point [M] |
|---|---|---|
| `docs/admin-gate.md` | `docs/60-reference/admin-gate.md` | `README.md`, `CHANGELOG.md`, `docs/dashboard-scope.md`, `docs/README.md` |
| `docs/dashboard-scope.md` | `docs/60-reference/dashboard-scope.md` | `README.md`, `CHANGELOG.md` |
| `docs/component-exceptions.md` | `docs/60-reference/component-exceptions.md` | `README.md`, `CHANGELOG.md` |

**The rule.** Citations in **living** documents are re-pointed in the same commit.
Citations in `CHANGELOG.md` are **left as written** — the changelog is a dated record
and its links were correct on the day they were written. Instead:

- `docs/README.md` carries a **redirect table** — old path → new path — permanently.
- The moved files keep their headings, so a `#section` anchor still resolves once a
  reader arrives.
- No pointer stub files are left behind. A stub is a second path that can rot; the
  redirect table is one place and is itself link-checked.

**Deliberately rejected:** leaving a one-line stub at each old path (master plan R4's
alternative). It keeps the old links working but creates three files whose only
content is "this moved", and the repo already has one file whose content is entirely
pointers (`archive/README.md`) and has watched it drift.

---

## 6. Acceptance criteria

**T1 — Structure**

- [ ] The §3 tree exists on disk, with the §4 coverage table fully populated.
- [ ] `docs/README.md` lists every document, and the count assertion from Phase 1 T2
      still holds against the new total.
- [ ] Every document is reachable from `docs/README.md` in ≤2 hops, and from the root
      `README.md` in ≤3.

**T2 — The freshness contract**

- [ ] `00-meta/doc-map.md` classifies every document as **derived**, **dated**, or
      **living**, and gives each a freshness signal.
- [ ] Every **dated** document carries a `Last verified:` line with a date and a
      commit SHA.
- [ ] Every **derived** document states the command that regenerates it, at the top.
- [ ] No document is both derived and hand-edited — asserted by a check that fails if
      a file marked derived has a hand-written edit marker.

**T3 — No dead links**

- [ ] Every relative link in every `.md` under `docs/` and at the root resolves to a
      file that exists.
- [ ] The redirect table covers all three moves.
- [ ] `CHANGELOG.md` is unmodified by this phase.

**T4 — The domains answer real questions**

Each document is judged by whether it answers its question, not by existing:

- [ ] `10-onboarding/README.md` — a reader who has never seen the repo can say what it
      is, what it is not, and where the dashboard's gate sits, after reading one page.
- [ ] `20-development/architecture.md` — names the seams (`api.ts`, `routes.ts`,
      `chrome.ts`) and what breaks if each is bypassed.
- [ ] `20-development/patterns.md` — includes the *"an assertion that cannot see the
      thing it claims to check"* pattern, with its three recorded occurrences.
- [ ] `30-operations/deployment.md` — says how to **confirm** a deploy, not just how
      to trigger one, and records the deploy-author gate.
- [ ] `30-operations/runbook-incident.md` — a rollback a person can execute at 2am
      without reading anything else.
- [ ] `40-project/tasks.md` — every PRD §16.2 F-item has a status.
- [ ] `50-sessions/protocol.md` — states what a session must leave behind.
- [ ] `60-reference/routes.md` — generated, and regenerating it is a no-op.

**T5 — Nothing regressed**

- [ ] `npm test` still reports **127 checks**.
- [ ] No `src/` file is modified.
- [ ] All new and moved files are LF (`tr -cd '\r' | wc -c` → 0).

---

## 7. Risks

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | The restructure churns every citation at once and hides real changes in a large diff | **High** | One `docs(refactor)` commit for moves, separate commits for new content. A move-only commit diffs as renames. |
| R2 | The numbered scheme is adopted at a document count that does not justify it | Medium | §3's note: if the count stays under ~12, use the unnumbered two-level scheme. Revise this PRD rather than follow it. |
| R3 | New documents are written to fill the tree and answer nothing | **High** | T4 judges each by its question. A domain with no real question gets no document. |
| R4 | `60-reference/routes.md` goes stale because it is generated but nobody regenerates it | Medium | Phase 5 asserts the regeneration is a no-op. Until then it is marked **derived** and dated. |
| R5 | `50-sessions/devlog/` becomes a write-only directory | Medium | The protocol requires an entry only for substantive work, and the index links the most recent three rather than all of them. |
| R6 | The ADR directory collects decisions nobody made | Low | One ADR per *irreversible* decision, with a real alternative that was rejected. The gate is "what would we lose by reversing this?" |

---

## 8. Open questions

**Q1 — Delete `overview.md` here, or keep it?**

Phase 1 Q1 deferred this. It is a gitignored session artifact at the root,
regenerated each session and stale on arrival [M: `.gitignore` `/overview.md`].

*Recommendation: **delete the root file** in this phase, once
`50-sessions/devlog/` exists to hold the durable version. It is the third place
project state lives and the least reliable; keeping it while building a devlog
guarantees the two disagree.*

**Q2 — Do the three PRD §13.2 parity documents merge into `60-reference/parity.md`, or stay separate?**

Parity is currently described in four places: `PRD.md` §13, `docs/development/standards.md` §5,
`tests/README.md`, and `README.md`'s Parity section.

*Recommendation: `60-reference/parity.md` becomes the single description, and the
other three **link** to it rather than restating it. Four descriptions of one
unbuilt capability is how the thresholds drifted the last time.*

**Q3 — Should `tests/README.md` move to `20-development/testing.md`, or stay put?**

It is authoritative, well-written, and cited by `docs/development/standards.md` §5.
Moving it means re-pointing those citations; not moving it means the library has one
document outside the library.

*Recommendation: **promote it**, and leave a one-line pointer at `tests/README.md`
saying where it went. This is the one place a pointer stub is right — `tests/` is a
directory people open when they are looking at test code, and a reader there needs to
be told, not redirected silently. It is a deliberate exception to §5's no-stubs rule.*

**Q4 — Who owns a document?**

`CODEOWNERS` (Phase 2) maps paths to GitHub handles, but there is one contributor
[M: `git log -1 --format='%an'`].

*Recommendation: the `doc-map.md` owner column carries a **role**, not a person —
*"the author of the last change to the file it describes"*. A named owner on a
one-person project is a fiction that decays the moment the roster changes.*

---

## 9. Dependencies

| Direction | Item |
|---|---|
| **Blocked by** | Phase 1 (the index), Phase 2 (CI asserts against the new structure) |
| **Blocks** | Phase 4 — the wiki mirrors this structure; mirroring a half-moved tree generates it twice |
| **External** | The Vercel project, for `30-operations/deployment.md` to describe rather than infer |

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| `docs/` holds 6 files at `2f009a2` | `ls docs/*.md` |
| 3 files move; each has live citations | repo-wide grep for each filename |
| `overview.md` is gitignored at the root | `.gitignore` `/overview.md` |
| Parity is described in four places | `PRD.md` §13; `docs/README.md` §5; `tests/README.md`; `README.md` |
| `tests/README.md` is authoritative and cited | `docs/README.md` §5 pointer |
| One author across 30 commits | `git log -1 --format='%an <%ae>'` |
| `archive/README.md` is an all-pointer file that has drifted | `archive/README.md`; master plan §5 |
