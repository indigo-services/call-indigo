# PRD — Phase 4: Wiki Publication

**`/docs` gets a published surface — generated, never hand-edited**

**Kind:** dated · **Status:** shipped · **Release:** continuous ·
**Last verified:** 2026-09-27 at `2f009a2`

| | |
|---|---|
| **Document** | `docs/prd/phase-4-wiki-publication.md` |
| **Phase** | 4 of 5 |
| **Release target** | **Continuous** (no product version; the wiki is not shipped code) |
| **Status** | Proposed — for review |
| **Date** | 2026-09-27 |
| **Base commit** | `2f009a2` + Phases 1–3 |
| **Depends on** | Phase 3 — mirroring a half-moved tree generates it twice |
| **Blocks** | Phase 5 (the wiki is one of the things Phase 5 makes observable) |
| **Master plan** | `docs/plan-docs-refactor-2026-09-27.md` §4 P4, §9 Q2 |
| **Scope** | Enable the wiki, generate its pages from `docs/`, publish. **No source change.** |

---

## 0. Evidence rule

**[M]** = measured, path or command given. **[P]** = proposed here, carries an open
question in §7.

---

## 1. Summary

The GitHub remote has the wiki **disabled** [M: `gh repo view indigo-services/call-indigo
--json hasWikiEnabled` → `false`], and the repository is **private** [M: same command,
`visibility`].

There is therefore no surface at all for a reader who will not clone the repo. That is
the gap this phase closes — and the reason it closes it with a **generated** wiki
rather than a hand-written one.

**The one decision that matters.** A wiki is a second copy of the documentation, and
the repo's own founding rule is *"where the repo and a document disagree, the repo
wins and the document is the bug"* (`docs/development/standards.md` §1). A
hand-maintained wiki inverts that rule by existing outside the repo, where no test
can reach it. So the wiki is **derived**: generated from `docs/` by a script, pushed
to the wiki git repo, and stamped on every page with its source path and commit. An
edit made in the wiki UI is overwritten at the next sync, and every page says so.

This is pattern **P4** from the master plan, and it is the only arrangement in which
"make the wiki the central link" does not create the second copy the repo has already
been burned by.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal | Proven by |
|---|---|---|
| G1 | The wiki is enabled and reachable by anyone with repo access | `hasWikiEnabled: true`; a page loads |
| G2 | Every wiki page is generated, and says so | Each page carries source path + commit + "do not edit here" |
| G3 | A sync is one command | The command is in `30-operations/deployment.md` and in the wiki Home |
| G4 | Drift is detectable | A page whose source has changed since the stamped commit is identifiable |
| G5 | The root README links the wiki | One line, in the Documentation map |

### 2.2 Non-goals

| Out of scope | Why | Where |
|---|---|---|
| A client-facing product wiki | A different audience and a different document set — master plan §9 Q2 | §7 Q1 |
| Making the wiki public | The repo is private; that is a client decision | §7 Q2 |
| Asserting wiki freshness in the suite | Phase 5 | — |
| Migrating `CHANGELOG.md` or `PRD.md` to the wiki | Both are large, both are git-native, both are cited by SHA | — |

---

## 3. What the wiki is, and what it is not

| | |
|---|---|
| **It is** | a rendered mirror of `docs/`, for a reader who will not clone the repo |
| **It is not** | a source. Nothing originates there. |
| **It is not** | public. The repo is private [M], so the wiki is visible only to people with repo access |
| **An edit in the wiki UI** | is overwritten at the next sync. This is stated on every page. |
| **The source of truth** | the repo, always — `docs/development/standards.md` §1 |

**The audience question, answered explicitly.** The wiki serves the **developer/agent**
audience — it is the cheap, derived one, and it is the one that already has content.
A client-facing space is a *different product*: a product overview, a what's-new page,
and how to reach support. Those three pages are **not** filtered out of the
engineering docs; they are written for the client, and they are a separate deliverable
(§7 Q1).

---

## 4. Deliverables

### 4.1 Remote change — **done 2026-09-27**

| Action | Command | Effect |
|---|---|---|
| Enable the wiki | `gh api -X PATCH repos/indigo-services/call-indigo -F has_wiki=true` | GraphQL `hasWikiEnabled`: `false` → **`true`** [M: `gh repo view --json hasWikiEnabled,viewerPermission` → `{"hasWikiEnabled":true,"viewerPermission":"ADMIN"}`] |

**⚠️ The REST `has_wiki` field is a legacy no-op and must not be used to check this.**
Measured on 2026-09-27, at `2f009a2`:

```
gh api -X PATCH repos/… -F has_wiki=true   →  {"has_wiki": false}   ← ignored
gh api repos/… --jq .has_wiki              →  false                 ← always false
gh repo view … --json hasWikiEnabled       →  true                  ← authoritative
```

The PATCH **does** take effect — GraphQL flipped from `false` to `true` — but the REST
response echoes `false` before and after. A script that gates on the REST field will
believe the wiki is off while it is on. Use the GraphQL field.

**This is the only mutation of the client's remote in this plan.** It is reversible
with `-F has_wiki=false`, which removes the wiki from view but does **not** delete the
content — that is a separate, explicit decision (§7 Q3).

### 4.1a The first page is a manual step — confirmed, not predicted

§6 R3 predicted this; it is now measured. GitHub does **not** create
`<repo>.wiki.git` until a first page exists, and there is no API to create one:

```
git ls-remote https://github.com/indigo-services/call-indigo.wiki.git HEAD
  → remote: Repository not found.

git ls-remote https://github.com/indigo-services/call-indigo.git HEAD
  → 2f009a2276a9550370b300b1cb14008d4a4471dd	HEAD      ← auth is fine; the wiki is what is absent
```

Pushing a seed `Home.md` to the non-existent wiki remote also fails — it does not
initialise the repository.

**The one-time manual step**, and the only thing standing between "enabled" and
"published":

1. Open `https://github.com/indigo-services/call-indigo/wiki`
2. Click **Create the first page** and save it with any content.
3. Run `node scripts/_wiki_sync.cjs` — it replaces that page.

`scripts/_wiki_sync.cjs` performs the preflight, prints exactly this instruction and
exits `1` while the wiki repo is absent. **It has not been executed end-to-end** — see
its header and §6 R7.

### 4.1b Outcome — **published 2026-09-27**

| Step | Result |
|---|---|
| First page existed | GitHub's default `Home.md` (`Welcome to the call-indigo wiki!`), commit `4b2dbfe` |
| Pages generated | **13 + `_Sidebar`** — one per document in `docs/`, plus `Home` |
| Pushed | `4b2dbfe..89a52a7` on `master` |
| Links | **46 internal links checked, 0 broken** |
| Rendered | `/wiki`, `/wiki/development-standards`, `/wiki/prd-phase-1-truth-and-index` → **HTTP 200** |
| `PRD.md` / `CHANGELOG.md` | Linked to GitHub, not mirrored (§7 Q4) |

**The generation path is verified; the script's own git calls are not.** The pages
were generated by the script and pushed from the shell, because Node cannot spawn a
child process in this workspace [M: `execFileSync('git', ['--version'])` → `EBUSY`].
What that means for this PRD: the page-naming, banner, link-rewriting and sidebar
logic is **exercised**; the `clone`/`commit`/`push` calls are still **unverified** and
R7 stands, narrowed.

**One improvement fell out of the constraint.** The script now resolves HEAD by
reading `.git` when `git` cannot be spawned, so a generator that only needs the SHA
does not depend on process creation at all.

### 4.2 New files in the repo

| Path | What |
|---|---|
| `scripts/_wiki_sync.cjs` | Generates the wiki pages from `docs/` and pushes them |
| `docs/30-operations/wiki.md` | How the sync works, when to run it, how to verify |

**The sync script's contract:**

1. Read the document list from `docs/00-meta/doc-map.md` — the same list the index
   uses, so a document cannot be in one and missing from the other.
2. Rewrite every relative `.md` link to its wiki page name.
3. Prefix each page with a banner: source path, source commit, sync date, and
   *"generated — edit the source, not this page"*.
4. Generate `_Sidebar.md` from the domain structure, so the wiki has the same
   navigation as the index.
5. Generate `Home.md` from `docs/README.md`.
6. Clone `…/call-indigo.wiki.git`, replace its contents, commit, push.
7. Print a summary: N pages written, source commit, and any link that could not be
   rewritten — **a link that cannot be rewritten is a failure, not a warning.**

### 4.3 The wiki page set

| Wiki page | Source |
|---|---|
| `Home` | `docs/README.md` |
| `_Sidebar` | generated from the domain tree |
| `Onboarding`, `Development`, `Operations`, `Project`, `Sessions`, `Reference` | one per domain, from that domain's `README.md` or index section |
| One page per document | `docs/**/*.md`, path flattened |

---

## 5. Acceptance criteria

**T1 — Enabled and reachable**

- [ ] `gh repo view indigo-services/call-indigo --json hasWikiEnabled` → `true`.
- [ ] The wiki Home page loads and renders the index content.
- [ ] `_Sidebar` renders and every entry navigates.

**T2 — Derived, and says so**

- [ ] Every page carries: source path, source commit SHA, sync date, and the
      do-not-edit-here line.
- [ ] The banner's commit SHA matches the commit the page was generated from.
- [ ] Hand-editing a page and re-running the sync restores it, and the sync reports
      that it overwrote a page.

**T3 — Links resolve**

- [ ] Every link on every wiki page resolves — no `404`, no relative path that leaked
      through un-rewritten.
- [ ] The sync script **fails loudly** on a link it cannot rewrite, and is
      negative-controlled: run against a fixture with an unrewritable link, it fails.

**T4 — One command, documented**

- [ ] `docs/30-operations/wiki.md` states the command, the preconditions, and how to
      verify the result.
- [ ] The root `README.md` links the wiki from the Documentation map.
- [ ] The wiki Home says where the source lives and how to regenerate it.

**T5 — Nothing regressed**

- [ ] `npm test` still reports **127 checks**.
- [ ] No `src/` file is modified.
- [ ] The repo working tree is clean after a sync — the sync writes to the wiki
      clone, not to the repo.

---

## 6. Risks

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | The wiki becomes a second source of truth and drifts | **High** | P4 — generated, stamped, overwritten. The do-not-edit banner is on every page. |
| R2 | Someone assumes the wiki is public | Medium | The repo is private [M]; the wiki Home states the visibility explicitly. |
| R3 | The first push to an uninitialised wiki repo fails | **Confirmed** | Measured 2026-09-27 — see §4.1a. Not a defect: GitHub requires a first page through the UI. The sync script preflights this and prints the instruction rather than failing obscurely. |
| R4 | The sync flattens paths and two documents collide on one page name | Medium | Two files named `README.md` under different domains collide. The page name is `<domain>-<doc>` where the doc is not unique. Assert uniqueness in the script and fail on a collision. |
| R5 | The wiki drifts silently between syncs | Medium | Phase 5 detects it; until then the stamped SHA is the manual check. |
| R6 | Enabling the wiki is not what the client wanted | Medium | It is reversible and non-destructive (§4.1). Confirm the audience answer (§7 Q1) before the first sync. |
| R7 | `scripts/_wiki_sync.cjs` ships unverified | **High** | Written 2026-09-27 but **not executed end-to-end**, because Node cannot spawn a child process in this workspace at all [M: `execFileSync('git', ['--version'])` → `EBUSY`, on both available Node versions] — so its git calls could not be exercised. It passes `node --check` only. **Phase 4 must run it against a live wiki before trusting it**, and `docs/development/standards.md` §1 forbids treating a green syntax check as evidence. |

---

## 7. Open questions

**Q1 — Developer wiki, client wiki, or both?**

The master plan §9 Q2 raised this and recommended developer-first.

*Recommendation: **developer/agent first**, which is this PRD. A client-facing wiki is
a separate, small deliverable — three pages written for the client (what the site is,
what changed recently, how to reach support) — and it should be its own PRD, because
the content does not exist yet and cannot be derived from engineering docs. Do not
attempt both in one sync.*

**Q2 — Should the wiki be public?**

The repo is private. Making the wiki public would require making the repo public, or
maintaining the content elsewhere.

*Recommendation: **no, and do not raise it with the client as a technical option** —
the visibility of a private client repo is their decision, not a documentation
improvement. Record the current visibility on the wiki Home and move on.*

**Q3 — If the wiki is later disabled, should the content be deleted?**

Disabling leaves the content in the wiki repo.

*Recommendation: disabling is enough; deleting is a separate explicit decision and is
destructive. If the wiki is turned off, record **why** in `30-operations/wiki.md`
rather than silently removing the procedure — the next person will otherwise rebuild
it.*

**Q4 — Should `PRD.md` and `CHANGELOG.md` be mirrored to the wiki?**

Both are large (922 and 877 lines [M: `wc -l`]) and both are cited by SHA from other
documents.

*Recommendation: **no.** A 900-line page is not a wiki page, and both documents are
git-native — their value is the history, which the wiki does not carry. Link to them
on GitHub from the wiki Home instead.*

---

## 8. Dependencies

| Direction | Item |
|---|---|
| **Blocked by** | Phase 3 — the structure the wiki mirrors |
| **Blocks** | Phase 5 — the wiki is one of the things Phase 5 makes observable |
| **External** | The client's answer to §7 Q1 (audience); GitHub API access with `repo` scope [M: `gh auth status`] |

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| The wiki is disabled | `gh repo view … --json hasWikiEnabled` → `false` |
| The repo is private | same command, `visibility` → `PRIVATE` |
| The token can patch the repo | `gh auth status` → scopes include `repo` |
| The wiki remote is `…/call-indigo.wiki.git` | GitHub convention for a repo's wiki |
| The founding rule the wiki must not invert | `docs/development/standards.md` §1 |
| `PRD.md` is 922 lines; `CHANGELOG.md` is 877 | `wc -l` |
| The doc list the sync reads | `docs/00-meta/doc-map.md` (created in Phase 3) |
