# Data layer

**Kind:** dated · **Owner:** `src/lib/data/` · **Last verified:** 2026-10-28 in the working tree

The full surface. The *reasoning* is in
[`../40-project/decisions/0003-localstorage-behind-an-async-seam.md`](../40-project/decisions/0003-localstorage-behind-an-async-seam.md)
— **superseded**, and kept because the reason the seam was built that way is why
replacing it cost one file; the *shape* is in
[`../20-development/architecture.md`](../20-development/architecture.md#seam-2--the-data-layer).
This document is the lookup table.

---

## 1. The chain

![Data layer diagram](../assets/data-layer-diagram.svg)

*Figure 1 — The async seam: pages call `api.ts`, which is the only module that calls `/api/*`. Nothing is stored in the browser.*

```
pages  →  api.ts  →  /api/*  →  Postgres
            ↑                    └→  Resend (the notification email)
   the only seam; async because
   every call is a network call
```

| File | Lines | Owns |
|---|---:|---|
| `types.ts` | 271 | The domain types, storage-agnostic |
| `seed.ts` | 66 | The shipped `DEFAULT_*` records — what the client merges when the server has no value |
| `api.ts` | 371 | **The seam.** Every method `async`; the only module that calls `/api/*` |
| `hooks.ts` | 82 | `useApiData` — the single read path |
| `use-draft.ts` | 60 | Draft state that survives a background refresh |

*Counted 2026-10-28 with `wc -l`. The previous column had drifted — it said `types.ts`
was 189 lines and `api.ts` 257, both measured before the staff model (#110, #114) added
its types and its two methods. Nothing compares this table to the files, so it rots
silently; the numbers are here for orientation, and `wc -l` is the answer.*

[M: `src/lib/data/` owns app data; Clerk authentication is managed separately by `@clerk/react`.]

**There is no `backend.ts`.** It was a `localStorage` engine behind this facade, and
it outlived its last reader by a release: by 2026-10-28 it held one `security` record
that no screen read, reachable only through a "Reset demo data" button. Both went in
[#95](https://github.com/indigo-services/call-indigo/issues/95). §2 is what that
removal ended.

## 2. The browser stores nothing

There is no storage namespace. `call-indigo:v1:*` is gone from the codebase, and
`grep -rn "localStorage" src/` returns **comments only** — no `getItem`, no `setItem`.
The one thing that still uses the browser's storage is Clerk, under Clerk's own keys,
which is a session and not app data.

| Was | Now |
|---|---|
| `call-indigo:v1:inquiries` | the `inquiries` table, read through `/api/inquiries` |
| `call-indigo:v1:settings` | `admin_settings`, `/api/settings?key=site` |
| `call-indigo:v1:profile` | `admin_settings`, `/api/settings?key=profile` |
| `call-indigo:v1:notifications` | `admin_settings`, `/api/settings?key=notifications` |
| `call-indigo:v1:security` | **deleted** — no table, no reader, no screen (#95) |

**Why the security record was deleted rather than given a table.** It held
`twoFactorEnabled`, `passwordChangedAt` and `sessionTimeoutMinutes`. All three are
Clerk's facts, and a copy of them here would be a second source of truth that drifts
the first time someone enrols a second factor. A row in Postgres would have made the
record *look* like a setting the dashboard owned. The Security page manages the
account through Clerk instead — see §8.

**Why the reset control was deleted with it.** "Reset demo data" cleared every key and
re-seeded the demo inbox. With the keys gone it cleared nothing, and it was the only
way to discover that: an operator pressed a destructive-looking button, was told "This
browser's data cleared", and nothing happened anywhere. A control that reports success
and does nothing is worse than an absent one.

## 3. The API surface

Every method returns a promise. **`api.ts` is the only module a page may import, and
the only one that calls `/api/*`** — `tests/policy.mjs` fails if another file under
`src/` fetches an API path directly.

### Inquiries

| Method | Returns | Notes |
|---|---|---|
| `listInquiries()` | `Inquiry[]` | **Newest first** — the inbox's default order, sorted by `createdAt` |
| `getInquiry(id)` | `Inquiry \| null` | |
| `createInquiry(input)` | `Inquiry` | **Called by the public inquiry form.** Sets `status: "new"`, stamps `createdAt`/`updatedAt`, `notes: ""` |
| `updateInquiry(id, patch)` | `Inquiry` | **Throws** `No inquiry with id <id>` if the id is unknown. Stamps `updatedAt` |
| `deleteInquiry(id)` | `void` | |

### Settings, profile, notifications

Every one of these takes an optional `TokenGetter` as its last argument and sends the
result as `Authorization: Bearer …`; the server — not the page — decides whether the
caller is an admin.

| Method | Returns | Storage since 2026-10-23 |
|---|---|---|
| `getSettings()` / `saveSettings(v)` | `SiteSettings` | `/api/settings?key=site` — **the read is public**, the write is admin-only |
| `getProfile()` / `saveProfile(v)` | `AdminProfile` | `/api/settings?key=profile`, admin-only |
| `getNotifications()` / `saveNotifications(v)` | `NotificationPrefs` | `/api/settings?key=notifications`, admin-only |
| `getNotificationSettings()` / `saveNotificationSettings(v)` | `NotificationSettings` | `/api/notification-settings`, admin-only — **the delivery address**; the only screen that sets it since #93 |

A key the server has never been written for comes back as `value: null` and the client
merges the `DEFAULT_*` record from `seed.ts`. The server does not seed itself on a
`GET`: a read that writes is a read that cannot be cached or retried safely.

### Staff

| Method | Returns | Capability |
|---|---|---|
| `getTeam()` | `{ staff, audit }` | `settings:read` |
| `setStaffLevel(input)` | `{ staff, audited }` | `settings:write` |

### Subscription

| Export | Purpose |
|---|---|
| `getVersion()` | The change counter. A **stable primitive**, for `useSyncExternalStore` |
| `subscribeToChanges(fn)` | Registers a listener; returns an unsubscribe function |

## 4. Why a version counter

Mutations call `bump()`, which increments `version` and notifies the `Set` of listeners.
`useApiData` subscribes via `useSyncExternalStore`.

**This is the whole cross-page reactivity mechanism.** Submitting the form on `/contact`
repaints the dashboard inbox without either page knowing the other exists — one integer
and a listener `Set`. No context, no prop drilling, no global store.

`useApiData(key, load)` takes an explicit **`key`** rather than a dependency array.
Deliberate: a dependency array built from inline values defeats the lint rule that would
otherwise catch a missing dependency.

## 5. The seed

`seed.ts` holds three records and no fixtures:

| Record | Used when |
|---|---|
| `DEFAULT_SETTINGS` | `GET /api/settings?key=site` answers `value: null` |
| `DEFAULT_PROFILE` | `GET /api/settings?key=profile` answers `value: null` |
| `DEFAULT_NOTIFICATIONS` | `GET /api/settings?key=notifications` answers `value: null` |

`DEFAULT_SETTINGS` carries the site's published facts — phone, address, licence
number — and the shipped theme tokens, because those are what the marketing pages must
render on a cold database.

**The nine-inquiry demo inbox is gone (#95).** It existed to populate an empty browser
store on first run, and `resetDemoData()` restored it. Once the inbox read Postgres, the
only way to see those rows was to believe the dashboard was showing real work — so the
fixture outlived its purpose by a release and was deleted with the store. `seed.ts` now
contains no inquiry, and nothing in the app can create one except the public form.

## 6. Latency, and why it was there

`LATENCY_MS = 140` was a simulated delay, so **loading and in-flight button states were
actually exercised during review** — a UI that only ever renders its loaded state is a
UI whose loading state is untested.

It survived one release longer than it deserved: by 2026-10-28 it applied only to the
three vestigial `backend.ts` calls, and it went with them in #95. **There is no
artificial latency now.** A loading state is only seen when the network is actually
slow, which on a cold Vercel function it is.

> ⚠️ **The consequence for verification, unchanged:** every `useApiData` page renders as
> **skeletons** in the headless suite, because the effect that would resolve the promise
> never runs. **No data-driven admin UI is checkable from `npm test`.** See
> [`../20-development/testing.md` §4.3](../20-development/testing.md#43-every-data-driven-admin-page).

## 7. Failure modes

| Failure | Behaviour | Why |
|---|---|---|
| **A `GET` answers `value: null`** | The `DEFAULT_*` record is merged underneath | A cold database must render the real phone number, not a blank field |
| **A read fails** | `useApiData` keeps `data` null and the page shows its empty or skeleton state | A failed read must not be rendered as an empty record |
| **A write is refused** | The page shows the server's message and the save button re-enables | The server is the authority; a refusal is information |
| **A corrupt stored colour** | Dropped rather than applied | A half-typed or hand-edited hex must not blank a token — asserted in `tests/verify.mjs` |

The failure modes this table used to carry are gone with the store, and each one is
worth naming because each was a real behaviour someone might still expect:

- **Corrupt JSON** and **quota exceeded** — nothing in the browser is parsed or stored.
- **A silent write failure** — the cost the old table accepted. `saveSettings` and its
  siblings throw on a non-2xx and the page reports it.
- **`crypto.randomUUID` absent** — the browser no longer mints ids. `api/_lib/inquiries.ts`
  calls `crypto.randomUUID()` on the server and returns the id, so a browser without it
  is not a browser that cannot submit.

## 8. What is browser-only, stated plainly

**Nothing.** The seam did its job — replacing the storage was a change to `api.ts` and a
handful of call sites, and no page learned what a `fetch` is — and then the engine
behind it outlived its last reader and was deleted.

| Record | Where it lives now | Since |
|---|---|---|
| Inquiries | `inquiries` (Postgres) | 2026-10-22 (#68) |
| Notification delivery | `notification_settings` (Postgres) | 2026-10-22 (#68) |
| `site`, `profile`, `notifications` | `admin_settings` (Postgres) | 2026-10-23 (A2) |
| Staff levels | `staff` (Postgres) | 2026-10-27 (#110) |
| Who changed whose level | `staff_audit` (Postgres) | 2026-10-28 (#114) |
| ~~`security`~~ | **deleted** — Clerk owns 2FA, the password and the session | #95 |

**The security record was never a setting.** `getSecurity`/`saveSecurity` had no
callers; the fields it held (`twoFactorEnabled`, `passwordChangedAt`,
`sessionTimeoutMinutes`) are Clerk's facts, and a local copy would have been a second
source of truth that drifts the first time someone enrols a second factor. The Security
page opens Clerk's own profile panel and holds nothing else. #95 was open on the
question of *what to do with the Security pane*; the answer was to give it no state.

**The four limitations this used to state, and where they went:**

1. *"`localStorage` is not a database."* **Resolved.** There is no `localStorage`.
2. *"The contact form tells the business nothing."* **Fixed 2026-10-22.** `/contact`
   POSTs, the row is stored, the email is sent, and `/admin/inquiries` reads the same
   row from any device.
3. *"No migration is possible."* Moot: the server started empty on purpose, and the
   only browser data worth carrying was the seeded demo inbox — which was itself a
   fixture, and is now gone.
4. *"No server authorization on the data."* **Fixed.** Every admin endpoint calls
   `requireCapability()` before it touches the database, so the browser-only Clerk
   check is a UI courtesy rather than the boundary.

**One consequence worth naming:** `use-theme` reads `GET /api/settings?key=site`, which
is the only un-gated settings read. Before this, a visitor's own `localStorage` decided
the site's colours — two visitors could see two different sites.

---

## 9. The server, since 2026-10-22 (#68)

**Added, and wired at both ends.** There is a server: `api/` holds Vercel functions,
`api/_lib/` holds the code they share, and `db/migrations/` holds the schema. The
public form **POSTs to `api/inquiry`**, and the admin inbox **reads and writes
`api/inquiries`** — so a lead is stored in Postgres, emailed to the address in
`notification_settings`, and visible in `/admin` from any device. `api.createInquiry()`
in `src/lib/data/api.ts` returns a *receipt* (the new id), not the stored row.

| Piece | File | What it does |
|---|---|---|
| Endpoint | `api/inquiry.ts` | `POST` → validate, insert, email. Store first, notify second |
| Endpoint | `api/notification-settings.ts` | `GET`/`PUT` the four delivery fields, `settings:read` / `settings:write` |
| Endpoint | `api/inquiries.ts` | `GET`/`PATCH`/`DELETE` the inbox, one capability per method, authorises before it reads |
| Endpoint | `api/settings.ts` | `GET`/`PUT ?key=site\|profile\|notifications. Only the `site` read is un-gated |
| Endpoint | `api/me.ts` (2026-10-27) | `GET` → the caller's own role and capability list. The admin shell's nav is built from it |
| Endpoint | `api/staff.ts` (2026-10-27) | `GET` → the roster (Clerk members + levels) **and the recent audit**, `settings:read`. `PUT` → set one level, `settings:write`, recording the actor |
| Shared | `api/_lib/adminSettings.ts` | The field spec for the three records, and their read/write |
| Shared | `api/_lib/validate.ts` | The same rules the form applies, restated for a caller that is not the form — plus the minimum time-to-submit (#92) |
| Shared | `api/_lib/db.ts` | Neon SQL-over-HTTP. No `pg`, no pool |
| Shared | `api/_lib/notifications.ts` | Reads the settings row and the preferences per send, applies `shouldNotify()`, then Resend. `emergencyAlerts` is a **floor, not a filter** (#93) |
| Shared | `api/_lib/auth.ts` | Clerk session token + staff level → role and capabilities. Pure rules exported for tests |
| Shared | `api/_lib/roles.ts` (2026-10-27) | The capability matrix: role → what it may do. No I/O, so it is tested directly |
| Shared | `api/_lib/staff.ts` (2026-10-27) | The `staff` table: the hot-path lookup, the roster join, the audited upsert, and the pure rules for all of it |
| Shared | `api/_lib/throttle.ts` (2026-10-28) | The `inquiry_throttle` counter: `sha256(ip + THROTTLE_SALT)`, one upsert, and the fail-open rules for when it cannot enforce (#94) |
| Schema | `db/migrations/0001_*.sql` | `inquiries`, `notification_settings`, `schema_migrations` |
| Schema | `db/migrations/0002_*.sql` | `admin_settings` — one `jsonb` row per key |
| Schema | `db/migrations/0003_*.sql` (2026-10-27) | `staff` — one row per person, holding their level |
| Schema | `db/migrations/0004_*.sql` (2026-10-28) | `inquiry_throttle` — one row per hashed address per window. Holds no address, and no lead |
| Schema | `db/migrations/0005_*.sql` (2026-10-28) | `staff_audit` — one row per level change: who changed whose level, from what, to what, when |
| Runner | `scripts/_db_migrate.cjs` | Applies pending files; `--check` for the gate |

**Setting a level.** Custom Clerk organization roles are plan-gated — measured
2026-10-27, `POST /v1/organization_roles` answers `402
unsupported_subscription_plan_features` for `org:roles` — so Admin, Service Manager
and Service Rep are rows here rather than roles in Clerk. Since issue #102 a level is
set on **`/admin/team`**, through `api/staff.ts`:

| Method | Capability | What it does |
|---|---|---|
| `GET /api/staff` | `settings:read` | Clerk's members of `Indigo Services`, each with their level — the roster, not just the rows, so a member with **no row** appears as *no level set*. Also returns `audit`: the recent level changes |
| `PUT /api/staff` | `settings:write` | `{ userId, role, active? }` → one upsert **and its audit row in the same statement**. `422 not_a_member` if Clerk says they are not in the organization; `422 cannot_change_own_level` if it is the caller's own row |

**Who changed whose level (2026-10-28, #114).** `staff.updated_at` said *when* and
never *who*, so the two questions an incident asks — who made this person a
manager, who withdrew this person's access — had no answer in the data. The only
trace was a function log retained for hours. `staff_audit` records every
transition, and the level change and its record are one statement:

```sql
with previous as (select role, active from staff where clerk_user_id = $1),
     upserted as (insert into staff … returning …),
     logged   as (insert into staff_audit (actor_id, subject_id, …)
                  select $4, u.clerk_user_id, p.role, u.role, p.active, u.active
                    from upserted u left join previous p on true
                   where p.role is distinct from u.role
                      or p.active is distinct from u.active
                  returning id)
select …, (select count(*) from logged) as audit_rows from upserted u
```

Two requests would leave a window in which the level committed and its record did
not — a promotion indistinguishable from one made before the audit existed. A
data-modifying `WITH` is the only way to avoid that here, because the driver
prepares one statement at a time. `is distinct from` rather than `<>`: on a first
assignment `previous.role` is NULL, and `NULL <> 'admin'` is NULL, which `where`
reads as false. `actor_id` is `auth.userId` from the verified session and never a
body field, or a caller could attribute their own change to someone else.

The join is the server's because `useUser()` only carries the signed-in user's own
memberships — a browser-side roster would need `useOrganization()` and its own
pagination to see the same list. `active` is tri-state: omitted means *do not touch
it*, so changing a leaver's level cannot silently restore their access.

The statement it replaces, still valid for a repair when the dashboard is the thing
that is broken:

```sql
insert into staff (clerk_user_id, role) values ('user_…', 'service_manager')
on conflict (clerk_user_id) do update set role = excluded.role, active = true, updated_at = now();
```

`role` is one of `admin`, `service_manager`, `service_rep`. A Clerk `org:admin` does
not need a row — `roleFromOrgRole()` short-circuits before the table is read — and a
row cannot demote one. `active = false` withdraws access without deleting the record
of who once had it.

**Every relative import under `api/` ends in `.js`.** `package.json` sets
`"type": "module"`, so Vercel compiles each `api/*.ts` to an ESM `.js` file and
copies the specifier through unchanged. Node's ESM resolver requires an
extension: `./_lib/http` never resolves, `./_lib/http.js` does. TypeScript
accepts both, `tsc -b` accepts both, and the build reports success — the first
symptom is `FUNCTION_INVOCATION_FAILED` in production, with the reason only
visible in the runtime log. One check enforces the rule for value *and* type
imports, because one rule is easier to hold than "which of these survives the
compiler".

**Why the notification settings are not in `SiteSettings`.** Delivery is
server-owned: the function that sends the email reads `notification_settings`
directly, so a "To:" field in the `site` record would look like it configured
delivery while the sender kept its own value. `SiteSettings` is about how the site
looks and says who to call; those four are about where mail goes. Since #93 that is
enforced rather than merely intended: the duplicate field was removed, and
`tests/backend.mjs` fails if a delivery-looking label reappears with no reader behind
it.

**What the server does not do yet**, named so it is not assumed:

1. **Spam protection is still the client-side captcha.** The honeypot is now also
   checked on the server, which stops naive bots; a determined one is unaffected.
   That is proposal A6 and it is not in this change.

**The duplicate delivery address is gone (2026-10-28, #93).** `SiteSettings` carried a
`notificationEmail`, labelled *Where new-inquiry alerts are sent*, and no sender read
it — `notification_settings.to` was the value that decided delivery, and it was
settable only by `curl`. An operator changed the address, was told it saved, and every
lead kept going to the old inbox. The field is deleted from the type, the seed, the
validator and the Settings page; `/admin/notifications` now reads and writes the row
the sender reads. Three checks hold it: a delivery address cannot be stored in the
`site` record at all, the page's copy of the send rule agrees with the server's on
every input, and a settings field whose label claims a delivery behaviour must have a
reader under `api/`.

**Unverified:** a *valid* Clerk session token was not exercised against
`api/notification-settings`. This instance is a production instance, so
`POST /v1/sessions` — the way to mint one without a browser — is refused
(`Invalid request for environment`). The token **rejection** paths are tested; the
acceptance path is tested only through the pure rule (`grantsAdmin`,
`membershipGrantsAdmin`). The first person to save the settings page proves it, and
the save surfaces the error if it fails.

### 9.1 What the first production deploy taught

Both endpoints answered `FUNCTION_INVOCATION_FAILED` on `call-indigo.com` while an
unknown `/api/*` path returned 404 — registered, routed, crashing on load.
`/api/health` was written to separate the two possible causes, and it answered: the
runtime was fine, and **the module graph was not**.

**Two plausible diagnoses were wrong, and each cost a deploy.**

1. *"It imports a `.ts` file from `src/` at runtime."* Plausible, and false. The
   lists were copied into the server so only `import type` crossed the boundary.
   The endpoints still failed.
2. *"Vercel only bundles `api/`, so the sibling `server/` tree is missing."* Also
   plausible, also false. The shared code moved to `api/_lib/`. The endpoints
   still failed.

**The actual cause was the extension.** `package.json` sets `"type": "module"`,
so Vercel compiles each `api/*.ts` to ESM and leaves the specifier alone. Node
refuses to resolve `./_lib/http` without a `.js`. The runtime log said it in one
line:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/http'
  imported from /var/task/api/inquiry.js
```

`tsc -b` passed, the build passed, the deployment reported `Ready`, and the
module did not load. **A green build cannot see this**, which is why
`tests/backend.mjs` now asserts the extension on every relative import under
`api/`.

**Read the runtime log, not the deployment status.** `vercel inspect <dpl>
--logs` printed an empty body here; `vercel logs <deployment-url>` returned the
stack trace immediately. Reach for the second one first.

**`/api/health` is the diagnostic, and it stays.** It reports presence, never values,
and answers 503 when the database is unreachable rather than claiming health it
cannot verify. It is also the fastest way to find out that an environment variable
exists in Development and not in Production — which is what it found next:
Production has `RESEND_API_KEY` but not `DATABASE_URL` or `CLERK_SECRET_KEY`.

---

**Last verified:** 2026-10-28 in the working tree
