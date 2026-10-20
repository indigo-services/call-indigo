# Audit — backend and Clerk production readiness

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-10-20 at `be9afcb`
**Issue:** #72 (parent #64, item 6) · **Produces a document, not a feature.**

> **The headline, in one sentence a non-engineer can act on.**
> **When somebody fills in the contact form, the details are saved inside their own web
> browser and are never sent to Indigo — nobody at the business ever sees the inquiry.**
> Everything else in this document follows from that one fact.

---

## 1. How this was checked

Every claim below carries a `file:line` or a command. Where a claim could only be checked
against a live system, the command is given so it can be re-run.

| Method | What it establishes |
|---|---|
| `grep -rn "fetch(\|XMLHttpRequest\|axios\|navigator.sendBeacon" src/` | **0 hits.** The application makes no network request of any kind — not to a backend, not to a payment provider, not to an analytics service. |
| `ls -d api` | **No `api/` directory.** There is no serverless function and therefore no server code at all. |
| `curl https://call-indigo.com/` → the entry chunk → the lazy `AdminArea` chunk | What production actually serves, read from the deployed bytes rather than from the repo. |
| `curl -H "Authorization: Bearer $CLERK_SECRET_KEY" https://api.clerk.com/v1/billing/plans` | `HTTP 403 {"code":"billing_not_enabled"}` — Clerk Billing is not on. |
| `clerk config pull` | `organization_settings.enabled = true` — Organizations **are** on. |

The rest is read from the tree, and the line numbers are current as of `be9afcb`.

---

## 2. The verdict, per subsystem

**"Production-ready" here means: a visitor using this in the real world gets the behaviour
the business believes it is getting.** Nothing on this site touches a customer's money or a
regulator's interest, so "demo-only" is not automatically a defect — but it must be a
*known* state, not an assumed one.

| Subsystem | State | Why |
|---|---|---|
| **Marketing pages** (4 routes) | ✅ **Production-ready** | Static content, no data, no third party. `src/marketing/pages/*.tsx`. |
| **Theming** | ✅ **Production-ready, by design** | Per-browser, and the UI says so. `src/lib/theme.ts:14`. |
| **Form handling — the fields** | ✅ **Production-ready** | Inline validation, `noValidate`, honeypot, focus management. `ContactPage.tsx:202`. |
| **Form handling — delivery** | ❌ **Demo-only. This is the defect.** | See F1. |
| **Data storage** | ❌ **Demo-only** | `localStorage`. See F1 and F2. |
| **Admin authentication** | ✅ **Production-ready** | Clerk `pk_live_` present in the deployed `AdminArea` chunk; invite-only. See F6. |
| **Admin authorization** | ⚠️ **UI gate, not authorization** | Client-side boolean. See F3. |
| **Bot defence** | ⚠️ **Cosmetic** | Local arithmetic + honeypot. See F4. |
| **Payments / membership** | ⛔ **Not built, and cannot be built yet** | Clerk Billing is off. See F5. |
| **Observability** | ❌ **None** | No analytics, no error reporting, no logs — a deliberate product decision. See F7. |

---

## 3. Findings

Severity is about **consequence to the business**, not effort to fix.
**S1** — a customer or a lead is lost silently. **S2** — a real limit that must be known.
**S3** — hygiene.

### F1 — A submitted inquiry never leaves the visitor's browser — **S1**

`src/lib/data/api.ts:95` writes the record through `backend.writeInquiries(...)`, and
`src/lib/data/backend.ts:2` is a *"localStorage-backed storage engine"* namespaced at
`:28`. The write lands in the **visitor's own** browser storage.

The consequence, stated plainly: the record exists only in that browser. It is visible in
`/admin/inquiries` **in the same browser that submitted it**, and nowhere else. Indigo's
team, on their own machines, sees nothing. A visitor who submits from a phone, clears site
data, or uses a different browser has sent the inquiry nowhere.

**Already priced — do not re-price.** This is Option A ($1,000) in
[`proposal-backend-and-lead-handling-2026-09-29.md`](./proposal-backend-and-lead-handling-2026-09-29.md)
§2.1, and it is disclosed to the client in
[`client-disclosure.md`](./client-disclosure.md) §3.3. This audit confirms the finding is
**still true on `be9afcb`** and has not been quietly re-scoped.

**The first thing to build.** Issue #68 — one `POST /api/inquiry` writing to Neon — is the
smallest change that turns this from false to true, and it is the precondition for
everything else the client asked for in #64.

### F2 — The admin inbox ships demo data that looks like real leads — **S2**

`backend.ts` seeds on first read (`readInquiries()` → `createSeedInquiries()`), so a fresh
browser opens `/admin/inquiries` to a populated list of **fictional** inquiries
(`src/lib/data/seed.ts:35`). Combined with F1 this is confusing in a specific way: an
operator cannot tell a demo row from a real submission by looking, because both live in the
same array.

The risk is not data loss — it is a person believing they are looking at real leads.

### F3 — "Admin-only" means "hidden from the UI" — **S2**

`src/admin/clerkAuth.ts` holds the whole rule, in `resolveAdminAccess()`: access is an
Admin membership of the `Indigo Services` organization. It is evaluated in JavaScript
delivered to the browser. (At the time of writing it was a flat
`publicMetadata.role === "admin"` flag; issue #74 replaced it the same day — see the
amendment in [ADR 0005](./decisions/0005-clerk-admin-identity.md).) The file says so
itself — *"it is not server authorization"* — and `RequireAuth.tsx` is the only place it
is enforced.

With no server, there is nothing to authorize: the data is in the browser and the source is
public. **This is not a vulnerability in the current architecture; it is a limit that
disappears only when F1 is fixed.** Once there is a server, this boolean must be replaced by
a session check on every data operation, not by a better boolean.

### F4 — The captcha is arithmetic, not a bot defence — **S2**

`src/marketing/Captcha.tsx:10-12` states it plainly: a small random arithmetic question,
*"deliberately not strong cryptography"*. The honeypot at `ContactPage.tsx:202` is the
second layer. Both are client-side, so both are trivially bypassed by anything that runs
JavaScript.

This matters **more** after F1 is fixed, not less: today a bot's submission harms nobody
because it lands in the bot's own browser. The day `POST /api/inquiry` exists, an
unprotected endpoint is a spam and database-growth problem. **The endpoint must not ship
without a server-side check** — that is the one place where #68's "out of scope" deserves a
second look before it is deployed, not after.

### F5 — Clerk Billing is disabled, so there are no plans to read — **S2** (decision, not defect)

Measured 2026-10-20 against the production instance:

```
GET https://api.clerk.com/v1/billing/plans
HTTP 403  {"code":"billing_not_enabled",
           "long_message":"The billing feature is not enabled for this instance."}
```

`/v1/commerce/plans` is deprecated in API version 2025-11-10 and later, so there is no
second route to the same data. **The client's "use the data created or changed in billing"
cannot be satisfied today** — there is no billing data.

This resolves the collision #69 named, and the issue already anticipated the answer: the
plan catalogue ships as a **local typed constant** whose shape mirrors a Clerk plan, so
wiring it to Billing later is a data-source swap rather than a UI rewrite. Two caveats stay
true until Billing is enabled: prices in that catalogue are **not** a commitment, and the
`stripe-sandbox-call-indigo` integration is provisioned but **unclaimed**.

### F6 — The Clerk-enabled build **is** deployed — **S3, and it corrects a repo document**

[`30-operations/security.md`](../30-operations/security.md) §1 states that the latest
Production deployment is the 29 September release and that *"the Clerk-enabled working tree
is not deployed"*. **That is no longer true.** Read from the live bytes:

```
curl https://call-indigo.com/                              → /assets/index-BEanJHIV.js
grep -o 'assets/[A-Za-z0-9_-]*\.js' that chunk              → assets/AdminArea-2-mDYO_J.js
curl https://call-indigo.com/assets/AdminArea-2-mDYO_J.js   → contains "pk_live_…" and "publicMetadata"
```

A `pk_live_` key and the `publicMetadata` role check in a **deployed** chunk can only come
from a Clerk-enabled build. Admin authentication is therefore live, not pending.

⚠️ **This also corrects an assumption in the repo's own memory** that production carries
zero `VITE_`-prefixed variables. It does — but the Clerk key does not need one:
`vite.config.ts:14-18` maps `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` onto
`import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` via `define` (ADR 0005). A missing `VITE_` var
is **not** evidence that sign-in is broken.

### F7 — There is no observability, and that is deliberate — **S3**

No analytics, no error reporting, no server logs. This is a founding product decision, not
an oversight (the site's cookie posture depends on it). The consequence to record is narrow
but real: **when F1 loses a lead, there is no signal that it happened.** Nothing anywhere
records a failed delivery, because there is no delivery.

### F8 — The repository is public — **S3**

`github.com/indigo-services/call-indigo` is public: source, demo fixtures and the
`localStorage` key shape are all readable. Nothing secret is committed — `.env.local` is now
ignored (`.gitignore`, 2026-10-20) — but any future "hidden" logic must be assumed readable.

---

## 4. What this audit changes

- **One repo document is stale and is corrected here**: `security.md` §1's deployment row
  (F6). The correction is recorded rather than applied silently, because the row is the
  evidence other documents cite.
- **Nothing else in the tree is touched.** This is an investigation.

---

## 5. Cross-references — priced once, not twice

| Finding | Where it is already priced / disclosed |
|---|---|
| F1, F2 | Option A, **$1,000** — [`proposal-backend-and-lead-handling-2026-09-29.md`](./proposal-backend-and-lead-handling-2026-09-29.md) §2.1 |
| F5 (checkout, if ever wanted) | Option B, **$1,500** (= Option A + $500) — same proposal §2.2. **Membership display is not Option B**: it takes no money. |
| F3, F4 | Stated as limits, not costed — [`30-operations/security.md`](../30-operations/security.md) §2–3 |
| F1 (client-facing wording) | [`client-disclosure.md`](./client-disclosure.md) §3.3 |

---

## 6. What this audit could **not** verify

Recorded so the next reader does not mistake silence for a clean bill of health.

| Question | Why it is open |
|---|---|
| Which commit production is actually running | The deployed chunk hashes (`index-BEanJHIV.js`) do not match a local build, and the Vercel CLI is unreachable from this environment (`vercel whoami` → SIGTERM). F6 proves *a* Clerk-enabled build is live, not *which* one. |
| Whether `/api/*` survives the SPA rewrite | `vercel.json` rewrites `/(.*)` → `/index.html`. Whether a function takes precedence is **unmeasured** — it needs a deployed function to test, which is #68's first step. Do not assume either way. |
| Whether the Neon, Resend and Stripe integrations work | They are installed; nothing calls them. `grep` for `fetch` returns 0. "Installed" and "reachable" are different sentences and only the first is currently true. |
| Whether Clerk Billing can be enabled without a connected Stripe account | Billing is off (F5), so this cannot be tested. Enabling it is a dashboard change with a payment provider attached — a client decision, not a repo change. |

---

*Every claim above carries a `file:line`, a command, or an explicit "unverified".
Where this document and the repository disagree, **the repository wins and this document is
the bug** — [`../00-meta/conventions.md`](../00-meta/conventions.md) §1.*
