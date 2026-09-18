# Changelog

All notable changes to the Call Indigo website are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
with pre-release tags for release candidates.

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
  (PRD §6.1). shadcn semantic tokens mapped via `@theme inline` (PRD §6.3).
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

- `valvoro-prototype/` — the v2 static-HTML prototype; serves as the parity
  baseline for PRD §13.
- `_audit/` — the verification harness (`verify.py`, `diag.py`, `mincontent.py`,
  `shots.py`, `gen_pages.py`) and all diagnostic screenshots.
- `Valvoro - Plumbing Services HTML Template Preview.html` — original template
  preview.
- `ci.*` files — captured live site snapshot (Next.js).
- `call-indigo-com/` — earlier static reconstruction.
- `valvoro-images/` — original template image library (206 files).

### Known limitations (rc1 scope)

- **No authentication.** `/admin` is reachable by anyone with the URL. Auth is
  scheduled for post-rc1 (PRD §16, F1).
- **No persistence.** All dashboard state is `useState`; reload discards
  everything (PRD §9.1).
- **No API or database.** Dashboard uses static fixtures in `src/admin/mock/`
  (PRD §9.1).
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
