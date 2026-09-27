# Documentation refactor — plan and evidence, 2026-09-27

**Kind:** dated · **Status:** proposed · **Release:** Phase 1 targets **v2.0.rc2** · **Scope:** the
`docs/` library, the root `README.md`, and the GitHub remote's wiki.

The repo has an accurate *code* culture and an inaccurate *documentation* one. The
suite is 127 checks and the code is measured before it is changed; meanwhile three
documents in the tree assert things that stopped being true weeks ago. This plan
turns `docs/` into a library with a front door, makes the root README the index of
project knowledge, and publishes the same content to the GitHub wiki — derived, so
it cannot drift.

**The instrument is the tree itself.** Every number below was read out of the
workspace on 2026-09-27 at `2f009a2`, with the command or path given.

---

## 0. Evidence rule

This document inherits the repo's founding rule (`docs/development/standards.md` §1,
formerly `docs/README.md` §1):

- **[M]** — **measured**, read out of this workspace, path or command given.
- **[P]** — **proposed** by this document, no prior existence in the repo, always
  carries an open question in §9.

Where the repo and this document disagree, the repo wins and this document is the
bug. That rule is why §1 exists: the first thing this plan does is find the places
where the documents already lost.

---

## 1. What exists today — measured inventory

**`docs/` — 6 files, 37,481 bytes** [M: `ls -la docs/`]

| File | Bytes | What it actually is |
|---|---:|---|
| `README.md` | 16,219 | **Developer Flow Standards** — 12 sections: evidence rule, branches, commits, PR flow, testing, component policy, tokens, CSS pipeline, file organisation, release process, archive, pitfalls |
| `plan-client-feedback-2026-09-25.md` | 19,650 | Round-2 plan, evidence, risks, open questions, outcome |
| `plan-client-feedback-2026-09-26.md` | 15,000 | Round-3 plan, evidence, risks, open questions |
| `dashboard-scope.md` | 9,044 | Where the build departs from the PRD, and why |
| `admin-gate.md` | 8,401 | Threat model, rotation, verification for the `/admin` gate |
| `component-exceptions.md` | 1,159 | One PRD §7.5 exception record (`ColourSwatch`) |

**Outside `docs/`** — `PRD.md` (922 lines) [M: `wc -l PRD.md`], `CHANGELOG.md`
(877 lines), `tests/README.md` (174 lines), `archive/README.md` (83 lines),
`overview.md` (gitignored, a session artifact) [M: `.gitignore` `/overview.md`].

**The remote** [M: `gh repo view indigo-services/call-indigo --json …`]

```
visibility        PRIVATE
hasWikiEnabled    false          ← the wiki is off
defaultBranch     main
branches          main only      [M: git branch -a]
homepageUrl       https://call-indigo.com
```

**Repo hygiene files** [M: presence check, 11 paths]

```
MISSING  LICENSE  CONTRIBUTING.md  SECURITY.md  CODE_OF_CONDUCT.md
MISSING  CODEOWNERS  .github/  .editorconfig  .nvmrc  .node-version
PRESENT  CHANGELOG.md
```

**The suite is 127 checks** [M: `npm run test:only` → `127 checks passed`].

---

## 2. What is wrong — the findings

Each of these is a claim in a document that the tree contradicts. They are ordered
by how badly they mislead a reader who trusts them.

### F1 — The root README says there is no authentication. There is. **[High]**

`README.md:218`:

> - **No authentication.** `/admin` is reachable by anyone with the URL. There is no
>   login, session or token code.

The gate shipped in **`e622315`** (2026-09-26) [M: `git log --oneline`]. The
changelog records that four *in-`src/`* surfaces were corrected and that
`tests/auth.mjs` fails if any of them reverts — but `README.md` is not under `src/`,
so the scanner never saw it. **This is the same failure shape the repo has already
paid for twice**: *an assertion that cannot see the thing it claims to check passes
forever.* The README is the first document a new reader opens, and it is the one
document the guard cannot reach.

### F2 — Both READMEs state a check count that is 60 out of date. **[Medium]**

```
README.md:53        # Build, then run every verification suite (67 checks)
README.md:67        `test` 67/67 checks pass.
docs/README.md:153  **67 checks.** `tests/harness.mjs` holds the assertions…
```

Measured: **127** [M: `npm run test:only`]. `tests/README.md` already diagnosed this
class of defect and refused to participate —

> **Check counts are deliberately not listed here.** They grow with every round, and
> the copy of this file that read "67 checks" was wrong within a day of being written.

— and the two documents that kept listing a number are exactly the two that are now
wrong. **The fix is not "write 127".** Writing 127 dates the defect; the fix is to
make the claim self-invalidating (§4, pattern P3).

### F3 — `docs/README.md` says there is no automated suite. There is. **[Medium]**

`docs/README.md:102`:

> 5. **Exercise the change by hand** — see §5. There is no automated suite yet, so
>    "it type-checks" is not evidence that it works.

`tests/` holds 7 modules and 127 checks, and `docs/README.md` §5 two paragraphs later
describes them. The file contradicts itself in the space of 50 lines.

### F4 — `/docs` has no front door, and its front door is named wrong. **[High]**

`docs/README.md` is the file a reader opens when they want the index. It is not an
index — it is 12 sections of process. Three of the six docs in `docs/`
(`admin-gate.md`, `component-exceptions.md`, the two `plan-*` files) are reachable
only by knowing they exist. There is no file in the repo that answers *"what
documentation exists, and which one answers my question?"*

### F5 — The README's Documentation table is incomplete. **[Medium]**

`README.md:239-241` lists 3 documents. `docs/` holds 6. Missing: `admin-gate.md`
(the security posture of the shipped gate) and both `plan-*` files.

### F6 — The PR flow is documented but not practised. **[Medium]**

`docs/README.md` §2 defines `feat/` `fix/` `docs/` branches and a four-step lifecycle;
§4 defines a PR gate table. Measured: `git branch -a` returns **`main` only**, and the
last 30 commits are linear on `main` with the paperwork as a second `docs(changelog)`
commit citing the first SHA [M: `git log --oneline -30`]. The process described is
better than the process followed — but a document that describes a flow nobody runs
is a document that teaches a new contributor to be wrong.

### F7 — There is no CI, and `docs/README.md` §5 claims the suite "runs in CI". **[Medium]**

`tests/README.md:53`: *"It runs in CI, and it cannot be skipped for being
inconvenient."* There is no `.github/` directory [M: `ls .github` → absent]. The
suite runs when a human types `npm test`. This is a security claim — *"cannot be
skipped"* — that is currently false.

### F8 — No production-hygiene files. **[Low, but blocks "prod grade"]**

No `LICENSE` (the README asserts *"Proprietary — Call Indigo LLC"* with no file
behind it), no `CONTRIBUTING.md`, no `SECURITY.md`, no `.editorconfig`, no
`.nvmrc`. `package.json` has no `engines`, no `repository`, no `license` field
[M: `grep -E '"(engines|packageManager|repository|license|author)"' package.json` →
none]. Node version is unstated, so `npm install` is not reproducible across
machines.

### F9 — The wiki is disabled, so there is nowhere for a non-repo reader to land.

[M: `hasWikiEnabled: false`]. The client-facing audience — the people who will never
clone this — has no published surface. This is the gap Phase 4 closes.

### F10 — Root-level drift. **[Low]**

`overview.md` is a session artifact at the repo root, gitignored, regenerated every
session, and stale the moment it is written. It is a third place a reader can look
for project state, and it is the least reliable of the three.

---

## 3. The target — `/docs` as the library

The organising decision: **numbered domains, audience-led, one front door.** Numbers
make the sidebar order stable and let a new domain be added without renaming
anything. Domains group by *who is reading*, because that is the question a reader
actually has.

```
docs/
├── README.md                     ← THE INDEX. Front door. Every doc, by domain,
│                                   by audience, and by "what question does it answer"
│
├── 00-meta/                      How the docs work
│   ├── conventions.md            Doc-writing rules: evidence, front-matter, naming,
│   │                             the freshness contract, the templates list
│   ├── doc-map.md                domain → doc → owner → last-verified signal
│   └── templates/                plan.md · prd.md · adr.md · runbook.md · devlog.md
│
├── 10-onboarding/                Day one → first merged change
│   ├── README.md                 Ten-minute orientation: what this is, what it isn't
│   ├── setup.md                  Local setup, the four gates, first run
│   └── glossary.md               PRD Appendix B + the repo's own vocabulary
│
├── 20-development/               How to build here
│   ├── standards.md              ← MOVED from docs/README.md (dev flow standards)
│   ├── architecture.md           The seams: routing, the data layer, the chrome
│   ├── patterns.md               House patterns and the anti-patterns each one kills
│   ├── testing.md                ← promoted from tests/README.md
│   ├── design-tokens.md          PRD §6, expanded
│   └── css-pipeline.md           PRD §8, expanded
│
├── 30-operations/                DevOps
│   ├── deployment.md             Vercel, the SPA rewrite, the deploy-author gate
│   ├── environments.md           local / preview / production, and what differs
│   ├── observability.md          What we can see, and what we cannot
│   ├── runbook-incident.md       Rollback, bad deploy, broken asset
│   └── security.md               Posture index → admin-gate.md, and the gaps
│
├── 40-project/                   Project management
│   ├── roadmap.md                The five phases, their releases, their exit criteria
│   ├── tasks.md                  The live punch list (T2, T5–T7) + PRD §16.2 F-items
│   ├── prd/                      phase-1…phase-5 — one PRD per phase
│   ├── decisions/                ADRs, one file per irreversible decision
│   └── artifacts.md              Where generated things live and what may be deleted
│
├── 50-sessions/                  The human/agent I/O protocol
│   ├── protocol.md               How a session starts, what it must leave behind
│   ├── agent-io.md               The contract: inputs, outputs, artifact paths
│   └── devlog/                   YYYY-MM-DD.md, one per substantive session
│
└── 60-reference/                 Look-it-up material
    ├── routes.md                 The route table, generated from src/App.tsx
    ├── data-layer.md             api → backend → localStorage, in full
    ├── admin-gate.md             ← MOVED from docs/
    ├── dashboard-scope.md        ← MOVED from docs/
    ├── component-exceptions.md   ← MOVED from docs/
    └── parity.md                 PRD §13, and the harness that is still missing
```

**What stays at the root, and why.** `PRD.md` and `CHANGELOG.md` do not move.
`PRD.md` is the founding spec that §16.2 F-items are cited from across the tree;
`CHANGELOG.md` is the release record and a file whose *path* is a convention
(Keep a Changelog). Both gain a pointer from the index rather than a relocation.
Relocating either would break every existing citation for no gain.

### Domain coverage — the requested list, mapped

| Requested domain | Home | Phase |
|---|---|---|
| Structure | `docs/README.md`, `00-meta/doc-map.md` | 1 / 3 |
| Organization | `00-meta/doc-map.md` | 3 |
| Timelines | `40-project/roadmap.md` | 3 |
| Patterns | `20-development/patterns.md` | 3 |
| Protocols | `50-sessions/protocol.md` | 3 |
| Rules | `20-development/standards.md`, `00-meta/conventions.md` | 1 / 3 |
| Onboarding | `10-onboarding/` | 3 |
| Development | `20-development/` | 1 / 3 |
| Sessions | `50-sessions/` | 3 |
| Agent I/O | `50-sessions/agent-io.md` | 3 |
| DevOps | `30-operations/` | 3 |
| Deployment | `30-operations/deployment.md` | 3 |
| Project management | `40-project/` | 3 |
| Tasks | `40-project/tasks.md` | 3 |
| PRDs | `40-project/prd/` | **1** |
| Artifacts | `40-project/artifacts.md` | 3 |
| Devlog | `50-sessions/devlog/` | 3 |
| Changelog | root `CHANGELOG.md` + index pointer | **1** |
| Workproducts | `40-project/artifacts.md` + `50-sessions/agent-io.md` | 3 |

Phase 1 deliberately creates only three of these directories — `prd/`,
`development/`, and the rewritten index — because §9 Q1 asks whether the full
restructure is worth its churn *before* it is done.

---

## 4. Patterns and protocols

Four patterns carry the whole library. Each exists because the repo has already
been burned by its absence.

### P1 — One front door, and it is `docs/README.md`

A reader who does not know the tree must have exactly one file to open.
`docs/README.md` becomes the index; the dev-standards content moves to
`docs/development/standards.md`. **Nothing in the index describes a document that
does not exist**, and every document appears in the index — the pair is checked by
the same script that checks links (Phase 5, T2).

### P2 — Documents are derived, or they are dated

The distinction that would have prevented F2, F3, F5 and F7:

| Kind | Rule | Examples |
|---|---|---|
| **Derived** | Generated from the tree. Never hand-edited. Regenerating is the only way to change it. | `60-reference/routes.md`, the wiki, `doc-map.md`'s freshness column |
| **Dated** | Hand-written, carries a `Last verified:` line with a date and the commit it was checked against. Goes stale *visibly*. | `admin-gate.md`, `dashboard-scope.md`, every `plan-*` |
| **Living** | Hand-written, asserted against the tree by a test. Fails the suite when it drifts. | `README.md`'s status block, `tests/README.md` |

F2 is a *living* claim that was written as a *dated* one and never dated. The fix in
Phase 1 is to make the status block living: it states the count **and** the command
that produces it, and Phase 5 asserts the two agree.

### P3 — A number in a document carries its producer

> **127 checks** — `npm run test:only`, 2026-09-27, at `2f009a2`.

Never a bare number. A reader can re-run the command; a reviewer can see the claim
expire. This is `docs/development/standards.md` §1 applied to a count, and it is the
only form of the claim that survives a release.

### P4 — The wiki is a mirror, never a source

The wiki is generated from `docs/` by a script and pushed. It is read-only in
practice: an edit made in the wiki UI is overwritten at the next sync, and the sync
script says so on every page it writes. **The repo is the source of truth; the wiki
is a rendering of it.** This is the only arrangement in which "make the wiki the
central link" does not create a second, silently-diverging copy — which is exactly
the failure mode §1 of `docs/development/standards.md` exists to prevent.

### P5 — Every session leaves a devlog entry and a task state

`50-sessions/protocol.md` defines the contract: a session that changes the repo
appends to `docs/50-sessions/devlog/YYYY-MM-DD.md` and updates
`40-project/tasks.md`. Today that history exists only in `CHANGELOG.md` and the
git log — both excellent, neither of which records *what was tried and abandoned*,
which is the expensive part to rediscover.

---

## 5. Production standards — GitHub and Vercel

The target is that a reviewer arriving from GitHub sees the conventions they expect,
without being told where to look.

| Convention | Today | Phase |
|---|---|---|
| `README.md` as the front door | Present, stale (F1, F2, F5) | **1** |
| `docs/` index | Absent (F4) | **1** |
| `LICENSE` | Absent; README asserts proprietary (F8) | 2 |
| `CONTRIBUTING.md` | Absent | 2 |
| `SECURITY.md` | Absent — and this repo has a threat model in `admin-gate.md` that deserves one | 2 |
| `CODEOWNERS` | Absent | 2 |
| PR template + issue templates | Absent (`.github/`) | 2 |
| CI running the four gates on PR | Absent (F7) — `tests/README.md` claims otherwise | 2 |
| Dependabot | Absent | 2 |
| `.editorconfig` / `.nvmrc` | Absent (F8) | 2 |
| `package.json` `engines` / `repository` / `license` | Absent (F8) | 2 |
| Branch protection on `main` | Unknown — not verifiable with the current token scope | 2 |
| Wiki | Disabled (F9) | **4** |
| Deployment recorded per release | Done in prose in `CHANGELOG.md` | 5 (automate) |
| Doc-freshness assertions | Absent | 5 |

**Vercel.** `vercel.json` carries one rule — a catch-all rewrite to `/index.html`
[M: `vercel.json`] — which is correct and load-bearing for a client-rendered SPA
(`eadaf31`). Production is `call-indigo.com`; `call-indigo.vercel.app` 307-redirects
to it. **Deploys are gated on the commit *author*, not the token** — a fact recorded
in the project's own tooling notes and the reason `blocked-deploy-author-gate` exists
as a documented procedure. `30-operations/deployment.md` (Phase 3) is where that
becomes findable rather than folklore.

---

## 6. The five phases

Dates are **[P]** and deliberately relative — this repo's cadence is measured in
sessions, not sprints, and a fabricated calendar would be the first dishonest number
in the plan.

| Phase | Title | Release | Lands | Effort |
|---|---|---|---|---|
| **1** | **Truth & Index** | `v2.0.rc2` | Docs-only: index, README, F1–F5 corrected | 1 session |
| **2** | **Repo standards & CI** | `v2.1.0` | `.github/`, hygiene files, the four gates run on PR | 1–2 sessions |
| **3** | **The docs library** | `v2.2.0` | The §3 structure; every domain populated | 3–4 sessions |
| **4** | **Wiki publication** | continuous | Enable, generate, push, link from the README | 1 session + sync |
| **5** | **Observability & automation** | continuous | Freshness checks, link check, deploy log, doc coverage | 2–3 sessions |

**Phase 1 is deliberately small.** It closes the findings that make the docs
*untrustworthy* (F1–F5) without moving a single file that another document cites.
The restructure is Phase 3 precisely because moving `admin-gate.md` invalidates every
citation to it — that is a change that should be made once, deliberately, with a
redirect plan, not opportunistically in a corrections pass.

**Dependency order.** 1 → 2 → 3 → 4, with 5 beginning after 2 and running
continuously. Phase 4 depends on Phase 3 because a wiki generated from a
half-restructured tree is generated twice.

---

## 7. Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| **R1** | Phase 1's README rewrite loses a claim a reader depended on | A reader follows a stale link or misses a known limitation | The rewrite is additive: every section of the current README survives, with only the false sentences changed. Diff-review the section list, not the prose. |
| **R2** | Moving `docs/README.md`'s content breaks the ~9 citations to it across the tree | Dead links in `README.md`, `PRD.md`, `CHANGELOG.md`, `tests/README.md` | Phase 1 **keeps `docs/README.md` as a path** (it becomes the index) and moves the *content* to a new path. Citations to "docs/README.md §5" are re-pointed in the same commit. |
| **R3** | A generated wiki drifts from `docs/` because the sync is manual | The second copy problem P4 exists to prevent | The sync script stamps every page with the source path and commit; Phase 5 makes an out-of-date wiki a visible failure, not a silent one |
| **R4** | Phase 3's restructure churns every citation at once | A large, low-value diff that hides real changes | One `docs(refactor)` commit, a redirect table in `docs/README.md`, and the old paths kept as one-line pointer files for one release |
| **R5** | Adding CI in Phase 2 makes a pre-existing warning a red build | The gate is disabled to unblock, and then there is no gate | Phase 2 pins the exact current output first (`0 errors, 4 warnings` [M: README §"Verified clean"]) and sets the threshold there, then tightens in a separate commit |
| **R6** | The wiki is enabled on a private repo and someone assumes it is public | Expectations set wrongly about audience | Phase 4 records the visibility on the wiki Home page itself |

---

## 8. What was verified for this plan, and what was not

**Verified** [M]:

- The doc inventory, byte sizes and line counts — `ls -la docs/`, `wc -l`.
- The suite total, 127 — `npm run test:only`.
- Every stale claim in §2, by path and line number.
- The remote's metadata, including `hasWikiEnabled: false` — `gh repo view --json`.
- The absence of 9 hygiene files — presence check over 11 paths.
- That the "dead scaffolding" the README lists is genuinely unreferenced — a
  repo-wide import grep returns nothing for `nav-main`, `nav-secondary`,
  `nav-projects`, `nav-user`, `marketing/Frame`, `marketing/Slab`,
  `marketing/Pill`.
- That `main` is the only branch — `git branch -a`.
- That the tree is LF-clean — `tr -cd '\r' | wc -c` → `0` for both READMEs, against
  `.gitattributes`' `* text=auto eol=lf`.

**Not verified:**

- **Whether `main` is protected on the remote.** The token's scopes
  [M: `gh auth status`] include `repo` but branch protection is an org-policy
  question this pass did not test. Phase 2 must check it before relying on it.
- **Whether the Vercel project is connected to this GitHub remote or deploys from a
  CLI.** `vercel.json` proves the *configuration*; it does not prove the *trigger*.
  Phase 3's `deployment.md` must read the Vercel project, not infer it.
- **Whether the client reads documentation at all.** Every decision here assumes a
  reader exists. §9 Q2 asks it rather than assuming it.

---

## 9. Open questions

Each carries a recommendation, per this repo's convention.

**Q1 — Is the full §3 restructure worth its churn, or is a flat `docs/` enough?**

The repo has 6 documents. Six files do not need numbered domains; they need an
index. The restructure earns its cost somewhere around 15–20 documents, which is
where Phase 3 lands once onboarding, operations, sessions and reference are
populated.

*Recommendation: keep Phase 1 flat and ship the index. Re-evaluate the numbered
domains at the start of Phase 3, when the document count is known rather than
predicted. If the count is still under ~12, use a two-level scheme
(`docs/development/`, `docs/operations/`, `docs/project/`) without the numeric
prefixes — they are there to force sidebar order, and a 12-file tree has an order.*

**Q2 — Who is the audience for the wiki: the client, or the next developer?**

These want different content. A client-facing wiki is a product overview, a
changelog and a how-to-reach-us page. A developer-facing wiki is this repo's `docs/`
rendered. Publishing the whole library to the wiki serves the second audience and
buries the first.

*Recommendation: enable the wiki for the **developer/agent** audience first — it is
the cheap, derived one — and treat a client-facing space as a separate Phase 4
deliverable with its own three pages, written for the client rather than filtered
out of the engineering docs. Do not attempt both in one sync.*

**Q3 — Should `overview.md` (F10) be deleted, or promoted?**

It is a session artifact, gitignored, and it duplicates `CHANGELOG.md` at lower
fidelity.

*Recommendation: delete it as a root file and let `50-sessions/devlog/` hold the
session record. The artifact panel can point at the devlog entry. Keeping a third
place where project state lives is how the first two get out of sync.*

**Q4 — Does Phase 1 need a CHANGELOG entry, given it changes no product behaviour?**

The repo's convention is two commits — `feat(…)` then `docs(changelog)` citing its
SHA — and `CHANGELOG.md`'s format is Keep a Changelog with an `[Unreleased]` block.

*Recommendation: yes, under `[Unreleased]` → a `### Documentation` subsection. The
audience for the changelog includes the client, and "the README was lying about
authentication" is a fact they should be able to find. It is also the only place the
correction is visible without reading the diff.*

**Q5 — Should the stale claims be corrected in place, or struck through?**

`CHANGELOG.md` already answered this for the v1.0.1 mobile-card claim: corrected in
place, because the guard is the instructive part.

*Recommendation: correct in place, and record the *shape* of the defect — a guard
that could not see its target — rather than only the new value. That is what makes
the third occurrence less likely.*

---

## 10. Definition of done — the milestone

The documentation milestone is complete when all nine are true and demonstrable.

- [ ] **No document asserts something the tree contradicts.** A repo-wide scan for
      each of F1–F7's strings returns zero hits, and the scan is itself tested
      against a fixture containing the strings.
- [ ] **`docs/README.md` is an index**, and every document under `docs/` appears in
      it exactly once. Asserted, not reviewed.
- [ ] **The root README is the single starting point** — a reader who opens only it
      can reach every other document in at most two hops.
- [ ] **Every number in a document carries its producer** (P3), and the living ones
      are asserted by the suite.
- [ ] **CI runs the four gates on every PR** and a red gate blocks merge (F7 closed).
- [ ] **The hygiene set exists**: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`,
      `CODEOWNERS`, `.editorconfig`, `.nvmrc`, `package.json` metadata.
- [ ] **The wiki is enabled and generated from `docs/`**, stamped with source path
      and commit, and an out-of-date wiki is a visible failure.
- [ ] **Every requested domain has a home** (§3 table), and the domain is reachable
      from the index.
- [ ] **A session leaves a devlog entry and a task state** (P5), and the protocol is
      written down where a new agent will find it.

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| `docs/` holds 6 files, 37,481 bytes | `ls -la docs/` |
| The suite is 127 checks | `npm run test:only` → `127 checks passed` |
| `README.md` says 67 checks | `README.md:53`, `README.md:67` |
| `docs/README.md` says 67 checks | `docs/README.md:153` |
| `docs/README.md` says there is no automated suite | `docs/README.md:102` |
| `README.md` says there is no authentication | `README.md:218` |
| `tests/README.md` claims the suite runs in CI | `tests/README.md:53` |
| The gate shipped in `e622315` | `git log --oneline` |
| `main` is the only branch | `git branch -a` |
| The wiki is disabled | `gh repo view indigo-services/call-indigo --json hasWikiEnabled` |
| The repo is private | same command, `visibility` |
| No `.github/` | `ls .github` → absent |
| 9 hygiene files are missing | presence check over 11 paths |
| `package.json` has no `engines`/`repository`/`license` | `grep -E '"(engines|…)"' package.json` |
| `vercel.json` carries one catch-all rewrite | `vercel.json` |
| Dead scaffolding is unreferenced | repo-wide import grep for 7 module names |
| The tree is LF | `tr -cd '\r' \| wc -c` → 0; `.gitattributes` `* text=auto eol=lf` |
| The two-commit paperwork convention | `git log --oneline -30` — every `feat` paired with a later `docs(changelog)` |
