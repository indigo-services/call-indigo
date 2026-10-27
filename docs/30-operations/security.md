# Security posture

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-27 in the working tree

The current identity decision is [ADR 0005](../40-project/decisions/0005-clerk-admin-identity.md).
The former shared-credential prototype is retained only as a historical record in
[`../60-reference/admin-gate.md`](../60-reference/admin-gate.md).

---

## 1. The posture, in one table

| Surface | State | Evidence |
|---|---|---|
| **`/admin` identity** | Clerk Invite-only mode is active; both Production users are Admin members of the `Indigo Services` organization, and that membership is the only thing that grants dashboard access. Sign-in still awaits deployment of this build. | Clerk Dashboard; `src/admin/AdminArea.tsx`, `src/admin/RequireAuth.tsx`, `src/admin/clerkAuth.ts` |
| **Admin authorization** | Re-checked on the server by `requireCapability()` in every admin endpoint, against a capability matrix that lives in code. The browser gate decides which screens are *shown*; it authorizes nothing. | `api/_lib/auth.ts`, `api/_lib/roles.ts` |
| **Role assignment** | Two parts, because custom Clerk roles are a paid feature: the person must be a member of `Indigo Services` in Clerk, and their level (`admin` / `service_manager` / `service_rep`) is a row in `staff`. A Clerk `org:admin` is admin regardless of the row. Levels are set on `/admin/team`; `GET` needs `settings:read`, `PUT` needs `settings:write` | `resolveOrgAccess()` + `GET /api/me`; `api/staff.ts`; `db/migrations/0003_staff.sql` |
| **Dashboard data** | Postgres (Neon) for inquiries and every settings record. The only browser-held record left is `security`, which nothing reads (#95) | `api/inquiries.ts`, `api/settings.ts` |
| **The contact form** | POSTs to `/api/inquiry`, which stores the lead in Postgres and emails it | `src/lib/data/api.ts` → `createInquiry` |
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
verifies the Clerk session token with the official server SDK, resolves the caller's
level, and refuses a request that needs a capability that level does not carry. It
guards five endpoints:

- `/api/me` (2026-10-27), which reports the caller's own role and capability list. It
  is the only thing the admin shell renders its navigation from, which is what stopped
  the client and the server disagreeing about what a member may see;
- `/api/staff` (2026-10-27), which is **who may sign in and at what level** — the one
  endpoint whose data is other people's access. Reading the roster needs
  `settings:read`, so a Service Manager sees every level; writing one needs
  `settings:write`. It refuses a level for anyone who is not a member of
  `Indigo Services` (`422 not_a_member`), because such a row is inert — the org check
  refuses them before the table is read, so the row would never take effect — and it
  refuses a change to the caller's own row (`422 cannot_change_own_level`);
- `/api/notification-settings`, which decides **where every future lead is emailed** —
  an unauthenticated write would let anyone redirect the business's inquiries to an
  inbox they control;
- `/api/inquiries` (2026-10-23), which can read every lead and delete any of them.
  Reading needs `inbox:read`, editing `inbox:write`, deleting `inbox:delete` — three
  separate grants, so a Service Rep cannot do the one irreversible thing;
- `/api/settings` (2026-10-23), for the `profile` and `notifications` keys and **every**
  write. Its single exception is a `GET` of `key=site`, which is public on purpose: the
  marketing pages read it for their colours and their phone number, and both are on
  the page anyway.

All five call it **before** parsing a query, reading a body or touching the database,
so a caller who is about to be refused causes no work and learns nothing. The rest of
the dashboard's UI is still gated only in the browser, and that is fine: what it gates
is now a view of data the server has already refused to hand it.

### Who is staff, and at what level

Two sources, because one of them cannot answer:

| Question | Answered by | Where |
|---|---|---|
| Are you in `Indigo Services`? | Clerk, from the session token, with a membership lookup as the fallback | `api/_lib/auth.ts` |
| At what level? | the `staff` table | `db/migrations/0003_staff.sql` |

The split exists because **custom organization roles are a paid Clerk feature.**
Measured against the production instance on 2026-10-27: `POST /v1/organization_roles`
returns `402 unsupported_subscription_plan_features` with
`{"unsupported_features": ["org:roles"]}`. `max_allowed_roles` reports **10**, which
reads like an invitation and is only the ceiling for a plan that includes the feature;
`max_allowed_permissions` is **0**, so even a custom role could not carry a capability.
The instance has exactly two roles: `org:admin` and `org:member`.

So the level lives in Postgres, which is the better home regardless: it is in `git`, a
test asserts it, and it can be joined to the inquiries a rep is assigned. The whole
matrix is `api/_lib/roles.ts`. A Clerk `org:admin` is `admin` outright and never reads
the table, so an empty table — or a bad row — can only ever reduce access, never widen
it.

A level is set on **`/admin/team`** (issue #102), not in a psql session. The screen
joins Clerk's membership list to the rows — Clerk says who works here, Postgres says at
what level — and shows a member with no row as *no level set*, which is what the server
actually does with them. It offers no control on a Clerk admin's row, because a level
there is never read: that badge says where the level comes from instead. Removing
someone's access is `active = false`; the row is kept, because it is the record of who
was once allowed to read a customer's phone number.

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

**Last verified:** 2026-10-27 in the working tree
