# Changelog

All notable changes to the Call Indigo website are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
with pre-release tags for release candidates.

---

## [Unreleased] — working dashboard and public inquiry page

### Overview

The rc1 dashboard was a mockup. This build makes it function: every `/admin` item
is a real page backed by a persisted data layer, and there is a new public
`/contact` page carrying the inquiry form that feeds it. Deliberately exceeds PRD
§5.2's three-entry limit — reconciled in `docs/dashboard-scope.md`.

### Added

- **Public `/contact` page** — the six advertised services, property type, urgency,
  and a message. Validates on submit, reports errors inline and to assistive
  technology, and writes a real inquiry record.
- **Dashboard data layer** (`src/lib/data/`) — storage-agnostic types, first-run
  seed fixtures, a `localStorage` backend under the versioned `call-indigo:v1:*`
  namespace, and an `api.ts` seam that is async on purpose so an HTTP backend is a
  one-file swap (PRD §16.2 F2). A version counter invalidates readers, so an
  inquiry submitted on `/contact` repaints the dashboard inbox.
- **Inquiries inbox** (`/admin/inquiries`) — search, status filter, detail sheet,
  status pipeline, internal notes, delete, and a live unread badge in the sidebar.
- **Settings pages** — General, Profile, Notifications and Security, each persisted
  with dirty-state tracking, a Discard action, and save confirmations. Splits the
  rc1 Settings page's three inert tabs into real pages.
- **Assets and Components pages** — inventory discovered at build time from
  `public/assets/images/` and `src/components/ui/` via `import.meta.glob`, so
  neither list can go stale.
- **Marketing design system** — the 65 component classes the prototype relied on
  (`.pill`, `.hero-h1`, the `.banner-*` hero geometry, `.statistics-*`, `.eyebrow`,
  the `.pad-*` spacing rhythm, `.slab-photo`, `.card`, the `.legal-*` modal system)
  were absent from `src/index.css` entirely, so the React pages rendered mostly
  unstyled. Ported verbatim; `src/index.css` is now 987 lines against the
  prototype's 890-line `css/tw.css`, with zero classes missing.
- **Shared marketing chrome** — the top bar, header, drawer, footer and legal
  modals extracted from the page markup into `src/marketing/` components.
- **Documentation** — `docs/dashboard-scope.md` records where this build departs
  from PRD §5.2 / §9.1 and why. `README.md` and `docs/README.md` were brought in
  line with the build: full route table, data-layer contract, the gates that
  actually run, and the dead scaffolding that remains.

### Changed

- **Admin navigation** — `src/admin/routes.ts` is now the single source of truth for
  the sidebar, the breadcrumb and each page's title.
- **Unknown `/admin/*` paths** redirect to the inbox instead of rendering a shell.
  §5.2's "no catch-all" rule is preserved as a routing property.
- **Broken links fixed** — residential and commercial linked to `index.html#…`,
  a file that does not exist in an SPA (7 links on each page).

### Fixed

- **60 permanently invisible elements** — the marketing pages never wired up the
  prototype's `IntersectionObserver`, so every `.reveal` element stayed at
  `opacity: 0` on all three pages (35 on home, 16 residential, 9 commercial).
  Ported as `src/marketing/useSiteChrome.ts`.
- **Inquiry form fields were not marked required** — the form used `noValidate`
  with custom validation but never set the native `required` attribute, so
  assistive technology had no way to announce it. `noValidate` keeps the custom
  messages in charge; the attribute is what screen readers read.
- **`useMemo` dependency in the inbox** — `rows` fell back to a fresh `[]` on every
  render, so the filter memo recomputed needlessly. Now memoised on `data`.

### Known limitations

- **No authentication** — unchanged (PRD §16.2 F1). Profile and Security state this
  on screen rather than implying a security posture this build does not have.
- **`localStorage` is not a database** — data is per-browser, not shared between
  users or devices, and is cleared with site data.
- **Content management is still deferred** (F4) — editing Settings does not rewrite
  the marketing pages' inline copy; Settings says so.
- **Two button systems** persist — marketing `.pill`, dashboard shadcn `Button` (F7).
- **The scroll-reveal animation is unverified in a real browser.** The CSS cascade
  and the observer port were both verified directly, but a headless preview cannot
  fire `IntersectionObserver`, so the animation itself still needs a look in a real
  tab. See `docs/README.md` §5.
- **Dead scaffolding remains** — `src/components/nav-*.tsx` and
  `src/marketing/{Frame,Slab,Pill}.tsx` are unused.

---

## [v2.0.rc1] — 2026-09-18 (pre-release)

### Overview

Transition from a three-page static-HTML prototype to a React / Vite / Tailwind CSS v4
/ shadcn/ui build, with a mocked-up `/admin` dashboard. This is a release candidate
for review — not a production release.

### Added

- **React build** — Vite + React 19 + TypeScript 5.9 + Tailwind CSS v4 via
  `@tailwindcss/vite` (PRD §4). No `tailwind.config.js`, no PostCSS plugin, no
  `tailwindcss-animate`.
- **Single design-token source** — all brand tokens ported from the inline
  `@theme` block into `src/index.css`, eliminating the stale `css/tw.css` duplicate
  as a *build input* (PRD §6.1). shadcn semantic tokens mapped via `@theme inline`
  (PRD §6.3).
- **Footer admin link** — one new link in the footer bottom bar on all three pages,
  opening `/admin` (PRD §12).
- **Admin dashboard** — two-menu shadcn sidebar shell (`sidebar-08`) with two
  mockup pages:
  - `/admin/settings` — three tabs (General, Appearance, Notifications), seeded
    from real published facts, `useState` only, reload discards state (PRD §10).
  - `/admin/design` — read-only display of logo, icon, colours, standard accents,
    and segment accents for Residential and Commercial (PRD §11).
- **Developer documentation** — `README.md`, `docs/README.md` (developer flow
  standards), `.gitignore`, `components.json` for shadcn.
- **Git repository** — initialised with the organised workspace and archived past
  work.

### Changed

- **Stack** — from hand-written static HTML with a Tailwind browser-build CDN
  script to a compiled Vite + Tailwind v4 CLI build.
- **Project structure** — workspace organised into a clean project root with all
  past work (static prototype, audit harness, reference sites, template assets)
  archived under `archive/`.

### Archived (not deleted)

- `valvoro-prototype/` — the v2 static-HTML prototype. A second copy was archived
  under `archive/v1-prototype/`; the **tracked copy at the repo root** is the parity
  baseline for PRD §13, because `.gitignore` drops images under `archive/**`.
- `_audit/` — the verification harness (`verify.py`, `diag.py`, `mincontent.py`,
  `shots.py`, `gen_pages.py`) and all diagnostic screenshots.
- `Valvoro - Plumbing Services HTML Template Preview.html` — original template
  preview.
- `ci.*` files — captured live site snapshot (Next.js).
- `call-indigo-com/` — earlier static reconstruction.
- `valvoro-images/` — original template image library (206 files).

### Known limitations (rc1 scope)

- **No authentication.** `/admin` is reachable by anyone with the URL. Auth is
  scheduled for post-rc1 (PRD §16, F1). Still true in Unreleased.
- **No persistence.** All dashboard state was `useState`; reload discarded
  everything (PRD §9.1). **Resolved in Unreleased** — see above.
- **No API or database.** The dashboard used static fixtures in `src/admin/mock/`
  (PRD §9.1). **Resolved in Unreleased** — see above.
- **Two button systems.** The marketing pages keep the bespoke `.pill` family;
  the dashboard uses shadcn `Button`. Reconciliation is deferred (PRD §8.3, §16 F7).
- **Client-rendered SPA.** No SSR/pre-rendering; SEO impact noted (PRD §15, R4).
- **`theme-color` meta** still carries the v1 indigo (`#1f1c4a`) — a one-line fix
  recommended for rc1 (PRD §15, Q5).

---

## [v1.0] — 2026-09-17 (static prototype)

Three hand-written static HTML pages (`index.html`, `residential.html`,
`commercial.html`) styled with a Tailwind browser-build CDN script and an inline
`@theme` block duplicated in each page. Visually tuned and verified against the
original Valvoro template and the live call-indigo.com site.

Superseded by v2.0.rc1. Preserved in `archive/v1-prototype/`.
