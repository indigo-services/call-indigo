# Observability

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-27 against `cd7ed7b` (v2.3.0)

**The honest summary: this project has almost no application observability, and that is
a known and deliberate state rather than an oversight.** It is a marketing site with an
admin dashboard. It takes no payments. Since **v2.3.0** it does have a back end — a lead
posted to `/api/inquiry` is stored in Neon and announced by mail — but the observability did
not grow with it: there is still no error reporter and no analytics. No app-level error or
usage telemetry is collected.

This document exists so the gap is **written down** rather than rediscovered.

---

## 1. What we can see

| Signal | Where | Latency | Who looks |
|---|---|---|---|
| **Build result** | GitHub Actions, `.github/workflows/ci.yml` | On push / PR | Anyone |
| **Deploy result** | The commit status on GitHub (see [`deployment.md` §3.1](./deployment.md#31-read-the-status-before-theorising)) | Minutes | Anyone |
| **Runtime errors** | **The browser console.** Not collected. | — | Whoever is looking |
| **Traffic** | Vercel's own dashboard | ~real time | Whoever has Vercel access |
| **Form submissions** | `inquiries` in Neon, written by `api/inquiry.ts`; announced by mail from `api/_lib/notifications.ts` | At submit | A staff member, in `/admin/inquiries` or in the inbox the alert reaches |
| **Whether a submission was emailed** | The `notified` flag in the `POST /api/inquiry` response, and the function log when `RESEND_API_KEY` is unset or the send fails | At submit | Whoever reads the log — **not** the visitor |
| **Admin identities and sessions** | Clerk Dashboard | As users sign in | A Clerk administrator |
| **Who holds which staff level** | `/admin/team` (`GET /api/staff`) | On load | A staff member with `settings:read` |

## 2. What we cannot see

| Cannot see | Consequence |
|---|---|
| **Any runtime error a visitor hit** | There is no error reporter. A broken interaction is invisible until someone reproduces it by hand. |
| **A submission that was stored but not emailed** | The lead is safe in Neon and the response carries `notified: false`, but nothing alerts anyone that the mail failed. It is visible only to whoever reads that response or the function log. **After a mail outage, check `/admin/inquiries`** — not the inbox. |
| **Which routes are used** | No analytics. PRD §16.2 and the client's requirements rule it out — see [`security.md`](./security.md). |
| **Who changed a staff level** | `staff.updated_at` records *when*, not *who*. A level changed on `/admin/team` is attributable to nobody (#114). |
| **Core Web Vitals / real-user performance** | Vercel's dashboard has some of this; nothing is recorded in the repo. |
| **Whether the deploy is serving the intended build** | Only by the manual fingerprint procedure in [`deployment.md` §5](./deployment.md#5-proving-a-deploy-actually-shipped-the-code). |

> ⚠️ **"The form works" now means two things, and only one of them is visible to the
> visitor.** The lead is stored and the mail is attempted; if the mail fails, the visitor
> still sees the thank-you and the lead is still in the dashboard. Before a demo, submit
> once yourself and check `/admin/inquiries` — that is the surface that shows the truth.
> The warning that stood here said the business never receives a submission. That stopped
> being true in #89.

## 3. Why there is no analytics

**Analytics and advertising remain out of scope.** The public marketing pages set no
cookies or load analytics scripts. The explicitly approved Clerk integration runs only
for private admin sign-in and sets authentication cookies; see [the privacy disclosure](../../src/marketing/pages/HomePage.tsx)
and [ADR 0005](../40-project/decisions/0005-clerk-admin-identity.md).

A future analytics or advertising integration would reverse the recorded client decision.
Necessary Clerk auth cookies are limited to `/admin`; they are not permission to add
tracking or analytics cookies.

## 4. What a useful next step would look like

Ordered by value per unit of risk. **None of these is committed work.**

| # | What | Why first | The constraint |
|---|---|---|---|
| 1 | **A real backend for `/contact`** (PRD §16.2 **F2**) | The form currently tells the business nothing. This is the only observability gap with a business consequence. | It is the biggest change in the project — it is the whole reason the `api.ts` seam exists |
| 2 | **A deploy log**, written per release | Cheap, no runtime risk, and it closes the "did it ship?" question permanently | Phase 5 of the docs plan |
| 3 | **An uptime check** on `call-indigo.com` | The only thing a visitor notices is the site being down | External service; a decision, not a default |
| 4 | **Error reporting** | Real value, but it is a third-party script | **Collides with §3.** Would need the client's explicit agreement |
| 5 | **Analytics** | Would answer "which routes are used" | **Collides with §3.** Not recommended |

**Recommendation:** do #1 and #2. Do not do #4 or #5 without the client reversing their
own requirement in writing.

## 5. How a problem is found today

By a person using the site. That is the whole mechanism.

The practical consequence for anyone changing this codebase: **a change that is correct
in `npm test` and wrong in a browser will not be caught by anything except a browser.**
See [`../20-development/testing.md` §4](./../20-development/testing.md#4-what-this-does-not-cover)
for exactly which classes of defect the suite cannot see.

---

**Last verified:** 2026-10-16 in the uncommitted working tree
