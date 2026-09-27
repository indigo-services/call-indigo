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
| **The `/admin` sign-in** | **Client-side only. It is not access control.** There is no server, so there is nowhere for a secret to hide from the browser. Anyone who can open devtools can set the session flag by hand. This is recorded in `docs/60-reference/admin-gate.md`, stated on screen in four in-app places, and asserted by `tests/auth.mjs`. |
| **Dashboard data** | `localStorage`, per-browser, not shared, not a database. There is no server-side data to breach. |
| **The contact form** | Writes to the same `localStorage` namespace. The captcha is **local arithmetic**, not a bot defence. There is no address field, no cookie is set, and there is no analytics. |
| **Credentials in the bundle** | There are none. The password is a salted PBKDF2-HMAC-SHA-256 digest (210,000 iterations); the username is a salted SHA-256. Grepping the built JavaScript for either finds nothing. **The digests are still in the bundle, and a digest is crackable offline** — the gate's whole purpose is to keep `/admin` off the public internet while it is being demonstrated, not to be a security boundary. |

A server-issued session is PRD §16.2 **F1** and lands before this dashboard is
pointed at anything real. Until then, "the gate is bypassable" is a known and
documented state, not a vulnerability report.

## What *is* in scope

- A way to make the dashboard reachable **without** a browser that can run the
  bundle — i.e. a real authentication bypass rather than the documented one.
- A secret committed to the tree: an API key, a token, a real password (as opposed
  to the deliberately-shipped salted digest).
- A dependency with a known advisory that the build actually exercises.
- A cross-site scripting path in the marketing pages' `dangerouslySetInnerHTML`
  seam (`src/marketing/chrome.ts`), which is the one place raw HTML enters the DOM.

## Deployment

The live site is `call-indigo.com`, served by Vercel from this repository. Deploys
are gated on the **commit author**, not the token — a fact recorded in
`docs/30-operations/deployment.md`.
