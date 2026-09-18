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
2. **Run the type checker** — `npx tsc --noEmit` must pass with zero errors.
3. **Run the build** — `npm run build` must succeed.
4. **Check the acceptance criteria** — if your PR implements a PRD section,
   verify every checkbox in §14 that your work covers.
5. **Write a PR description** that links to the PRD section and lists what changed,
   what was verified, and what remains.

### Three gates (adapted from Jaden's release conventions)

| Gate | What it checks | Command |
|---|---|---|
| G1 — Type check | TypeScript compiles | `npx tsc --noEmit` |
| G2 — Build | Vite production build succeeds | `npm run build` |
| G3 — Parity (marketing routes only) | React renders match static prototype | `npm run test:parity` *(when implemented)* |

A PR is not mergeable until all applicable gates pass.

### After merge

- Tag the merge commit if it's a release: `git tag -a v2.0.rc1 -m "rc1 release"`.
- Delete the feature branch.
- Update the CHANGELOG if the release was tagged.

---

## 5. Testing & verification

### Parity testing (PRD §13)

The React build must reproduce the three marketing pages as exact duplicates of
the static prototype. The parity harness is adapted from `archive/audit/v1-audit/v2check/`:

| Script | Purpose | Adapted from |
|---|---|---|
| `parity.py` | Pixel-diff React renders vs. static screenshots at 1920 / 1440 / 390 | New — wraps `shots.py` |
| `verify.py` | Link, anchor, image, active-nav assertions | `v1-audit/v2check/verify.py` |
| `diag.py` | Landmark box measurement (`.pad-rl`, `.mbox`, `.slab`, `.shell`) | `v1-audit/v2check/diag.py` |
| `mincontent.py` | Min-content spill detection | `v1-audit/v2check/mincontent.py` |

### Parity thresholds (PRD §13.2)

- **Layout:** every landmark box within ±1px at every viewport.
- **Page height:** within ±0.5%.
- **Pixels:** no more than 0.5% of pixels differing by more than 8/255 per channel.
- **Hard zeros:** console errors, broken images, dead anchors, horizontal overflow.

### Unit tests

When component logic is non-trivial (e.g., the gutter-ladder frame model, the
scroll-reveal controller), write a unit test. For presentational components that
are verified by the parity harness, unit tests are optional.

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
| **Route count** | `/admin` has exactly 3 routes (§5.2) | Pre-merge assertion |
| **Auth negative** | Grep build for login/session/token/auth route or provider code; expect zero | Pre-merge grep |

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
| Mock fixtures | `src/admin/mock/` |
| Shared utilities | `src/lib/` |
| Verification scripts | `tests/` (adapted from `archive/audit/v1-audit/v2check/`) |
| Documentation | `docs/` |
| Past work / reference | `archive/` |

### Import rules

- `@/*` resolves to `src/*`. Always use it.
- `src/admin/**` may not import from `src/marketing/**` (PRD §7.4.2).
- `src/marketing/**` may not import from `src/admin/**`.

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
- **The v1 prototype** (`archive/v1-prototype/valvoro-prototype/`) is the parity
  baseline — screenshots from here are the diff target.
- **The audit harness** (`archive/audit/v1-audit/v2check/`) contains scripts that
  will be adapted into `tests/` during rc1 implementation.
- If you need a script from the archive, copy it into `tests/` and adapt it — do
  not run it in place.

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
