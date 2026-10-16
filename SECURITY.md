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
| **The `/admin` sign-in** | Clerk React sign-in; the intended policy is Invite-only plus a client check for `publicMetadata.role === "admin"`. This is not server-side data authorization. See `docs/40-project/decisions/0005-clerk-admin-identity.md`. |
| **Dashboard data** | `localStorage`, per-browser, not shared, not a database. The app has no server-side record store. |
| **The contact form** | Writes to the submitter's `localStorage`. The captcha is **local arithmetic**, not a bot defence. The form does not collect an address. The public marketing pages run no analytics or advertising. |
| **Authentication data** | Clerk manages admin identity and session cookies. `CLERK_SECRET_KEY` is not loaded into the client bundle. The app has no authenticated backend, so Clerk does not protect the browser-local records. |

The role check is client-side UI gating only. Add a backend that verifies Clerk sessions
and enforces role permissions before storing or serving shared or sensitive data.

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
