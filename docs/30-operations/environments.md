# Environments

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

Three places this code runs. **What differs between them is smaller than you would
expect** — and that is deliberate, because a difference between preview and production
is a defect that only appears after a merge.

---

## 1. The matrix

| | Local | Preview | Production |
|---|---|---|---|
| **Command** | `npm run dev` | `npm run build` on Vercel | `npm run build` on Vercel |
| **URL** | `http://localhost:5173` | `call-indigo.vercel.app` → 307 → production | `call-indigo.com` |
| **Server** | Vite dev server | Vercel CDN | Vercel CDN |
| **SPA rewrite** | Vite's own fallback | `vercel.json` | `vercel.json` |
| **Data** | `localStorage`, seeded on first run | **the visitor's own** `localStorage` | same |
| **The `/admin` gate** | on | **on** | **on** |
| **Analytics** | none | **none** | **none** |
| **Cookies set** | none | **none** | **none** |

## 2. What genuinely differs

**Only three things**, and two of them are consequences of the first:

| Difference | Consequence |
|---|---|
| **The build is minified and bundled** | Stack traces are unreadable without a source map. A class-name grep must target the JS bundle, not the HTML shell ([`deployment.md` §5](./deployment.md#5-proving-a-deploy-actually-shipped-the-code)). |
| **The dev server serves modules, not a bundle** | A class-coverage failure in `npm test` can be invisible in `npm run dev` — the dev server generates CSS on demand. **Build before believing a CSS check.** |
| **`dist/` is what production serves** | `npm run test:only` reads `dist/`. A stale `dist/` means a green suite describing the *previous* build. |

## 3. What does **not** differ — and this is the point

**There is no environment-specific configuration.** No `.env` file is required, no
`VITE_*` variable is read, and no code branches on `import.meta.env.PROD`.

That is not an accident of a small project; it is a consequence of the architecture:

- **There is no server**, so there is no API base URL to configure.
- **The data layer is `localStorage`** ([`../20-development/architecture.md`](../20-development/architecture.md#seam-2--the-data-layer)),
  so there is no database connection string.
- **The gate is client-side** ([`security.md`](./security.md)), so there is no auth
  secret to inject.

> ⚠️ **The first environment variable this project adds is the moment preview and
> production can diverge.** When PRD §16.2 **F2** lands (a real backend), an
> environment matrix becomes load-bearing rather than descriptive, and this document
> must be rewritten at the same time — not after.

## 4. Environment variables

**None are required to build or run.** `package.json` has no `dotenv` dependency and
no `.env` file is committed or expected.

`.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `*.pem` and `*.key`, so a
secret added by accident is not committed by default. **That is a safety net, not a
policy** — see [`security.md`](./security.md).

## 5. Node and npm

| | |
|---|---|
| **Node** | `^20.19.0 \|\| >=22.12.0` — `package.json` `engines` |
| **Pinned to** | `22.22.2` — `.nvmrc` and `.node-version` |
| **npm** | `packageManager` in `package.json`; `package-lock.json` is npm's |

CI reads `.nvmrc` via `actions/setup-node`'s `node-version-file`, so the CI Node and
the local Node are the same pin. **That is the one reproducibility guarantee this
project has.**

---

**Last verified:** 2026-09-27 at `2f009a2`
