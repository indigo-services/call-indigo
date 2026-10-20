# ADR 0005 — Clerk identity for the admin UI, with an explicit server-authorization boundary

**Kind:** dated · **Status:** accepted, amended 2026-10-20 · **Date:** 2026-10-16 ·
**Last verified:** 2026-10-20 on `main` after the #74 merge · **Deciders:** the repo

---

## Context

The Vercel project `call-indigo` is linked to the existing Clerk integration. The checked-out app and Vercel project both use Vite and React Router; there is no Next.js runtime, API server, database, or shared data store. Dashboard data is held in each browser's `localStorage`.

ADR 0002's single-credential prototype has been superseded by the user's request to add Clerk. That credential implementation is removed. The Marketplace connection supplies Development keys. A Production publishable key is set separately in Vercel's Production environment. Preview has no Clerk key. Clerk's Production domain and all five DNS records are verified. The Production instance is Invite-only. It has one user with the Clerk organization Admin membership and `publicMetadata.role = "admin"`; there are no pending invitations. The account has never signed in. The latest Production deployment predates this Clerk implementation; the current working tree is not live.

## Decision

**Use Clerk React for browser identity and require `publicMetadata.role === "admin"` before showing the admin shell, while documenting that this does not authorize data on a server.**

The access policy for the Clerk instance is Invite-only. Admins must be invited and
separately receive the trusted `publicMetadata.role = "admin"` marker; either condition
alone is insufficient.

The lazy `/admin` entry point uses `@clerk/react` with a route-scoped `ClerkProvider`, React Router navigation callbacks, Clerk's shadcn-themed prebuilt sign-in UI, and Clerk-managed sign-out/account controls. The Call Indigo logo is shown in the sign-in card. Marketing visitors do not download the Clerk bundle. Vercel's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is mapped to Vite's `VITE_CLERK_PUBLISHABLE_KEY`. Only the publishable key reaches the browser. The linked `CLERK_SECRET_KEY` is not read by Vite or used in client code.

`RequireAuth` waits for Clerk to load, requires a signed-in user, then checks the server-managed public metadata role. Users with absent or different roles fail closed. The role is assigned through Clerk's trusted dashboard/backend, not through the app.

## Consequences

**What this buys**

- Individual Clerk identities replace a shared build-time credential.
- A missing publishable key disables only the dashboard sign-in and shows a setup message; public marketing routes still render.
- The UI and account security controls come from Clerk rather than simulated local forms.

**What this costs**

- The role check runs in a public browser bundle. A visitor can inspect the UI code; this is not a server-side authorization boundary.
- Dashboard data remains browser-local and is not shared, backed up, or protected by Clerk.
- Each Vercel environment needs the matching Clerk instance's publishable key. Development is Marketplace-managed; Production is configured with a separate encrypted public-key variable; Preview is not configured.
- Production sign-in cannot be validated until the Clerk-enabled build is deployed and the account signs in. The domain and trusted admin role are verified; the existing user has never signed in.

**What it forecloses**

- Treating a signed-in browser or a hidden React route as permission to access future server data.
- Assigning admin status from user-editable client state.
- Reusing the removed username/password prototype.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Run Clerk's Next.js setup** | The repository and linked Vercel project are Vite. Adding Next.js would be a framework migration outside the requested integration. |
| **Run `clerk init` or create another Clerk application** | The existing Vercel-linked Clerk resource is the requested integration; setup must preserve it and its keys. |
| **Allow every signed-in account into `/admin`** | Admin status should not follow from self-service account creation. The explicit role marker fails closed. |
| **Call the Vite route guard server authorization** | There is no server or shared data API to enforce that claim. |

## Reversibility

**Moderate.** The Clerk UI integration is contained in the provider, route guard, sign-in page, and sidebar. Moving to server authorization requires a backend to verify Clerk sessions and roles, moving data out of browser storage, and enforcing permissions on every data operation.

---

## Amendment — 2026-10-20: access comes from an organization role

**Issue:** #74. **Supersedes:** the *source* of the role in the Decision section above.
Everything about where the gate runs, and about what it does not authorize, stands
unchanged.

The flat `publicMetadata.role = "admin"` marker is **retired**. Access is now an Admin
membership of the `Indigo Services` organization (`org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb`),
resolved in one function — `resolveAdminAccess()` in `src/admin/clerkAuth.ts` — which
returns *which feature areas* a role may see rather than a single boolean.

Why the source moved:

- A single boolean cannot express per-feature access, and organization roles were already
  enabled on the instance.
- **Measured before changing**, against the Production instance: organizations are enabled,
  there is exactly one organization, and both existing users were already `org:admin` in
  it. So this is a code change, not a re-provisioning — and there was therefore no reason
  to keep the old flag as a fallback, which would have been a second grant path that
  nothing exercises.
- The organization is **pinned by id**. Clerk's `creator_role` on this instance is
  `org:admin`, so a check that accepted "any organization where the user is an admin"
  would let anyone able to create an organization grant themselves access.

Roles: `org:admin` sees every feature area; `org:member` sees the inbox and settings —
including the member's own profile, notifications and security — but not the brand system
or the engineering documentation. Custom roles are not accepted.

The gate reads `user.organizationMemberships` **and** the session's active organization,
because a user can hold an Admin membership without having selected that organization in
the current session. Requiring the active organization alone would lock a legitimate
operator out on every fresh sign-in.

**What has not changed.** This is still a client-side UI gate inside a public bundle, and
it still authorizes nothing. When a backend lands, the same membership has to be
re-checked there.
