# Plan — admin navigation, roles and the vendor accounts

**Kind:** dated · **Owner:** the repo · **Status:** accepted — Q1 answered by the `v2.3.0` tag; R1–R3 target `v2.4.0`
**Base:** `a26b291` (main, 2026-10-27) · **Issues:** #104, #105, #106, #107, #108
**Last verified:** 2026-10-28, re-verified against `27da05a` — see §10 for what moved

---

## 0. What this document is, and what it is not

**It is** a sequenced plan for three sidebar changes and one question of product design, with
every claim about the current code verified against `a26b291` and cited in Appendix A.

**It is not** a design for a general navigation system, and it does not touch the marketing
site, the database schema, or the capability model beyond one new read capability.

**One thing this document was not allowed to do:** quietly assume the next release was
`v2.2.0`. Three documents in this repo already claim that number for something else. §1.3
records the collision and how it was resolved.

---

## 1. Verified starting state

### 1.1 The three requests, read against the code

The request has three parts. Two of them are **not what they appear to be**, and saying so is
most of the value of this section.

| # | As asked | What the code actually does |
|---|---|---|
| 1 | "the dashboard shouldn't have the Dashboard links to Admin role provider accounts" | **A live defect.** A Service Rep sees Clerk, Vercel and GitHub. See §1.2. |
| 2 | "an Admin only section … to Google and Social account pages" | **Genuinely missing.** The external nav holds three groups' worth of nothing else: one group, three items, all vendor infrastructure. `src/admin/routes.ts:204-228`. |
| 3 | "both Admin and Service accounts should see links to the website home page, and a user settings link" | **Already true, and invisible.** The home link exists for every role (`src/components/app-sidebar.tsx:150-155`); the account control exists as `<UserButton />` (`:156`) rendering a bare avatar. The treatment is the problem, not the presence. And the "user settings link" cannot be `/admin/profile` for a rep — §1.4. |

### 1.2 Why a Service Rep sees the vendor dashboards

`src/components/app-sidebar.tsx:130-138` carries a warning block that argues the external
group needs no gate:

> This group is NOT role-gated, and that is deliberate rather than an oversight.
> `RequireAuth` already refuses to render `AdminLayout` — and therefore this sidebar — to
> anyone without the admin role, so a `visibleTo` predicate here would be tautologically
> true for every render that can reach it.

**That premise was true until #100.** It is false now, and nothing failed when it became
false:

1. `src/admin/RequireAuth.tsx:73` refuses only when `access.features.size === 0`.
2. A `service_rep` holds `inbox:read` and `inbox:write` (`api/_lib/roles.ts:119`), which opens
   the `inbox` feature (`src/admin/clerkAuth.ts:144-149`). The size is 1. The shell renders.
3. Internal items are filtered per item (`src/components/app-sidebar.tsx:94`), but
   `<ExternalNavLinks />` (`:139`) maps `ADMIN_EXTERNAL_NAV` with no filter at all
   (`src/admin/ExternalNav.tsx:38`) — and `AdminExternalNavItem` (`src/admin/routes.ts:167`)
   has no `feature` field, so there is nothing to filter on.

The comment is not merely stale. It is the reason the defect was not caught: it tells a
reviewer the question has already been answered, in a release that answered it differently.

⚠️ This is a **general trap**, not a one-off: a comment that justifies an absent guard by
citing a guard elsewhere expires silently when that guard's rule changes. #101's memory entry
records the same lesson one level up ("the nav filter is not a guard"). The repair is not to
delete the comment but to leave the new reason where the old one was.

### 1.3 The version collision — resolved, not by this document

**How it stood at `a26b291`.** The tag line was `v2.0.1`, `v2.0.2`, `v2.1.0` (plus one
non-release ref, `archive/three-lead-forms`); `package.json` was `2.1.0`. On that evidence the
next product number was `v2.2.0` — but three documents already used `v2.2.0` as the
*documentation* milestone's Phase 3 label:

| File:line | Said |
|---|---|
| `docs/40-project/roadmap.md:20` | Phase 3, "The docs library", `Release` = `v2.2.0` |
| `docs/README.md:108` | "**v2.2.0** — the numbered-domain library, fully populated" |
| `docs/40-project/prd/phase-3-docs-library.md:5,11` | "**Release:** `v2.2.0`" |

Phase 3 is **Done** and shipped inside `v2.0.x`, so `v2.2.0` was a spent *label* and a free
*tag*. This document offered two readings and recommended A (reuse `v2.2.0`, with four edits
to the documents that claim it).

**What actually happened: B, and it is settled.** `v2.3.0` was tagged on **2026-10-27**
(`74544e1`, "the server release"), `package.json` is now `2.3.0`, and `roadmap.md:32-37`
names `v2.3.0` as the product release. So:

- **`v2.2.0` stays a label with no tag, permanently.** Reading A is no longer available — the
  number was skipped by a release that already shipped. Do not "close the hole" by tagging
  `v2.2.0` now; it would attach a product release to three documents that describe a docs
  library, which is the exact contradiction A was trying to prevent, inverted.
- **The four edits in reading A must not be made.** They were written to make `v2.2.0` mean
  the product. `roadmap.md:32-37` was instead rewritten to say `v2.3.0` is the product
  release — which is the edit B required, and the one that makes the skipped number legible.
- **This work therefore targets `v2.4.0`**, and R4/C5 (the Navigation pane, #107) targets
  `v2.5.0`. Both numbers below have been moved accordingly; the *sequencing* — gating first,
  panel after — is unchanged and is the part that mattered.

⚠️ **The lesson worth keeping.** This document's blocking question was answered by a release
that shipped while the document sat in draft, and nothing announced it. A plan that
recommends a version number has a shelf life measured in commits: re-read the tag line and
`package.json` before acting on the recommendation, not after. The `v2.2.0` reasoning above is
kept in past tense on purpose — it is the record of a decision that was made differently, and
deleting it would leave the next reader wondering why the line jumps from `v2.1.0` to
`v2.3.0`.

### 1.4 A Service Rep cannot be sent to `/admin/profile`

The third request asks for "a user settings link" for both Admin and Service accounts. The
obvious target does not work:

- `/admin/profile` is tagged `feature: "settings"` (`src/admin/routes.ts:87-89`).
- A `service_rep` holds `inbox:read`/`inbox:write` and nothing else (`api/_lib/roles.ts:119`),
  so `AdminLayout.tsx:57` replaces the outlet with the refusal screen.
- And it would not save even if it rendered: `PUT /api/settings?key=profile` requires
  `settings:write` (`api/settings.ts:39` region), which a rep does not hold.

A rep's "user settings" is therefore **Clerk's own account modal** — name, email, password,
sessions — which every signed-in person has regardless of staff level. That is what #106
proposes, and it is the honest answer rather than a tidier one.

### 1.5 Iframes: measured, and not a backlog item

The request asks whether loading the service accounts in an iframe is worth including or
backlogging. Measured 2026-10-27, unauthenticated, following redirects:

| Provider | Framing policy |
|---|---|
| `dashboard.clerk.com` | `X-Frame-Options: deny` |
| `vercel.com` | `X-Frame-Options: DENY`; CSP `frame-ancestors 'self'` + vercel/contentful origins |
| `github.com` | `X-Frame-Options: deny`; CSP `frame-ancestors 'none'` |
| `business.google.com` | `X-Frame-Options: SAMEORIGIN` |
| `business.facebook.com` | `X-Frame-Options: DENY` (after the 302) |
| `instagram.com` | `X-Frame-Options: DENY` |

**Six of six refuse to be framed cross-origin.** None of them lists `call-indigo.com` in
`frame-ancestors`. An `<iframe>` would render a blank rectangle with a console error, in every
environment, permanently — this is not a policy the client can negotiate, it is the vendor's
clickjacking defence.

So the answer to "backlog or include?" is **neither**: it is a **non-goal**, and it should be
recorded as one (§8) rather than deferred. A backlog item implies a future release could do
it; none can.

---

## 2. The product, decomposed

Each capability maps to exactly one release. Nothing here is a page redesign.

| ID | Capability | Release | Issue |
|---|---|---|---|
| **C1** | The external groups are gated by a capability, not by the shell | v2.4.0 | #104 |
| **C2** | One new read capability, `accounts:read`, held by admin alone, present on both sides of the list | v2.4.0 | #104 |
| **C3** | A `Business accounts` group: Google Business Profile, Facebook, Instagram | v2.4.0 | #105 |
| **C4** | Every role gets a labelled home link and a labelled account control | v2.4.0 | #106 |
| **C5** | An admin can add, edit, remove and reorder **external** links without a deploy | v2.5.0 | #107 |
| **C6** | The roadmap's product table matches the tree | shipped in v2.3.0 | #108 |

**C5 is the answer to the design question in the request** — "would a simple Admin settings
panel be the solution that lets an admin reorder the menu and add provider accounts in
groupings?" The answer is *yes for the external links, no for the internal pages, and not in
the same release as C1–C4*. §3.3 is the reasoning.

---

## 3. Design decisions

### 3.1 Gate on `feature`, not on `access.role`

**Chosen:** add `feature` to `AdminExternalNavItem` and filter with the same
`can(access, item.feature)` the internal groups use.

**Rejected — `access.role === "admin"` in the nav.** It works today in one line. It is also a
second access rule living beside `feature`, which is precisely the client/server drift #100
spent a release removing (`src/admin/clerkAuth.ts:11-30` records that history). One predicate
for both halves of the sidebar is the property worth keeping.

**Rejected — reusing the existing `team` feature.** `team` is opened by `settings:read`, which
a `service_manager` holds. A manager would keep seeing the Clerk dashboard. The request says
admin.

### 3.2 One capability, `accounts:read`, for both external groups

**Chosen:** a single new capability and a single `accounts` feature, covering both the
`Dashboards` group and the new `Business accounts` group.

**Why the name.** Capabilities here are `<area>:<action>` — `inbox:read`, `settings:read`,
`reference:read` — and the areas are coarser than pages on purpose
(`src/admin/clerkAuth.ts:58-65`). `accounts` names what both groups are: links to accounts the
business owns, none of them hosted here.

**Rejected — a second capability for the Google/social group.** Two names for one decision. The
moment they need to differ, that is a real requirement; inventing it now costs a capability
slot and a test for a distinction nobody has asked for.

**Rejected — a nav-only predicate with no capability at all.** It would be the first
permission decision in the sidebar that `/api/me` does not know about, which is the exact
thing `use-capabilities.ts` exists to prevent.

**Precedent for a capability that guards no endpoint:** `reference:read` guards nothing on the
server either, and `api/_lib/roles.ts:111-114` records why it is in the table anyway — so a
later server surface is a *check*, not an invention. `accounts:read` is the same shape.

⚠️ **The cost, stated plainly:** the capability list is duplicated between `api/_lib/roles.ts`
and `src/admin/clerkAuth.ts`, because the two are built by different tsconfigs and `src/` may
not import `api/`. `tests/backend.mjs` asserts the two are identical in both directions, so a
one-sided edit fails the build rather than hiding a group from everybody. Four edits, one test
that catches three of them.

### 3.3 The settings panel: external links yes, internal order no

**Chosen:** an admin pane that manages **only** the external groups (C5), in the release after
the gating fix.

**Rejected — letting the panel reorder the internal pages.** Four reasons, in order of weight:

1. **Order encodes an errand.** The inbox is first because that is the job. That is a reviewed
   decision, not a preference, and the sidebar's job is to answer "what do I do now".
2. **The nav is asserted by tests.** 10 routes, 2 group labels, 9 Settings sub-panes, and a
   path→feature map (`tests/policy.mjs:275-326`). A stored order is invisible to every one of
   them, so the assertions would have to be weakened to permit a feature nobody needs.
3. **The failure mode is invisible.** A stored order that disagrees with the code produces a
   sidebar that differs per session, with no audit trail — to replace a two-minute reviewed
   edit.
4. **Grouping is the dangerous half.** `tests/policy.mjs:301` exists because a regroup once
   moved a page between permission areas. A panel that can move an *internal* page between
   groups can retag access while the labels look shuffled, and no test can see runtime data.

**If the owner wants internal reordering anyway**, the honest minimal version is a stored array
of **paths**, filtered against `ADMIN_ROUTES`, unknown paths ignored. It can never add a page
and `feature` never moves. That is a different, smaller issue — not this one.

**Why the external half is worth building.** Adding a business account is currently a PR: the
URLs are hard-coded (`src/admin/routes.ts:192-202`) for a good reason — they do not vary by
environment — but that reasoning protects the three *vendor infrastructure* links, not the
business's own social profiles, which change when the business does.

### 3.4 The account control is Clerk's modal, not a new page

**Chosen:** `useClerk().openUserProfile()` behind a labelled `Your account` control, for every
role.

**Rejected — retagging `/admin/profile` to a self-service area every role gets.** It is the
tidier product answer and it is a **server change**: `settings:write` is enforced per endpoint,
not per key (`api/settings.ts`), so a rep writing their own profile means a per-key capability.
Worth doing; not worth bundling into a sidebar fix. It is a separate issue if the owner wants
it (§9 Q3).

**Rejected — a new `/admin/account` route.** A page that duplicates Clerk's own account UI, for
a rep who can already reach it from the avatar, adds a route, a test count and a capability
question to solve a labelling problem.

---

## 4. Release-by-release plan

### Pre-flight — P1: the roadmap stops contradicting the tree (#108)

**Why first:** this plan reads the roadmap to decide what the next release is, and three rows
of it say the main data boundary is unbuilt. A plan that cites a stale document inherits the
staleness. It is also the cheapest item here and it is docs-only, so it can land while the
version question is open.

**In scope:** §2 of `roadmap.md`, row by row, against the tree; §2.1 rewritten or retired.

**NOT in scope:** §1 (the documentation milestone table) — it already carries the
"these labels are not tags" warning and is fine. No CHANGELOG entry, no tag.

**Exit criteria**

```bash
node tests/run.mjs                      # docs suite green, no count change
git grep -n "still requires a backend" docs/    # no hits
git grep -n "F2 is the roadmap" docs/           # no hits
```

### v2.4.0 — R1: the external groups are gated (#104)

**In scope:** `feature` on `AdminExternalNavItem`; `accounts:read` in both capability lists;
`FEATURES_FOR_CAPABILITY` gains `accounts`; `ExternalNavLinks` filters with `can()`; the
`app-sidebar.tsx:130-138` warning block replaced with the new reason.

**NOT in scope:** the Business accounts group (#105 — separate PR, same release); the footer
(#106); any server endpoint; any change to `ADMIN_ROUTES` membership or order.

**Exit criteria**

```bash
node tests/run.mjs                                   # green, N checks
grep -n "checks passed" README.md                    # N matches the suite
git grep -n "NOT role-gated" src/                    # no hits
git grep -c "accounts:read" api/_lib/roles.ts        # >= 2 (ALL_CAPABILITIES + CAPABILITIES)
git grep -c "accounts:read" src/admin/clerkAuth.ts   # >= 2 (KNOWN_CAPABILITIES + FEATURES_FOR_CAPABILITY)
```

**Mutation test, and it is the acceptance criterion for the fix:** remove the `can()` filter
from `ExternalNavLinks` and the new anchor-count check must fail. A check that proves the group
renders (the existing `:254`) cannot see this defect — the group *did* render, for everybody.

### v2.4.0 — R2: the Business accounts group (#105)

**In scope:** a second `AdminExternalNavGroup` with three items, gated `accounts` from the
start.

**NOT in scope:** a URL-management UI (#107). The three hrefs are hard-coded.

**Blocking input:** the three exact URLs (§9 Q2). Recommended: ship with the management homes
(`business.google.com`, `business.facebook.com`, `instagram.com`) so the group lands with the
gating, then replace three strings.

**Exit criteria**

```bash
git grep -c "business.google.com" src/admin/routes.ts   # 1
node tests/run.mjs                                      # green; the absolute-https check covers the new three
```

### v2.4.0 — R3: home and account links for every role (#106)

**In scope:** a labelled `Your account` control via `openUserProfile()`; the home link promoted
out of the footer footnote into a labelled item.

**NOT in scope:** any change to `/admin/profile`'s feature tag; any new route; the per-key
capability (§9 Q3).

**Exit criteria**

```bash
git grep -n "openUserProfile" src/components/app-sidebar.tsx   # 1 hit
node tests/run.mjs                                             # green
```

### v2.5.0 — R4: the Navigation pane (#107)

**In scope:** `/admin/navigation`; add/edit/remove/reorder **external** links; a `navigation`
settings key, private; a runtime https-only href check at the write boundary.

**NOT in scope:** reordering or regrouping internal pages (§3.3); icons from an arbitrary
source (a fixed set); per-user menus.

**Exit criteria**

```bash
node tests/run.mjs                                                    # green
curl -s -o /dev/null -w "%{http_code}" "$PROD/api/settings?key=navigation"   # 401 anonymous
# as admin, PUT {"links":[{"title":"x","href":"javascript:alert(1)"}]}       # 422, fields.href
# as admin, PUT a valid list; reload /admin; the sidebar shows the new order
```

---

## 5. Task inventory

| Task | Capability | Release | Blocked by |
|---|---|---|---|
| P1 — re-verify roadmap §2 | C6 | shipped in v2.3.0 | — |
| R1a — `accounts:read` in `api/_lib/roles.ts` | C2 | v2.4.0 | — |
| R1b — `accounts:read` + `accounts` feature in `src/admin/clerkAuth.ts` | C2 | v2.4.0 | R1a |
| R1c — `feature` on `AdminExternalNavItem`, set on the three items | C1 | v2.4.0 | R1b |
| R1d — filter in `ExternalNavLinks` | C1 | v2.4.0 | R1c |
| R1e — replace the stale warning block in `app-sidebar.tsx` | C1 | v2.4.0 | R1d |
| R1f — anchor-count check, rep vs admin | C1 | v2.4.0 | R1d |
| R2 — Business accounts group | C3 | v2.4.0 | R1c, Q2 |
| R3 — footer home + account control | C4 | v2.4.0 | — |
| R4 — Navigation pane | C5 | v2.5.0 | R1d, R1f |
| Q1 — version decision | — | answered (`v2.3.0`) | — |
| Q2 — three URLs | C3 | v2.4.0 | owner |

---

## 6. Sequencing, dependencies, critical path

**Critical path: R1 → R2.** R2 cannot be gated before the `feature` field exists; shipping it
first would re-create the bug in a new group.

**Genuinely parallel: R3 against R1/R2.** Different surface (the footer), no shared type. But
⚠️ R3 and R1 **both edit `src/components/app-sidebar.tsx`**. They are parallel *tasks* and must
be **serial edits to that one file** — parallel `Edit` calls to one file race on the write and
silently drop one change while both report success.

**P1 is independent of everything** and should land first.

**Order inside R1 matters:** capability lists (R1a, R1b) before the type change (R1c) before the
filter (R1d) before the comment (R1e). Each step is checkable on its own, and a half-done R1 is
strictly safer than a half-done R2: until R1c lands, nothing is gated and nothing is worse.

---

## 7. Risk register

| ID | Risk | Impact | Mitigation | Status |
|---|---|---|---|---|
| **K1** | The tag `v2.2.0` is created while three documents claim it for the docs library | Two contradictory release histories; the docs index is wrong at the tag | **Resolved the other way:** `v2.3.0` was tagged on 2026-10-27 and `v2.2.0` stays a label with no tag. The four "reading A" edits were never made and must not be made now (§1.3) | **Closed — moot** |
| **K2** | `accounts:read` added to one capability list only | `tests/backend.mjs` fails — the intended outcome. If that test is ever weakened, the group silently disappears for everyone | Keep the both-directions assertion; it is the only thing that can catch this | Mitigated |
| **K3** | The new gating check passes without testing anything (the group renders for an admin, which it always did) | The defect survives a green suite | Assert **zero** anchors for a rep, not just three for an admin; mutation-test by deleting the filter | Mitigated by design |
| **K4** | The `app-sidebar.tsx` comment is deleted rather than replaced | The next reviewer re-asks the same question, and the next guard change goes unnoticed again | R1e is a task, not a cleanup | Mitigated |
| **K5** | R4's pane accepts a stored `javascript:` href | Admin-authored script injection into the sidebar | Runtime https-only validation at the write boundary; `tests/policy.mjs:205` only covers static hrefs | **Open — R4** |
| **K6** | Internal pages get dragged into R4's scope ("while we're here") | The nav tests have to be weakened; a regroup can retag access | §3.3 and the per-release NOT-in-scope lists | Fenced |
| **K7** | The three URLs arrive late and block R2 | A release waits on three strings | Ship with the management homes; replace later (§9 Q2) | Mitigated |
| **K8** | The tree is edited under this document by another session | Line citations drift and a commit can swallow another agent's work | This happened: `#102` landed as `1944fa7` (#110) and moved every citation below `routes.ts:103`. All citations re-pinned to `27da05a` (§10); commit only this document's paths, never `git add -A` | **Live — recurred** |
| **K9** | The sidebar is not the only place a role is promised something it cannot do | The same class of defect reappears | This is #101's lesson, one level down. `tests/policy.mjs` has no general assertion that a visible control is an enabled one — the honest answer is that this class needs a review habit, not a test | Accepted |

---

## 8. Do not do yet

- **Iframes for the vendor dashboards.** Not deferred — **rejected**, measured (§1.5). Six of
  six providers refuse cross-domain framing. Do not re-open this without a provider that
  permits it.
- **Reordering or regrouping the internal pages.** §3.3. The tests assert the shape; the shape
  is a decision.
- **A per-key capability so a rep can save their own profile.** The right fix for the
  collision in §1.4, and a server change (§9 Q3).
- **Custom Clerk organization roles.** Plan-gated: `POST /v1/organization_roles` →
  `402 unsupported_subscription_plan_features`, `max_allowed_permissions: 0`. Measured
  2026-10-27 and recorded at `api/_lib/roles.ts:4-17`. Three staff levels live in Postgres and
  will stay there.
- **A server endpoint for the navigation model.** Nothing server-side reads a menu. R4 needs a
  settings key, not an endpoint.
- **Changing `/admin/profile`'s feature tag** to make the "user settings" link work. It
  would show a rep a form that answers 403 on save — the exact lie #101 removed.

---

## 9. Open questions for the owner

| # | Question | Recommendation |
|---|---|---|
| **Q1** | **Which version number?** `v2.2.0` (continue the tag line, correct three documents) or `v2.3.0` (leave a hole, correct nothing)? | **Answered — `v2.3.0`.** Tagged 2026-10-27 (`74544e1`), `package.json` is `2.3.0`, `roadmap.md:32-37` names it the product release. This work is `v2.4.0`. Do not tag `v2.2.0` retroactively (§1.3). |
| **Q2** | **The three exact URLs** for Google Business Profile, Facebook Page, Instagram. Is "service business account" the service-area profile, or a second account? | Ship R2 with the three management homes and replace the strings when supplied — a URL question should not hold a role question. |
| **Q3** | **Should a rep be able to edit their own profile?** Today they cannot, and `/admin/profile` is admin/manager-only. | **Not now.** It is a per-key capability in `api/settings.ts`, which is a server change. Clerk's account modal covers the real need (name, email, password) for every role. File it separately if the owner wants our profile page to be self-service. |
| **Q4** | **Does a `service_manager` see the vendor dashboards?** The request says admin-only; a manager holds `settings:read` and runs the desk. | **Admin only**, as asked. `accounts:read` is granted to admin alone. If a manager needs Vercel, that is a one-line change to `CAPABILITIES` and a decision about whether a manager should see the GitHub repository. |

**The program's acceptance test, and what to do if it fails.** Sign in as
`indigobuildops+service@gmail.com` (Service Rep) and look at the sidebar: it must show the
inbox, the home link and the account control, and **no external group**. Then as an admin: two
external groups, five links. **If the rep still sees a group, the fix failed regardless of the
suite** — and the next move is not more tests, it is to ask what else the comment in
`app-sidebar.tsx:130-138` was justifying. If the admin has *lost* the groups, the gating is
over-broad: check that `accounts` reached `FEATURES_FOR_CAPABILITY` and not only
`KNOWN_CAPABILITIES`.

---

## 10. Release mechanics

Restated because this is the part that gets skipped.

- `main` is protected: 1 approval + strict `Gates`. **Even documentation needs a PR.**
- Four gates: `tsc`, `lint`, `build`, `test`. `npm test` = build + suite; **`test:only` does
  not rebuild**, so a stale `dist/` can pass a suite that would fail the real build.
- The README's `**N checks passed**` is machine-checked against the suite. Bump it by the
  number actually added, and read the number off the run, not off an estimate.
- Commit with `-F <file>`; backticks inside a double-quoted `--body` are command substitution.
- `gh pr merge` prints nothing and exits 0. Confirm with `gh pr view --json state`.
- A squash-merge makes the branch conflict with its own merged content; rebase, do not
  hand-resolve.
- This document is a new file and nothing references it until the index rows land. **Commit it
  in the same change as its two index rows** (`docs/README.md`, `docs/00-meta/doc-map.md`) —
  `tests/docs.mjs` asserts the index, the doc-map row count and the `**NN documents**` figure
  against the tree, so a document without its registrations fails the suite.

### Re-verification, 2026-10-28 — what moved under this document

Six commits landed between the base (`a26b291`) and `27da05a`, and one of them invalidated
citations rather than merely shifting them. Every `file:line` below was re-measured; this is
the record of which ones changed, so the next reader can tell a corrected citation from an
untouched one.

| Commit | PR | Effect on this document |
|---|---|---|
| `1944fa7` | #110 (the Team screen, #102) | **The substantive one.** `ADMIN_ROUTES` went **9 → 10 pages** and Settings **8 → 9 sub-panes**; `AdminFeature` gained `team`; `FEATURES_FOR_CAPABILITY` remapped `settings:read` to `team`. Every citation below `routes.ts:103` shifted by +12. |
| `74544e1` | #117 (the `v2.3.0` release) | Answered Q1 in favour of reading **B**. `package.json` 2.1.0 → 2.3.0; tag added; `roadmap.md:32-37` rewritten. §1.3 rewritten, K1 closed, four Appendix B rows cancelled. |
| `ce1c133`, `cd7ed7b` | #112, #113 | Lint ignores and a timing correction. No claim in this document touched. |
| `53ba365`, `27da05a` | #118, #98 | Dependency bumps. `lucide-react` 1.x removed the brand glyphs, so `routes.ts` uses `GitBranch` where it used `Github` — inside the external nav this document plans to gate, and it does not change the shape. |

| Citation | Was | Now | Why |
|---|---|---|---|
| `AdminExternalNavItem` | `routes.ts:167` | `routes.ts:179` | +12 from the Team entry |
| `ADMIN_EXTERNAL_NAV` | `routes.ts:192-203` | `routes.ts:204-228` | same shift; the array is also 3 lines longer after the `GitBranch` comment |
| Hard-coding rationale | `routes.ts:183-190` | `routes.ts:192-202` | same shift |
| `FEATURES_FOR_CAPABILITY` | `clerkAuth.ts:139-149` | `clerkAuth.ts:144-149` | +5 from `team` |
| Nav shape | 9 routes, 8 sub-panes | **10 routes, 9 sub-panes** | #110 |

Unchanged and re-checked: `app-sidebar.tsx:130-138` (the false comment), `:139`, `:150-155`,
`:156`; `RequireAuth.tsx:73`; `ExternalNav.tsx:38`; `roles.ts:111-114`, `:119`;
`adminSettings.ts:20`, `:32`, `:38`; `settings.ts:39`; `AdminLayout.tsx:57`;
`policy.mjs:205-210`, `:254-263`, `:279-288`, `:301-326`; `clerkAuth.ts:58-65`.

⚠️ **The count is the part that matters for #107.** Its issue text says `ADMIN_ROUTES` goes
"9 → 10" when the Navigation pane lands. It is already 10, so the pane takes it to **11** and
moves four assertions (`policy.mjs:279`, `:286`, `:322`, and the `EXPECTED` map). Read the
issue's arithmetic as stale, not the plan's.

---

## Appendix A — Claim → evidence

Every line number is pinned to `a26b291`. The working tree has `#102` in flight, which adds 12
lines to `src/admin/routes.ts` below line 105 — anything cited there is +12 in the working tree
today.

| Claim | Evidence |
|---|---|
| The external group is not gated | `src/admin/ExternalNav.tsx:38` (maps `ADMIN_EXTERNAL_NAV`, no filter) |
| External items have no `feature` field to gate on | `src/admin/routes.ts:167` |
| The external nav is three hard-coded vendor links | `src/admin/routes.ts:204-228` |
| Hard-coding is deliberate | `src/admin/routes.ts:192-202` |
| The warning block claiming the shell already gates it | `src/components/app-sidebar.tsx:130-138` |
| The shell renders whenever any feature is granted | `src/admin/RequireAuth.tsx:73` |
| A rep holds `inbox:read`/`inbox:write` only | `api/_lib/roles.ts:119` |
| Capability → feature mapping | `src/admin/clerkAuth.ts:144-149` |
| Internal items are filtered per item | `src/components/app-sidebar.tsx:94` |
| A nav-only capability is established precedent | `api/_lib/roles.ts:111-114` |
| `/admin/profile` is tagged `settings` | `src/admin/routes.ts:87-89` |
| The route guard swaps the outlet for a refusal | `src/admin/AdminLayout.tsx:57` |
| Home link exists for every role | `src/components/app-sidebar.tsx:150-155` |
| Account control is an unlabelled `UserButton` | `src/components/app-sidebar.tsx:156` |
| Nav shape is asserted: 10 routes, 2 labels, 9 sub-panes | `tests/policy.mjs:279-288` |
| A regroup must not move a page between permission areas | `tests/policy.mjs:301-326` |
| Static external hrefs must be absolute https | `tests/policy.mjs:205-210` |
| The external group's render check does not vary by role | `tests/policy.mjs:254-263` |
| Settings keys are a closed enum of three | `api/_lib/adminSettings.ts:20` |
| Only `site` is publicly readable | `api/_lib/adminSettings.ts:32` |
| Settings shapes are a field spec with unknown keys dropped | `api/_lib/adminSettings.ts:38` |
| The 422 message names the three keys | `api/settings.ts:39` |
| The contact form writes to Postgres | `api/inquiry.ts:41` |
| Phase 3 is Done and its label was `v2.2.0` | `docs/40-project/roadmap.md:20,45` |
| The roadmap disclaims its own Release column, and names `v2.3.0` the product release | `docs/40-project/roadmap.md:32-37` |
| Tags: `v2.0.1`, `v2.0.2`, `v2.1.0`, `v2.3.0` — **no `v2.2.0`** | `git tag -l` |
| `package.json` is 2.3.0 | `package.json` |
| Custom Clerk roles are plan-gated | `api/_lib/roles.ts:4-17` |
| Six providers refuse cross-origin framing | measured 2026-10-27, `curl -D` per provider (§1.5) |

## Appendix B — Documentation to update

| Document | Change | When |
|---|---|---|
| `docs/README.md` | this plan's row; `**62 documents**` → 63 | same commit as this file |
| `docs/00-meta/doc-map.md` | this plan's row | same commit as this file |
| `docs/40-project/roadmap.md:20,32-37` | ~~Phase 3's release label~~ — **cancelled.** Q1 was answered B: `:32-37` already names `v2.3.0` as the product release, and the Phase 3 label stays a label | not doing |
| `docs/README.md:108` | ~~the Phase 3 index row stops reading as a tag~~ — **cancelled** with the row above | not doing |
| `docs/40-project/prd/phase-3-docs-library.md:5,11` | ~~a "label only" marker~~ — **cancelled** with the row above | not doing |
| `docs/40-project/roadmap.md` §2 | re-verified against the tree | done — shipped in v2.3.0 (#108) |
| `CHANGELOG.md` | the `v2.4.0` entry | when the release is cut, not before |
| `README.md` | `**N checks passed**` | each PR that adds checks |
