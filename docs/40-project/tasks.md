# Tasks — the live punch list

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-29 at `6cb10f6`

> ⚠️ **Two `T`-numbering schemes collide in this repo.** The ones below are the
> **client punch list**. A phase PRD's `T2` is a different thing entirely — see
> [`README.md` §1](./README.md#1-the-two-numbering-schemes--read-this-first).

---

## 1. Client punch list — needs a decision, not code

Each of these is **blocked on the client**, not on engineering. The symptom is clear in
every case; the remedy is not. Source: `CHANGELOG.md` §"Client punch list v1.0.1 —
pending, needs clarity (TBD)".

### T2 — "Each service icon has a stack issue with the color" *(home + residential)*

**Open. The remedy is ambiguous, and the measurement says why.**

All six `services-icon*.png` are **pure-white glyphs** (`#ffffff`, alpha) inside a chip
that is:
- `bg-sky` (`#30c3eb`),
- a **3px** white ring,
- **14px** padding.

So the glyph renders at roughly **28px inside a 62px chip**. **Any of those three
surfaces could be the "stack issue".**

**Needs:** is it the chip colour, the white ring, or the padding?

### T5 — Does "drop management" also cover the descriptive uses? *(commercial)*

**Open.** The product names are renamed. Two *descriptive* uses of the word remain on
the commercial page:
- the hero chip **"National facility management"**,
- **"…without a full management commitment"** in the services box.

Those describe a service category rather than the membership product, so they were left.

**Needs:** keep or reword.

### T6 — The home membership eyebrow repeats its heading

**Open.** The block reads:

```
MEMBERSHIP
Indigo Home & Facility Membership
```

The eyebrow was not in the instruction, so it was left alone.

**Needs:** drop the eyebrow, or keep it.

### T7 — Which reading of "at the top level"? *(home membership block)*

**Open.** Implemented as *heading* = "Indigo Home & Facility Membership", *CTA* =
"BECOME A MEMBER", body under — **which matches the residential and commercial boxes.**

The alternative reading: *eyebrow* = the name, and *h2* = "BECOME A MEMBER".

**Needs:** confirm.

## 2. Client punch list — closed

This section now tracks the **client's own 13-item punch list of 2026-09-29**, which
supersedes the repo's paraphrase (§1). Each landed item is tracked as its own issue in the
**v2.0.0** milestone.

| # | Client item | State |
|---|---|---|
| **12** | Footer copyright → `© 2026 Call Indigo, LLC. All rights reserved.` | **Landed** (issue #22) — footer constant + the three mirror pages + `LICENSE` + `client-disclosure.md` §5.6, one commit. **This settles the legal entity: `Call Indigo, LLC`.** |
| **2** | `15+` → `15 years` | Open — S2 wave 1 (issue #13) |
| **4** | "How it works" two-line heading | Open — S2 wave 1 (issue #14) |
| **6** | Testimonials → carousel | Open — S2 wave 1 (issue #15) |
| **11** | Remove the black fade on the "Ready when you call" band | Open — S2 wave 1 (issue #21) |
| **3** | Rename "Why Indigo" / remove "Peace Of Mind" | **Already satisfied** — the heading is `Why choose Call Indigo` and no "Peace Of Mind" block exists (issue #25) |
| **7** | FAQ | **No action** — the client said the section is fine |
| **1, 5, 8** | Hero rotator · section overflow · "13 years"/"Send a message" | **BLOCKED-ON-CLIENT** — the quoted strings exist on no page (issues #24, #26, #27) |
| **9, 10, 13** | Receipt copy · redundant CONTACT section · site-wide sweep | Deferred to **S2 wave 2**, after the forms merge (issues #16, #17, #23) |

### ⚠️ Found closing #22 — the utility bar names the *other* entity

The client's item 12 asked for the correct copyright name **"and the most up-to-date
info"**. The footer and `LICENSE` now agree on **`Call Indigo, LLC`**, but the **utility
bar** on all four pages still renders:

```
Est. 2012 · Indigo Home & Facility Services
```

at `src/marketing/chrome-markup.ts:54` and inline in the three mirror pages
(`HomePage.tsx:59`, `ResidentialPage.tsx:59`, `CommercialPage.tsx:59`).

**It was left alone deliberately.** The two are different fields with different jobs —
`copyrightName` (`Call Indigo LLC`) is the copyright holder; `legalName`
(`Indigo Home & Facility Services`) is the entity used *"on documents and the utility
bar"* (`src/admin/SettingsPage.tsx:33`), and `seed.ts` / `tokens.ts` both still carry it.
The client's ruling named the **copyright** name, so rewriting the utility bar would be a
guess about a different field. **Recorded as a question, not silently changed** — resolve
it in issue #23 (the site-wide sweep) or with the client.

| # | Item | State |
|---|---|---|
| **T3** | *(shipped)* | **Closed** |
| **T4** | The Terms of Service and Privacy text | **Closed for the prototype.** The client's answer: treat it as done for now. **A *public* launch still needs the real text** — the placeholder copy still carries its own warning. |

> **A rewrite must not break four facts, all verified against the build:** no cookie is
> set; no analytics exists; the form collects **no postal address**; the captcha is
> **local arithmetic** with no third-party service.

## 3. Engineering tasks — ours, and unblocked

| # | Task | Why | Where |
|---|---|---|---|
| **E3** | **Re-measure PRD §13.2 parity.** | The marketing copy changed, so the thresholds have to be re-measured rather than inherited. **F10 is blocked on it.** | `archive/audit/v1-audit/v2check/` |
| **E4** | **Build the deploy log.** | Release history is prose in `CHANGELOG.md`. Phase 5. | — |
| **E5** | **Rename the phase PRDs' `T`-tasks** to `P<n>-T<n>`. | Two schemes collide. Deferred because renaming invalidates cross-references. | `40-project/prd/*` |
| **E6** | **The wiki drift check.** | The wiki is generated manually; nothing fails when it is stale. Phase 5. | `scripts/_wiki_sync.cjs` |
| **E7** | **A dependency-vulnerability gate in CI.** | Dependabot opens PRs; nothing fails a build on an advisory. | `.github/workflows/ci.yml` |
| **E10** | **Machine-check the README's build figures.** | Found while closing E8: the count is guarded now, but the build row is not. A one-line edit to `ComponentsPage.tsx` moved the JS figure **810.79 → 810.81 kB** and nothing failed. ⚠️ **The blocker is real:** `test:only` does **not** rebuild, so a check reading `dist/` would compare against a stale bundle and fail spuriously. Solve that first — do not ship the check without it. | `README.md`, `tests/` |
| **E12** | **Re-sync the wiki — it lags `docs/`.** | The sync is manual, so any document added or changed since the last push is missing from the wiki. It **cannot run** from a sandbox that refuses child processes [M: `node scripts/_wiki_sync.cjs` → `git could not be started (EBUSY)`] — a limit of that environment, not of the script. Run it from a machine that can spawn git, then confirm the result against `docs/` rather than trusting a page count written down here. | `scripts/_wiki_sync.cjs` |
| **E13** | **The "how many times" count disagrees across three files.** | Each place that counts this defect counts it differently: `CONTRIBUTING.md:39` says **three**, `tests/docs.mjs:4–13` lists **four**, and `CHANGELOG.md` calls E8 the **fifth**. Nothing maintains any of them. Either drop the number and point at `docs/20-development/patterns.md`, or give it a producer — but a bare count here is the very defect it counts. | `CONTRIBUTING.md`, `tests/docs.mjs`, `CHANGELOG.md` |

### Closed — 2026-09-27

**E1 and E2 were the first two items this milestone found, and they are now closed
along with three more that surfaced while closing them.** Each is recorded in
[`../../CHANGELOG.md`](../../CHANGELOG.md) with the commit that closed it.

| # | Task | What closed it |
|---|---|---|
| **E1** | Assert the backend-import rule | `tests/policy.mjs` asserts it now, **with a positive control** — the one allowed edge (`api.ts` → `backend.ts`) must exist, so a disconnected facade fails instead of reading as compliance. Negative-controlled: a fixture importing `@/lib/data/backend` fails the suite. |
| **E2** | The stale `/admin` comment | `src/admin/routes.ts` says *redirects to the inbox*, which is what `App.tsx:69` does. The old text said *falls through to the home page*. |
| **E8** | *(found closing E1/E2)* **The README's check count.** | It stated **127** beside its own producer for the whole of a milestone that took the suite to **139**. `tests/docs.mjs` check 8 fires only when a producer is **missing**, so a number that *named* one was trusted and never compared — **the fifth instance of the defect shape.** Now correct, and **machine-checked** by `tests/run.mjs`. |
| **E9** | *(found closing E1/E2)* **Six stale `docs/` paths in `src/` and `scripts/`.** | The restructure moved four documents into numbered domains and left six references behind — including one that `src/admin/ComponentsPage.tsx` **renders to the operator in the dashboard UI**. Repaired; `tests/docs.mjs` check 13 now asserts every such reference resolves. |
| **E11** | *(found publishing the wiki)* **The wiki generator's preflight.** | It caught every exception and reported one cause — *"the wiki repository does not exist yet"* — so a failure to **run git** was reported as a missing wiki. The wiki exists [M: `git ls-remote … HEAD` → `c315c9d`; the page returns HTTP 200]. A spawn failure has no exit status, so `e.status === null` now separates it from a git error. |

## 4. PRD §16.2 — deferred product work

The full table, with dependencies: [`roadmap.md` §2](./roadmap.md#2-the-product-roadmap).

| Open | Landed | Closed |
|---|---|---|
| F1 (partly), F2, F3, F4, F5, F7, F8, F9, F10, F12 | **F6** | **F11** |

**F2 is the roadmap** — the contact form currently writes to the submitter's own
browser, so the business never receives a submission.

## 5. The documentation milestone

Phases 1–5, with their exit criteria:
[`roadmap.md` §1](./roadmap.md#1-the-documentation-milestone--five-phases).

---

**Last verified:** 2026-09-29 at `6cb10f6`
