# Glossary

**Kind:** living · **Owner:** the repo

Two kinds of word live here. **Product words** come from the PRD's own glossary
(Appendix B). **Repo words** are local to this codebase and its documents — the ones
a new reader will not find in a general search, and will therefore guess wrong.

---

## Part 1 — Product and design words

From `PRD.md` Appendix B.

| Term | Meaning |
|---|---|
| **Slab** | A section rendered as a large rounded card (`.mbox.slab`) — the page's basic visual unit |
| **Frame model** | The three nested layout layers `.pad-rl` → `.mbox` → `.shell` |
| **Registry** | The shadcn/ui component registry. Components are **installed by CLI**, not imported from a package |
| **Block** | A registry item containing a page plus several components (e.g. `sidebar-08`) |
| **Two-menu layout** | The shadcn sidebar shell with a primary and a secondary nav group (PRD §9.2) |
| **Segment accent** | A colour assigned to Residential or Commercial (PRD §11.5) |
| **Parity** | The rc1 requirement that the React build duplicates the static pages exactly (PRD §13) |

## Part 2 — Repo words

| Term | Meaning | Where it bites |
|---|---|---|
| **Seam** | A single file that isolates a decision so it can be replaced without touching call sites. This repo has four: `src/lib/data/api.ts`, `src/lib/data/backend.ts`, `src/admin/routes.ts`, `src/marketing/chrome.ts`. | A change that reaches *past* a seam is the change that hurts. Pages must never import `backend.ts`. |
| **The chrome** | The top bar, header, mobile drawer, footer and legal modals. | **It is not shared.** It is duplicated inside all three marketing pages' `BODY_HTML` literals. A `chrome.ts` change reaches **one page of four**. |
| **`BODY_HTML`** | A page's markup held as a string literal and injected with `dangerouslySetInnerHTML`. Three marketing pages do this. | It is the only place raw HTML enters the DOM, and the reason `chrome.ts` exists. |
| **The gate** | The `/admin` client-side sign-in (`src/admin/auth.ts`). | It is **not access control**. Four in-app surfaces say so; `tests/auth.mjs` fails if any reverts. |
| **Derived / Dated / Living** | A document's kind, which determines how it can go wrong. See [`../00-meta/conventions.md` §2](../00-meta/conventions.md#2-declare-the-documents-kind). | A **living** claim written as if **dated** can be wrong forever without anyone noticing. |
| **Producer** | The command that produced a number. | A number without one is a claim that cannot expire. |
| **Negative control** | Running a check against a fixture that **contains** the defect, and confirming it fails. | A check that only ever sees correct input cannot tell a real fix from a vacuous one. This repo has paid for that mistake three times. |
| **The paperwork commit** | A second, separate `docs(changelog)` commit citing the feature commit's SHA. | The feature commit must not touch `CHANGELOG.md`. |
| **Skeleton** | A page's loading state. | Every `useApiData` page renders as skeletons in the verification suite, so **no data-driven admin UI is checkable from the suite**. |
| **The prototype** | `valvoro-prototype/` at the repo root — the parity baseline, 87 files. | The archived copy under `archive/` is **not** self-contained (images are gitignored). Compare against the root copy. |
| **rc1 / rc2** | Release-candidate labels. `rc1` is the product spec (`PRD.md` v2.0.rc1); `rc2` is the Phase 1 documentation release. | The product version and the docs milestone are versioned separately. |
| **Punch list** | The open client decisions, `T2` and `T5`–`T7`. | `T3` and `T4` are closed. See [`../40-project/tasks.md`](../40-project/tasks.md). |

## Part 3 — Acronyms

| | |
|---|---|
| **PRD** | Product Requirements Document — `PRD.md` at the repo root |
| **ADR** | Architecture Decision Record — [`../40-project/decisions/`](../40-project/decisions/) |
| **SPA** | Single-Page Application — client-rendered, which is why `vercel.json` rewrites everything to `/index.html` |
| **KDF** | Key Derivation Function. The gate uses PBKDF2-HMAC-SHA-256 at 210,000 iterations |
| **RMP** | Registered Master Plumber — the licence number in the footer (45574) |
| **F-item** | A deferred feature in `PRD.md` §16.2 (F1–F12) |

---

**Last verified:** 2026-09-27 at `2f009a2`
