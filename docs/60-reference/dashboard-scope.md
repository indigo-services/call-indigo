# Dashboard Scope Deviation (PRD §5.2, §9.1, §16.2)

**Kind:** dated · **Last verified:** 2026-09-27 at `2f009a2`
**Status:** accepted 2026-09-18 · **Release:** v2.0.rc1 (pre-release)

The PRD describes rc1's `/admin` as a **mockup**: exactly three entries, `useState`
only, no authentication, no persistence, no API. This build is not that. Every
`/admin` item is now a real page backed by a working data layer, and there is a
new public route on top.

This document records what changed and why, because
`docs/development/standards.md` §1 says the repo wins over a document and the document
is the bug. Where the PRD and this build disagree, this file is the reconciliation.

---

## 1. What the PRD specified

| Ref | Claim | Verdict |
|---|---|---|
| §5.2 | "`/admin` contains exactly two pages: Settings, Design System" | **Superseded** — 8 pages |
| §5.2 | "**Three entries. No more.** Any additional `/admin` route in rc1 is a scope violation." | **Superseded** — see §3 |
| §5.2 | "no catch-all" — an unknown `/admin/*` path must not silently become a page | **Honoured** — see §4 |
| §9.1 | No authentication | **Superseded 2026-09-26** — a client-side gate; see §6 |
| §9.1 | No persistence; reload discards state | **Superseded** — localStorage backend |
| §9.1 / §10 | Dashboard uses static fixtures in `src/admin/mock/` | **Superseded** — `src/lib/data/` |
| §7.4 | Registry-only components under `/admin` | **Honoured** — see §5 |
| §8.3 | Two button systems stay separate | **Honoured** |

## 2. What this build actually contains

**Public routes — 4** [M: `src/App.tsx`]

`/`, `/residential`, `/commercial` (static-prototype parity) plus `/contact`, a new
inquiry page carrying a validated form that writes a real record.

**`/admin` routes — 8** [M: `src/admin/routes.ts`, `src/App.tsx`]

| Path | Page |
|---|---|
| `/admin/inquiries` | Inbox — list, search, status filter, detail sheet, status transitions, notes, delete |
| `/admin/settings` | General — business details, persisted |
| `/admin/profile` | The operator's own details, persisted |
| `/admin/notifications` | Preferences, persisted, with a replay of what would have been sent |
| `/admin/security` | 2FA toggle, session timeout, change-password flow, demo-data reset |
| `/admin/design` | Design System — unchanged, read-only |
| `/admin/assets` | The images the marketing pages serve, discovered from disk |
| `/admin/components` | The registry primitives and their exports, discovered from disk |

**Data layer** [M: `src/lib/data/`]

| File | Role |
|---|---|
| `types.ts` | Storage-agnostic domain types |
| `seed.ts` | First-run fixtures — 9 inquiries covering all five statuses, both property types, all three urgency levels |
| `backend.ts` | The **only** file that knows data lives in `localStorage`, under `call-indigo:v1:*` |
| `api.ts` | The async seam every page calls; a version counter invalidates readers |
| `hooks.ts` | `useApiData` — the one read path |
| `use-draft.ts` | Keeps unsaved edits from being clobbered by a background refresh |

Pages never import `backend.ts`. `api.ts` is `async` on purpose even though the
local backend is synchronous, so replacing it with `fetch` is a change to one file
(§16.2 F2). Mutations bump a version that `useApiData` subscribes to, which is why
submitting on `/contact` repaints the inbox without either page knowing about the
other.

**Maintenance impact.** The demo store is versioned (`:v1:`) so a shape change can
migrate rather than crash on stale JSON. `localStorage` is not a database: data is
per-browser, is not shared between users or devices, and is cleared by site data
clearing. This is a demo of the workflow, not a shipped backend.

## 3. Why the route count was superseded

The PRD's "three entries, no more" rule exists to stop rc1's dashboard growing
speculatively. These pages are not speculative — they are the minimum set for the
feature to be demonstrable:

- The inbox cannot be demonstrated without an inquiry to show, so the public
  `/contact` form is load-bearing rather than a bonus.
- Profile, Notifications and Security exist because the original Settings page had
  tabs for exactly those, with no page behind them. Leaving three tabs inert while
  the fourth worked would be worse than either splitting them out or deleting them.

**What the rule was protecting, and how that is preserved.** §5.2's real fear is an
accidental fourth page appearing out of a routing mistake. That is enforced
structurally instead of by counting: `src/admin/routes.ts` is the single source of
truth, and `src/App.tsx` routes only what that model declares. Adding a page means
adding a nav entry, so a page cannot exist without a sidebar link and a breadcrumb.

## 4. The no-catch-all rule is still honoured

`/admin/*` with an unknown path **redirects** to `/admin/inquiries`. It does not
render a shell, an empty state, or a page. There is no route that a typo can land
on, which is the property §5.2 was actually asking for.

## 5. Component provenance is preserved

Two primitives were added via the registry CLI rather than hand-written:
`table` and `textarea` [M: `src/components/ui/` — 21 files]. `npx shadcn@latest add
--all --overwrite` must still leave an empty diff.

`ComponentsPage` reads export names out of the modules themselves via
`import.meta.glob`, so its inventory cannot go stale when a primitive is re-added or
gains a sub-component. `AssetsPage` does the same for `public/assets/images/`.

## 6. Authentication — a client-side gate, not access control (changed 2026-09-26)

The client asked for a username and password on the dashboard, so §9.1's "no
authentication" no longer holds. What was added is deliberately the smallest thing
that answers the request: a **client-side gate** in `src/admin/auth.ts`, with the
password stored as a salted PBKDF2-HMAC-SHA-256 digest at 210,000 iterations and
the username as a salted SHA-256.

**This is not access control, and nothing in this repo may imply that it is.**
There is no server, so there is nowhere for a secret to hide from the browser:
anyone who can open devtools can set the session flag by hand. What it does buy is
that **neither credential is in the bundle** — `grep`ping the shipped JavaScript
finds nothing, and recovering the password from the digest means an offline
dictionary attack against a deliberately slow KDF rather than a string comparison.
It keeps the dashboard off the public internet, which is the actual requirement
while the client is showing this around.

Four surfaces used to state that there was no authentication — Profile, Security
("There is no authentication yet — anyone who reaches `/admin` has full access"),
the change-password form, and the Design System publish note. All four now describe
the gate instead, and `tests/auth.mjs` fails if any of them reverts: a stale
"anyone can get in" is worse than no claim at all.

Session behaviour: the flag lives in `sessionStorage` (dies with the tab, and is
deliberately **outside** the `call-indigo:v1:` namespace so "Reset demo data" does
not sign the operator out), expires after 12 hours, and is cleared by Sign out in
the sidebar.

Threat model, rotation procedure and verification: **`docs/admin-gate.md`**.
§16.2 F1 is still the real gate — a server-issued session is what lands before this
dashboard is pointed at real data.

## 7. What is still deferred

| Ref | Item | Note |
|---|---|---|
| F1 | Authentication | **Partly addressed** — a client-side gate (see §6); a server-issued session is still owed |
| F2 | Real data layer | The `api.ts` seam is ready; `backend.ts` is the only file to replace |
| F4 | Content management | The marketing pages still carry copy inline, so editing Settings does **not** rewrite them. Settings says this on screen. |
| F7 | Button reconciliation | Unchanged — marketing `.pill`, dashboard `Button` |

## 8. Out of scope for this deviation

Marketing parity. The three prototype pages are unchanged apart from the shared
chrome extraction and the broken `index.html#…` link fixes; `/contact` is additive.
The root `valvoro-prototype/` remains the parity baseline and was not modified.

## 9. What was verified, and what was not

Verified by exercising the running app, not by reading it:

- The inquiry form validates, persists, and appears in the inbox; the sidebar badge
  tracks it; deleting it through the two-step confirm restores the seed state.
- Settings, Profile, Notifications and Security each survive a **reload**.
- Password change records the date and clears its fields. Reset demo data clears the
  namespace and re-seeds.
- All 12 routes render with zero console errors. `typecheck` 0 errors, `lint` 0
  errors (4 pre-existing registry warnings), `build` succeeds.

**Not verified:** the scroll-reveal animation. It cannot run in a headless preview
(`IntersectionObserver` never fires there, and CSS transitions never advance). The
cascade and the observer port were checked directly — see
`docs/development/standards.md` §5 — but
the animation needs a look in a real browser tab.
