# Plan — v2.0.0 prune, health verification and milestone reconciliation

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-29 at `b6b4709`

> The v2.0.0 milestone was declared *"final client delivery"* but carried **7 open
> issues**, all of them blocked on the client rather than on engineering. This plan
> records the reconciliation: which items were genuinely complete, which were
> hanging, where they were moved, and what was pruned.
>
> **Where this document and the repo disagree, the repo wins** — every claim below
> carries its producer ([`00-meta/conventions.md`](../../00-meta/conventions.md) §1).

---

## 1. The finding

The milestone was **not complete**, and could not be completed without the client.
Three of the client's thirteen punch-list items quote strings that exist on **no
page** — not in the tree, not in the served bundle.

| Probe | Repo (`src/`) | Verdict |
|---|---|---|
| `13 years` | **0 hits** | issue #27's quoted figure exists nowhere |
| `Send a message` | **0 hits** | the form's real eyebrow is `Request Service` |
| `Proof We Care` | **0 hits** | issue #26's named section does not exist |
| `24/7 Emergency Response` | **0 hits** | issue #24's second hero string does not exist |
| `gradient` | **0 hits** | issue #21's "black fade" has no gradient to remove |
| `Why Indigo` | **0 hits** | issue #25's rename is already satisfied |

Producer: `grep -rin "<phrase>" src/` on `main` @ `b6b4709`, 2026-09-29. The one
survivor is the **phrase** *"peace of mind"* as ordinary body copy in the
Residential and Commercial hero paragraphs — a block by that name does not exist,
which is what #25 was asked to remove.

**So the honest state of v2.0.0 is: wave 1 shipped, and six items are waiting on an
answer, not on code.** Shipping a change to satisfy a description that matches
nothing is how a release ships a regression.

---

## 2. What is genuinely complete for v2.0.0

Landed on `main` in **#35** (`b6b4709`) plus the two commits before it, on a green CI:

| Client item | Issue | Evidence |
|---|---|---|
| **2** — `15+` → `15 years` | #13 | `grep -rn "15+" src/marketing/` → **0 hits** |
| **4** — "How it works" two-line heading | #14 | `HomePage.tsx:670` → `Clear Path From<br>Start To Finish` |
| **12** — copyright → `Call Indigo, LLC` | #22 | `chrome.ts:123` `COPYRIGHT_FIXED` + the three duplicated footers |
| *(repo hygiene)* CI red on `main` | #28 | `tests/harness.mjs` esbuild declared; `Gates` = **success** on `main` |

The CI check is the load-bearing one: [M: `gh api …/commits/main/check-runs` →
`Gates|completed|success`, 2026-09-29].

Item **3** (#25) closed as **already satisfied** — the rename had already happened;
the grep above is the proof.

---

## 3. What was moved, and why

**All 7 open v2.0.0 issues moved to the v2.1.0 milestone.** None was completable
inside v2.0.0 without an answer from the client.

| Issue | Subject | Blocker |
|---|---|---|
| #24 | Home hero: freeze the rotator | quoted string exists on no page |
| #26 | "Proof We Care" overlap/overflow | no section of that name exists |
| #27 | "13 years" / "Send a message" | both strings exist nowhere |
| #21 | the "black fade" on the band | no gradient exists |
| #16 | receipt copy + reference prominence | gated on the forms merge (#33) |
| #17 | remove the redundant CONTACT section | needs the section identified |
| #23 | site-wide consistency sweep | deferred to wave 2 |

**Result:** v2.0.0 carries **0 open issues**; v2.1.0 carries **11** (these 7 plus
#29 persistence, #30 wiki re-sync, #31 §13.2 parity, #33 the forms merge).

### ⚠️ A duplicate cluster was found and left alone

Issues **#18, #19 and #20** are byte-for-byte duplicates of **#21, #22 and #23**,
opened and closed within seconds of each other on 2026-09-29 (`05:25:13Z` /
`05:25:16Z` / `05:25:18Z`). The later trio is the live one and the earlier trio was
closed correctly. **No action taken** — closing them again would be churn. Recorded
here so the next reader does not re-file a fourth copy.

---

## 4. Pruning — measured, and reversible

The repository was **already lean where it counts**. The git pack object is
**9.12 MiB** [M: `git count-objects -vH`]; the 188 MB `archive/` directory is almost
entirely **gitignored binaries** that never entered history.

**Fifteen tracked files were removed from the index** — untracked, not deleted. The
bytes stay on disk; a `.gitignore` rule keeps them from returning.

| Removed | Count | Why |
|---|---|---|
| `archive/audit/v1-audit/_t2.py` … `_t13.py` | 12 | Ad-hoc Playwright probes with a **hardcoded local Chrome path**; cannot run elsewhere; referenced by no document; superseded by the documented `v2check/` harness |
| `archive/audit/v1-audit/_gt767.txt` | 1 | A single probe's raw dump, with no producer named |
| `v2check/index.html.bak{,2}` | 2 | Pre-edit copies; `gen_pages.py` regenerates them |

**Tracked files: 624 → 609.** `archive/README.md` gained a *"Pruned 2026-09-29"*
section listing each removal.

### Not pruned, deliberately

- Every script the archive's own *"Why this is archived"* list names — `verify.py`,
  `diag.py`, `mincontent.py`, `shots.py`, `gen_pages.py`, `GROUND_TRUTH-*`,
  `tw.css`. **`v2check/` is the instrument E3 (#31) depends on.**
- `css/_orphaned-style.css.bak` — the one backup that *is* documented.
- `archive/v1-prototype/valvoro-prototype/` — **byte-identical** to the root
  `valvoro-prototype/` for HTML, CSS, JS and the ground-truth docs
  [M: `cmp -s` on `index.html`, `residential.html`, `commercial.html`, `css/tw.css`,
  `js/main.js` → all identical]. It is a **documented duplicate**, so removing it is
  the owner's call, not a mechanical prune.

### Local scratch, not part of the repo

`.preview/` holds **498 MB** of accumulated session output — a broken
`node_modules-broken` backup, a dozen stale `dist-*` trees, generated sheets. It is
gitignored and never shipped. **Safe to clear at any time**; reported rather than
deleted because it is the working environment, not the repository.

---

## 5. Documentation and wiki drift

**The docs library is internally consistent** — `tests/docs.mjs` asserts the index,
the doc-map, the claim producers and every link, and it is green.

**The wiki has drifted, and by more than its issue records.**

| Probe | Result |
|---|---|
| Wiki HEAD | `c315c9d` — unchanged since 2026-09-27 |
| Wiki page stamp | **`2da36b6`** |
| Wiki pages | **53** content pages |
| `docs/` markdown | **57** |
| `Home.md` self-reported count | **54 documents** ← stale literal |

Three documents are missing from the wiki (no orphans, so the sync is purely
additive):

| Document | Added by |
|---|---|
| `docs/00-meta/docs-butler.md` | `12b8015` (2026-09-27) |
| `docs/40-project/proposal-backend-and-lead-handling-2026-09-29.md` | `8eb5a3b` (#34) |
| `docs/40-project/client-disclosure.md` | `b6b4709` (#35) |

### ⚠️ A correction to E12 (#30)'s own claim

E12 states the sync **cannot run** where child processes are refused, citing an
`EBUSY`. That is true of the *original* sandbox but **not of this environment** —
[M: `git clone` of the wiki remote succeeded into `.preview/wiki-check`, and
`node scripts/_wiki_sync.cjs --dry-run` wrote **57 pages + `_Sidebar`**]. The limit
is per-environment, not a property of the script.

**One more drift, found here:** `docs/40-project/tasks.md` §2 still says *"Each
landed item is tracked as its own issue in the **v2.0.0** milestone"* — no longer
true after this reconciliation. Corrected in the same commit.

---

## 6. Open question, with a recommendation

**Should `archive/v1-prototype/valvoro-prototype/` be removed?**

It is a byte-identical copy of the root `valvoro-prototype/`, minus the 79 images
that `.gitignore` excludes. It exists so the parity baseline survives if the root
copy moves.

- **Recommendation: keep it for now, and delete it only together with the root
  copy** — when **#31 (E3)** retires `valvoro-prototype/` after re-measuring §13.2
  parity. Deleting the archive copy first would remove the safety net while the
  baseline is still in use.
- **The decision is the owner's**, because the archive's stated purpose (*"preserves
  all pre-git workspace content"*) argues for keeping both.

---

## 7. Exit state

| Gate | Result |
|---|---|
| `npm test` | **152 checks passed** [M: `npm test`, 2026-09-29, at the pre-prune tree] |
| `tsc -b && vite build` | clean |
| `Gates` on `main` | success |
| v2.0.0 open issues | **0** |
| v2.1.0 open issues | **11** |
| Tracked files | **609** (from 624) |
| Wiki | re-synced to the docs tip by `scripts/_wiki_sync.cjs` |
