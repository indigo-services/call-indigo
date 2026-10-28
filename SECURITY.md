# Security policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.** This repository is public,
so an issue is a disclosure.

Email **support@call-indigo.com** with the subject line `SECURITY: call-indigo`.
Include what you found, how to reproduce it, and what you think the impact is. You
will get an acknowledgement, and — if the report is valid — a note when it is fixed.

## What this repository is, security-wise

Read this before reporting, because most of what looks like a vulnerability here is
a **documented, deliberate limitation** rather than a defect.

| Surface | Reality |
|---|---|
| **The `/admin` sign-in** | Clerk React sign-in, Invite-only, plus a membership of the `Indigo Services` organization. The browser check decides which screens are **shown**; it is not the authorization boundary. Every admin endpoint verifies the Clerk session token and re-checks the caller's capability before it touches the database. See `docs/40-project/decisions/0005-clerk-admin-identity.md`. |
| **Dashboard data** | Neon Postgres, over HTTP, through `/api/*`. One copy: leads, settings, staff levels and the audit log. **The browser stores no app data** — `localStorage` was removed on 2026-10-28 (#95). |
| **The contact form** | `POST /api/inquiry`, stored in Postgres, then emailed. The captcha is **local arithmetic**, not a bot defence; the endpoint also has a per-address throttle that fails open when it cannot enforce. The public marketing pages run no analytics or advertising. |
| **Authentication data** | Clerk manages admin identity and session cookies. `CLERK_SECRET_KEY` is not loaded into the client bundle; it is read only by the server, which verifies each request's session token. |

The browser gate is UI gating only, and is documented as such. Authorization is enforced
per endpoint, and the gaps that remain — ranked — are in
`docs/30-operations/security.md`.

## What *is* in scope

- A way to access shared or sensitive data without an authenticated server-side check.
- A secret committed to the tree: an API key, a token, a real password (as opposed
  to the deliberately-shipped salted digest).
- A dependency with a known advisory that the build actually exercises.
- A cross-site scripting path in the marketing pages' `dangerouslySetInnerHTML`
  seam (`src/marketing/chrome.ts`), which is the one place raw HTML enters the DOM.

## Deployment

The live site is `call-indigo.com`, served by Vercel from this repository. Deploys
are gated on the **commit author**, not the token — a fact recorded in
`docs/30-operations/deployment.md`.
