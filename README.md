# Call Indigo Website

> Home & facility services for Austin, TX — plumbing, electrical, HVAC, carpentry, remodeling.
> Family owned, locally operated since 2012. Serving Hays, Travis, and Williamson counties.

This repository contains the Call Indigo marketing website and admin dashboard, built on
a React / Vite / Tailwind CSS v4 / shadcn/ui stack.

**Current version:** v2.0.rc1 (pre-release) — see [CHANGELOG.md](./CHANGELOG.md) for the
release entries and [PRD.md](./PRD.md) for the full product requirements document.

> **Scope note.** The dashboard in this build does more than the PRD's rc1 mockup
> described (`§5.2` allowed three `/admin` entries; `§9.1` said no persistence).
> The deviation and its reasoning are reconciled in
> [docs/dashboard-scope.md](./docs/dashboard-scope.md). **The repo wins over the
> document** — see [docs/README.md](./docs/README.md) §1.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Build | Vite 7 | Fast dev server, optimised production builds |
| UI | React 19 + TypeScript 5.9 | SPA with client-side routing |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) | No `tailwind.config.js`, no PostCSS plugin |
| Dashboard components | shadcn/ui (`new-york` style) | Registry-only under `/admin` (PRD §7) |
| Marketing components | Bespoke | Ported from the static prototype (PRD §8) |
| Routing | React Router 7 | SPA with client-side fallback |
| Icons | lucide-react | Matches shadcn `iconLibrary` |
| Toasts | sonner | Dashboard save confirmations |
| Dashboard data | `localStorage` behind an async API seam | Demo only — see [Data layer](#data-layer) |
| Path alias | `@/*` → `src/*` | Required by the shadcn CLI |

## Quick start

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Type-check only (no emit)
npm run typecheck

# Lint
npm run lint

# Type-check + production build
npm run build

# Preview the production build
npm run preview
```

Verified clean on this commit: `typecheck` 0 errors · `lint` 0 errors, 4 warnings
(pre-existing `react-refresh` warnings in generated registry files) · `build`
succeeds (788 kB JS / 122 kB CSS; the >500 kB chunk warning is pre-existing and
code-splitting is the fix).

## Routes

### Public (PRD §5.1)

| Route | Description |
|---|---|
| `/` | Home page — 13 sections, parity with the static prototype |
| `/residential` | Residential services sub-page |
| `/commercial` | Commercial services sub-page |
| `/contact` | Inquiry form — writes a real record the dashboard inbox reads |

### Dashboard

| Route | Description |
|---|---|
| `/admin` | Redirects to `/admin/inquiries` |
| `/admin/inquiries` | Inbox — search, status filter, detail sheet, status pipeline, notes, delete |
| `/admin/settings` | Business details (`General`) — persisted |
| `/admin/profile` | The signed-in operator's own details — persisted |
| `/admin/notifications` | What the team is told about, and when — persisted |
| `/admin/security` | 2FA toggle, session timeout, change password, reset demo data |
| `/admin/design` | Design System — read-only brand token display |
| `/admin/assets` | The images the marketing pages serve, discovered from disk |
| `/admin/components` | The registry primitives and their exports, discovered from disk |

An unknown `/admin/*` path **redirects** to the inbox rather than rendering a
shell — PRD §5.2's "no catch-all" rule is preserved as a routing property.

## Project structure

```
indigo/
  PRD.md                         Product requirements document
  CHANGELOG.md                   Release history
  archive/                       Past work and reference material (see archive/README.md)
  docs/
    README.md                    Developer flow standards
    dashboard-scope.md           Why this build exceeds PRD §5.2 / §9.1
    component-exceptions.md      Registry-component exceptions (PRD §7.5)
  src/
    main.tsx                     App entry
    App.tsx                      Router — the route table
    index.css                    Tailwind import + @theme tokens + ported design system (PRD §6)
    lib/
      utils.ts                   cn() utility (shadcn)
      format.ts                  Date, number, bytes and initials formatters
      data/                      Dashboard data layer (see below)
        types.ts                 Storage-agnostic domain types
        seed.ts                  First-run fixtures
        backend.ts               The only file that knows data lives in localStorage
        api.ts                   The async seam every page calls
        hooks.ts                 useApiData — the single read path
        use-draft.ts             Draft state that survives background refreshes
    components/
      ui/                        Registry-only components (PRD §7) — 21 files
      app-sidebar.tsx            Sidebar block (sidebar-08), driven by admin/routes.ts
      nav-*.tsx                  Unused scaffolding — see "Dead scaffolding" below
    marketing/                   Bespoke components (PRD §8)
      SiteChrome.tsx             Composes top bar + header + drawer + footer + legal modals
      chrome.ts                  Chrome markup, with SPA href rewrites applied
      chrome-markup.ts           The chrome markup extracted from the prototype
      useSiteChrome.ts           Port of the prototype's js/main.js behaviour
      pages/                     HomePage · ResidentialPage · CommercialPage · ContactPage
      Frame.tsx Slab.tsx Pill.tsx   Unused scaffolding — see below
    admin/
      AdminLayout.tsx            SidebarProvider + AppSidebar + SidebarInset + breadcrumb
      routes.ts                  Single source of truth for sidebar, breadcrumb and titles
      PageHeader.tsx             Shared page heading + action slot
      InquiriesPage.tsx          /admin/inquiries
      SettingsPage.tsx           /admin/settings
      ProfilePage.tsx            /admin/profile
      NotificationsPage.tsx      /admin/notifications
      SecurityPage.tsx           /admin/security
      DesignSystemPage.tsx       /admin/design
      AssetsPage.tsx             /admin/assets
      ComponentsPage.tsx         /admin/components
      mock/tokens.ts             Design-token fixtures (display only — PRD §11)
  public/
    assets/images/                Brand images, logos, favicons
  components.json                 shadcn config
  vite.config.ts
  tsconfig.json  tsconfig.app.json
```

### Dead scaffolding

`src/components/nav-main.tsx`, `nav-secondary.tsx`, `nav-projects.tsx`,
`nav-user.tsx` and `src/marketing/Frame.tsx`, `Slab.tsx`, `Pill.tsx` are **not
imported by anything**. They are leftovers from the sidebar block and the original
marketing skeleton. They are safe to delete; they are listed here so the structure
above matches reality rather than aspiration.

## Data layer

The dashboard's data lives in `localStorage` under the versioned namespace
`call-indigo:v1:*`. The shape of the layer is what matters, because it is designed
to be replaced:

```
pages  →  api.ts  →  backend.ts  →  localStorage
            ↑
   the only seam; async on purpose
```

- **Pages never import `backend.ts`.** They call `api.ts`, which is `async` even
  though the local backend is synchronous — so swapping in `fetch` is a change to
  one file (PRD §16.2 F2).
- **`backend.ts` is the only file that knows where data physically lives.** It is
  synchronous and dumb on purpose. Corrupt JSON and a full quota both fall back
  rather than taking the page down.
- **Mutations bump a version counter** that `useApiData` subscribes to via
  `useSyncExternalStore`. This is why submitting on `/contact` repaints the
  dashboard inbox without either page knowing the other exists.
- **`useApiData(key, load)` is the one read path.** `key` is an explicit cache/test
  identity rather than a dependency array, which keeps the effect lint-checkable.

Seed fixtures are 9 inquiries covering every status, both property types and all
three urgency levels. **Settings → Security → Reset demo data** clears the whole
namespace and restores them.

**`localStorage` is not a database.** Data is per-browser, is not shared between
users or devices, and is cleared with site data. This demonstrates the workflow; it
is not a shipped backend.

## Parity

The marketing pages must reproduce the three prototype pages as exact duplicates.

**The baseline is `valvoro-prototype/` at the repo root** — the tracked copy, 87
files including all 79 brand images. `archive/v1-prototype/valvoro-prototype/`
holds a byte-identical copy of the HTML, CSS, JS and ground-truth docs, but
`.gitignore` excludes images under `archive/**`, so the archived copy is not
self-contained. **Compare against the root copy.**

The verification harness in `archive/audit/v1-audit/v2check/` (`verify.py`,
`diag.py`, `mincontent.py`, `shots.py`) has **not yet been adapted** into a test
suite — `tests/` contains a plan, not scripts, and `npm run test:parity` is not in
`package.json`. See [tests/README.md](./tests/README.md) for the plan and
[docs/README.md](./docs/README.md) §5 for how parity is currently verified.

## Known limitations

- **No authentication.** `/admin` is reachable by anyone with the URL. There is no
  login, session or token code. Auth is PRD §16.2 F1 and lands before this dashboard
  is pointed at anything real. Profile and Security say so on screen.
- **No real backend.** See [Data layer](#data-layer).
- **Content management is deferred** (F4). The marketing pages carry their copy
  inline, so editing Settings does **not** rewrite them. Settings says so on screen.
- **Two button systems.** Marketing uses the bespoke `.pill` family; the dashboard
  uses shadcn `Button`. Reconciliation is deferred (F7).
- **Client-rendered SPA.** No SSR or pre-rendering; SEO impact noted in PRD §15 R4.
- **The scroll-reveal animation is unverified in a real browser.** 60 elements are
  gated behind `.reveal` + an `IntersectionObserver` (35 home, 16 residential, 9
  commercial), which cannot fire in a headless preview context. The CSS cascade and
  the observer port were both verified directly, but the animation itself needs a
  look in a real tab.

## Documentation

| Document | Covers |
|---|---|
| [PRD.md](./PRD.md) | Product requirements — the original spec |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |
| [docs/README.md](./docs/README.md) | Developer flow: commits, PRs, gates, component policy, CSS pipeline |
| [docs/dashboard-scope.md](./docs/dashboard-scope.md) | Where this build departs from the PRD, and why |
| [docs/component-exceptions.md](./docs/component-exceptions.md) | Registry-component exceptions (PRD §7.5) |

## License

Proprietary — Call Indigo LLC.
