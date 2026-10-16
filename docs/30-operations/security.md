# Security posture

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-16 in the uncommitted working tree

The current identity decision is [ADR 0005](../40-project/decisions/0005-clerk-admin-identity.md).
The former shared-credential prototype is retained only as a historical record in
[`../60-reference/admin-gate.md`](../60-reference/admin-gate.md).

---

## 1. The posture, in one table

| Surface | State | Evidence |
|---|---|---|
| **`/admin` identity** | Clerk Invite-only mode is active; the Production user has both organization Admin membership and `publicMetadata.role = "admin"`. Sign-in still awaits deployment of the Clerk-enabled build. | Clerk Dashboard; `src/admin/AdminArea.tsx`, `src/admin/RequireAuth.tsx`, `src/admin/clerkAuth.ts` |
| **Admin authorization** | Client-side UI gate only. There is no server or authenticated data API | Vite SPA; `src/lib/data/backend.ts` |
| **Role assignment** | Set `role: "admin"` through Clerk's trusted dashboard/backend; missing roles fail closed | `hasAdminRole()` and `RequireAuth` |
| **Dashboard data** | `localStorage`; per-browser, not shared, not a database, and not protected by Clerk | `src/lib/data/backend.ts` |
| **The contact form** | Writes to the visitor's own `localStorage`; the business does not receive it | `src/lib/data/api.ts` → `createInquiry` |
| **Clerk secret** | Vercel's Development environment has `CLERK_SECRET_KEY`; Production has only the publishable key. The Vite client does not read or bundle the secret | Vercel environment metadata; `vite.config.ts` loads only `VITE_*` and `NEXT_PUBLIC_*` values |
| **Clerk publishable key** | Public key mapped from Vercel's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to Vite | `vite.config.ts` |
| **Vercel environment scopes** | Development has the Marketplace publishable and secret keys; Production has the encrypted Production publishable key; Preview has no Clerk key | Vercel project environment-variable metadata |
| **Clerk access mode** | Development and Production are both verified as Invite-only; Production has one user with the admin role and zero pending invitations | Clerk Dashboard (verified 2026-10-16) |
| **Production deployment** | Latest Production deployment is the September 29 release; the Clerk-enabled working tree is not deployed | Vercel deployment metadata |
| **Cookies and browser auth state** | Clerk sets authentication cookies when users interact with sign-in; the app does not implement its own auth storage | `@clerk/react`; [Clerk cookie documentation](https://clerk.com/docs/guides/how-clerk-works/cookies) |
| **Third-party runtime scripts** | Clerk's authentication UI/runtime loads from Clerk; no analytics or advertising scripts | Clerk React SDK; app source |
| **Dependencies** | Watched by Dependabot | `.github/dependabot.yml` |
| **Deploy gate** | The Vercel commit-author gate, not an auth control | [`deployment.md` §3](./deployment.md#3-the-author-gate) |
| **CI** | Four gates on push to `main` and on every PR | `.github/workflows/ci.yml` |

## 2. The authorization limit

Clerk authenticates the user and the app checks the admin role before rendering the
dashboard. That check runs in JavaScript delivered to the browser, so it is not a server
authorization boundary. The app's source and dashboard bundle are public, and the current
records live in browser storage. Do not put shared or sensitive data in this app until an
authenticated backend verifies Clerk sessions and enforces role permissions on every
data operation.

The previous `auth.ts` credential and its hashes have been removed. The former security
settings mock has also been replaced with Clerk-managed account controls. See [ADR 0005](../40-project/decisions/0005-clerk-admin-identity.md).

## 3. Other current limits

- **No backend.** The contact form writes to the visitor's own browser and the business
  receives nothing.
- **The captcha is local arithmetic.** It is not a bot defence.
- **The repository is public.** Source, demo fixtures, and the localStorage shape are
  readable by anyone.
- **No secret scanning or dependency-advisory build gate is configured in CI.**

## 4. Reporting a problem

See [`../../SECURITY.md`](../../SECURITY.md). **Do not open a public issue** — the
repository is public, so an issue is a disclosure.

---

**Last verified:** 2026-10-16 in the uncommitted working tree
