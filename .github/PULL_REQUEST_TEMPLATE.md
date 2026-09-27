# Pull request

<!--
  The shape below is what docs/20-development/standards.md §4 asks for. It is short on
  purpose: a PR that cannot fill it in is a PR whose scope is not yet clear.
-->

## What this changes

<!-- One paragraph. What is different after this merges? -->

## Why

<!--
  The problem this solves, or the decision it implements. If it implements a PRD
  section, link it. If it departs from the PRD, say so here and reconcile it in
  docs/60-reference/dashboard-scope.md the way that file already does.
-->

## Gates

<!-- Tick what you ran. "It type-checks" is not evidence that it works. -->

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors, warnings within the ceiling
- [ ] `npm run build` — succeeds
- [ ] `npm test` — suite passes; total is ____ checks

## Verification

<!--
  HOW do you know it works? Numbers, commands, or a description of what you exercised
  by hand. This project's founding rule is that every claim is checkable
  (docs/20-development/standards.md §1), and a PR description is a document.

  If the suite cannot reach it — layout, animation, dashboard CRUD, the sign-in gate —
  say what you did instead and what you did NOT verify.
-->

## Not verified

<!-- Anything you deliberately left unverified, and why. An honest gap beats a claim. -->

## Checklist

- [ ] No file under `src/` was modified by a docs-only change
- [ ] No `src/admin/**` file imports from `src/marketing/**` (or vice versa)
- [ ] Pages still reach the data layer through `@/lib/data/api`, never `backend`
- [ ] `CHANGELOG.md` is **not** touched in this commit — it is the separate paperwork
      commit that cites this one's SHA (docs/20-development/standards.md §3)
