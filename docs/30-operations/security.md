# Security posture

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-22 in the working tree

The current identity decision is [ADR 0005](../40-project/decisions/0005-clerk-admin-identity.md).
The former shared-credential prototype is retained only as a historical record in
[`../60-reference/admin-gate.md`](../60-reference/admin-gate.md).

---

## 1. The posture, in one table

| Surface | State | Evidence |
|---|---|---|
| **`/admin` identity** | Clerk Invite-only mode is active; both Production users are Admin members of the `Indigo Services` organization, and that membership is the only thing that grants dashboard access. Sign-in still awaits deployment of this build. | Clerk Dashboard; `src/admin/AdminArea.tsx`, `src/admin/RequireAuth.tsx`, `src/admin/clerkAuth.ts` |
| **Admin authorization** | Client-side UI gate only. There is no server or authenticated data API | Vite SPA; `src/lib/data/backend.ts` |
| **Role assignment** | Add the operator to the `Indigo Services` organization with the Admin role in Clerk's dashboard; a missing membership or a lower role fails closed | `resolveAdminAccess()` and `RequireAuth` |
| **Dashboard data** | `localStorage`; per-browser, not shared, not a database, and not protected by Clerk | `src/lib/data/backend.ts` |
| **The contact form** | Writes to the visitor's own `localStorage`; the business does not receive it | `src/lib/data/api.ts` → `createInquiry` |
| **Clerk secret** | Vercel's Development environment has `CLERK_SECRET_KEY`; Production has only the publishable key. The Vite client does not read or bundle the secret | Vercel environment metadata; `vite.config.ts` loads only `VITE_*` and `NEXT_PUBLIC_*` values |
| **Clerk publishable key** | Public key mapped from Vercel's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to Vite | `vite.config.ts` |
| **Vercel environment scopes** | Development has the Marketplace publishable and secret keys; Production has the encrypted Production publishable key; Preview has no Clerk key | Vercel project environment-variable metadata |
| **Clerk access mode** | Development and Production are both verified as Invite-only; Production has one user with the admin role and zero pending invitations | Clerk Dashboard (verified 2026-10-16) |
| **Production deployment** | **The Clerk-enabled build is live.** Corrected 2026-10-20: the deployed `AdminArea` chunk carries a `pk_live_` key and the `publicMetadata` check, so the September 29 claim below is stale. Which commit is deployed remains unverified. | `curl https://call-indigo.com/` → entry chunk → `assets/AdminArea-*.js`; [`../40-project/audit-backend-and-clerk-readiness-2026-10-20.md`](../40-project/audit-backend-and-clerk-readiness-2026-10-20.md) F6 |
| **Cookies and browser auth state** | Clerk sets authentication cookies when users interact with sign-in; the app does not implement its own auth storage | `@clerk/react`; [Clerk cookie documentation](https://clerk.com/docs/guides/how-clerk-works/cookies) |
| **Third-party runtime scripts** | Clerk's authentication UI/runtime loads from Clerk; no analytics or advertising scripts | Clerk React SDK; app source |
| **Dependencies** | Watched by Dependabot | `.github/dependabot.yml` |
| **Deploy gate** | The Vercel commit-author gate, not an auth control | [`deployment.md` §3](./deployment.md#3-the-author-gate) |
| **CI** | Four gates on push to `main` and on every PR | `.github/workflows/ci.yml` |

## 2. The authorization limit

Clerk authenticates the user and the app checks the admin role before rendering the
dashboard. That check runs in JavaScript delivered to the browser, so it is not a server
authorization boundary: the app's source and dashboard bundle are public, and hiding a
control hides a button, not a record. **The boundary is the server** — every admin read
and write is authorised again inside the function that serves it, below. One record
(`security`) still lives in browser storage; it has no callers and is a placeholder, not
a secret.

The previous `auth.ts` credential and its hashes have been removed. The former security
settings mock has also been replaced with Clerk-managed account controls. See [ADR 0005](../40-project/decisions/0005-clerk-admin-identity.md).

**Since 2026-10-22 there is one real server-side check** — `api/_lib/auth.ts`. It
verifies the Clerk session token with the official server SDK, then requires
`org:admin` in the pinned organization, falling back to a membership lookup when the
token carries no active-organization claim. It guards three endpoints:

- `/api/notification-settings`, which decides **where every future lead is emailed** —
  an unauthenticated write would let anyone redirect the business's inquiries to an
  inbox they control;
- `/api/inquiries` (2026-10-23), which can read every lead and delete any of them;
- `/api/settings` (2026-10-23), for the `profile` and `notifications` keys and **every**
  write. Its single exception is a `GET` of `key=site`, which is public on purpose: the
  marketing pages read it for their colours and their phone number, and both are on
  the page anyway.

All three call it **before** parsing a query, reading a body or touching the database,
so a caller who is about to be refused causes no work and learns nothing. The rest of
the dashboard's UI is still gated only in the browser, and that is fine: what it gates
is now a view of data the server has already refused to hand it.

## 3. Other current limits

- **The form posts to the server, and that is proven end to end.** `POST /api/inquiry`
  stores the lead in Postgres and emails it; a real browser submission on 2026-10-23
  landed in the inbox. A failed POST is shown to the visitor with a phone number rather
  than swallowed.
- **The captcha is local arithmetic.** It is not a bot defence. The server now also
  checks the form's hidden honeypot, which stops naive bots and nothing more.
- **The repository is public.** Source, demo fixtures, and the localStorage shape are
  readable by anyone. No secret is committed: `.env*` is ignored with `!.env.example`.
- **No secret scanning or dependency-advisory build gate is configured in CI.**
- **The API has no rate limit.** One IP can post as fast as it can connect; the only
  ceilings are field lengths and the honeypot.

## 4. Reporting a problem

See [`../../SECURITY.md`](../../SECURITY.md). **Do not open a public issue** — the
repository is public, so an issue is a disclosure.

---

**Last verified:** 2026-10-22 in the working tree
