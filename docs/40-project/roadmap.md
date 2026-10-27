# Roadmap

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-27 against `cd7ed7b` (v2.3.0)

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

> **The `Release` column is the plan's original label, not a tag that exists.**
> Phases 2–4 shipped inside the `v2.0.x` releases, and the repository has no
> `v2.2.0` tag. **`v2.3.0` (2026-10-27) is the product release** — the server, the three
> staff levels, the Team screen — and `v2.1.0` (2026-10-22) was the one before it.
> Read the column as "which release the plan expected this to land in"; read
> [`CHANGELOG.md`](../../CHANGELOG.md) for what actually shipped.

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
| **F1** | Authentication — a **server-issued** session | — | **Landed** — Clerk identity, and `requireCapability()` on every endpoint (`api/_lib/auth.ts:176` → `api/_lib/roles.ts`) |
| **F2** | Real persistence — API + database | F1 | **Landed** — `api/_lib/inquiries.ts:54` `insertInquiry()` writes to Neon over HTTP (`api/_lib/db.ts:59`); the inbox and settings read it back (`api/inquiries.ts`, `api/settings.ts`) |
| **F3** | A working design-token editor | F1, F2, a token-source decision | Open. `/admin/design` is read-only today |
| **F4** | Content management for the marketing copy and images | F1, F2 | Open |
| **F5** | Asset management — upload/replace `assets/images/**` | F1, F2 | Open. `/admin/assets` discovers from disk, read-only |
| **F6** | The remaining sidebar pages | F1 | **Landed** — Profile, Notifications, Security, Assets and Components are all real pages now |
| **F7** | Reconcile the two button systems | §8.3 debt | Open |
| **F8** | Static pre-rendering / SEO | R4 | Open |
| **F9** | Audit log and roles | F1, F2 | **Partly landed** — a role is a row in Postgres (`staff`, migration `0003`) enforced per endpoint; **the audit log is not built**, so a level change records when but not who (#114) |
| **F10** | Retire `valvoro-prototype/` | rc1 acceptance | **Archived, not retired** — the directory is at `archive/valvoro-prototype/`; deleting it still needs §13.2 parity re-measured and signed off |
| **F11** | ~~The `#area` city-list contradiction~~ | — | **Closed** — resolved to the four-city list |
| **F12** | Update the `modern-web-app` skill template to Tailwind v4 | R1 | Open |

### 2.1 What the roadmap says now

**F2 was the roadmap, and it is built.** The paragraph that stood here said every other item
was cosmetic next to a contact form that wrote to the submitter's own browser. That is no
longer the state: a lead posted to `/api/inquiry` is stored in Neon and announced by mail
from the server, and has been since v2.3.0.

What is left is not smaller, it is **different**. Three things, in order:

1. **The public endpoint is undefended** — no rate limit, no bot defence (#92, #94). A
   backend that stores leads honestly and accepts every one of them is half a solution.
2. **The address that receives the leads has no screen** (#93). It is settable only by
   `curl`, while the field an operator would use writes a row nothing reads.
3. **A level change is unattributable** (#114). Roles are enforced; who granted one is
   recorded nowhere that outlives a function log.

F3, F4, F5 and F8 remain open, and they wait on decisions rather than on code.

## 3. The client punch list

Four items need a **decision**, not code. Full detail:
[`tasks.md`](./tasks.md). The client's answers are the blocker.

| # | Needs |
|---|---|
| **T2** | Which of three surfaces is the "stack issue" on the service icons |
| **T5** | Whether "drop management" also covers the two descriptive uses on the commercial page |
| **T6** | Whether to drop the membership eyebrow, which repeats its heading |
| **T7** | Which reading of "at the top level" for the home membership block |
