# Call Indigo Website

> Home & facility services for Austin, TX — plumbing, electrical, HVAC, carpentry, remodeling.
> Family owned, locally operated since 2012. Serving Hays, Travis, and Williamson counties.

This repository contains the Call Indigo marketing website and admin dashboard, built on
a React / Vite / Tailwind CSS v4 / shadcn/ui stack.

**Current version:** v2.0.rc1 — see [CHANGELOG.md](./CHANGELOG.md) for the release entry
and [PRD.md](./PRD.md) for the full product requirements document.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Build | Vite 7 | Fast dev server, optimised production builds |
| UI | React 19 + TypeScript 5.9 | SPA with client-side routing |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) | No `tailwind.config.js`, no PostCSS plugin |
| Dashboard components | shadcn/ui (`new-york` style) | Registry-only under `/admin` (PRD §7) |
| Marketing components | Bespoke | Ported from the static prototype (PRD §8) |
| Routing | React Router | SPA with client-side fallback |
| Icons | lucide-react | Matches shadcn `iconLibrary` |
| Path alias | `@/*` → `src/*` | Required by the shadcn CLI |

## Quick start

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Type-check + production build
npm run build

# Preview the production build
npm run preview
```

## Project structure

```
indigo/
  PRD.md                         Product requirements document
  archive/                       Past work and reference material (see archive/README.md)
  docs/
    README.md                    Developer flow standards
  src/
    index.css                    Single Tailwind import + @theme tokens (PRD §6)
    main.tsx                     App entry
    App.tsx                      Router
    lib/utils.ts                  cn() utility (shadcn)
    components/
      ui/                         Registry-only components (PRD §7)
      nav-main.tsx                Sidebar block file (sidebar-08)
      nav-secondary.tsx           Sidebar block file (sidebar-08)
      nav-user.tsx                Sidebar block file (sidebar-08)
      app-sidebar.tsx             Sidebar block file (sidebar-08)
    marketing/                    Bespoke components (PRD §8)
      Frame.tsx  Slab.tsx  Pill.tsx  TopBar.tsx  Header.tsx  Footer.tsx
      sections/                   The 13 home slabs + sub-page sections
    admin/
      AdminLayout.tsx              SidebarProvider + AppSidebar + SidebarInset
      SettingsPage.tsx             /admin/settings
      DesignSystemPage.tsx         /admin/design
      mock/tokens.ts               Design-token fixtures (PRD §11)
  public/
    assets/images/                Brand images, logos, favicons
  components.json                 shadcn config
  vite.config.ts
  tsconfig.json  tsconfig.app.json
```

## Routes

| Route | Description |
|---|---|
| `/` | Home page — 13 sections, exact parity with the static prototype |
| `/residential` | Residential services sub-page |
| `/commercial` | Commercial services sub-page |
| `/admin` | Redirects to `/admin/settings` |
| `/admin/settings` | Mockup Settings page (three tabs, no persistence) |
| `/admin/design` | Mockup Design System page (read-only token display) |

## Design tokens

All brand tokens live in `src/index.css` as a single `@theme` block — the one source
of truth (PRD §6.1). shadcn semantic tokens are mapped in `:root` and exposed via
`@theme inline` so the dashboard inherits the brand without a second palette.

## Parity

The React build must reproduce the three marketing pages as exact duplicates of the
static prototype. The parity harness lives in `archive/audit/v1-audit/v2check/` and
will be adapted into the project's test suite during rc1 implementation (PRD §13).

## License

Proprietary — Call Indigo LLC.
