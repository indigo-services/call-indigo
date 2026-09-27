# Roadmap

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-27 at `ff46132`

Two roadmaps, deliberately separate: **the product** and **the documentation**. They
ship on their own clocks, and the documentation one exists because the product one had
grown a library of documents nobody could find.

---

## 1. The documentation milestone — five phases

The full plan, with evidence for every finding:
[`plans/plan-docs-refactor-2026-09-27.md`](./plans/plan-docs-refactor-2026-09-27.md).

| Phase | Title | Release | What lands | PRD |
|---|---|---|---|---|
| **1** | **Truth & Index** | `v2.0.rc2` | Docs-only: the index, the README, findings F1–F5 corrected | [`prd/phase-1`](./prd/phase-1-truth-and-index.md) |
| **2** | **Repo standards & CI** | `v2.1.0` | `.github/`, hygiene files, the four gates run on PR | [`prd/phase-2`](./prd/phase-2-repo-standards-and-ci.md) |
| **3** | **The docs library** | `v2.2.0` | This numbered-domain structure, every domain populated | [`prd/phase-3`](./prd/phase-3-docs-library.md) |
| **4** | **Wiki publication** | continuous | The GitHub wiki, generated from `docs/` | [`prd/phase-4`](./prd/phase-4-wiki-publication.md) |
| **5** | **Observability & automation** | continuous | Freshness assertions, link checks, a deploy log | [`prd/phase-5`](./prd/phase-5-observability-and-automation.md) |

**Dates are [P] and deliberately relative.** This repository's cadence is measured in
sessions, not sprints, and a fabricated calendar would be the first dishonest number in
the plan.

**Dependency order:** 1 → 2 → 3 → 4, with 5 beginning after 2 and running
continuously. **Phase 4 depends on Phase 3**, because a wiki generated from a
half-restructured tree gets generated twice.

### 1.1 Phase status

| Phase | Status | Evidence |
|---|---|---|
| **1** | **Done** | The index exists; the README is the front door; F1–F5 corrected |
| **2** | **Done** | `.github/` with CI, PR/issue templates, Dependabot; `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.editorconfig`, `.nvmrc`, `package.json` metadata |
| **3** | **Done** | The seven numbered domains, populated |
| **4** | **Done** | The wiki is enabled and published — a page per document plus a sidebar, each stamped with its source path and commit |
| **5** | **In progress** | `tests/docs.mjs` asserts the index, the links and the claim registry. The deploy log is **not** built |

## 2. The product roadmap

| # | Work | Depends on | State |
|---|---|---|---|
| **F1** | Authentication — a **server-issued** session | — | **Partly landed** — a client-side prototype gate ships; the real one is owed before any real data exists |
| **F2** | Real persistence — API + database | F1 | Open. **The `api.ts` seam was built for exactly this** |
| **F3** | A working design-token editor | F1, F2, a token-source decision | Open. `/admin/design` is read-only today |
| **F4** | Content management for the marketing copy and images | F1, F2 | Open |
| **F5** | Asset management — upload/replace `assets/images/**` | F1, F2 | Open. `/admin/assets` discovers from disk, read-only |
| **F6** | The remaining sidebar pages | F1 | **Landed** — Profile, Notifications, Security, Assets and Components are all real pages now |
| **F7** | Reconcile the two button systems | §8.3 debt | Open |
| **F8** | Static pre-rendering / SEO | R4 | Open |
| **F9** | Audit log and roles | F1, F2 | Open |
| **F10** | Retire `valvoro-prototype/` | rc1 acceptance | **Blocked** — needs §13.2 parity re-measured and signed off |
| **F11** | ~~The `#area` city-list contradiction~~ | — | **Closed** — resolved to the four-city list |
| **F12** | Update the `modern-web-app` skill template to Tailwind v4 | R1 | Open |

### 2.1 The one that matters

**F2 is the roadmap.** Every other item either depends on it or is cosmetic next to it.
The contact form currently writes to the **submitter's own browser** — the business
never receives a submission ([`../30-operations/observability.md` §2](../30-operations/observability.md#2-what-we-cannot-see)).

**F1 gates F2**, and F1 is not a small change: a server-issued session means a server,
which means the project stops being a static SPA on Vercel.

## 3. The client punch list

Four items need a **decision**, not code. Full detail:
[`tasks.md`](./tasks.md). The client's answers are the blocker.

| # | Needs |
|---|---|
| **T2** | Which of three surfaces is the "stack issue" on the service icons |
| **T5** | Whether "drop management" also covers the two descriptive uses on the commercial page |
| **T6** | Whether to drop the membership eyebrow, which repeats its heading |
| **T7** | Which reading of "at the top level" for the home membership block |
