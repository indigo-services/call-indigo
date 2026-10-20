# Environments

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-16 in the uncommitted working tree

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
| **Clerk admin UI** | On with a configured key | Setup message until Preview key is configured | Sign-in UI loads; the Production accounts are Admin members of the `Indigo Services` organization — the only thing that grants dashboard access — but have not signed in yet |
| **Clerk publishable key** | Pull from Vercel Development or set locally | Not configured | Production instance key is set in Vercel Production as an encrypted variable |
| **Analytics** | none | **none** | **none** |
| **Authentication state** | Clerk-managed when configured; auth cookies are set during sign-in | Clerk-managed when configured; auth cookies are set during sign-in | Clerk-managed when configured; auth cookies are set during sign-in |

## 2. What genuinely differs

**Four things currently differ** across local, Preview, and Production:

| Difference | Consequence |
|---|---|
| **The build is minified and bundled** | Stack traces are unreadable without a source map. A class-name grep must target the JS bundle, not the HTML shell ([`deployment.md` §5](./deployment.md#5-proving-a-deploy-actually-shipped-the-code)). |
| **The dev server serves modules, not a bundle** | A class-coverage failure in `npm test` can be invisible in `npm run dev` — the dev server generates CSS on demand. **Build before believing a CSS check.** |
| **`dist/` is what production serves** | `npm run test:only` reads `dist/`. A stale `dist/` means a green suite describing the *previous* build. |
| **Vercel uses Node 24.x; local and CI use the 22.22.2 pin** | Both satisfy the package engine range, but local/CI do not exactly mirror Vercel's build runtime. |

## 3. Clerk environment behavior

The Clerk Marketplace integration is linked to the Vercel `call-indigo` project. Its
Marketplace-managed `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are scoped
to Development. The Production instance's publishable key is set separately in Vercel
Production as an encrypted `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; it is not attached to the
Marketplace configuration. Preview has no Clerk key. When the public key is absent, the
app keeps the marketing site available and shows an admin setup message on `/admin`.

The requested access policy is **invited admins only**. Both the Development and
Production instances are verified as **Invite-only**. Production has two users and no
pending invitations, and both are **Admin members of the `Indigo Services`
organization**. Invite-only prevents self-sign-up; that organization membership is what
separately controls whether the app renders the admin shell, and its role decides which
feature areas the sidebar offers. An invitation by itself does not assign the admin
role. See
Clerk's [access restriction guide](https://clerk.com/docs/guides/secure/restricting-access)
and [invitation guide](https://clerk.com/docs/guides/users/inviting).

The Production Clerk domain `call-indigo.com` is verified. Clerk reports all five DNS
records below verified and SSL certificates issued:

| Purpose | Type | Name | Target |
|---|---|---|---|
| Frontend API — verified | CNAME | `clerk` | `frontend-api.clerk.services` |
| Account portal — verified | CNAME | `accounts` | `accounts.clerk.services` |
| Email — verified | CNAME | `clkmail` | `mail.dq4mggr97l2y.clerk.services` |
| Email DKIM — verified | CNAME | `clk._domainkey` | `dkim1.dq4mggr97l2y.clerk.services` |
| Email DKIM — verified | CNAME | `clk2._domainkey` | `dkim2.dq4mggr97l2y.clerk.services` |

The Vercel Production environment now has the encrypted Production publishable key,
but environment values are included in a deployment at build time. The latest Production
deployment is still the September 29 release (`dbdd3657`); the Clerk-enabled working
tree has not been deployed to Production.

The Vite SPA uses only the publishable key. Keep `CLERK_SECRET_KEY` server-only; this
app does not need or read it. Add a matching key for Preview only if preview sign-in is
needed, using the non-production instance.

The app is Vite, despite the original Next.js description. `vite.config.ts` loads only
`VITE_*` and `NEXT_PUBLIC_*` variables and maps the publishable key to
`VITE_CLERK_PUBLISHABLE_KEY`. It does not load or expose `CLERK_SECRET_KEY`. Clerk's
server key is not used by this browser-only app and must never be renamed to a
`VITE_*` variable.

## 4. Environment variables

The Clerk publishable key is required for local admin sign-in. From the linked project,
pull the Development environment with `vercel env pull .env.local`; alternatively set
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`. `VITE_CLERK_PUBLISHABLE_KEY` is
also accepted for standalone Vite development. `.env.example` documents the public key
name; do not put a real secret there.

`.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `*.pem` and `*.key`, so a
secret added by accident is not committed by default. **That is a safety net, not a
policy** — see [`security.md`](./security.md).

## 5. Node and npm

| | |
|---|---|
| **Node** | `^20.19.0 \|\| >=22.12.0` — `package.json` `engines` |
| **Pinned to** | `22.22.2` — `.nvmrc` and `.node-version` |
| **Vercel Node** | `24.x` — project setting; accepted by `package.json` `engines`, but differs from the local/CI pin |
| **npm** | `packageManager` in `package.json`; `package-lock.json` is npm's |

CI reads `.nvmrc` via `actions/setup-node`'s `node-version-file`, so the CI Node and
the local Node are the same pin. Vercel currently builds with Node `24.x`; the package
engine range supports it, but CI and Vercel do not use the same Node version.

---

**Last verified:** 2026-10-16 in the uncommitted working tree
