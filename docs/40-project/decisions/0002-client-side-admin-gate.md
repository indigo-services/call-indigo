# ADR 0002 — A client-side gate on `/admin`, and saying out loud what it is not

**Kind:** dated · **Status:** accepted · **Date:** 2026-09-26 (`e622315`) ·
**Last verified:** 2026-09-27 at `2f009a2` · **Deciders:** the repo, on the client's request

---

## Context

The client asked for the dashboard to be behind **a username and password**, with a
*secure* implementation rather than a literal string comparison.

Three constraints were already fixed and none of them was negotiable:

1. **There is no server.** The project is a static SPA on Vercel; `vercel.json`'s only
   rule is a rewrite to `/index.html`. There is no place for a secret to be checked
   server-side, and nowhere for one to hide from the browser.
2. **The client's requirements rule out cookies and third-party services.** So no
   session cookie, no auth provider, no hosted identity service.
3. **The request was for a demonstration.** The dashboard is being shown around while
   the real backend (PRD §16.2 **F1**, **F2**) is still owed.

The honest options were therefore: (a) refuse until a server exists, (b) build the
smallest thing that answers the request and document precisely what it does not do.

## Decision

**Build the smallest thing that answers the request — a client-side credential check —
and make what it is *not* impossible to miss.**

The implementation, in `src/admin/auth.ts`:

| | |
|---|---|
| Password | Salted **PBKDF2-HMAC-SHA-256**, 210,000 iterations |
| Username | Salted SHA-256 |
| Session | `sessionStorage`, 12 hours, dies with the tab |
| Namespace | Deliberately **outside** `call-indigo:v1:`, so "Reset demo data" does not sign the operator out |
| Guard placement | `RequireAuth` **wraps `AdminLayout`**, so an unauthenticated visitor never sees the sidebar, and no `/admin/login` route exists to loop through |

**And four in-app surfaces state on screen that it is not access control** — with
`tests/auth.mjs` failing if any of them reverts.

## Consequences

**What this buys**

- `/admin` is off the public internet while the client shows it around. That is the
  whole benefit, and it is a real one.
- **Neither credential is in the bundle** — grepping the built JavaScript for either
  finds nothing.
- The claim is **asserted, not promised**: the four disclaimers cannot be quietly
  deleted.

**What this costs**

- **The digests are in the bundle, and a digest is crackable offline.** A PBKDF2
  digest at 210,000 iterations raises the cost of a dictionary attack; it does not
  eliminate it. OWASP's current floor for this digest is 600,000 — 210,000 is the
  widely-quoted 2023 baseline, chosen to keep a sign-in under a second.
- **The gate is bypassable by design.** Anyone who can open devtools can set the session
  flag by hand.
- **It creates a documentation obligation.** Four surfaces and a test exist purely to
  stop someone inferring a security property that is not there.

**What it forecloses**

- **Claiming the dashboard is secure.** Not "hard to do" — **foreclosed**. The
  repository must never imply it, and a change that does is a regression the suite
  catches.
- **Reusing this as the auth layer for real data.** F1 is a separate, larger piece of
  work, and this gate does not shorten it.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Refuse until a server exists** | Honest, and it declines a reasonable request for a demo. The client asked for a curtain, not a vault. |
| **Hard-code the username and password in the bundle** | The client explicitly asked for a secure implementation rather than a literal comparison. A plaintext credential in a public repository is worse than the digest in every way. |
| **Use a hosted auth provider** | Collides with constraint 2 — a third-party service. |
| **A session cookie** | Collides with constraint 2 — the client's requirements rule out cookies. `sessionStorage` is the cookie-shaped option that sets nothing. |
| **Hide `/admin` behind an obscure URL** | Security by obscurity, with no session, no lockout, and nothing to show the client. |

## Reversibility

**Expensive, in a specific way.** The code is small and could be replaced in a session.
What is expensive is the **documentation obligation** — the four on-screen surfaces, the
test that guards them, and this ADR exist because the gate's limits are the load-bearing
part. A future implementation that removes the gate also removes the reason those exist,
and whoever does it must decide what replaces the honesty rather than just deleting it.
