# Call Indigo Website

> Home & facility services for Austin, TX — plumbing, electrical, HVAC, carpentry, remodeling.
> Family owned, locally operated since 2012. Serving Hays, Travis, and Williamson counties.

This repository contains the Call Indigo marketing website and admin dashboard, built on
a React / Vite / Tailwind CSS v4 / shadcn/ui stack.

**This file is the starting point and the index of project knowledge.** Everything below
is either the answer itself or a link to the document that holds it. The complete
documentation index is [docs/README.md](./docs/README.md), also rendered as a
[**wiki**](https://github.com/indigo-services/call-indigo/wiki).

**Current version:** v2.0.2 — see [CHANGELOG.md](./CHANGELOG.md) for the
release entries and [PRD.md](./PRD.md) for the full product requirements document.

> **Scope note.** The dashboard in this build does more than the PRD's rc1 mockup
> described (`§5.2` allowed three `/admin` entries; `§9.1` said no persistence). The
> deviation and its reasoning are reconciled in
> [docs/60-reference/dashboard-scope.md](./docs/60-reference/dashboard-scope.md).
> **The repo wins over the document** — see
> [docs/20-development/standards.md](./docs/20-development/standards.md) §1.

---

## Where to look

| I want to… | Go to |
|---|---|
| **See every document in the project** | [docs/README.md](./docs/README.md) — the documentation index |
| **Read the docs as a website** | [**The project wiki**](https://github.com/indigo-services/call-indigo/wiki) — the same library, generated from `docs/` |
| **Get set up** | [docs/10-onboarding/setup.md](./docs/10-onboarding/setup.md) — clone to green in ten minutes |
| **Know the rules** | [docs/20-development/standards.md](./docs/20-development/standards.md) |
| **Understand the code** | [docs/20-development/architecture.md](./docs/20-development/architecture.md) — the four seams |
| **Avoid the traps** | [docs/20-development/patterns.md](./docs/20-development/patterns.md) — ten this repo has paid for |
| Understand how verification works | [docs/20-development/testing.md](./docs/20-development/testing.md) |
| Understand what this product is meant to be | [PRD.md](./PRD.md) |
| Know what changed, and when | [CHANGELOG.md](./CHANGELOG.md) |
| **Know what is still open** | [docs/40-project/tasks.md](./docs/40-project/tasks.md) — the live punch list |
| Understand the `/admin` sign-in | [docs/60-reference/admin-gate.md](./docs/60-reference/admin-gate.md) |
| Know how it deploys, and the author gate | [docs/30-operations/deployment.md](./docs/30-operations/deployment.md) |
| Find past work and reference material | [archive/README.md](./archive/README.md) |
| Contribute | [CONTRIBUTING.md](./CONTRIBUTING.md) |

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
| Dashboard access | A client-side sign-in gate | **Not access control** — see [The dashboard gate](#the-dashboard-gate) |
| Path alias | `@/*` → `src/*` | Required by the shadcn CLI |
| Node | `^20.19.0 \|\| >=22.12.0` | `package.json` `engines`, pinned in `.nvmrc` |

## Quick start

```bash
npm install          # install dependencies
npm run dev          # dev server → http://localhost:5173

npm run typecheck    # G1 — tsc --noEmit
npm run lint         # G2 — eslint
npm run build        # G3 — tsc -b && vite build
npm run test:only    # G4 — the verification suite, against the build you just made

npm test             # G3 + G4 together — build, then run every suite
npm run preview      # preview the production build
```

Full setup, the five common failures, and the `test` vs `test:only` difference:
[docs/10-onboarding/setup.md](./docs/10-onboarding/setup.md).

### Verified clean on this commit

**Every number below names the command that produced it.** Re-run the command to check
it; **do not trust a number without one.** Two documents in this repo stated a check
count that had been wrong for 60 checks' worth of releases, because the number had no
producer attached to it and nothing failed when it drifted.

| Gate | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` | **0 errors** |
| Lint | `npm run lint` | **0 errors, 4 warnings** — `react-refresh/only-export-components` in `src/components/ui/{badge,button,sidebar,tabs}.tsx` (registry files, pre-existing) |
| Build | `npm run build` | **1815 modules** — 813.48 kB JS (240.13 kB gzip) / 130.84 kB CSS (23.16 kB gzip) / 1.46 kB HTML. The >500 kB chunk warning is pre-existing; code-splitting is the fix |
| Verification | `npm run test:only` | **153 checks passed** |

*Measured 2026-09-27 at `899beff`, vite v7.3.6.* **One row here is machine-checked
and three are a snapshot.** The check count cannot drift: `tests/run.mjs` compares it
against the run that just happened and fails when the two disagree. The build figures
are a snapshot — **editing any `src/` file moves the JS byte count** (this row read
810.79 kB until a one-line change to `ComponentsPage.tsx` moved it), and nothing
asserts them yet (task **E10**). The claim registry that names each producer is
[docs/00-meta/claims.json](./docs/00-meta/claims.json).

### CI

`.github/workflows/ci.yml` runs the same four gates on every push to `main` and every
pull request. The lint ceiling is pinned at the **measured** 4 warnings — it is a floor
to tighten, never a budget to spend.

## Routes

The generated route table, with each page's file and line count, is
[docs/60-reference/routes.md](./docs/60-reference/routes.md) — regenerate with
`node scripts/_routes_doc.cjs`.

### Public (PRD §5.1)

| Route | Description |
|---|---|
| `/` | Home page — 13 sections, parity with the static prototype |
| `/residential` | Residential services sub-page |
| `/commercial` | Commercial services sub-page |
| `/contact` | Inquiry form — writes a real record the dashboard inbox reads |

### Dashboard — all behind the sign-in gate

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

An unknown `/admin/*` path **redirects to the inbox** rather than rendering a shell —
PRD §5.2's "no catch-all" rule is preserved as a routing property, and
`tests/policy.mjs` asserts it is a redirect and not a page.

## Project structure

```
indigo/
  README.md                      This file — the starting point and knowledge index
  PRD.md                         Product requirements document
  CHANGELOG.md                   Release history
  CONTRIBUTING.md SECURITY.md    Pointers into the rules; how to report a problem
  LICENSE                        Proprietary — Indigo Home & Facility Services
  THIRD-PARTY-NOTICES.md         The public attribution register
  CODE_OF_CONDUCT.md
  .editorconfig  .nvmrc          Editor and toolchain pins (LF; Node 22.22.2)
  .github/                       CI, PR templates, issue templates, Dependabot
  archive/                       Past work and reference material (see archive/README.md)
  docs/                          THE DOCUMENTATION LIBRARY — index at docs/README.md
    00-meta/                     How the docs work: conventions, doc-map, claims.json, templates
    10-onboarding/               Day one: orientation, setup, glossary
    20-development/              The rules, the seams, the patterns, testing, tokens, CSS
    30-operations/               Deployment, environments, observability, runbook, security
    40-project/                  Roadmap, tasks, artifacts, prd/, plans/, decisions/ (ADRs)
    50-sessions/                 The session protocol, the agent I/O contract, devlog/
    60-reference/                Routes, data layer, the gate, scope, parity, third-party rights
  src/
    main.tsx                     App entry
    App.tsx                      Router — the route table
    index.css                    Tailwind import + @theme tokens + ported design system (PRD §6)
    lib/
      utils.ts                   cn() utility (shadcn)
      format.ts                  Date, number, bytes and initials formatters
      theme.ts, use-theme.ts     Theme token authoring behind the Design System page
      data/                      Dashboard data layer (see below)
        types.ts                 Storage-agnostic domain types
        seed.ts                  First-run fixtures — 9 inquiries
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
      TopBar.tsx Header.tsx Footer.tsx   The chrome pieces
      chrome.ts                  Chrome markup, with SPA href rewrites applied
      chrome-markup.ts           The chrome markup extracted from the prototype (GENERATED)
      useSiteChrome.ts           Port of the prototype's js/main.js behaviour
      hero-rotation.ts           The rotating word, its arch map, and fitFontSize
      service-area.ts            The ZIP decision, as a pure function
      Captcha.tsx                Local arithmetic captcha for the inquiry form
      pages/                     HomePage · ResidentialPage · CommercialPage · ContactPage
      Frame.tsx Slab.tsx Pill.tsx   Unused scaffolding — see below
    admin/
      AdminLayout.tsx            SidebarProvider + AppSidebar + SidebarInset + breadcrumb
      RequireAuth.tsx            The route guard — wraps the layout, not the pages
      LoginPage.tsx              The sign-in page, rendered in place of the dashboard
      auth.ts                    The credential, the KDF, the session store
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
    hooks/use-mobile.ts          Viewport hook for the registry sidebar
  public/
    assets/images/               95 brand images, logos, favicons
  tests/                         Verification suite — see docs/20-development/testing.md
  scripts/                       Build, probe and image tooling (prefixed _)
  valvoro-prototype/             The parity baseline (PRD §13)
  components.json                shadcn config
  vite.config.ts  vercel.json    Build and hosting config
  tsconfig.json  tsconfig.app.json
```

### Dead scaffolding

`src/components/nav-main.tsx`, `nav-secondary.tsx`, `nav-projects.tsx`, `nav-user.tsx`
and `src/marketing/Frame.tsx`, `Slab.tsx`, `Pill.tsx` are **not imported by anything** —
verified by a repo-wide import grep on 2026-09-27, not by reading the directory. They are
leftovers from the sidebar block and the original marketing skeleton. They are safe to
delete; they are listed here so the structure above matches reality rather than
aspiration.

## Data layer

The dashboard's data lives in `localStorage` under the versioned namespace
`call-indigo:v1:*`. The shape of the layer is what matters, because it is designed to be
replaced:

```
pages  →  api.ts  →  backend.ts  →  localStorage
            ↑
   the only seam; async on purpose
```

- **Pages never import `backend.ts`.** They call `api.ts`, which is `async` even though
  the local backend is synchronous — so swapping in `fetch` is a change to one file
  (PRD §16.2 F2).
- **`backend.ts` is the only file that knows where data physically lives.** It is
  synchronous and dumb on purpose. Corrupt JSON and a full quota both fall back rather
  than taking the page down.
- **Mutations bump a version counter** that `useApiData` subscribes to via
  `useSyncExternalStore`. This is why submitting on `/contact` repaints the dashboard
  inbox without either page knowing the other exists.

Full surface — every method, the namespace, the seed, and the failure modes:
[docs/60-reference/data-layer.md](./docs/60-reference/data-layer.md).

**`localStorage` is not a database.** Data is per-browser, is not shared between users or
devices, and is cleared with site data. This demonstrates the workflow; it is not a
shipped backend. **The contact form tells the business nothing** — it writes to the
submitter's own browser. Say so before a demo.

## The dashboard gate

`/admin` is behind a **client-side sign-in gate** (`src/admin/auth.ts`), added
2026-09-26 in `e622315`. The client asked for a username and password with a secure
implementation rather than a literal comparison, and this is the smallest thing that
answers the request.

- **Neither credential is in the bundle.** The password is a salted PBKDF2-HMAC-SHA-256
  digest at 210,000 iterations; the username is a salted SHA-256. Grepping the built
  JavaScript for either finds nothing.
- **The session lives in `sessionStorage`** under a key deliberately *outside* the
  `call-indigo:v1:` namespace, so "Reset demo data" does not sign the operator out. It
  expires after 12 hours and dies with the tab.
- **The guard wraps the layout**, not the pages — a stranger never sees the sidebar, and
  there is no `/admin/login` route to loop through.

**It is not access control, and nothing in this repo may imply that it is.** There is no
server, so there is nowhere for a secret to hide from the browser: anyone who can open
devtools can set the session flag by hand. What it buys is that the dashboard is off the
public internet while the client is showing it around. Four in-app surfaces say so on
screen, and `tests/auth.mjs` fails if any of them reverts.

Threat model, rotation procedure, risk register and the verification evidence:
**[docs/60-reference/admin-gate.md](./docs/60-reference/admin-gate.md)**. A server-issued
session is PRD §16.2 F1 and lands before this dashboard is pointed at anything real.

## Parity

The marketing pages were ported from the three prototype pages, and PRD §5.1 required
them to stay exact textual duplicates.

**The baseline is `valvoro-prototype/` at the repo root** — the tracked copy, 87 files
including all 79 brand images. `archive/v1-prototype/valvoro-prototype/` holds a
byte-identical copy of the HTML, CSS, JS and ground-truth docs, but `.gitignore` excludes
images under `archive/**`, so the archived copy is not self-contained. **Compare against
the root copy.**

**The copy is no longer an exact duplicate.** A later pass removed the duplicated copy
from all three pages, so §5.1's textual requirement no longer describes the build.
Structure, section ids, class names, element count and the `BODY_HTML` rendering model
are unchanged. `npm test` asserts the behavioural properties §5.1 was protecting — links,
ids, images, ARIA targets, stylesheet coverage — headlessly.

**The §13.2 pixel thresholds still govern layout and have not been re-measured since the
copy changed.** The browser harness in `archive/audit/v1-audit/v2check/` is still the only
code that can measure them, and PRD §16.2 F10 (retiring the prototype) is blocked on it.
Full detail, including the two known risks:
[docs/60-reference/parity.md](./docs/60-reference/parity.md).

**A note on provenance.** The design came from a purchased HTML template, and the rights
position is measured rather than assumed: the markup was rewritten (246 template classes
vs 488, 29 shared) and the CSS re-implemented in Tailwind, **but 59 of the 95 images in
`public/assets/images/` are byte-identical to the template library.** See
[docs/60-reference/third-party-assets.md](./docs/60-reference/third-party-assets.md).

## Known limitations

- **The gate is client-side.** See [The dashboard gate](#the-dashboard-gate). It keeps
  `/admin` off the public internet; it is not access control, and a server-issued session
  is still owed (PRD §16.2 F1).
- **No real backend.** See [Data layer](#data-layer). The contact form writes to the
  submitter's browser and the business never receives it.
- **Content management is deferred** (F4). The marketing pages carry their copy inline,
  so editing Settings does **not** rewrite them. Settings says so on screen.
- **Two button systems.** Marketing uses the bespoke `.pill` family; the dashboard uses
  shadcn `Button`. Reconciliation is deferred (F7).
- **Client-rendered SPA.** No SSR or pre-rendering; SEO impact noted in PRD §15 R4.
- **The scroll-reveal animation is unverified in a real browser.** 60 elements are gated
  behind `.reveal` + an `IntersectionObserver` (35 home, 16 residential, 9 commercial),
  which cannot fire in a headless preview context. The CSS cascade and the observer port
  were both verified directly, but the animation itself needs a look in a real tab.
- **No observability.** No error reporting, no analytics, no uptime check. See
  [docs/30-operations/observability.md](./docs/30-operations/observability.md).
- **`overview.md` is a session artifact.** It sits at the repo root, is gitignored, and is
  regenerated each session — it is stale the moment it is written. The durable records are
  [CHANGELOG.md](./CHANGELOG.md) and [docs/50-sessions/devlog/](./docs/50-sessions/devlog/2026-09-27.md).

## Contributing, security, licence

| | |
|---|---|
| **Contributing** | [CONTRIBUTING.md](./CONTRIBUTING.md) — the short version, and what we will not merge |
| **Security** | [SECURITY.md](./SECURITY.md) — how to report, and why most of what looks like a vulnerability is documented behaviour |
| **Conduct** | [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) |
| **Licence** | [LICENSE](./LICENSE) — **proprietary.** The package is `UNLICENSED`; no rights are granted by this repository being readable |
| **Third-party material** | [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) — the attribution register, with the MIT appendix |

**The repository is public, but the code is not open source.** Public visibility is not a
licence. Third-party assets are recorded in
[docs/60-reference/third-party-assets.md](./docs/60-reference/third-party-assets.md), and
**do not commit a third-party asset without recording it there first.**

## Documentation

The full index is **[docs/README.md](./docs/README.md)** — 55 documents in seven domains,
every one of them listed exactly once (asserted by `tests/docs.mjs`).

| Domain | Covers |
|---|---|
| [docs/00-meta/](./docs/00-meta/README.md) | How the docs work: the evidence rule, the document kinds, the claim registry, the templates |
| [docs/10-onboarding/](./docs/10-onboarding/README.md) | Day one → first merged change |
| [docs/20-development/](./docs/20-development/README.md) | The rules, the seams, the patterns, testing, tokens, CSS |
| [docs/30-operations/](./docs/30-operations/README.md) | Deployment, environments, observability, incident runbook, security |
| [docs/40-project/](./docs/40-project/README.md) | Roadmap, tasks, artifacts, the client disclosure, PRDs, plans, ADRs |
| [docs/50-sessions/](./docs/50-sessions/README.md) | The session protocol, the agent I/O contract, the devlog |
| [docs/60-reference/](./docs/60-reference/README.md) | Routes, data layer, the gate, scope, parity, third-party rights |
| [PRD.md](./PRD.md) | The founding product requirements |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |
| [tests/README.md](./tests/README.md) | The verification suite: what it proves and what it cannot see |
| [archive/README.md](./archive/README.md) | What is archived, and why it was archived rather than deleted |

> **The documentation is mid-refactor.** Phases 1–4 are done — the docs are true, CI
> enforces the gates, the library has domains, and the wiki is published. Phase 5
> (freshness assertions and a deploy log) is in progress. The plan, with evidence for
> every finding, is
> [docs/40-project/plans/plan-docs-refactor-2026-09-27.md](./docs/40-project/plans/plan-docs-refactor-2026-09-27.md).
