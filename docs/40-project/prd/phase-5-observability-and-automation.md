# PRD — Phase 5: Observability & Automation

**The documentation starts failing loudly instead of drifting quietly**

**Kind:** dated · **Status:** in progress · **Release:** continuous ·
**Last verified:** 2026-09-27 at `2f009a2`

| | |
|---|---|
| **Document** | `docs/prd/phase-5-observability-and-automation.md` |
| **Phase** | 5 of 5 — the closing phase |
| **Release target** | **Continuous** (begins after Phase 2) |
| **Status** | Proposed — for review |
| **Date** | 2026-09-27 |
| **Base commit** | `2f009a2` + Phases 1–4 |
| **Depends on** | Phase 2 (a CI gate to fail in), Phase 4 (the wiki to check) |
| **Blocks** | — |
| **Master plan** | `docs/plan-docs-refactor-2026-09-27.md` §4 P2/P3, §10 |
| **Scope** | Assertions, link checks, deploy log, coverage metrics. **No product-behaviour change.** |

---

## 0. Evidence rule

**[M]** = measured, path or command given. **[P]** = proposed here, carries an open
question in §7.

---

## 1. Summary

Phases 1–4 make the documentation *true* and *findable*. Phase 5 makes it **stay**
true.

The failure this phase exists to prevent is the repo's own most-repeated defect. It
has now occurred three times, in three different layers:

1. A source-text guard could not see a CSS rule, so the mobile Emergency card was
   broken for weeks while the changelog claimed it worked.
2. A probe built its list from a hardcoded array and then printed that array, so it
   reported the same result whatever the DOM did.
3. `tests/auth.mjs` scanned `src/` for *"there is no authentication"* — and `README.md`
   is not under `src/`, so the guard was blind to the highest-traffic copy of the
   claim it was written to catch. **That is F1, and it survived a release.**

The pattern is one sentence: **an assertion that cannot see the thing it claims to
check passes forever.** Every check this phase adds must be negative-controlled — run
against a fixture that *does* contain the defect, and required to fail. A check that
has never been seen to fail is not a check.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal | Proven by |
|---|---|---|
| G1 | A stale claim fails the suite | A fixture containing the defect makes the check red |
| G2 | Every check added here is negative-controlled | Each has a paired positive test that feeds it the defect |
| G3 | A dead link fails the suite | Same |
| G4 | A deploy is recorded without a human retyping a SHA | The deploy log is generated |
| G5 | Doc coverage is a number, not an impression | A count, printed by the run |
| G6 | The wiki cannot drift undetected | A page whose source moved is reported |

### 2.2 Non-goals

| Out of scope | Why |
|---|---|
| The PRD §13.2 browser parity harness | A capability project with its own dependency and flake profile — its own PRD (Phase 2 Q3) |
| Re-checking pixel thresholds | Needs the browser harness above |
| Enforcing doc style with a linter | The conventions in `00-meta/conventions.md` are for humans; a style linter on prose is churn |
| Auto-fixing stale claims | A machine that rewrites a claim can make it wrong in a new way. The suite **reports**; a human corrects. |

---

## 3. What gets asserted

### 3.1 The claim registry — the core mechanism

A single machine-readable file lists every **living** claim: the document, the claim's
identity, the command that produces the truth, and the expected shape.

```
docs/00-meta/claims.json
  { "doc": "README.md", "id": "suite-count",
    "producer": "npm run test:only",
    "expect": "last line matches /^(\\d+) checks passed$/" }
```

The suite reads the registry, runs each producer, and compares. **The registry is the
guard, and the registry is testable**: a fixture claim with a deliberately wrong
expectation must make the run red. Without that, the registry is the same
cannot-see-the-target defect wearing a new hat.

### 3.2 What the registry covers

| Claim | Producer | Why it is living |
|---|---|---|
| The suite's check count | `npm run test:only` | The README stated 67 for 60 checks' worth of releases (F2) |
| The build's module count and bundle sizes | `npm run build` | Stated in the README status block |
| The lint warning count | `npm run lint` | The CI ceiling in Phase 2 depends on it |
| The route table | `src/App.tsx` | `README.md` and `docs/60-reference/routes.md` both state it |
| The doc count vs the index | `docs/**/*.md` vs `docs/README.md` | Phase 1 T2 |
| The `/admin` route count | `src/admin/routes.ts` | Stated in three documents |
| Dead scaffolding is still unreferenced | repo-wide import grep | `README.md`'s Dead scaffolding section |

### 3.3 Link integrity

- Every relative link in every `.md` resolves to a file that exists.
- Every `#anchor` resolves to a heading that exists.
- Every `docs/…` path referenced from `CHANGELOG.md` that is *not* a historical
  citation resolves — the historical ones are exempted by an explicit allowlist, not
  by a loose pattern.

### 3.4 Wiki drift

- Each wiki page's stamped source commit is compared with the current commit for its
  source file. A page behind its source is **reported**, not silently tolerated.

### 3.5 Doc coverage

Two numbers, printed by the run:

- **Documented:** files under `src/` that a document names by path.
- **Orphaned:** documents under `docs/` that nothing links to.

Neither has a pass/fail threshold — they are **metrics**, and the value is the trend,
not the number. A threshold on a metric like this produces a document written to
satisfy a counter, which is the failure R3 in Phase 3.

### 3.6 The deploy log

A generated file, `docs/30-operations/deploy-log.md`, appended by a script from the
Vercel deployment record plus the commit SHA. It replaces a hand-written paragraph in
`CHANGELOG.md`, and it is the difference between *"we deployed"* and *"this SHA is
serving, confirmed"*.

---

## 4. Deliverables

| Path | What |
|---|---|
| `docs/00-meta/claims.json` | The claim registry |
| `tests/docs.mjs` | The registry runner, the link check, the coverage metrics |
| `tests/fixtures/stale-claims/` | The negative-control fixtures — one per claim kind |
| `scripts/_wiki_drift.cjs` | Compares wiki page stamps against source commits |
| `scripts/_deploy_log.cjs` | Generates the deploy log |
| `docs/30-operations/deploy-log.md` | Generated, dated, appended |
| `docs/30-operations/observability.md` | What is asserted, what is a metric, what is still manual |
| `.github/workflows/ci.yml` | Extended: the new suite joins the four gates |

---

## 5. Acceptance criteria

**T1 — Every check is negative-controlled**

- [ ] For each check added in this phase, there is a fixture that **contains the
      defect**, and a test proving the check goes red against it.
- [ ] The run prints, for each check, whether its control was exercised. A check whose
      control did not run is reported as **UNCONTROLLED**, not as passed.
- [ ] The registry itself is controlled: a fixture claim with a wrong expectation
      makes the run red.

**T2 — The specific regressions cannot return**

- [ ] Re-inserting *"No authentication. `/admin` is reachable by anyone with the URL."*
      into `README.md` fails the run.
- [ ] Replacing the README's check count with `67` fails the run.
- [ ] Adding an unlinked document under `docs/` fails the index count check.
- [ ] Breaking one relative link fails the run.
- [ ] Adding an import of `src/components/nav-main.tsx` fails the dead-scaffolding check.

**T3 — Metrics are reported, not enforced**

- [ ] The run prints: documents, orphaned documents, documented `src/` files, dead
      links, wiki pages behind source.
- [ ] None of the five has a pass/fail threshold, and the run says so in one line.

**T4 — The deploy log is generated**

- [ ] `docs/30-operations/deploy-log.md` is produced by a script from the deployment
      record and the commit SHA — no hand-typed SHA.
- [ ] The script **refuses to write** an entry it cannot confirm against the served
      artifact, and reports that refusal rather than writing a guess.
- [ ] `CHANGELOG.md` links the log rather than restating it.

**T5 — Nothing regressed**

- [ ] The four existing gates still pass; the suite total is 127 **plus** the new
      checks, and the new total is read from the run.
- [ ] No `src/` file is modified.
- [ ] All new files are LF.

---

## 6. Risks

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | A check that cannot fail is added and trusted | **High** | T1 — every check is negative-controlled, and an uncontrolled check reports as UNCONTROLLED. This is the whole phase. |
| R2 | The registry becomes a second place the truth lives | Medium | The registry stores the **producer command**, never the value. A registry that stores `127` is F2 again. |
| R3 | A metric acquires a threshold and becomes a target | Medium | T3 — metrics have no threshold, stated in the run's own output. |
| R4 | The deploy-log script writes an unverified entry | **High** | T4 — it refuses and reports, rather than guessing. A confident wrong deploy log is worse than none. |
| R5 | Suite runtime grows enough that people skip it | Medium | The link check and metrics are fast; the producer commands already run in `npm test`. Do not add a browser. |
| R6 | The negative-control fixtures are themselves stale and stop exercising the check | Medium | Each fixture is asserted to still contain the defect it was built for — a fixture that has been "fixed" fails the run. |

---

## 7. Open questions

**Q1 — Does the claim registry belong in the repo, or in the suite?**

`tests/` currently holds everything verification-related, and `docs/` holds documents.

*Recommendation: **the registry is data, so it lives with the data it describes** —
`docs/00-meta/claims.json` — and the runner lives in `tests/docs.mjs`. The registry is
reviewed by whoever changes a document, which is the right moment for a claim to be
updated; a registry inside `tests/` is reviewed by whoever changes tests.*

**Q2 — Should the coverage metrics be published anywhere, or only printed?**

*Recommendation: **printed by the run, and summarised in `30-operations/observability.md`
as a dated reading** — pattern P3. A dashboard is a Phase 6 question; a metric nobody
looks at is not an improvement.*

**Q3 — Does `CHANGELOG.md` lose its deployment paragraphs to the deploy log?**

The changelog currently carries deployment prose [M: `c44dfdf` — *"record the
deployment and verify it against the served artifact"*].

*Recommendation: **the changelog keeps its prose; the log carries the table.** They
answer different questions — the changelog says what was released and why, the log
says which SHA is serving. Do not delete the prose; link the table from it.*

**Q4 — When is this phase done?**

It is continuous by design, so "done" needs a definition that is not "never".

*Recommendation: the phase is done when §3.1–§3.4 are asserted and controlled. §3.5's
metrics and §3.6's log run continuously and are not exit criteria. This is the last
open question of the whole plan, and answering it is what closes the milestone
(master plan §10).*

---

## 8. Dependencies

| Direction | Item |
|---|---|
| **Blocked by** | Phase 2 (CI), Phase 4 (the wiki to check drift against) |
| **Blocks** | — |
| **External** | Vercel API access for the deploy log; a token scope that can read deployments |

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| The suite is 127 checks | `npm run test:only` |
| The mobile-card guard could not see a CSS rule | `overview.md` §"Two findings"; `CHANGELOG.md` v1.0.1 correction |
| The probe printed a hardcoded array | `overview.md` §"Two findings" |
| `tests/auth.mjs` scans `src/` only | `tests/auth.mjs` |
| `README.md:218` survived that guard | `grep -n 'No authentication' README.md` |
| The deploy was recorded by hand | `CHANGELOG.md`, `c44dfdf` |
| Dead scaffolding is unreferenced | repo-wide import grep |
