# PRD — Phase 2: Repo Standards & CI

**The repository starts enforcing what its documents already claim**

**Kind:** dated · **Status:** shipped · **Release:** `v2.1.0` ·
**Last verified:** 2026-09-27 at `2f009a2`

| | |
|---|---|
| **Document** | `docs/prd/phase-2-repo-standards-and-ci.md` |
| **Phase** | 2 of 5 |
| **Release target** | **v2.1.0** |
| **Status** | Proposed — for review |
| **Date** | 2026-09-27 |
| **Base commit** | `2f009a2` (Phase 1 lands before this starts) |
| **Depends on** | Phase 1 |
| **Blocks** | Phase 5 |
| **Master plan** | `docs/plan-docs-refactor-2026-09-27.md` §5 |
| **Scope** | Repo standards, CI, and hygiene files. **No product-behaviour change.** |

---

## 0. Evidence rule

**[M]** = measured, path or command given. **[P]** = proposed here, carries an open
question in §7.

---

## 1. Summary

`tests/README.md:53` states:

> It runs in CI, and it cannot be skipped for being inconvenient.

There is no `.github/` directory [M: `ls .github` → absent]. The suite runs when a
human types `npm test`, and it can be skipped by not typing it. **This is the
highest-severity documentation defect in the repo after Phase 1's F1**, because it is
a claim about enforcement, and enforcement that does not exist is worse than no claim.

Phase 2 closes the gap in the direction the document already points: it makes the
claim true rather than deleting it.

It also adds the nine files a reviewer arriving from GitHub expects, and the metadata
that makes `npm install` reproducible across machines.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal | Proven by |
|---|---|---|
| G1 | The four gates run on every PR and block merge | A red PR shows a red check; a green PR cannot be merged while red |
| G2 | `tests/README.md`'s CI claim becomes true | The workflow file exists and runs the same command |
| G3 | `npm install` is reproducible | `engines` pinned; `.nvmrc` present; a second machine installs and passes |
| G4 | A reviewer from GitHub finds the conventions without being told | `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, PR/issue templates present |
| G5 | Ownership is declared | `CODEOWNERS` maps paths to owners |

### 2.2 Non-goals

| Out of scope | Why | Where |
|---|---|---|
| Restructuring `docs/` | Phase 3 | — |
| The wiki | Phase 4 | — |
| Doc-freshness assertions | Needs CI to exist first | Phase 5 |
| The PRD §13.2 browser parity harness | A real capability, not a standards gap — and it needs a headless browser dependency the repo has deliberately avoided | Open question Q3 |
| Changing any `src/` file | Phase 2 adds gates; it does not make the code pass new rules | — |

---

## 3. The gates

The repo already has four commands [M: `package.json` scripts]. Phase 2 puts them in
CI unchanged.

| Gate | Command | Current output [M] |
|---|---|---|
| G1 — Type check | `npm run typecheck` | 0 errors |
| G2 — Lint | `npm run lint` | 0 errors, **4 warnings** (pre-existing `react-refresh` in generated registry files) |
| G3 — Build | `npm run build` | 1749 modules, 789.92 kB JS / 235.53 kB gzip, 122.14 kB CSS |
| G4 — Verification suite | `npm test` | **127 checks passed** |

`docs/development/standards.md` §4 lists the four commands above as **G1–G4**, plus a
**G5 — Parity** row marked *"Not implemented"*. (Phase 1 corrected that table: it had
listed the non-existent parity gate as G4 and omitted the suite entirely.) Phase 2 does
**not** implement parity; it leaves the G5 row's status accurate and wires the four
gates that exist.

### 3.1 The pinning rule — the single most important decision here

**CI must be configured to pass on the current tree, then tightened in a separate
commit.**

If the first workflow fails on the 4 pre-existing lint warnings, the first thing that
happens is someone adds `--no-verify` or disables the job, and then there is no gate —
the outcome worse than having none. So:

- Commit A: the workflow, with the lint gate set to `--max-warnings 4`.
- Commit B: a separate, deliberate decision to reduce the count, lowering the ceiling
  with it.

The ceiling is **never** raised to make a build pass.

### 3.2 Deploy interaction — check before wiring

Vercel deploys this project, and **deploys are gated on the commit *author*, not the
token** — a fact recorded in the project's own tooling notes and the reason a
`blocked-deploy-author-gate` procedure exists. CI must not be assumed to be the
deploy trigger. `30-operations/deployment.md` (Phase 3) must read the Vercel project
rather than infer it from `vercel.json` [M: one catch-all rewrite to `/index.html`].

---

## 4. Deliverables

### 4.1 `.github/` (7 files)

| Path | What |
|---|---|
| `workflows/ci.yml` | The four gates on `push` to `main` and on `pull_request` |
| `PULL_REQUEST_TEMPLATE.md` | The PR description shape `docs/development/standards.md` §4 already asks for: PRD section, what changed, what was verified, what remains |
| `ISSUE_TEMPLATE/bug_report.md` | — |
| `ISSUE_TEMPLATE/feature_request.md` | — |
| `ISSUE_TEMPLATE/config.yml` | Points at the docs index rather than blank issues |
| `CODEOWNERS` | Path → owner. Must be a real GitHub handle, not a name |
| `dependabot.yml` | npm + GitHub Actions, weekly, grouped |

### 4.2 Repo root hygiene (6 files)

| Path | What | Note |
|---|---|---|
| `LICENSE` | Proprietary text for Call Indigo LLC | The README already asserts proprietary; this is the file behind the claim |
| `CONTRIBUTING.md` | Short — points at `docs/development/standards.md`, does not duplicate it | **A pointer, not a copy.** Two copies drift. |
| `SECURITY.md` | Reporting route + the honest scope | This repo has a real threat model (`admin-gate.md`); the file must say the gate is client-side and not access control |
| `.editorconfig` | LF, UTF-8, 2-space, final newline | Matches `.gitattributes` `* text=auto eol=lf` [M] |
| `.nvmrc` | The Node version CI uses | Must match `engines` and the CI matrix |
| `.gitignore` | Add `*.tsbuildinfo` if not covered | Already covered [M: `.gitignore`] — verify, do not duplicate |

### 4.3 `package.json` metadata

Add: `engines.node`, `repository`, `license`, `author`. Values must be real — an
`engines` field that does not match CI is a new lie in a pass whose purpose is
removing them.

---

## 5. Acceptance criteria

**T1 — The gates run**

- [ ] A PR that breaks the type checker shows a failing check.
- [ ] A PR that breaks the suite shows a failing check.
- [ ] The check names match the gate names in `docs/development/standards.md` §4.
- [ ] `main` cannot be merged into while a required check is red (**branch protection
      verified, not assumed** — see §6 R2).
- [ ] The workflow uses the pinned Node version from `.nvmrc`, not a floating `latest`.

**T2 — The pinning rule held**

- [ ] The lint gate is configured with an explicit `--max-warnings` ceiling equal to
      the measured count at the time of the commit, and the number is stated in the
      workflow with a comment explaining why it is not zero.
- [ ] The ceiling was never raised in this phase.

**T3 — The claim is true**

- [ ] `tests/README.md`'s *"It runs in CI"* sentence is verifiable against a file
      that exists. If the workflow's trigger set is narrower than the sentence
      implies, **the sentence is corrected**, not the workflow stretched.
- [ ] `docs/development/standards.md` §4's gate table matches the workflow exactly —
      same commands, same status column.

**T4 — A reviewer finds things**

- [ ] `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS`, `.editorconfig`,
      `.nvmrc` all exist at the paths GitHub expects.
- [ ] `CONTRIBUTING.md` contains no duplicated standards content — it links.
- [ ] `SECURITY.md` states plainly that the `/admin` gate is **not access control**,
      consistent with `admin-gate.md` §1 and the README.
- [ ] Opening a new issue offers the two templates, not a blank body.

**T5 — Reproducible install**

- [ ] `engines.node` in `package.json`, `.nvmrc`, and the CI matrix all state the
      **same** version.
- [ ] A clean `npm ci` on the pinned version passes all four gates.

**T6 — Nothing regressed**

- [ ] `npm test` still reports **127 checks**.
- [ ] No `src/` file is modified in this phase.
- [ ] All new files are LF (`tr -cd '\r' | wc -c` → 0).

---

## 6. Risks

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | The first red build is disabled to unblock, and the gate is gone | **High** | §3.1 — pass on the current tree first, tighten separately. State this in the workflow as a comment. |
| R2 | `main`'s protection state is unknown — the token's scopes include `repo` but protection is an org-policy question this plan did not test [M: master plan §8] | **High** | **Check it before relying on it.** If protection is unavailable, the gate is advisory and `docs/development/standards.md` §4 must say so rather than implying enforcement. |
| R3 | `CODEOWNERS` names a handle that does not exist, so review is never requested | Medium | Verify each handle against the org before merging; a `CODEOWNERS` that matches nobody fails silently. |
| R4 | CI and Vercel both trigger on `main` and the deploy gate is misunderstood | Medium | §3.2 — read the Vercel project. Do not assume CI passing means deployed. |
| R5 | `engines` pins a version the deploy platform does not offer | Low | Check the Vercel project's Node setting before pinning. |
| R6 | Dependabot opens a flood of PRs on a small repo | Low | Weekly, grouped, with a limit. |

---

## 7. Open questions

**Q1 — Which Node version is the target?**

Available here: 22.22.2 (managed) and 25.8.1 (system) [M: session environment]. Vite 7
and React 19 both support 20+. The lockfile does not declare one.

*Recommendation: pin **22 LTS**. It is the managed version, it is an LTS line, and it
is what the local toolchain already runs — so CI and the workstation agree, which is
the whole point. Revisit only when a dependency forces it.*

**Q2 — Is `LICENSE` a file the repo should have, given it is private?**

A private repo has no legal need for one, but the README asserts *"Proprietary — Call
Indigo LLC"* and a reader who sees the claim and finds no file learns the docs are
approximate.

*Recommendation: add a short proprietary `LICENSE` — all rights reserved, no
distribution. It costs five lines and makes an existing claim true. If the client
prefers, the alternative is to **delete the claim from the README** rather than leave
it unsupported; both are honest, and the current state is not.*

**Q3 — Does Phase 2 implement the PRD §13.2 parity harness (gate G4)?**

It is the highest-value missing capability in the repo (`tests/README.md`), but it
needs a real browser — a new dependency, in a repo that has shipped **zero new test
dependencies** by design [M: `tests/README.md` — "Zero new dependencies"].

*Recommendation: **no.** Keep Phase 2 about standards. The parity harness is a
capability project with its own risk profile (browser dependency, flake, CI runtime)
and belongs in its own PRD once CI exists to run it. Phase 2's job is to make the
*existing* gates enforced, not to add one.*

**Q4 — Should `CODEOWNERS` exist before there is a second contributor?**

`git log` shows one author across the last 30 commits [M: `git log -1 --format=%an`].

*Recommendation: yes, but as a single catch-all rule pointing at the org, not
per-path rules that imply a team structure that does not exist. A `CODEOWNERS` that
overstates the team is the same class of defect as F1.*

---

## 8. Dependencies

| Direction | Item |
|---|---|
| **Blocked by** | Phase 1 — CI asserts against the corrected docs |
| **Blocks** | Phase 5 — freshness assertions need a gate to fail in |
| **External** | GitHub org policy for branch protection (§6 R2); the Vercel project's Node setting (§6 R5) |

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| No `.github/` | `ls .github` → absent |
| 9 hygiene files missing | presence check over 11 paths |
| The suite is 127 checks | `npm run test:only` |
| Lint is 0 errors, 4 warnings | `README.md` §"Verified clean on this commit" |
| `tests/README.md` claims CI | `tests/README.md:53` |
| The four gate commands | `package.json` scripts |
| `vercel.json` is one catch-all rewrite | `vercel.json` |
| One author across 30 commits | `git log -1 --format='%an <%ae>'` |
| `package.json` has no `engines`/`repository`/`license` | `grep -E '"(engines\|…)"' package.json` → none |
| `.gitattributes` normalises to LF | `.gitattributes` line 2 |
