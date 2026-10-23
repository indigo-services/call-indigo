# Data layer

**Kind:** dated · **Owner:** `src/lib/data/` · **Last verified:** 2026-10-16 in the uncommitted working tree

The full surface. The *reasoning* is in
[`../40-project/decisions/0003-localstorage-behind-an-async-seam.md`](../40-project/decisions/0003-localstorage-behind-an-async-seam.md);
the *shape* is in [`../20-development/architecture.md`](../20-development/architecture.md#seam-2--the-data-layer).
This document is the lookup table.

---

## 1. The chain

![Data layer diagram](../assets/data-layer-diagram.svg)

*Figure 1 — The async seam: pages call `api.ts`, which calls `backend.ts`, which reads from `localStorage`. Replacing the storage means replacing one file.*

```
pages  →  api.ts  →  backend.ts  →  localStorage
            ↑
   the only seam; async on purpose
```

| File | Lines | Owns |
|---|---:|---|
| `types.ts` | 164 | The domain types, storage-agnostic |
| `seed.ts` | 199 | First-run fixtures |
| `backend.ts` | 136 | **The only file that knows where data physically lives** |
| `api.ts` | 180 | **The seam.** Every method `async` |
| `hooks.ts` | 62 | `useApiData` — the single read path |
| `use-draft.ts` | 57 | Draft state that survives a background refresh |

[M: `src/lib/data/` owns app data; Clerk authentication is managed separately by `@clerk/react`.]

## 2. The storage namespace

```
call-indigo:v1:<key>
```

**Versioned on purpose.** A shape change bumps `v1` rather than migrating, and a stale
key is inert rather than corrupting.

Clerk owns the authentication session separately from this app-data namespace. The
`resetDemoData()` operation clears only `call-indigo:v1:*` and does not call Clerk's
sign-out method.

## 3. The API surface

Every method returns a promise. **`api.ts` is the only module a page may import.**

### Inquiries

| Method | Returns | Notes |
|---|---|---|
| `listInquiries()` | `Inquiry[]` | **Newest first** — the inbox's default order, sorted by `createdAt` |
| `getInquiry(id)` | `Inquiry \| null` | |
| `createInquiry(input)` | `Inquiry` | **Called by the public inquiry form.** Sets `status: "new"`, stamps `createdAt`/`updatedAt`, `notes: ""` |
| `updateInquiry(id, patch)` | `Inquiry` | **Throws** `No inquiry with id <id>` if the id is unknown. Stamps `updatedAt` |
| `deleteInquiry(id)` | `void` | |

### Settings, profile, notifications, security

| Method | Returns |
|---|---|
| `getSettings()` / `saveSettings(v)` | `SiteSettings` |
| `getProfile()` / `saveProfile(v)` | `AdminProfile` |
| `getNotifications()` / `saveNotifications(v)` | `NotificationPrefs` |
| `getSecurity()` / `saveSecurity(v)` | `SecurityState` |

### Housekeeping

| Method | Does |
|---|---|
| `resetDemoData()` | **Clears every key and restores the seed fixtures.** Does not touch the session |

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

**9 inquiries** covering:
- every status,
- both property types,
- all three urgency levels.

Restored by **Settings → Security → Reset demo data**.

## 6. Latency, and why it is there

```js
const LATENCY_MS = 140
```

Small enough not to be annoying, large enough that **loading and in-flight button states
are actually exercised during review.** A UI that only ever renders its loaded state is a
UI whose loading state is untested.

> ⚠️ **The consequence for verification:** every `useApiData` page renders as
> **skeletons** in the headless suite, because the effect that would resolve the promise
> never runs. **No data-driven admin UI is checkable from `npm test`.** See
> [`../20-development/testing.md` §4.3](../20-development/testing.md#43-every-data-driven-admin-page).

## 7. Failure modes

| Failure | Behaviour | Why |
|---|---|---|
| **Corrupt JSON** in a key | Falls back rather than throwing | A demo must not be taken down by its own storage |
| **Quota exceeded** | Falls back rather than throwing | Same |
| **`crypto.randomUUID` absent** | Falls back to a timestamp + random id | Older browsers |
| **A write fails** | **It can fail silently.** This is the cost of the two fallbacks above | ⚠️ The deliberate trade: resilience over loudness |

## 8. The limitations, stated plainly

1. **`localStorage` is not a database.** Data is per-browser, is not shared between users
   or devices, and is cleared with site data.
2. **The contact form tells the business nothing.** `/contact` writes to the
   **submitter's own** `localStorage`. A demo where the client fills in the form and
   checks their inbox will find nothing. **Say this out loud before a demo.**
3. **No migration is possible.** A real backend starts empty. Acceptable now because
   there is nothing worth migrating — and it will not be true after the first real
   inquiry.
4. **No server authorization on the data.** The browser-only Clerk role check controls the
   admin UI, but anything in the namespace is readable by code running on the origin.

**Replacing `localStorage` with `fetch` is a change to `api.ts` alone** — that is what
the seam is for, and it is PRD §16.2 **F2**.

---

## 9. The server, since 2026-10-22 (#68)

**Added, and not yet wired.** There is a server for the first time: `api/` holds
Vercel functions, `server/` holds the code they share, and `db/migrations/` holds
the schema. **The public form still calls `api.createInquiry()` → `localStorage`**,
so the limitation in §8.2 above is still true of the running site. What exists is
the destination, proven, waiting for the arrow.

| Piece | File | What it does |
|---|---|---|
| Endpoint | `api/inquiry.ts` | `POST` → validate, insert, email. Store first, notify second |
| Endpoint | `api/notification-settings.ts` | `GET`/`PUT` the four delivery fields, admin-only |
| Shared | `server/validate.ts` | The same rules the form applies, restated for a caller that is not the form |
| Shared | `server/db.ts` | Neon SQL-over-HTTP. No `pg`, no pool |
| Shared | `server/notifications.ts` | Reads the settings row per send, then Resend |
| Shared | `server/auth.ts` | Clerk session token → admin, against the pinned organization |
| Schema | `db/migrations/0001_*.sql` | `inquiries`, `notification_settings`, `schema_migrations` |
| Runner | `scripts/_db_migrate.cjs` | Applies pending files; `--check` for the gate |

**Why the notification settings are not in `SiteSettings`.** `SiteSettings` lives in
`localStorage`, which is per-browser; the function that sends the email cannot read
any browser's storage. A "To:" field beside "Business name" would look like it
configured delivery while the sender kept its own value — so those four live in the
`notification_settings` row and the page reads them back through the API.

**Two things the server does not do yet**, named so they are not assumed:

1. **The dashboard does not read the server.** `listInquiries()` is still
   `localStorage`, so a lead that arrives by email is not in `/admin` until the
   dashboard is moved (proposal A2).
2. **Spam protection is still the client-side captcha.** The honeypot is now also
   checked on the server, which stops naive bots; a determined one is unaffected.
   That is proposal A6 and it is not in this change.

**Unverified:** a *valid* Clerk session token was not exercised against
`api/notification-settings`. This instance is a production instance, so
`POST /v1/sessions` — the way to mint one without a browser — is refused
(`Invalid request for environment`). The token **rejection** paths are tested; the
acceptance path is tested only through the pure rule (`grantsAdmin`,
`membershipGrantsAdmin`). The first person to save the settings page proves it, and
the save surfaces the error if it fails.

---

**Last verified:** 2026-10-22 in the working tree
