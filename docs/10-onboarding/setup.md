# Setup

**Kind:** living · **Owner:** the repo · **Asserted by:** `tests/docs.mjs` (the
commands below exist in `package.json`)

Clone → running dev server → all four gates green.

---

## 1. What you need

| | Version | Why |
|---|---|---|
| **Node** | `^20.19.0 \|\| >=22.12.0` | Vite 7's own requirement [M: `node -p "require('./node_modules/vite/package.json').engines.node"`]. Declared in `package.json` `engines`, pinned in `.nvmrc` and `.node-version`. |
| **npm** | 10.x | `package-lock.json` is npm's. `packageManager` records the version the lockfile was produced with. |
| **git** | any | |

**Use the pinned version.** `nvm use` (or `fnm use`) reads `.nvmrc`. `npm install` is
not reproducible across Node majors, and the repo declares which one it means.

## 2. Install and run

```bash
npm install          # install dependencies
npm run dev          # dev server → http://localhost:5173
```

![Homepage hero](../assets/home-hero.png)

*Figure 1 — The homepage at `localhost:5173`, showing the hero section with rotating architectural photography.*

The dev server is Vite's. There is **no** `tailwind.config.js`, **no** PostCSS config
and **no** `vite.config` beyond the Tailwind plugin — Tailwind v4 is configured in CSS
([`../20-development/css-pipeline.md`](../20-development/css-pipeline.md)).

## 3. The four gates

Run these before opening a pull request. CI runs the same four.

```bash
npm run typecheck    # G1 — tsc --noEmit
npm run lint         # G2 — eslint
npm run build        # G3 — tsc -b && vite build
npm run test:only    # G4 — the verification suite, against the build you just made
```

### `test` vs `test:only` — the difference matters

| Command | Does |
|---|---|
| `npm test` | `npm run build && node tests/run.mjs` — builds, **then** runs the suite |
| `npm run test:only` | `node tests/run.mjs` — runs the suite against whatever is in `dist/` |

> **`test:only` does not rebuild.** The suite asserts on the compiled CSS and on
> rendered output, so it needs a `dist/` — but it will happily read a **stale** one.
> If you changed anything that reaches the bundle, run `npm run build` first, or the
> suite will report on the previous build and pass.

The convenience wrapper is `npm test`, which cannot get this wrong. Use it unless you
have just built.

## 4. Expect this on a clean tree

Every number carries its producer. Re-run the command to check it.

| Gate | Command | Result on a clean tree |
|---|---|---|
| Type check | `npm run typecheck` | 0 errors |
| Lint | `npm run lint` | 0 errors, 4 warnings |
| Build | `npm run build` | ~1755 modules |
| Verification | `npm run test:only` | the suite's own count — **read it from the run** |

**The four lint warnings are pre-existing and known:** `react-refresh/only-export-components`
in `src/components/ui/{badge,button,sidebar,tabs}.tsx`. Those are shadcn registry files
and are not hand-edited (PRD §7). The ceiling is pinned at 4 in CI.

**The check count is deliberately not written here.** It grows with every round, and
the two documents that used to list it were wrong within a day. Read the authoritative
total from the run.

## 5. Common problems

| Symptom | Cause | Fix |
|---|---|---|
| `Port 5173 is already in use` | A previous dev server survived. `npm run dev &` leaves the real `vite` child alive when you kill the npm wrapper. | Find the listener and kill it: `netstat -ano \| grep LISTENING \| grep ":5173 "`, then kill **that** pid. Do not `taskkill /PID $!` in Git Bash — `$!` is an MSYS pid, not a Windows one. |
| `EBUSY` on `src/index.css` | A dev server holds the file open. | Stop the dev server. |
| The suite passes but the UI is visibly broken | `renderToStaticMarkup` sees **neither CSS nor effects**, and every `useApiData` page renders as **skeletons** in the suite. | Check it in a browser. See [`../20-development/testing.md`](../20-development/testing.md). |
| `npm test` fails with a delete error on `dist/` | `vite build` empties `dist/`, which can trip a bulk-delete guard. | Use `npm run test:only` against the existing build, or move `dist/` aside first. |
| A build check reads an old value | `test:only` read a stale `dist/`. | `npm run build`, then re-run. |

## 6. Editor setup

`.editorconfig` is committed and matches `.gitattributes` (`* text=auto eol=lf`).
**The repo is LF everywhere.** If your editor writes CRLF, the diff will show every
line changed.

The `.gitattributes` file also marks every image format `binary`, so Git will not try
to normalise line endings inside a PNG.

---

**Last verified:** 2026-09-27 at `2f009a2`
