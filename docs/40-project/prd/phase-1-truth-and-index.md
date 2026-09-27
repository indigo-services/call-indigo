# PRD — Phase 1: Truth & Index

**Documentation accuracy pass — the docs stop lying, and gain a front door**

**Kind:** dated · **Status:** shipped · **Release:** `v2.0.rc2` ·
**Last verified:** 2026-09-27 at `2f009a2`

| | |
|---|---|
| **Document** | `docs/prd/phase-1-truth-and-index.md` |
| **Phase** | 1 of 5 |
| **Release target** | **v2.0.rc2** |
| **Status** | Ready to implement |
| **Date** | 2026-09-27 |
| **Base commit** | `2f009a2` |
| **Depends on** | — |
| **Blocks** | Phase 2 (`v2.1.0`), Phase 3 (`v2.2.0`) |
| **Master plan** | `docs/plan-docs-refactor-2026-09-27.md` |
| **Scope** | Documentation only. **Zero product-behaviour change.** |

---

## 0. Evidence rule

Inherited from `docs/development/standards.md` §1. **[M]** = measured, path or
command given. **[P]** = proposed here, carries an open question in §7.

---

## 1. Summary

The repository's engineering culture measures before it changes; its documentation
does not. Three documents in the tree assert things that stopped being true, and one
of those — *"there is no authentication"* — is a security statement about a dashboard
that has had a sign-in gate since `e622315`.

Phase 1 does two things and nothing else:

1. **Corrects every false claim** the tree contradicts (F1–F5 of the master plan).
2. **Gives `docs/` a front door** — `docs/README.md` becomes the index, and the root
   `README.md` becomes the single starting point that reaches every other document.

It deliberately does **not** restructure `docs/`. Moving a file invalidates every
citation to it; that is Phase 3's job, done once, with a redirect plan. Phase 1
changes no path that another document already points at.

**Why now.** The next release is a documentation release. Landing accuracy fixes
inside a feature release buries them in a diff nobody reads.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal | Proven by |
|---|---|---|
| G1 | No document asserts what the tree contradicts | A scan for each F1–F5 string returns zero hits, and the scan is itself tested against a fixture |
| G2 | `docs/README.md` is an index, and every doc under `docs/` appears in it exactly once | Count assertion: docs on disk = docs listed |
| G3 | The root `README.md` reaches every other document in ≤2 hops | Link walk from `README.md` |
| G4 | Every number carries its producer (pattern P3) | Manual read; the count claim names its command |
| G5 | No citation is left dangling by the move | The 4 measured live citations re-pointed; `docs/README.md` stays a valid path |

### 2.2 Non-goals

| Out of scope | Why | Where it goes |
|---|---|---|
| Moving any existing doc | Invalidates citations for no accuracy gain | Phase 3 |
| `.github/`, CI, `LICENSE`, `CONTRIBUTING.md` | Repo standards, not doc accuracy | Phase 2 |
| The wiki | Needs a stable `docs/` to mirror | Phase 4 |
| Doc-freshness assertions in the suite | Needs Phase 2's CI to have teeth | Phase 5 |
| Rewriting `PRD.md` §9.1 / §14 | Already annotated in place by `2f009a2`; the PRD is the historical spec | — |
| Editing `CHANGELOG.md` history | The changelog is a dated record; its citations were correct when written | §5, T4 |

---

## 3. The defects this closes

Each is a claim in a document the tree contradicts. Full analysis: master plan §2.

| # | Defect | Location | Sev |
|---|---|---|---|
| F1 | *"No authentication. `/admin` is reachable by anyone with the URL."* | `README.md:218` | **High** |
| F2 | *"67 checks"* / *"67/67 checks pass"* — actual **127** [M: `npm run test:only`] | `README.md:53`, `README.md:67`, `docs/README.md:153` | Medium |
| F3 | *"There is no automated suite yet"* | `docs/README.md:102` | Medium |
| F4 | `docs/README.md` is named like an index but is 12 sections of process; `docs/` has no front door | `docs/README.md` | **High** |
| F5 | README's Documentation table lists 3 of 6 docs — `admin-gate.md` and both `plan-*` files are unreachable | `README.md:239-241` | Medium |

**The shape worth recording.** F1 is the third occurrence in this repo of *an
assertion that cannot see the thing it claims to check*. `tests/auth.mjs` scans
`src/` for the old sentences — `README.md` is not under `src/`, so the guard was
blind to the highest-traffic copy of the claim. F2 has the same shape:
`tests/README.md` refused to publish a count for exactly this reason, and the two
documents that kept one are the two now wrong.

---

## 4. Deliverables

### 4.1 New files (7)

| Path | What |
|---|---|
| `docs/README.md` | **Rewritten** — the index. Every doc, by domain and by "what question does it answer". Carries the section-redirect table (§5, T4). |
| `docs/development/standards.md` | **New** — the dev flow standards, moved from the old `docs/README.md`, with F2, F3 and the §4 gate table corrected. 12 sections keep their numbers so `§n` citations still resolve by content. The gate table had listed a gate that does not exist (parity) and omitted one that does (`npm test`); it now runs G1–G4 with parity as G5. |
| `docs/plan-docs-refactor-2026-09-27.md` | **New** — the master plan |
| `docs/prd/phase-1-truth-and-index.md` | This document |
| `docs/prd/phase-2-repo-standards-and-ci.md` | Phase 2 PRD |
| `docs/prd/phase-3-docs-library.md` | Phase 3 PRD |
| `docs/prd/phase-4-wiki-publication.md` | Phase 4 PRD |
| `docs/prd/phase-5-observability-and-automation.md` | Phase 5 PRD |

### 4.2 Edited files (2)

| Path | Change |
|---|---|
| `README.md` | Rewritten as the knowledge index. Every current section survives; only the false sentences change, and the Documentation table is completed. |
| `docs/dashboard-scope.md` | 2 citations re-pointed: `docs/README.md §1` → `docs/development/standards.md §1` (L10); `§5` → `§5` (L166). |

### 4.3 The README rewrite — what must survive

The rewrite is **additive by construction**. Every section below must be present in
the output, or the change is a regression:

- Scope note (the dashboard exceeds PRD §5.2 / §9.1) → now also cites the gate
- Stack table · Quick start · Routes (public + dashboard) · Project structure
- Dead scaffolding (verified unreferenced this pass)
- Data layer · Parity · Known limitations · Documentation · License

**Changed:** the status block (F2), *Known limitations* (F1 — "No authentication"
becomes an accurate description of the gate, with a pointer to `admin-gate.md`), the
Documentation table (F5), and a new **Documentation map** section that makes the
README the index of project knowledge.

### 4.4 Commit shape

Two commits, per `docs/development/standards.md` §3 and the tree's own practice
[M: `git log --oneline -30` — every `feat` paired with a later `docs(changelog)`]:

1. `docs(phase-1): make the docs true and give /docs a front door`
   — files 4.1 and 4.2. **Must not touch `CHANGELOG.md`.**
2. `docs(changelog): record the Phase 1 documentation pass and cite <sha>`
   — `CHANGELOG.md` only, under `[Unreleased]` → `### Documentation`.

Commit message goes in `.git/COMMIT_MSG.txt` and is applied with `git commit -F`.

---

## 5. Acceptance criteria

Phase 1 is complete when every line is true and demonstrable.

**T1 — Accuracy (closes F1–F3)**

- [ ] A repo-wide scan for these strings returns **zero** hits that are
      *assertions*:
      - `No authentication` (as a claim about `/admin`)
      - `67 checks` / `67/67 checks`
      - `There is no automated suite yet`
- [ ] The **quotation allowlist is explicit**, and each entry was read and classified
      rather than pattern-matched. Measured at the time of writing, the only
      legitimate hits are:

  | File | Why it is a quotation, not the claim |
  |---|---|
  | `CHANGELOG.md` | The dated record of what was wrong |
  | `docs/plan-docs-refactor-2026-09-27.md` §2 | The findings |
  | `docs/prd/phase-1-truth-and-index.md` §3 | This document's defect table |
  | `docs/prd/phase-5-observability-and-automation.md` | The fixtures |
  | `docs/development/standards.md` §1, §5 · `docs/README.md` §3.1 | The worked example |
  | `docs/dashboard-scope.md:23` · `docs/admin-gate.md:4` | The PRD's own claim, quoted to mark it **Superseded** |
  | `tests/README.md:40` | Its pre-existing policy note |
- [ ] The scan is **negative-controlled**: run against a fixture containing all three
      strings as *assertions*, it reports all three. *(A scanner that finds nothing
      for anything is the defect F1 already is.)*
- [ ] The allowlist is **not** tuned to reach zero. A scan that flags a sentence
      *describing* the defect is a false-positive machine, and one narrowed until it
      reports nothing is the cannot-see-the-target defect wearing a new hat. The
      first run of this scan produced **5 false positives across 4 files**, all of
      which were quotations — which is why the criterion is a classified allowlist
      rather than a count.
- [ ] `README.md`'s *Known limitations* describes the client-side gate, says it is
      **not access control**, and links `docs/admin-gate.md`.

**T2 — The index (closes F4)**

- [ ] `docs/README.md` opens with what the library is, then lists every document.
- [ ] **Count assertion:** the number of `.md` files under `docs/` equals the number
      of distinct documents listed in the index. 6 on disk at `2f009a2`; the count
      after Phase 1 is printed by the check, not hardcoded.
- [ ] Every link in the index resolves to a file that exists.
- [ ] The index states the doc conventions inline: the **[M]/[P]** rule, the
      derived/dated/living distinction (pattern P2), and pattern P3.

**T3 — The starting point (closes F5)**

- [ ] Every document in the repo is reachable from `README.md` in ≤2 hops.
- [ ] The Documentation table lists **all** of: `PRD.md`, `CHANGELOG.md`,
      `docs/README.md`, `docs/development/standards.md`, `docs/admin-gate.md`,
      `docs/dashboard-scope.md`, `docs/component-exceptions.md`, the two `plan-*`
      files, and `docs/prd/`.
- [ ] Every number in the status block names its producer and the date it was taken.

**T4 — No dangling citations**

- [ ] `docs/dashboard-scope.md` L10 and L166 point at `docs/development/standards.md`.
- [ ] `README.md` L16 and L212 point at `docs/development/standards.md`.
- [ ] `docs/README.md` carries a **section-redirect table** mapping the old §1–§12 to
      their new home, so the 4 historical citations in `CHANGELOG.md`
      (L53, L683, L774, L828) still lead a reader to the right content.
- [ ] `CHANGELOG.md` is **not edited** in commit 1.

**T5 — The gates still pass**

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors, 4 warnings (unchanged, pre-existing registry warnings)
- [ ] `npm run build` — succeeds
- [ ] `npm test` — **127 checks**, unchanged. *(Phase 1 changes no code, so the count
      must not move. A change here means something unintended was touched.)*

**T6 — Hygiene**

- [ ] Every new and edited file is **LF**, verified by byte count
      (`tr -cd '\r' | wc -c` → `0`), per `.gitattributes` `* text=auto eol=lf`.
- [ ] No emoji, no trailing whitespace, headings consistent with the tree's style.

---

## 6. Risks

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | The README rewrite silently drops a claim a reader depended on | **High** | §4.3 pins the section list as an acceptance criterion. Review the section list before the prose. |
| R2 | The moved standards lose their `§n` numbers, breaking content-addressed citations | Medium | The 12 sections keep their numbers. Only the file path changes, and only 4 live citations exist [M]. |
| R3 | `docs/README.md` becoming an index breaks a reader's bookmark to the standards | Medium | It stays a valid path, and the redirect table is the first thing on it. |
| R4 | A "fix the count" pass writes `127`, which is stale by the next release | Medium | Pattern P3: the claim names `npm run test:only` and the date. Phase 5 asserts the pair. |
| R5 | The correction of F1 reads as if the gate is real security | **High** | The README must say **"not access control"** in the same sentence, mirroring `admin-gate.md` §1. Four in-app surfaces already say so; the README is the fifth. |

---

## 7. Open questions

**Q1 — Should `overview.md` be deleted in this pass?**

It is a gitignored session artifact at the repo root, regenerated each session and
stale on arrival [M: `.gitignore` `/overview.md`]. It is a third place project state
lives, and the least reliable.

*Recommendation: delete the root file and let `docs/50-sessions/devlog/` hold the
session record (Phase 3). Doing it now is one line and removes a misleading root
entry; the replacement does not exist yet, so the content would simply be gone.
**Recommendation: defer to Phase 3**, and keep it out of the README's index so it is
not advertised as a source.*

**Q2 — Does the README keep the "Dead scaffolding" section?**

It lists 7 modules nothing imports, verified again this pass [M: repo-wide import
grep]. Keeping it makes the structure match reality; deleting it removes a section
whose only content is "these are safe to delete".

*Recommendation: keep it, and move the deletion itself into Phase 2's hygiene commit.
The section is evidence, and evidence is this repo's currency.*

**Q3 — v2.0.rc2, or fold into `[Unreleased]`?**

*Recommendation: **v2.0.rc2**, per the scope decision taken for this pass. Phase 1
is docs-only, so the tag carries no regression risk and gives the correction a
citable point. `[Unreleased]` is already large and mixing a docs pass into it makes
the next release note harder to write.*

---

## 8. Dependencies

| Direction | Item |
|---|---|
| **Blocks** | Phase 2 — the CI gate in `v2.1.0` asserts against the corrected docs |
| **Blocks** | Phase 3 — the restructure needs a stable index to redirect from |
| **Blocked by** | Nothing |
| **External** | None. No client input, no credential, no network |

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| The suite is 127 checks | `npm run test:only` → `127 checks passed` |
| `README.md:53`, `:67` say 67 checks | `grep -n '67 checks' README.md` |
| `docs/README.md:153` says 67 checks | `grep -n '67 checks' docs/README.md` |
| `docs/README.md:102` says there is no automated suite | `grep -n 'no automated suite' docs/README.md` |
| `README.md:218` says there is no authentication | `grep -n 'No authentication' README.md` |
| 4 live citations to `docs/README.md` | repo-wide grep, excluding `.workbuddy-ai/` and `CHANGELOG.md` history |
| `docs/` holds 6 files | `ls docs/*.md` |
| The tree is LF | `tr -cd '\r' \| wc -c` → 0 |
| The two-commit paperwork convention | `git log --oneline -30` |
| Dead scaffolding is unreferenced | repo-wide import grep for 7 module names |
