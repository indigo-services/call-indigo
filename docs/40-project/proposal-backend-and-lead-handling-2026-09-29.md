# Proposal — a real backend, multi-form lead handling, and optional online booking

**Kind:** dated · **Owner:** the repo · **Prepared for:** the client · **Last verified:** 2026-09-29 at `6cb10f6`

**The work, in one line.** Move the site off browser storage onto a real server, so a form
submission reaches your inbox instead of staying in the visitor's browser — and, if you want
it, add a way to take bookings and payments online.

**Two options, one decision.**

| | Option A — Backend & lead handling | Option B — Option A **+** product & service checkout |
|---|---|---|
| **Price** | **$1,000** flat | **$1,500** — **$1,000** to start, **$500** on delivery |
| **What it fixes** | The form starts reaching you | Everything in A, plus bookings and payments online |
| **New third-party service** | A database host | A database host **and** a payment processor (PayPal) |
| **New client obligation** | None | A PayPal **business** account, and transaction fees |

Option B contains Option A. There is no third option, and nothing here commits you to B.

---

## 0. How to read this document

Every factual claim about the current site carries one of two markers, inherited from this
project's own rules:

- **[M] — measured**, read out of the live codebase, with the file named.
- **[P] — proposed.** Does not exist yet, is not priced as certainty, and has an open
  question in §10.

**Why this matters to you specifically:** the $1,000 figure prices work that is *known*, not
work that is *hoped for*. Where something is genuinely uncertain — chiefly PayPal's approval
process and sales-tax handling — it is marked **[P]**, and it is **not** counted as delivered
scope. A proposal that quietly prices unknowns as if they were known is how a fixed fee turns
into an argument.

**One conflict to name up front, before you read any further.** §6.3 covers it in full: this
site was built under a rule that it must set **no cookies** and run **no third-party
trackers**, and a payment provider will do both. That rule lives in your own requirements and
in the repository's `CONTRIBUTING.md`, so it is a decision you would be reversing rather than
a detail we would take care of quietly. **It affects Option B and not Option A.**

---

## 1. Where the site stands today

Call Indigo is a React 19 / Vite 7 / Tailwind v4 site: four public pages and nine dashboard
pages, with a real saved-data layer behind an async seam, a working inquiry form, and a
sign-in gate on `/admin` [M: [`../60-reference/routes.md`](../60-reference/routes.md)].

**What is solid and stays.** The design, the copy, the pages, the dashboard workflow, and the
automated checks all carry over unchanged. **Nothing in this proposal is a rewrite.**

**What is missing is a server.** Today the entire application runs in the visitor's browser,
and data is kept in that browser's `localStorage` [M: [`../60-reference/data-layer.md`](../60-reference/data-layer.md)].

### 1.1 The consequence, stated plainly

> **The inquiry form currently writes to the submitter's own browser. The business never
> receives it.**

A visitor fills in `/contact`, sees the success message, and an inquiry record is genuinely
created — in **their** browser, on **their** computer. There is no inbox, no email, and no
notification. **If you fill in your own contact form on your laptop and then check your
inbox, you will find nothing.** This is the single most important sentence in this document,
and it is the reason Option A exists [M: [`./client-disclosure.md`](./client-disclosure.md) §3.3].

### 1.2 What the repository already did to prepare for this

This is not a rebuild of the data layer. The project was deliberately built so that the swap
is small, and this is measured rather than asserted:

| The preparation | Where it is |
|---|---|
| **Every data call is already asynchronous** — written for the world where it returns a network promise, even though today's storage is instant | `src/lib/data/api.ts` [M] |
| **One file knows where data physically lives** — `backend.ts`, 136 lines | `src/lib/data/backend.ts` [M] |
| **Pages may not import the storage layer at all** — an enforced rule, not a convention | `tests/policy.mjs` [M] |
| **The domain types are storage-agnostic** — `types.ts` is 164 lines | `src/lib/data/types.ts` [M] |

> **The honest version:** the seam is real and it was built for exactly this work, and it
> still does not make the backend *small*. It makes it **one file** instead of fifteen. The
> work below is mostly server-side work that does not exist at all yet — a database, an API,
> and somewhere to run them.

---

## 2. Scope

### 2.1 In scope — Option A ($1,000)

| # | Deliverable | What "done" means |
|---|---|---|
| **A1** | **A real backend** — a hosted database plus a small API | Data lives on a server, not in a browser. Two visitors, two devices, one shared inbox |
| **A2** | **Move the existing dashboard onto it** | The nine dashboard pages read and write through the API. No behaviour change you can see |
| **A3** | **Multi-form inquiry/lead handling** | Several entry points — not just `/contact` — each routed to the right queue, with the form it came from recorded |
| **A4** | **Real notifications** | A new inquiry sends an email, so a lead does not depend on someone opening the dashboard |
| **A5** | **Speak to the hosting** | The site stops being a static bundle on Vercel and gains a server component |
| **A6** | **Spam protection that actually works** | The current captcha becomes a real gap once a backend exists (§6.5) and is replaced |

### 2.2 In scope — Option B ($1,500), which contains all of A1–A6

| # | Deliverable | What "done" means |
|---|---|---|
| **B1** | **A product/service catalogue** | Bookable services and packages, each with a price, editable by the team |
| **B2** | **PayPal checkout** | A visitor can pay for a service online, and you get the money |
| **B3** | **Payment records in the dashboard** | A paid booking appears next to its inquiry, with its payment status |
| **B4** | **A confirmation path** | The visitor gets a receipt; the team gets a paid-notification |
| **B5** | **Refunds and failure handling** | What happens when a payment fails, is abandoned, or has to be returned |

### 2.3 Explicitly out of scope — both options

Named here so they cannot be assumed in, and so that neither of us discovers them later:

- **Content management.** Editing the marketing pages' copy and images from the dashboard
  remains deferred (it is PRD §16.2 **F4** in the repository) [M].
- **A server-side sign-in session.** The `/admin` gate today is a curtain, not access
  control — its own documentation says so on the page and in four in-app places. **A1 lands
  a server, so this is worth doing** — but it is a separate, priced-apart item (§10 Q2),
  not a free rider on Option A.
- **Recurring billing, subscriptions, or the membership product.**
- **Inventory, shipping, or a full shopping cart** with quantities and line items.
- **Sales-tax calculation and remittance** — see §6.4. This is the item most likely to be
  assumed in and is deliberately not.
- **The client punch list** (T2, T5, T6, T7) and the **Terms/Privacy text** (T4) — these are
  decision items, and they are not included in either fee.
- **Mobile apps, a customer portal, or accounts for visitors.**

---

## 3. What changes, in plain terms

### 3.1 The lead path, today and after Option A

```
TODAY                                    AFTER OPTION A

visitor fills /contact                   visitor fills /contact
        ↓                                        ↓
browser validates                        browser validates
        ↓                                        ↓
written to the VISITOR's localStorage    POST to the server
        ↓                                        ↓
success message shown                    written to the DATABASE
        ↓                                        ↓
                                            ┌────┴────┐
you see: nothing                            ↓         ↓
                                      your inbox  the dashboard
                                      gets an email   inbox
```

The only part of that diagram that is new work on the *site* is the arrow out. The
database, the API, the email and the hosting are new work that has no counterpart today.

### 3.2 Why "multi-form" is real work and not a copy-paste

The requirement is more than one entry point. The design consequence is that **an inquiry
must carry where it came from**, so that a booking request from a service page and a general
question from `/contact` are not the same row wearing different labels.

| Without a source field | With one |
|---|---|
| One undifferentiated list | The dashboard can filter by entry point |
| "Where did this lead come from?" is unanswerable | Answerable, and reportable |
| Two teams answering the same lead | One queue, one owner |

Today `Inquiry` has no such field [M: `src/lib/data/types.ts`] — the contact form is the only
writer, so it never needed one. **Adding it is a schema change plus a migration, and it is
priced inside A3.** The repository has also already learned, on the `member` field, that
adding a required-on-write field to existing records has to be done carefully and deliberately
[M: `NewInquiry` restates `member` to keep it required on the way in].

---

## 4. Price

| | Option A | Option B |
|---|---|---|
| **Total** | **$1,000** | **$1,500** |
| **Schedule** | Flat — invoiced on delivery | **$1,000** to start · **$500** on delivery |
| **Deposit refundable?** | n/a | No — it covers the work started, see §4.1 |
| **Recurring cost to you** | Hosting + database + email sending (§4.2) | The same, plus PayPal transaction fees |
| **New accounts you must open** | None — we set these up under accounts you own | A **PayPal Business** account, in your name |

**What the flat fee covers.** The scope in §2, delivered to the acceptance criteria in §7,
including the code, the tests, the documentation in the repository, and the deployment. **It
is a fixed price for the scope as written.** If the scope changes, that is a conversation
with a written amendment — it is not absorbed silently, and it is not invoiced by surprise.

### 4.1 Why Option B is staged rather than flat

Option B depends on **PayPal's approval of your business account**, which we do not control
and cannot schedule. Staging the payment means:

- You pay $1,000 for work that has started, not for a promise.
- The $500 is due **when checkout is live and taking a real payment** — not when the code is
  written.
- If PayPal declines onboarding, **that is scoped out at no charge**, and Option A still
  stands on its own. You are not paying $500 for an integration you cannot use.

*This is the reason the staged structure exists, and it is worth knowing that it is not a
cash-flow convenience dressed as one.*

### 4.2 Your ongoing costs — the part that is not our invoice

Both options move the site from a purely static host to a hosted database and an API. That
carries a running cost **paid to the providers, not to us**, and it is bounded and small:

| Item | Rough monthly | Note |
|---|---|---|
| Database + API hosting | **$0–25** | A free tier genuinely covers this volume |
| Transactional email | **$0–20** | Free tiers send hundreds per month |
| PayPal fees (Option B only) | **~2.9% + $0.30** per transaction | PayPal's published rate; confirm current |
| Domain, existing hosting | unchanged | You already pay this |

> ⚠️ **These figures are indicative [P], deliberately marked, and quoted as ranges rather
> than as a price.** They depend on the provider chosen and your volume, and neither has been
> fixed yet. §10 Q4 asks for the decision that settles them. **We will not spend your money
> on a provider without asking which one.**

**Accounts are opened in your name**, under your ownership, billed to you directly. We do not
resell hosting, and there is no markup.

---

## 5. Timing

**No calendar is offered, and that is deliberate.** This repository's own convention is that
its cadence is measured in sessions rather than sprints, and that *"a fabricated calendar
would be the first dishonest number in the plan"* [M: [`./roadmap.md`](./roadmap.md) §1].
Putting invented dates in a document you are asked to approve would be exactly that.

What can be committed to honestly is **sequence and dependency**:

```
Option A   A1 backend ──┬─→ A2 dashboard ──→ A3 multi-form ──→ A6 spam
                        │
                        ├─→ A4 notifications
                        │
                        └─→ A5 hosting
                               │
Option B                       └─→ B1 catalogue ──→ B2 checkout ──→ B3/B4/B5
                                                          ↑
                                        blocked on PayPal approval of YOUR account
```

**The two things that genuinely gate the schedule, and neither is ours:**

1. **PayPal's approval of your business account** — Option B cannot start its second half
   until this clears [P].
2. **Your answers to §10** — chiefly the provider choice (Q4) and the tax position (Q3).

**Everything else is ours to sequence, and progress is reported against the figure above
rather than against a date.** Each deliverable is shipped and verified independently, so you
can see A1 working before A3 begins.

---

## 6. Risks and trade-offs — the honest section

**This section is the point of the document.** Each row is something that could go wrong, or
something you are buying into, stated before you decide rather than after.

### 6.1 The scope is bigger than the fee's shape suggests

**The seam makes the *swap* small. It does not make the *backend* small.** A hosted database,
an API, email delivery, spam defences and a deploy pipeline do not exist today in any form.
The $1,000 is not a discount on an easy job; it is a fixed price on a real one, and the
seam is why it is not three times that.

### 6.2 Moving to a real backend is a one-way door

**Once there is live data, there is no going back**, and there is nothing to migrate: the
existing `localStorage` records are per-browser and cannot be collected from your visitors
[M: [`../60-reference/data-layer.md`](../60-reference/data-layer.md) §8]. **A real backend
starts empty.** Acceptable precisely because nothing real has been collected yet — and it
will never be true again after the first genuine inquiry.

### 6.3 ⚠️ A payment provider reverses a recorded decision

**This is the most important governance point in the document, and it applies to Option B.**

Your own requirements rule out cookies and third-party trackers, and `CONTRIBUTING.md` names
it in *"What we will not merge"* — *"Anything that adds a cookie, analytics, or a
third-party captcha"* [M]. The site today sets **no cookie at all** on the public pages, runs
**no analytics**, and loads **no third-party script at runtime** [M:
[`./client-disclosure.md`](./client-disclosure.md) §3.2].

**A PayPal checkout will set cookies and run a third-party script.** It has to — that is how
hosted payment buttons work. So choosing B means:

| Consequence | Detail |
|---|---|
| **The rule is reversed** | Deliberately and in writing, or not at all |
| **The Privacy policy must change** | It currently states the site sets no cookies. That sentence becomes false |
| **Five automated checks must be inverted** | They currently *fail* if a tracking script appears [M: [`./client-disclosure.md`](./client-disclosure.md) §3.5] |
| **Option A does not do this** | A backend and its cookies are **first-party**; A can ship with the rule intact |

*Recommendation: if the no-tracker rule matters to you — and judging by how the site was
specified, it does — **take Option A first**, and decide on B separately once a backend
exists. A is a prerequisite for B anyway, so nothing is lost by deciding in that order.*

### 6.4 Sales tax is not handled, in either option

Taking money for a service in Texas raises questions about tax on that service, and
**calculating, collecting and remitting it is not in scope** (§2.3). Stripe and PayPal both
offer tax tooling, and it is a real integration with a real configuration burden.

**This is a question for your accountant, not for us.** The platform will faithfully process
whatever amount it is told to charge. What that amount should include is a decision we are
not qualified to make and will not make silently. See §10 Q3.

### 6.5 The current captcha becomes a real gap

The captcha today is a **local arithmetic challenge** with zero external calls, and it stops
no determined bot. That is acceptable *only* because there is currently nothing to spam — the
form writes to the visitor's own browser [M:
[`./client-disclosure.md`](./client-disclosure.md) §3.4].

> **The moment a real backend exists, that reasoning collapses.** Every submission becomes a
> real row, a real email, and a real cost. **A6 exists because of this**, and it is why spam
> defence is scope rather than an afterthought. It is also the reason the third-party-captcha
> question has to be reopened — the local arithmetic challenge will not survive contact with
> a public form.

### 6.6 Third-party dependencies, and what happens if one fails

| Provider | Used for | If it fails |
|---|---|---|
| Database host | All persisted data | The dashboard and form stop. Data is not lost — it is theirs, backed up |
| Email sender | Lead notifications | Leads still land in the dashboard; only the email is delayed |
| **PayPal** (B only) | Payments | **Checkout stops. No money moves.** The rest of the site is unaffected |

**In every case the data lives in accounts you own**, and none of these providers can hold you
hostage through us. That is a deliberate property of how this is set up, not a coincidence.

### 6.7 What we cannot promise

- **That PayPal approves your account**, or how long it takes.
- **A date**, for the reason in §5.
- **That the fee will not change if the scope does** — §4. It will, by written amendment.
- **That a fixed fee makes the unknowns finite.** Where something is marked **[P]** in this
  document, it is genuinely unresolved, and pricing it as though it were resolved would be
  the dishonest move.

---

## 7. Acceptance criteria — how you know a deliverable is done

Each is demonstrable, in the spirit of the repository's own rule that a "done" item is one
that can be re-run rather than one that can be asserted.

**Option A**

- [ ] **A submission made on one device appears in the dashboard on another.** The current
      failure, restated as a test.
- [ ] **A new inquiry sends an email** to the configured address, from outside the browser.
- [ ] **The dashboard's nine pages read and write through the API** with no visible change in
      behaviour.
- [ ] **Submitting from two different entry points produces two records, each labelled with
      its source.**
- [ ] **A bot submitting the form hundreds of times does not produce hundreds of rows or
      emails.**
- [ ] **The automated check suite passes**, and the check count is asserted by the run that
      produced it — the repository's existing standard [M: `tests/run.mjs`].

**Option B — additionally**

- [ ] **A real payment of $1 succeeds end to end**, and the booking appears paid in the
      dashboard.
- [ ] **A failed or abandoned payment leaves no booking marked paid.**
- [ ] **A refund issued in PayPal is reflected in the dashboard**, or the limitation is
      documented if PayPal's API does not permit it.
- [ ] **The Privacy policy and the five tracking checks are updated** per §6.3, deliberately
      and in the same change.

---

## 8. What we need from you to start

| # | Item | Why it blocks |
|---|---|---|
| 1 | **Which option** — A or B | Everything else follows from it |
| 2 | **A decision on §6.3**, if Option B | It reverses a recorded decision. It is yours to make, not ours |
| 3 | **Answers to Q1–Q5 in §10** | Chiefly the provider choice and the tax position |
| 4 | **A PayPal Business account** in your legal name, if Option B | Approval is [P] and gates B's second half |
| 5 | **Your legal entity name** | ⚠️ **The repository currently states two.** *Call Indigo LLC* appears 105 times; *Indigo Home & Facility Services* appears 26 times and is identified in the PRD as the **legal** name. The `LICENSE` uses the legal name; the live site footer renders *"© Call Indigo LLC"*. **An invoice, a PayPal account and a copyright notice all need the same answer**, and picking the more frequent string would be a guess dressed as a measurement [M: [`./client-disclosure.md`](./client-disclosure.md) §5.6] |

**Item 5 is not new here and it is not ours to fix.** It is already recorded as an open
decision blocked on you in the repository's own disclosure. It simply becomes unavoidable
once money and invoices are involved.

---

## 9. Why a backend first, and an example of what it unlocks

**Option A is the thing every other improvement depends on.** The repository's own roadmap
says so directly — *"F2 is the roadmap. Every other item either depends on it or is cosmetic
next to it"* [M: [`./roadmap.md`](./roadmap.md) §2.1].

Worth noting, because it is unusual: **the same backend does work you can already see.**
Several items on the existing punch list are blocked on the client, not on code — but the
deferred **product** work is largely blocked on exactly this. Content management, asset
management, an audit log, and a real sign-in session all sit behind the same missing server
[M: [`./roadmap.md`](./roadmap.md) §2]. **Option A is not a one-purpose purchase.**

---

## 10. Open questions — each with a recommendation

Per this repository's convention, a question without a recommendation is a decision being
deferred onto the reader.

**Q1 — Which option?**

Option A fixes the thing that is actually broken; Option B fixes that *and* adds revenue, at
the cost of reversing your no-tracker rule and adding a permanent third-party dependency.

*Recommendation: **A now, B after.** A is a prerequisite for B, so taking A first costs
nothing and defers the decision you should not make quickly (§6.3).*

**Q2 — Should the server-side sign-in session be folded into Option A?**

The `/admin` gate today is a curtain, not access control — anyone who can open browser
developer tools can step past it [M: [`./client-disclosure.md`](./client-disclosure.md) §4.2].
That is honest for a prototype with no real data. **Once A1 lands, the dashboard holds real
customer inquiries**, and the curtain is protecting something that now exists.

*Recommendation: **do it, priced separately.** Folding it in silently would be a scope change
we cannot absorb inside the fixed fee; leaving it undone means a real inbox behind a fake
lock. It is a small piece of work with an obvious trigger.*

**Q3 — Who is deciding the tax position?**

See §6.4. This is an accountant's question, not ours, and the platform will charge whatever
it is told.

*Recommendation: **ask your accountant before B2 is built.** If tax must be applied, that
changes the checkout design, and discovering it after the integration is written is
expensive.*

**Q4 — Which database and hosting provider?**

The choice determines the recurring cost in §4.2 and the one file that changes.

*Recommendation: **we propose one, you approve it, and the account is yours.** We will not
commit you to a provider, and we will not run your data on an account you do not control.
The specific recommendation is deliberately deferred until Q1 is answered, because Option B's
requirements narrow the field.*

**Q5 — What counts as a lead source?**

A3 records where a submission came from. Whether that is *which page*, *which form*, *which
campaign*, or all three is a business decision, and it changes the schema.

*Recommendation: **start with the page and the form name.** Both are free to capture and
answer "where did this come from?" entirely. Campaign attribution implies marketing tags,
which collides with §6.3 and should be a separate decision.*

---

## 11. Summary — one page, for a decision

**The problem.** The contact form does not reach you. It writes to the visitor's own browser.
Every visitor who has filled it in has been told it worked, and you have received nothing
[M: [`./client-disclosure.md`](./client-disclosure.md) §3.3].

**Option A — $1,000 flat.** A real backend, the dashboard moved onto it, several lead entry
points each labelled with its source, working email notifications, and spam defence that
holds. **The site keeps its no-cookie, no-tracker property.**

**Option B — $1,500, $1,000 down / $500 on delivery.** All of Option A, plus a service
catalogue, PayPal checkout, payment records in the dashboard, and refund handling. **This
reverses the no-tracker rule deliberately, needs a PayPal Business account, adds transaction
fees, and excludes sales tax.**

**What is honestly uncertain.** PayPal's approval, the timing, the provider choice, and the
tax question. Each is marked **[P]** and priced as out of scope rather than assumed in.

**The one thing worth repeating at the end:** this is a fixed fee for a defined scope. §2.3
lists what it does *not* include, and it is worth reading before agreeing to anything.

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| The form writes to the submitter's browser; the business never receives it | [`./client-disclosure.md`](./client-disclosure.md) §3.3 |
| No cookies, no analytics, no third-party scripts at runtime | [`./client-disclosure.md`](./client-disclosure.md) §3.2 |
| The captcha is local arithmetic and stops no bot | [`./client-disclosure.md`](./client-disclosure.md) §3.4 |
| The active sign-in gate is not access control | [`./client-disclosure.md`](./client-disclosure.md) §4.2 |
| The copyright holder name is unresolved, two names in the tree | [`./client-disclosure.md`](./client-disclosure.md) §5.6 |
| Every `api.ts` method is already `async`; `backend.ts` is the only storage-aware file | `src/lib/data/api.ts`, `src/lib/data/backend.ts` [M] |
| Pages may not import the backend directly — enforced | `tests/policy.mjs` [M] |
| `Inquiry` carries no source field | `src/lib/data/types.ts` [M] |
| `localStorage` is per-browser and cannot be migrated from | [`../60-reference/data-layer.md`](../60-reference/data-layer.md) §8 |
| F2 is the roadmap; content and asset management depend on it | [`./roadmap.md`](./roadmap.md) §2.1, §2 |
| **F2** — real persistence, API + database | `PRD.md` §16.2 [M] |
| Dates are deliberately relative; a fabricated calendar is the first dishonest number | [`./roadmap.md`](./roadmap.md) §1 |
| A "done" item is one that can be re-run, not asserted | `tests/run.mjs`, [`../00-meta/conventions.md`](../00-meta/conventions.md) §3 |

---

**Last verified:** 2026-09-29 at `6cb10f6`
