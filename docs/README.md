# Developer Flow Standards

How we work on this project. Read this before your first PR.

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

---

## 4. PR flow

### Before opening a PR

1. **Rebase on `main`** — no merge commits into features. Keep history linear.
2. **Run the type checker** — `npm run typecheck` must pass with zero errors.
3. **Run the linter** — `npm run lint` must report zero errors. Warnings in
   generated registry files are expected; anything else is not.
4. **Run the build** — `npm run build` must succeed.
5. **Exercise the change by hand** — see §5. There is no automated suite yet, so
   "it type-checks" is not evidence that it works.
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
| G4 — Parity (marketing routes only) | React renders match static prototype | `npm run test:parity` | **Not implemented** — see §5 |

A PR is not mergeable until all applicable gates pass. G4 is not yet a gate
because the harness has not been adapted; until it is, parity is verified by hand
and the method recorded in the PR description.

### After merge

- Tag the merge commit if it's a release: `git tag -a v2.0.rc1 -m "rc1 release"`.
- Delete the feature branch.
- Update the CHANGELOG if the release was tagged.

---

## 5. Testing & verification

### Parity testing (PRD §13)

The React build must reproduce the three marketing pages as exact duplicates of
the static prototype. The parity harness is adapted from `archive/audit/v1-audit/v2check/`.
`tests/README.md` is the authoritative plan for it:

| Script | Purpose | Adapted from |
|---|---|---|
| `parity.py` | Pixel-diff React renders vs. static screenshots at 1920 / 1440 / 390 | New — wraps `shots.py` |
| `verify.ts` | Link, anchor, image, active-nav assertions | `v1-audit/v2check/verify.py` |
| `diag.ts` | Landmark box measurement (`.pad-rl`, `.mbox`, `.slab`, `.shell`) | `v1-audit/v2check/diag.py` |
| `mincontent.ts` | Min-content spill detection | `v1-audit/v2check/mincontent.py` |

### Parity thresholds (PRD §13.2)

- **Layout:** every landmark box within ±1px at every viewport.
- **Page height:** within ±0.5%.
- **Pixels:** no more than 0.5% of pixels differing by more than 8/255 per channel.
- **Hard zeros:** console errors, broken images, dead anchors, horizontal overflow.

### Unit tests

When component logic is non-trivial, write a unit test. For presentational
components that are verified by the parity harness, unit tests are optional.

**There is currently no test runner and no runnable tests.** `tests/` contains a
single `README.md` describing the plan above; none of those scripts exist yet, and
`npm run test:parity` is not a script in `package.json`. Adding one is the highest-
value thing anyone can do to this repo.

### What is actually verified today

Until the harness lands, verification is manual and is expected to be described in
prose with measurements, per §1. The methods that have proved useful here:

| Area | Method |
|---|---|
| Marketing parity | Diff generated markup against `valvoro-prototype/*.html`, then compare **computed styles** at the same viewport rather than screenshots |
| Design-system completeness | Assert every component class used in the markup exists in the compiled CSS |
| Dashboard CRUD | Drive the real UI end to end, then read the storage key back and reload to confirm it survived |
| Routes | Visit every route and check the console for errors and warnings |

### A caveat about headless previews

**A headless preview is not a browser.** In this workspace's preview context,
`IntersectionObserver` never fires (even for a fixed, in-viewport probe element)
and CSS transitions never advance, because the page is not being painted. Content
gated behind a scroll reveal therefore reads as `opacity: 0` and looks broken when
it is not.

Before reporting such a thing as a bug, check the cascade directly: suppress the
transition (`el.style.transition = 'none'`), add the state class, force a reflow,
and read the computed value. If it reaches the expected value, the cascade is
correct and the animation clock — not the code — is the problem. Confirm the
animation itself in a real browser tab.

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
| **Auth negative** | Grep build for login/session/token/auth route or provider code; expect zero | Pre-merge grep |
| **Storage containment** | Only `src/lib/data/backend.ts` may reference `localStorage`; every other file goes through `src/lib/data/api.ts` | Pre-merge grep |
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

### One source of truth

All brand tokens live in `src/index.css`. There is no other copy.

- Do not duplicate tokens in component files.
- Do not create a `tokens.ts` that shadows the CSS — the Design System page reads
  from a fixture for display purposes only (PRD §11), and that fixture is clearly
  labelled as a mock.
- If you need a new token, add it to `@theme` in `src/index.css` and document why.

### Colour encoding

Keep hex values as-is. Do not "modernise" them to OKLCH. Mixing the two encodings
is how a palette silently drifts (PRD §6.2).

### shadcn semantic mapping

shadcn components read `--primary`, `--foreground`, `--muted`, etc. — not brand
tokens. These are mapped in `:root` and exposed via `@theme inline` (PRD §6.3).
If you add a registry component that needs a token not yet mapped, add the mapping
in `:root`, not in the component.

---

## 8. CSS pipeline

### Tailwind v4, not v3

This project uses Tailwind CSS v4 via `@tailwindcss/vite`. There is:

- No `tailwind.config.js`
- No `postcss.config.js`
- No `tailwindcss-animate` (use `tw-animate-css` if needed)
- No `@tailwind` directives — use `@import "tailwindcss"`

If a tool or guide references any of those, it is describing v3 and does not apply
here.

### Preflight

The Vite plugin emits its own preflight. This can shift a box by 1–2px compared to
the Tailwind browser build the static prototype used. That drift is the single most
likely cause of a parity failure (PRD §13.3). Measure landmark boxes, not screenshots.

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
| Mock fixtures (design-token display only) | `src/admin/mock/` |
| Dashboard data layer | `src/lib/data/` — see `docs/dashboard-scope.md` |
| Shared utilities | `src/lib/` |
| Shared React hooks | `src/hooks/` |
| Verification scripts | `tests/` (planned — adapted from `archive/audit/v1-audit/v2check/`) |
| Documentation | `docs/` |
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
- **The audit harness** (`archive/audit/v1-audit/v2check/`) contains scripts that
  will be adapted into `tests/` — see `tests/README.md`.
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
| Hardcoding Unix timestamps | Use `date +%s` / `[DateTimeOffset]::Now.ToUnixTimeSeconds()`. |
| Trusting a headless preview for animation or scroll behaviour | `IntersectionObserver` and CSS transitions do not run there. Verify the cascade directly, then confirm in a real tab — see §5. |
| Adding an `@/admin/**` import of `@/lib/data/backend` | Pages import `@/lib/data/api`. `backend.ts` is the swappable storage engine (PRD §16.2 F2). |
