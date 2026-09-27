# Developer Flow Standards

**Kind:** living · **Owner:** the repo · **Asserted by:** `tests/docs.mjs` (the section
numbers and the redirect table), `tests/policy.mjs` (the rules they describe)

How we work on this project. Read this before your first PR.

> **Moved here 2026-09-27** from `docs/README.md`, which is now the docs index. The
> twelve section numbers below are unchanged, so an older `§n` citation still resolves
> by content. See `docs/README.md` → *Section redirects*.

---

## 1. Evidence-based development

Every claim in a document must be checkable. This is the repo's founding rule.

- Values marked **[M]** are **measured** — read out of a file in this workspace,
  with the path given.
- Values marked **[P]** are **proposed** by a document and have no prior existence
  in the repo; they are always flagged and carry an open question.
- Where the repo and a document disagree, the repo wins. The document is the bug.

If you write a number in a doc or a comment, you must have measured it. "Looks
about 200px" is not a measurement.

**A number also carries its producer.** Write *"`<value>` checks — `npm run test:only`,
`<date>`, at `<sha>`"*, never a bare number. A claim with a producer can be
re-run; a claim without one can only be believed. Two documents in this repo stated
`67 checks` long after the suite had passed 100, and neither had a command attached
to it. **And a living document states no value at all** — run the command.

---

## 2. Branch strategy

| Branch | Purpose |
|---|---|
| `main` | The release branch. Always buildable. Tagged at each release. |
| `feat/<scope>` | Feature work. Branch from `main`, PR back to `main`. |
| `fix/<scope>` | Bug fixes. Same flow as features. |
| `docs/<scope>` | Documentation-only changes. Same flow. |

**Scope names** use kebab-case and match the PRD section or component being worked
on: `feat/admin-settings`, `feat/parity-harness`, `fix/footer-admin-link`.

### Branch lifecycle

1. Branch from `main`.
2. Work in small commits. Each commit should compile.
3. Push and open a PR when the work is reviewable.
4. Delete the branch after merge.

> **⚠️ Documented, not yet practised.** [M: `git branch -a` → `main` only; the last
> 30 commits are linear on `main`.] The flow above is the target. Today commits go
> straight to `main` with the paperwork as a second `docs(changelog)` commit citing
> the first. This note exists so a new contributor follows what the repo does rather
> than what this section says. Closing the gap — or adopting the flow — is Phase 2 of
> `docs/prd/phase-2-repo-standards-and-ci.md`.

---

## 3. Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body — optional, for non-trivial changes>

<footer — optional, for breaking changes or issue refs>
```

### Types

| Type | Use for |
|---|---|
| `feat` | New feature or component |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, no code change |
| `refactor` | Code restructuring, no behaviour change |
| `test` | Adding or updating tests |
| `chore` | Build, deps, config, tooling |
| `ci` | CI/CD pipeline changes |

### Scope

The scope is optional but recommended. Use the PRD section number, component name,
or route: `feat(admin-settings)`, `fix(§12-footer)`, `docs(readme)`.

### Subject

- Imperative mood: "add", "fix", "update", not "added" or "fixes".
- Lowercase, no trailing period.
- Max 72 characters.

### Examples

```
feat(admin): scaffold sidebar-08 block and admin layout

fix(§12): use root-relative /admin path in footer link

docs: add developer flow standards

chore: configure @tailwindcss/vite in vite.config.ts
```

### Writing the message on Windows

Commit messages go in **`.git/COMMIT_MSG.txt`** and are applied with
`git commit -F .git/COMMIT_MSG.txt`. A heredoc mangles `\[` and `${}` in a shell,
and git cannot read an MSYS `/tmp` path.

### The two-commit paperwork convention

A change that a reader of `CHANGELOG.md` needs to know about is **two commits**:

1. The change itself — `feat(…)`, `fix(…)`, `docs(…)`. **Must not touch
   `CHANGELOG.md`.**
2. `docs(changelog): record <what> and cite <sha>` — `CHANGELOG.md` only.

The second commit cites the first by SHA, which is only possible after the fact.
That is the point: the changelog describes what actually landed, not what was
intended.

---

## 4. PR flow

### Before opening a PR

1. **Rebase on `main`** — no merge commits into features. Keep history linear.
2. **Run the type checker** — `npm run typecheck` must pass with zero errors.
3. **Run the linter** — `npm run lint` must report zero errors. Warnings in
   generated registry files are expected; anything else is not.
4. **Run the build** — `npm run build` must succeed.
5. **Run the verification suite** — `npm test`. It renders every public route and
   asserts against the output, so "it type-checks" is not evidence that it works;
   "the suite is green" is. It still cannot see layout — see §5.
6. **Check the acceptance criteria** — if your PR implements a PRD section,
   verify every checkbox in §14 that your work covers.
7. **Write a PR description** that links to the PRD section and lists what changed,
   what was verified, and what remains.

### Gates

| Gate | What it checks | Command | Status |
|---|---|---|---|
| G1 — Type check | TypeScript compiles | `npm run typecheck` | Active |
| G2 — Lint | ESLint, zero errors | `npm run lint` | Active |
| G3 — Build | Vite production build succeeds | `npm run build` | Active |
| G4 — Verification suite | every check in `tests/` against rendered output | `npm test` | Active |
| G5 — Parity (marketing routes only) | React renders match static prototype | `npm run test:parity` | **Not implemented** — see §5 |

A PR is not mergeable until all applicable gates pass. G5 is not yet a gate because
the browser harness has not been adapted; until it is, parity is verified by hand
and the method recorded in the PR description.

> **The gates are not enforced by CI yet.** [M: no `.github/` directory.] They run
> when a person types the command. Making them enforced is Phase 2 of
> `docs/prd/phase-2-repo-standards-and-ci.md`.

### After merge

- Tag the merge commit if it's a release: `git tag -a v2.0.rc1 -m "rc1 release"`.
- Delete the feature branch.
- Update the CHANGELOG if the release was tagged.

---

## 5. Testing & verification

```bash
npm test          # build, then run every suite
npm run test:only # run the suites against the last build — DOES NOT REBUILD
```

Both exit non-zero on failure, so either works as a gate. **CI runs `build` then
`test:only`.**

**Full detail: [`testing.md`](./testing.md)** — the module list, how the harness works,
the traps each helper exists to avoid, and **what the suite cannot see**. This is the
policy.

**The check count is deliberately not written down.** It grows with every round, and a
copy of this document that read "67 checks" was wrong within a day of being written —
and stayed wrong for 60 checks. Read the total from the run.

### When to write a unit test

Non-trivial logic gets a unit test. Presentational components verified by the
rendered-markup suite do not need one.

`src/marketing/service-area.ts` is the model to follow: the ZIP decision was pulled out
of the hook into a pure function **precisely so it could be asserted without a DOM**,
and `tests/service-area.mjs` covers its boundaries. Extract the decision, then test the
decision — not the component that renders it.

### What is still verified by hand

Anything the suite cannot reach. Measurements go in prose, with numbers, per §1.

| Area | Method | In the suite? |
|---|---|---|
| Layout parity (PRD §13.2) | Compare computed styles at a fixed viewport, not screenshots | No — needs a browser |
| Scroll-reveal animation | Confirm in a real tab; `IntersectionObserver` does not fire headlessly | No |
| Console cleanliness | Visit every route and read the console | No — the suite never boots a browser |
| Dashboard CRUD | Drive the real UI end to end, read the storage key back, reload | No — `useApiData` pages render as skeletons |
| Marketing markup | Diff generated markup against `valvoro-prototype/*.html` | Yes, behaviourally |
| Design-system completeness | Assert every class used in the markup exists in the compiled CSS | Yes |
| Routes, anchors, images, ids | Visit every route and check each destination resolves | Yes |

**The §13.2 thresholds are unchanged** — ±1px per landmark box, ±0.5% page height,
≤0.5% of pixels differing by >8/255 per channel, and hard zeros for console errors,
broken images, dead anchors and horizontal overflow. They are listed in full in
[`testing.md` §4.1](./testing.md#41-layout-parity-prd-132).

**They have not been re-measured since the copy changed.** The marketing copy was
de-duplicated, so the three pages are no longer textual duplicates of the prototype and
§13.2 has to be re-measured rather than inherited. Two things can move: the
absolutely-positioned hero `.navy-box`, `.years-experience-con` badge and `.plumber-img`
overlay, which sit against a flow height the shortened sentences changed; and
`/contact`, which shares the footer whose copy was edited. Re-running §13.2 before
sign-off is the outstanding item.

### A caveat about headless previews

**A headless preview is not a browser.** In this workspace's preview context,
`IntersectionObserver` never fires (even for a fixed, in-viewport probe element) and
CSS transitions never advance, because the page is not being painted. Content gated
behind a scroll reveal therefore reads as `opacity: 0` and looks broken when it is not.

**Before reporting such a thing as a bug, check the cascade directly:** suppress the
transition (`el.style.transition = 'none'`), add the state class, force a reflow, and
read the computed value. If it reaches the expected value, the cascade is correct and
the animation clock — not the code — is the problem. Confirm the animation itself in a
real browser tab.

---

## 6. Component policy (PRD §7)

### The rule

**Every component rendered under `/admin` must come from the shadcn CLI.**

```bash
npx shadcn@latest add <component>
```

Components are not hand-written, not copied from a blog, not re-implemented.

### Enforcement

| Check | How | When |
|---|---|---|
| **Provenance** | Re-add with `npx shadcn@latest add --all --overwrite` in a scratch worktree; diff must be empty | Pre-merge gate |
| **Import discipline** | No `src/admin/**` file may import from `src/marketing/**` | Pre-merge grep |
| **Route count** | `/admin` routes match `src/admin/routes.ts` exactly, and `/admin/*` has no catch-all page — unknown paths redirect (§5.2, `docs/dashboard-scope.md`) | Pre-merge assertion |
| **Nav model** | Every `/admin` page is listed in `src/admin/routes.ts` — a page cannot exist without a sidebar entry and a breadcrumb | Pre-merge review |
| **Auth boundary** | No server session, token or `/admin/login` route may appear, and the credential digests live in `src/admin/auth.ts` alone (§6, `docs/admin-gate.md`) | Pre-merge assertion |
| **Storage containment** | Only `src/lib/data/backend.ts` may reference `localStorage`, and only `src/admin/auth.ts` may reference `sessionStorage`; every other file goes through `src/lib/data/api.ts` | Pre-merge grep |
| **Design-system coverage** | Every component class used in the marketing markup is defined in `src/index.css` — the count of missing classes must be zero | Pre-merge script |

### Custom-component exceptions

If a dashboard requirement cannot be met by a registry component, open an
exception in `docs/component-exceptions.md` with all five fields completed (PRD §7.5).
A missing field is a rejection.

### Marketing components

The marketing front end (`/`, `/residential`, `/commercial`) remains bespoke. The
registry-only rule applies to `/admin` and to `/admin` alone (PRD §8).

---

## 7. Design tokens (PRD §6)

**Full detail: [`design-tokens.md`](./design-tokens.md).**

The four rules, in one place:

- **`src/index.css` is the only source.** No other file declares a brand token, and
  the suite asserts it.
- **Keep hex as-is. Do not "modernise" to OKLCH.** Mixing the two encodings is how a
  palette silently drifts (PRD §6.2).
- **shadcn components read `--primary`, `--foreground`, `--muted` — not brand
  tokens.** The bridge is the `:root` block. A registry component needing an unmapped
  token gets the mapping added in `:root`, never in the component.
- **`src/admin/mock/tokens.ts` is a display fixture, not a source.** The Design System
  page reads it for display only (PRD §11), and it is labelled a mock.

---

## 8. CSS pipeline

**Full detail: [`css-pipeline.md`](./css-pipeline.md).**

Tailwind CSS **v4** via `@tailwindcss/vite`. There is **no** `tailwind.config.js`, no
`postcss.config.js`, no `tailwindcss-animate`, and no `@tailwind` directive — use
`@import "tailwindcss"`. **If a guide references any of those, it is describing v3 and
does not apply here.**

> ⚠️ **Preflight drift.** The Vite plugin emits its own preflight, which can shift a
> box by **1–2px** against the Tailwind browser build the static prototype used. That
> drift is the single most likely cause of a parity failure (PRD §13.3). **Measure
> landmark boxes, not screenshots** — a sheet scaled to fit is a poor instrument for a
> crop.

> ⚠️ **The class-coverage check reads `dist/`.** `npm run test:only` does not rebuild,
> so it will validate a **stale** stylesheet. Build first, or use `npm test`.

---

## 9. File organisation

### Where things go

| Content | Location |
|---|---|
| Brand images, logos, favicons | `public/assets/images/` |
| Registry components | `src/components/ui/` |
| Sidebar block files | `src/components/` (root — they are block, not ui) |
| Bespoke marketing components | `src/marketing/` |
| Admin pages | `src/admin/` |
| Dashboard gate (client-side, prototype) | `src/admin/auth.ts` — see `docs/admin-gate.md` |
| Mock fixtures (design-token display only) | `src/admin/mock/` |
| Dashboard data layer | `src/lib/data/` — see `docs/dashboard-scope.md` |
| Shared utilities | `src/lib/` |
| Shared React hooks | `src/hooks/` |
| Verification scripts | `tests/` — see `tests/README.md` |
| Documentation | `docs/` — start at the index, `docs/README.md` |
| Past work / reference | `archive/` |

### Import rules

- `@/*` resolves to `src/*`. Always use it.
- `src/admin/**` may not import from `src/marketing/**` (PRD §7.4.2).
- `src/marketing/**` may not import from `src/admin/**`.
- Pages may not import `@/lib/data/backend` directly — they go through
  `@/lib/data/api`, so the storage engine stays replaceable (§16.2 F2).

---

## 10. Release process

1. **Verify acceptance criteria** — every checkbox in PRD §14 for the release scope.
2. **Tag the merge commit** — `git tag -a vX.Y.Z -m "release message"`.
   - Use `git mktag` if the sandbox's loose-ref bug is active (see user memory).
   - Get the timestamp from `date +%s` / `date +%z`, never by hand.
   - Push by SHA: `git push origin <tagsha>:refs/tags/vX.Y.Z`.
   - Verify: `git ls-remote origin refs/tags/vX.Y.Z`.
3. **Update CHANGELOG.md** — add the release entry with date and scope.
4. **Deployment log** — record the SHA, tag, and what was deployed, in a separate
   pass *after* the fact so it can cite real SHAs.

---

## 11. Working with the archive

The `archive/` directory holds all past work. It is reference material, not active
code.

- **Do not edit files in `archive/`** during normal development.
- **The audit harness** (`archive/audit/v1-audit/v2check/`) still holds the only
  browser-driving scripts (`verify.py`, `diag.py`, `mincontent.py`, `shots.py`).
  `tests/` did not adapt them — it went headless with `react-dom/server` instead.
  If the §13.2 pixel thresholds need measuring again, that harness is where the
  code to do it lives.
- If you need a script from the archive, copy it into `tests/` and adapt it — do
  not run it in place.

### The baseline prototype exists twice

`valvoro-prototype/` at the repo root and
`archive/v1-prototype/valvoro-prototype/` are the **same files** — the HTML, CSS,
JS and ground-truth docs are byte-identical.

**Use the root copy.** `.gitignore` excludes images under `archive/**`, so the
archived copy ships without its 79 brand images and is not self-contained. The root
copy is fully tracked. Before changing either, confirm which one your tooling
resolved; a diff against the wrong copy is a five-minute detour at best.

Note also that `css/tw.css` — described in `archive/README.md` as a "stale Tailwind
mirror" — is in fact the source of the marketing design system that was ported into
`src/index.css`. It is stale as a *build input*, not as a design reference.

---

## 12. Common pitfalls

Recorded from experience in this workspace and Jaden's broader conventions.

| Pitfall | Mitigation |
|---|---|
| Using the workspace's `modern-web-app` scaffold | It ships Tailwind v3.4.19 + `tailwind.config.js`. Do not use it. Bootstrap per PRD §4.2. |
| Assuming `git diff` against HEAD is accurate | On a stale checkout, diff against the intended base SHA: `git diff <base-sha> --stat`. |
| Trusting `git status` on a stale checkout | Compare blob SHAs per path with `git ls-tree -r <base>` vs `git ls-files -s`. |
| Batching parallel `Edit` calls on the same file | They race — the last writer wins, silently. Edit one file sequentially. |
| Using `grep -c` in a `&&` chain | `grep -c` exits 1 when count is 0, breaking the chain. Use `\|\| true` or `;`. |
| Counting CR bytes with `grep -c $'\r'` | An unexpanded `$'\r'` is an empty pattern that matches **every** line. Count bytes: `tr -cd '\r' \| wc -c`. |
| Hardcoding Unix timestamps | Use `date +%s` / `[DateTimeOffset]::Now.ToUnixTimeSeconds()`. |
| Trusting a headless preview for animation or scroll behaviour | `IntersectionObserver` and CSS transitions do not run there. Verify the cascade directly, then confirm in a real tab — see §5. |
| Adding an `@/admin/**` import of `@/lib/data/backend` | Pages import `@/lib/data/api`. `backend.ts` is the swappable storage engine (PRD §16.2 F2). |
| Writing a guard that cannot see its target | A source-text scan cannot see a CSS rule, a probe that prints its own array cannot see the DOM, and a scan of `src/` cannot see `README.md`. **Every check must be negative-controlled** — run it against a fixture that contains the defect and confirm it fails. |
