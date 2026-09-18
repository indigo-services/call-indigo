# PRD — Call Indigo Website v2.0.rc1

**Transition to a React / Tailwind CSS v4 / shadcn-ui stack, with a prototype `/admin` dashboard**

| | |
|---|---|
| **Document** | `PRD.md` |
| **Version** | v2.0.rc1 |
| **Status** | Draft — for review |
| **Date** | 2026-09-18 |
| **Supersedes** | The v2 static-HTML prototype briefs of 2026-09-17 / 2026-09-18 |
| **Scope** | rc1 only. Everything beyond rc1 is fenced in §16. |

---

## 0. Evidence rule

Every claim in this document is checkable. Values marked **[M]** are **measured** — read out of a file
in this workspace, with the path given. Values marked **[P]** are **proposed by this PRD** and have no
prior existence in the repo; they are always flagged and always carry an open question.

Nothing in this PRD is asserted from memory. Where the repo and this document disagree, the repo wins
and this document is the bug.

---

## 1. Summary

The site is currently three hand-written static HTML pages whose entire design system lives in an
inline Tailwind **browser-build** block duplicated inside each file. It works, and it is visually
tuned, but the stack does not scale to a second surface.

v2.0.rc1 does three things and nothing else:

1. **Ports the existing site to a real build** — Vite + React + TypeScript + Tailwind CSS v4 (CLI
   build) — while reproducing the three existing pages **exactly**. Visual parity is the acceptance
   test, not an aspiration.
2. **Adds exactly one new footer link** across all three pages, pointing at `/admin`.
3. **Adds a mocked-up dashboard at `/admin`** — two pages (Settings, Design System) on the shadcn/ui
   two-menu sidebar shell. Mockup only: no authentication, no persistence, no API.

The front end may keep its bespoke components. The dashboard may not — it is registry-only (§7).

---

## 2. Goals and non-goals

### 2.1 Goals (rc1)

| # | Goal | How it is proven |
|---|---|---|
| G1 | The React build renders the three existing pages as an **exact duplicate** | Pixel-diff harness, §13. Zero diff above threshold at 1920 / 1440 / 390 |
| G2 | One new footer link, present on all three pages | Rendered-DOM assertion on 3 routes |
| G3 | That link opens `/admin`, a two-menu shadcn sidebar shell | Route assertion + screenshot |
| G4 | `/admin` contains exactly two pages: Settings, Design System | Route table contains exactly 3 `/admin` entries (§5.2) |
| G5 | The Design System page shows logo, icon, colours, standard accents, and one accent shade each for Residential and Commercial | Content checklist, §11 |
| G6 | Every dashboard component is registry-provenanced | Provenance gate, §7.4 |
| G7 | No authentication anywhere | Negative assertion: no login route, no session code |

### 2.2 Non-goals (rc1)

Explicitly out of scope. Each is fenced again in §16.

- Authentication, sessions, roles, permissions.
- Real data of any kind. No API, no database, no fetch.
- Persistence. Reloading `/admin` discards all state.
- Editing the marketing pages from the dashboard.
- Writing theme changes back to CSS. The Design System page **displays** tokens; it does not author them.
- Migrating the marketing pages onto registry components (§8.3 explains why).
- SEO / pre-rendering. rc1 ships a client-rendered SPA (§15, R4).

---

## 3. Current state — verified

### 3.1 What exists

| Item | Value | Evidence |
|---|---|---|
| Pages | `index.html`, `residential.html`, `commercial.html` | `valvoro-prototype/` **[M]** |
| Home page sections | 13 slabs | `valvoro-prototype/index.html` **[M]** |
| Section ids | `about, area, brands, choose, contact, estimate, faq, process, results, reviews, services, top` | `index.html` id scan **[M]** |
| CSS pipeline | Tailwind **browser build** from CDN + inline `<style type="text/tailwindcss">` per page | `index.html:16-17` **[M]** |
| JS | `js/main.js` — drawer, legal modals, scroll reveal, copyright year | `valvoro-prototype/js/main.js` **[M]** |
| Page generator | `_audit/v2check/gen_pages.py` — builds the two sub-pages from `index.html` | **[M]** |
| Verification | `_audit/v2check/verify.py`, `diag.py`, `mincontent.py`, `shots.py` | **[M]** |
| Node project | **None.** No `package.json`, no `node_modules`, no lockfile | workspace scan **[M]** |

`gen_pages.py` extracts the shared chrome by string slicing, including:

```python
FOOTER = block(src, "<!-- ======================= FOOTER", "</html>")
```

So the footer is a single source in `index.html`, propagated byte-identically to both sub-pages. That
is what makes §12 a one-edit change. **[M]**

### 3.2 The live design tokens

Read from the `@theme` block at `valvoro-prototype/index.html:21-84`. These are the values rc1 must
carry across unchanged. **[M]**

| Token | Value | Role |
|---|---|---|
| `--color-brand` | `#2a5aa2` | Primary blue |
| `--color-brand-deep` | `#154d9f` | Deeper blue |
| `--color-sky` | `#30c3eb` | **Accent** (eyebrows, pills, checks) |
| `--color-sky-soft` | `#aed8f1` | Accent, muted |
| `--color-ink` | `#121b3c` | Headings |
| `--color-ink-2` | `#091f41` | Dark slab / footer |
| `--color-topbar` | `#091f41` | Utility bar |
| `--color-ring` | `#a8cdf0` | Focus ring |
| `--color-star` | `#e9bd4b` | Rating |
| `--color-mist` | `#f4f8fe` | Light surface |
| `--color-body` | `#696969` | Body copy |
| `--color-line` | `#e3e8f2` | Borders |
| `--color-scrim-hero` | `rgb(25 80 160 / 88%)` | Hero photo scrim |
| `--color-scrim-blue` | `rgb(42 90 162 / 90%)` | Estimate / area / CTA scrims |
| `--color-secondary` | `#ffffff` | — |
| `--font-sans` | `Archivo` + fallbacks | Type |
| `--radius-card` / `--radius-panel` | `18px` / `14px` | Radii (tightened from the template's 52/26) |
| `--shadow-lift` / `--shadow-drop` | see `index.html:64-65` | Elevation |
| `--animate-fade-up` / `-drawer-in` / `-drawer-out` | see `index.html:67-83` | Motion |

### 3.3 The frame model

Three nested layers, each with exactly one job. This is the layout contract rc1 must not break. **[M]**

```
viewport
 └── .pad-rl   → --gut    viewport edge → card edge
      └── .mbox → --inset card edge     → section text
           └── .shell → --col  max text column (1417px, ≥1200 only)
```

| Breakpoint | `--gut` | `--inset` |
|---|---|---|
| ≥ 1871 | 50 | 50 |
| ≤ 1870 | 40 | 40 |
| ≤ 1439 | 32 | 32 |
| ≤ 1199 | 24 | 28 |
| ≤ 991 | 16 | 24 |
| ≤ 767 | **0** | 16 |

`--gut: 0` at ≤767 is deliberate: cards go full-bleed on mobile so no viewport width is spent on
margin, and the text keeps a 16px inset of its own. **[M]**

### 3.4 Known defects in the current state

Carried forward as facts, not re-litigated here. rc1 does not fix them; §16 assigns them.

1. **`css/tw.css` is a stale mirror.** It carries the first-pass palette (`#4a5ea3` / `#7ec1e9` /
   `#0b1228`) and lacks the entire frame model. Only its radii are in sync. **[M]**
2. **The Tailwind browser build ignores external `type="text/tailwindcss"` links**, which is *why* the
   design system is duplicated inline in all three pages. Verified previously: all custom classes
   resolved to 0px. **[M]**
3. **`<meta name="theme-color">` is `#1f1c4a`** (`index.html:10`) — the v1 indigo, not any v2 token.
   **[M]**
4. **The `#area` city list disagrees with the footer.** `#area` names Austin / Round Rock / Cedar Park
   / Pflugerville / Georgetown; the footer names the v1 four (Austin / Buda / Kyle / San Marcos). Both
   are plausible (Williamson vs Hays County) but they contradict. **[M]**

---

## 4. Target architecture

### 4.1 Stack

| Layer | Choice | Note |
|---|---|---|
| Build | **Vite 7** | Fast, and the shadcn Vite guide targets it |
| UI | **React 19** + TypeScript 5.9 | React 19 is what shadcn's Tailwind-v4 path expects |
| CSS | **Tailwind CSS v4** via `@tailwindcss/vite` | **Not** PostCSS, **not** a `tailwind.config.js` |
| Components (dashboard) | **shadcn/ui**, `new-york` style, CSS variables, lucide icons | §7 |
| Components (marketing) | **Bespoke**, unchanged | §8 |
| Routing | React Router (declarative mode) | §5 |
| Path alias | `@/*` → `src/*` | Required by the shadcn CLI |

### 4.2 Bootstrap

```bash
npm create vite@latest indigo-web -- --template react-ts
cd indigo-web
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

`vite.config.ts`:

```ts
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
})
```

`src/index.css` begins with `@import "tailwindcss";`, then the ported token block (§6).

Then, with the alias in both `tsconfig.json` and `tsconfig.app.json`:

```bash
npx shadcn@latest init
```

Reference: <https://ui.shadcn.com/docs/installation/vite> and
<https://ui.shadcn.com/docs/tailwind-v4>.

> ⚠️ **Do not use the workspace's own scaffold script for this.** `modern-web-app`'s
> `scripts/init-webapp.sh` announces *"Using Node.js 20, Tailwind CSS v3.4.19, and Vite v7.2.4"* and
> its template ships `tailwindcss: ^3.4.19`, `tailwindcss-animate`, a `tailwind.config.js` and a
> `postcss.config.js` — all four of which the brief's Tailwind v4 requirement contradicts. Using it
> would produce a v3 project and require an immediate migration. See §15, R1. **[M]**

### 4.3 Target tree

```
src/
  index.css                  ← single @import "tailwindcss" + @theme (ported, §6)
  main.tsx
  App.tsx                    ← router
  lib/utils.ts               ← cn() (shadcn)
  components/
    ui/                      ← REGISTRY ONLY (§7)
    nav-main.tsx             ← registry block file (sidebar-08)
    nav-secondary.tsx        ← registry block file (sidebar-08)
    nav-user.tsx             ← registry block file (sidebar-08)
    app-sidebar.tsx          ← registry block file (sidebar-08)
  marketing/                 ← BESPOKE, ported from the static pages (§8)
    Frame.tsx  Slab.tsx  Pill.tsx  TopBar.tsx  Header.tsx  Footer.tsx
    sections/…               ← the 13 home slabs, plus the sub-page sections
  admin/
    AdminLayout.tsx          ← SidebarProvider + AppSidebar + SidebarInset
    SettingsPage.tsx         ← /admin/settings
    DesignSystemPage.tsx     ← /admin/design
    mock/tokens.ts           ← the design-token fixture (§11)
```

---

## 5. Routing and information architecture

### 5.1 Public routes — must be exact duplicates

| Route | Source page | Parity requirement |
|---|---|---|
| `/` | `index.html` | Exact |
| `/residential` | `residential.html` | Exact |
| `/commercial` | `commercial.html` | Exact |

### 5.2 Admin routes — rc1 contains exactly these

| Route | Page | Note |
|---|---|---|
| `/admin` | — | Redirects to `/admin/settings` |
| `/admin/settings` | Settings | Mockup, §10 |
| `/admin/design` | Design System | Mockup, §11 |

**Three entries. No more.** Any additional `/admin` route in rc1 is a scope violation. There is no
`/admin/login`, no `/admin/users`, no `/admin/*` catch-all page — a catch-all would become a fourth
page by accident. **[P]**

### 5.3 Hosting

Client-side routing means `/residential`, `/commercial` and `/admin/*` must all serve `index.html`.
Configure an SPA fallback (a rewrite rule on the host). Consequence: deep links work, but the server
returns 200 with the app shell for every path — recorded as R4 in §15. **[P]**

---

## 6. Design-system port

### 6.1 One source of truth

Today the tokens exist twice — inline in `index.html` and stale in `css/tw.css` (§3.4.1). rc1 collapses
them to **one** file, `src/index.css`, and deletes the duplication. That is the single largest
maintainability win in this release. **[P]**

### 6.2 Token port

Port the §3.2 table verbatim. Keep the **hex** values exactly as they are — do not "modernise" them to
OKLCH. shadcn's Tailwind-v4 defaults are OKLCH, but the brief is parity, and hex is a valid CSS colour
in v4. Mixing the two encodings is how a palette silently drifts. **[P]**

### 6.3 shadcn semantic-token mapping

shadcn components read semantic variables, not brand tokens. Map them once, in `:root`, so the
dashboard inherits the brand without a second palette. **[P]**

| shadcn token | Maps to | Value |
|---|---|---|
| `--primary` | `--color-brand` | `#2a5aa2` |
| `--primary-foreground` | — | `#ffffff` |
| `--background` | — | `#ffffff` |
| `--foreground` | `--color-ink` | `#121b3c` |
| `--muted` | `--color-mist` | `#f4f8fe` |
| `--muted-foreground` | `--color-body` | `#696969` |
| `--border` | `--color-line` | `#e3e8f2` |
| `--ring` | `--color-ring` | `#a8cdf0` |
| `--accent` | `--color-sky` | `#30c3eb` |
| `--sidebar` | `--color-ink-2` | `#091f41` |

Declare these under `:root` and reference them with `@theme inline`, which is the documented
Tailwind-v4 pattern:

```css
@import "tailwindcss";

:root {
  --primary: #2a5aa2;
  --foreground: #121b3c;
  /* … */
}

@theme inline {
  --color-primary: var(--primary);
  --color-foreground: var(--foreground);
  /* … */
}
```

Note `tw-animate-css` replaces `tailwindcss-animate` in new v4 projects, and `toast` is deprecated in
favour of `sonner`. **[M]**

---

## 7. Component policy

> **This section is normative. It is a release gate, not a guideline.**

### 7.1 The rule

**Every component rendered under `/admin` MUST come from the shadcn CLI, from the OSS registry.**

```
npx shadcn@latest add <component>
```

Components are added by CLI. They are not hand-written, not copied from a blog post, not
re-implemented "because it was quicker". **[P]**

### 7.2 Why the bar is where it is

The registry surface is large and maintained by other people:

- **64 documented primitives** — Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment, Avatar,
  Badge, Breadcrumb, Bubble, Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox,
  Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Direction, Drawer,
  Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Marker,
  Menubar, Message, Message Scroller, Native Select, Navigation Menu, Pagination, Popover, Progress,
  Questionnaire, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, **Sidebar**, Skeleton,
  Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group, Tooltip, Typography.
  **[M]** — count taken from the registry's own index page
- **A 16-block sidebar family alone** (`sidebar-01` … `sidebar-16`), plus dashboard and login blocks.
  **[M]**
- **A community registry directory** on top of that, reachable through `registries` in
  `components.json`. **[M]**

That is the "thousands of pre-built, maintained components" the brief refers to — and it is why the
**burden of proof sits on the custom component, never on the registry**. A hand-built component is not
neutral: it carries accessibility, keyboard, focus, RTL and dark-mode obligations that a registry
component already pays for.

### 7.3 Anti-patterns (each is a review failure)

| Anti-pattern | Correct action |
|---|---|
| Hand-rolling `Button`, `Input`, `Card`, `Badge`, `Table`, `Dialog`, `Select`, `DropdownMenu`, `Tabs`, `Tooltip`, `Skeleton`, `Sheet`, `Sidebar` | `npx shadcn@latest add <name>` |
| Wrapping a registry component purely to change its look | Pass `className` through `cn()` |
| Re-implementing a Radix primitive "to keep it light" | Add the registry component |
| Copying a component out of a tutorial | Find it in a registry, or open an exception (§7.5) |
| Forking a registry file in `components/ui/` | Open an exception, or upstream it |

### 7.4 Enforcement (build gate)

1. **Provenance.** Every file in `src/components/ui/**` must be registry-provenanced. Verify by
   re-adding with `npx shadcn@latest add --all --overwrite` in a scratch worktree and asserting the
   diff is empty. A non-empty diff means someone edited a registry file.
2. **Import discipline.** No file under `src/admin/**` may import from `src/marketing/**`. The
   dashboard uses `@/components/ui/*`, the registry block files, and `@/lib/utils`.
3. **Route count.** Assert `/admin` has exactly the three routes in §5.2.
4. **Auth negative assertion.** Grep the build for login/session/token/auth route or provider code;
   expect zero hits.

### 7.5 The custom-component exception

If — and only if — a dashboard requirement cannot be met by a registry component, a custom component
may be proposed. It must be recorded in `docs/component-exceptions.md` with **all five** fields
completed. A missing field is a rejection, not a gap to fill later. **[P]**

```markdown
## EXCEPTION-<n>: <component name>

1. REGISTRY SEARCH
   Registries searched : official (ui.shadcn.com), community directory
   Queries run         : <verbatim queries>
2. CLOSEST CANDIDATES (minimum three, with the reason each fails)
   - <registry component> — fails because <specific reason>
   - <registry component> — fails because <specific reason>
   - <registry component> — fails because <specific reason>
3. UNIQUE REQUIREMENT
   This component does <X>, which no registry component does, because <why>.
4. COST
   LOC: <n>   New a11y surface: <yes/no + detail>   Ongoing maintenance owner: <name>
5. SIGN-OFF
   Approved by: <name>   Date: <date>
```

**Worked example, applied to this release.** The Design System page (§11) renders a colour swatch grid
with hex labels and copy-to-clipboard. Step 2 would read:

- `Card` — fails: a card is a container, not a swatch grid; it carries no colour semantics.
- `Table` — fails: renders rows of text, cannot present a colour as a visual field.
- `Item` — fails: composes a title/description/actions row; no colour field.
- `Chart` — fails: it is a data-visualisation wrapper over Recharts.

Step 3: the swatch grid presents a colour as a first-class visual field with its token name, hex value
and role. No registry component does that. Step 4: ~60 LOC, no new a11y surface (it is a
`<ul>` of `<li>`s with text labels — it is not interactive except for the copy button, which is the
registry `Button`). This is a **legitimate exception**. A hand-rolled dashboard `Button` would not be.

### 7.6 Allowed registry additions for rc1

| Block / component | Command | Why |
|---|---|---|
| Two-menu sidebar shell | `npx shadcn@latest add sidebar-08` | Ships `app-sidebar.tsx`, `nav-main.tsx`, `nav-secondary.tsx`, `nav-user.tsx` — the two-menu layout, §9.2 |
| Sidebar primitive | `npx shadcn@latest add sidebar` | Registry dependency of the block |
| Form + display set | `npx shadcn@latest add tabs card field label input select switch radio-group separator badge button sonner tooltip` | §10 and §11 content |

No other registry items are needed for rc1. **[P]**

---

## 8. Front end — bespoke components permitted

> **This section is normative.**

### 8.1 The rule

**The marketing front end (`/`, `/residential`, `/commercial`) may remain custom, bespoke components.**

The registry-only rule of §7 applies to `/admin` and to `/admin` alone.

### 8.2 Why

The front end is not a generic application UI. It is a specific visual composition that was matched to
a reference design and then measured against it:

- a 13-slab page where alternating bands carry a 50px-radius slab (§3.1);
- a three-layer frame model with a six-step gutter ladder (§3.3);
- a signature pill button with a rotating disc, in four sizes;
- the hero arch, the oval work photo, the lozenge badge, the emergency card, the scroll ring.

shadcn ships no equivalent for any of that, and the rc1 goal is **exact duplication**, not
re-interpretation. Rewriting the front end onto registry components would trade a proven visual result
for a design regression, which is the opposite of the brief. **[P]**

### 8.3 The boundary, stated plainly

| | Marketing (`/`, `/residential`, `/commercial`) | Dashboard (`/admin/**`) |
|---|---|---|
| Generic primitives (button, input, dialog, table…) | Bespoke permitted | **Registry only** |
| Layout / frame | Bespoke permitted | Registry shell |
| Design tokens | Shared — one `@theme`, one source (§6.1) | Same tokens |
| Importing across the boundary | Not allowed | Not allowed |

**Known, accepted debt:** rc1 therefore ships **two button systems** — the bespoke `.pill` family on
the marketing pages, and shadcn's `Button` in the dashboard. They will not look identical. This is
accepted for rc1 because forcing one would either regress the front end or violate §7. §16 assigns the
reconciliation. It is recorded here so nobody discovers it as a surprise. **[P]**

---

## 9. Dashboard scope for rc1

### 9.1 Scope statement

**Exactly two pages. No authentication.**

| In rc1 | Out of rc1 |
|---|---|
| `/admin/settings` — mockup Settings page | Any authentication, login, session, or guard |
| `/admin/design` — mockup Design System page | Any real data, API call, or persistence |
| The two-menu sidebar shell | Any third `/admin` page |
| Mock fixtures in `src/admin/mock/` | Editing the marketing site from the dashboard |

There is no route guard and no auth provider in rc1. `/admin` is reachable by anyone who has the URL.
That is intended for a prototype, and it is the reason §16 schedules auth before any real data exists.
**[P]**

### 9.2 The two-menu layout

The brief's "shadcn/ui two-menu layout" is implemented as **one inset sidebar containing two menu
groups**, which is exactly the shape the registry block `sidebar-08` — *"An inset sidebar with
secondary navigation"* — ships. **[M]**

Install it with `npx shadcn@latest add sidebar-08`. The block provides the composition, and the two
menus map onto its two nav files:

```
SidebarProvider
└── Sidebar (variant="inset")        ← app-sidebar.tsx
    ├── SidebarHeader                ← Call Indigo mark + wordmark
    ├── SidebarContent
    │   ├── SidebarGroup             ← MENU 1: "Settings"   (nav-main.tsx)
    │   │   └── SidebarMenu → SidebarMenuItem → SidebarMenuButton
    │   └── SidebarGroup             ← MENU 2: "Design"     (nav-secondary.tsx)
    │       └── SidebarMenu → SidebarMenuItem → SidebarMenuButton
    ├── SidebarFooter                ← nav-user.tsx, mock identity
    └── SidebarRail
└── SidebarInset
    └── SiteHeader (SidebarTrigger + Breadcrumb) + page content
```

**Rejected alternative.** Block `sidebar-15` — *"A left and right sidebar"* — is **not** what the brief
describes: it renders two sidebars on opposite edges of the viewport, which is a three-pane workspace
shell, not a two-menu one. Recorded so the choice is not re-litigated. **[M]**

### 9.3 Menu model

| Menu | Group label | Item | Target | State |
|---|---|---|---|---|
| 1 | **Settings** | General | `/admin/settings` | Live (rc1 page) |
| 1 | | Profile | — | Mockup — `aria-disabled`, no route |
| 1 | | Notifications | — | Mockup — `aria-disabled`, no route |
| 1 | | Security | — | Mockup — `aria-disabled`, no route |
| 2 | **Design** | Design System | `/admin/design` | Live (rc1 page) |
| 2 | | Assets | — | Mockup — `aria-disabled`, no route |
| 2 | | Components | — | Mockup — `aria-disabled`, no route |

Mockup items **must not navigate**. They render as `SidebarMenuButton` with `aria-disabled="true"` and
`tabIndex={-1}` — not as a link to nowhere. A dead link is a bug; a visibly-disabled control is a
mockup. Active state comes from the router's location, not from a hard-coded class. **[P]**

---

## 10. Settings page spec (`/admin/settings`)

Mockup. All state is `useState`; a reload resets it. Registry components only.

| Region | Registry components | Mockup content |
|---|---|---|
| Page header | `Breadcrumb`, `Separator` | "Settings" |
| Tab set | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Three tabs: General, Appearance, Notifications |
| **General** | `Card`, `Field`, `FieldLabel`, `Input`, `Select` | Business name `Call Indigo`; legal name `Indigo Home & Facility Services`; phone `(512) 608-4999`; email `support@call-indigo.com`; service area `Hays, Travis, and Williamson counties` |
| **Appearance** | `Card`, `RadioGroup`, `Switch`, `Separator` | Theme (Light / Dark / System); accent preview; "Reduce motion" switch |
| **Notifications** | `Card`, `Switch`, `Separator` | Email on new lead; weekly summary; emergency-page alerts |
| Save action | `Button`, `Sonner` | "Save changes" → `toast("Saved (mockup — nothing was persisted)")` |

Field values are seeded from the site's real published facts so the mockup reads as the real product:

```
brandName        "Call Indigo"
legalName        "Indigo Home & Facility Services"
primaryPhone     "(512) 608-4999"
publicEmail      "support@call-indigo.com"
address          "1005 Meredith Drive, Austin, TX 78748"
establishedYear  "2012"
serviceArea      "Hays, Travis, and Williamson counties"
serviceAreaCities["Austin","Buda","Kyle","San Marcos"]
licenseNumber    "RMP: 45574"
copyrightName    "Call Indigo LLC"
```

Source: `valvoro-prototype/GROUND_TRUTH-source-facts.txt`. **[M]**

**Save must not claim success it did not achieve.** The toast says *mockup* and *nothing was
persisted*. A toast that reads "Saved" while writing nothing is a lie the prototype would teach
everyone to trust.

---

## 11. Design System page spec (`/admin/design`)

Mockup. Display-only. This page shows the brand; it does not author it (§2.2).

Required content, per the brief: **logo, icon, colours, standard accents, plus one accent shade for
Residential and one for Commercial.**

### 11.1 Logo

| Asset | File | Use |
|---|---|---|
| Mark (light) | `assets/images/call-indigo-mark.svg` | On light surfaces |
| Mark (dark) | `assets/images/call-indigo-mark-dark.svg` | On dark surfaces / footer |
| Wordmark | — | "Call Indigo", `font-sans`, `tracking-[-.02em]`, weight 700, 23px |
| Lockup | mark + wordmark, `gap-2.5` | Header and footer |

`assets/images/` also holds `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png`,
`call-indigo-mark.svg`. **[M]**

### 11.2 Icon

The brand icon is the mark itself. **UI icons are lucide**, matching the `iconLibrary` in
`components.json` — this is what the registry sidebar uses, so no second icon set enters the build.
**[M]**

### 11.3 Colours

Render the full §3.2 token table as swatches: token name, hex, role. Group as **Brand** (`brand`,
`brand-deep`, `ink`, `ink-2`, `topbar`), **Accents** (§11.4), **Neutrals** (`mist`, `line`, `body`,
`secondary`), **Semantic** (`star`, `ring`).

### 11.4 Standard accents

| Token | Hex | Role |
|---|---|---|
| `--color-sky` | `#30c3eb` | **Primary accent** — eyebrows, pill CTA, checkmarks |
| `--color-brand` | `#2a5aa2` | Structural blue — slabs, scrims |
| `--color-brand-deep` | `#154d9f` | Deeper blue — dark surfaces |
| `--color-ink-2` | `#091f41` | Dark accent — footer, top bar, CTA slabs |
| `--color-star` | `#e9bd4b` | Rating accent — stars only |

### 11.5 Segment accents — Residential and Commercial

**These do not exist in the repo today.** Both sub-pages currently use an identical accent set —
`residential.html` and `commercial.html` both carry 24 `text-sky`, 4 `scrim-hero`, 4 `scrim-blue`,
2 `bg-brand`. There is no per-segment accent token anywhere. **[M]**

This PRD therefore **assigns** two segment accents **from the existing palette** rather than inventing
new hues:

| Segment | Token | Hex | Rationale |
|---|---|---|---|
| **Residential** | `--color-accent-residential` | `#30c3eb` (`--color-sky`) | Residential pages already lead with the sky accent — 9 `bg-sky` against commercial's 3, plus the check-availability band and the pill CTA **[M]** |
| **Commercial** | `--color-accent-commercial` | `#154d9f` (`--color-brand-deep`) | Commercial pages already lean on the deeper blue surfaces — 3 `bg-sky` against residential's 9 **[M]** |

**Inventing no new colours is deliberate.** A mockup that silently introduces two brand hues would
look authoritative and be fiction. If genuinely distinct segment hues are wanted, that is a brand
decision — see §15, Q1.

Render each as a labelled swatch: segment name, token, hex, and the surface it is intended for.

---

## 12. The footer link

### 12.1 Requirement

**Exactly one new footer link**, on all three pages, opening `/admin`.

### 12.2 Placement

Add it to the footer **bottom bar**, as the last item in the right-hand cluster, after Privacy Policy.

Rationale: the bottom bar is the utility row (copyright, legal links). A prototype admin link belongs
there — low prominence, out of the way — not in the "Company" site-map column, which is navigation for
visitors. **[P]**

Current markup, `valvoro-prototype/index.html:1843-1852` **[M]**:

```html
<div class="shell">
  <div class="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] lg:flex-row lg:justify-between lg:text-left">
    <p>© <span id="year"></span> Call Indigo LLC — prototype reconstruction for demo purposes.</p>
    <div class="flex flex-col items-center gap-2.5 md:flex-row md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-2">
      <span class="text-white/60">Licensed, bonded, and insured.</span>
      <button type="button" class="legal-link" data-legal="terms">Terms of Service</button>
      <button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>
      <a href="/admin" class="transition-colors hover:text-sky">Admin</a>   <!-- NEW -->
    </div>
  </div>
</div>
```

### 12.3 Two implementation notes that matter

1. **Use the root-relative `/admin`, not `admin.html`.** The sub-pages' footer anchors had to be
   rewritten to `index.html#…` because a bare `#anchor` is dead off the home page. A root-relative
   path needs no rewriting and resolves identically from all three routes. In the React port the same
   link becomes `<Link to="/admin">`.
2. **Edit `index.html` once, then re-run `_audit/v2check/gen_pages.py`.** The generator slices the
   footer out of `index.html` (`block(src, "<!-- ======================= FOOTER", "</html>")`) and
   writes it byte-identically into `residential.html` and `commercial.html`. Editing a sub-page
   directly would be overwritten on the next regeneration. **[M]**

### 12.4 Verification

- Rendered DOM contains exactly one `/admin` anchor per page, on all three pages.
- Its computed colour differs from the two legal buttons' (it is a link, not a modal trigger).
- The footer's grid and bottom bar are otherwise byte-identical to today's.

---

## 13. Parity and verification

### 13.1 The parity gate

rc1's headline claim is "exact duplicate". It is proven by diffing renders, not by looking at them.

```
for route in ["/", "/residential", "/commercial"]:
  for viewport in [1920, 1440, 390]:
    static  = screenshot("valvoro-prototype/<page>", viewport)
    react   = screenshot("<dev server><route>",    viewport)
    assert diff(static, react) <= threshold
```

Reuse the existing harness — `_audit/v2check/shots.py` (viewport-aware screenshots), `diag.py`
(landmark boxes + real overflow), `mincontent.py` (min-content spill), `verify.py` (link, anchor,
image and active-nav assertions). Add `parity.py` for the pixel diff. **[M]**

### 13.2 Threshold

Zero pixel difference is not achievable across a CSS-pipeline change, so the gate is:

- **Layout:** every landmark box (`.pad-rl`, `.mbox`, `.slab`, `.shell`, header, footer) within
  **±1px** of the static build at every viewport. This is the metric that matters — it is what the
  gutter ladder and frame model encode.
- **Page height:** within **±0.5%**.
- **Pixels:** no more than **0.5%** of pixels differing by more than 8/255 per channel.
- **Hard zeros:** console errors, broken images, dead anchors, horizontal overflow — all must be
  exactly zero, per `verify.py`'s existing checks.

### 13.3 Why the pipeline change is the real risk

Today's pages are styled by the **Tailwind browser build**; rc1 compiles Tailwind with the Vite plugin.
The class *names* are identical but the emitted CSS can differ in order and in preflight, which can
move a box by a pixel or two without anyone touching the markup. This is the single most likely cause
of a parity failure and the reason §13.2 measures landmark boxes rather than trusting a screenshot
that "looks right". **[P]**

---

## 14. Acceptance criteria

rc1 is complete when every line is true and demonstrable.

**Parity**
- [ ] `/`, `/residential`, `/commercial` pass §13.2 at 1920 / 1440 / 390.
- [ ] Zero console errors, broken images, dead anchors, horizontal overflow on all 3 routes × 3 viewports.
- [ ] All 13 home sections present, in order, with ids intact.

**Stack**
- [ ] Tailwind CSS **v4** — no `tailwind.config.js`, no `postcss.config.js`, no `tailwindcss-animate`.
- [ ] React 19 + TypeScript, `@/*` alias resolving.
- [ ] Tokens live in exactly one file (§6.1); `css/tw.css`'s stale duplicate is gone.
- [ ] `npm run build` succeeds with no TypeScript errors.

**Footer link**
- [ ] Exactly one `/admin` anchor per page, on all 3 pages (§12.4).
- [ ] Clicking it from any of the 3 routes lands on `/admin/settings`.

**Dashboard**
- [ ] `/admin` has exactly the 3 routes in §5.2 — no catch-all.
- [ ] The sidebar renders two menu groups, labelled **Settings** and **Design** (§9.3).
- [ ] Mockup items are `aria-disabled` and do not navigate.
- [ ] Settings page renders all three tabs with the §10 seeded values.
- [ ] Design System page shows logo, icon, colours, standard accents, and both segment accents (§11).
- [ ] Saving shows a toast that says the change was not persisted.

**Policy**
- [ ] Every file in `src/components/ui/**` is registry-provenanced (§7.4.1).
- [ ] No `src/admin/**` file imports from `src/marketing/**`.
- [ ] Every custom component has a complete 5-field exception record (§7.5).
- [ ] Zero auth code in the build.

---

## 15. Risks and open questions

### 15.1 Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| **R1** | The workspace's own `modern-web-app` scaffold ships **Tailwind 3.4.19** + `tailwind.config.js` + `postcss.config.js` + `tailwindcss-animate`, contradicting the brief's Tailwind v4 requirement | Building on it produces a v3 project and forces an immediate migration | Do **not** use `init-webapp.sh` for this. Bootstrap per §4.2 (`npm create vite` + `@tailwindcss/vite` + `npx shadcn@latest init`). **Recommendation: update the skill's template to Tailwind v4 before it is used on this project.** |
| **R2** | Tailwind browser build → Vite CLI build changes CSS emit order and preflight | Silent 1–3px layout drift; a "looks fine" screenshot hides it | §13.2 measures landmark boxes at ±1px, not pixels alone |
| **R3** | Two button systems ship in rc1 (bespoke `.pill` vs registry `Button`) | Visual inconsistency between marketing and dashboard | Accepted for rc1; §16 assigns reconciliation. Documented so it is not a surprise |
| **R4** | Client-rendered SPA with fallback: every path returns the app shell | Marketing pages lose per-page server HTML; crawlers and link previews degrade | Accepted for rc1 (mockup). **Recommendation: add static pre-rendering in rc2**, before the site is public |
| **R5** | The Design System page is display-only, but reads as an editor | Reviewers expect it to save | §2.2 and §16 say so explicitly; the page carries a visible "mockup — read-only" note |
| **R6** | Porting 3 large hand-written pages (131KB / 93KB / 92KB of HTML) by hand invites transcription drift | Parity failures that look like design bugs | Port mechanically (the page is already sliced by `gen_pages.py`'s markers); diff against the static build at every step, not at the end |

### 15.2 Open questions

Each carries a recommendation, per this repo's convention.

**Q1 — Should Residential and Commercial get genuinely distinct accent hues?**
§11.5 assigns both from the existing palette (`#30c3eb` / `#154d9f`) and invents nothing, because the
repo has no segment-accent token and silently introducing two brand hues would be fiction.
*Recommendation: ship rc1 with the assigned palette values, then decide the brand question separately.
If distinct hues are wanted, they should be chosen deliberately and added as real tokens — not
improvised in a mockup page.*

**Q2 — Does "two-menu layout" mean two menu groups in one sidebar, or two sidebars?**
§9.2 implements two groups in one inset sidebar, matching registry block `sidebar-08`
("An inset sidebar with secondary navigation") and the brief's "a mockup Settings menu and a mockup
Design menu".
*Recommendation: keep `sidebar-08`. `sidebar-15` ("A left and right sidebar") is a three-pane
workspace shell and does not match the described menus.*

**Q3 — Footer link placement: bottom bar or Company column?**
§12.2 puts it in the bottom bar utility row.
*Recommendation: bottom bar. The Company column is visitor navigation; an admin link there would sit
beside "About Us" and "FAQ".*

**Q4 — Should `/admin` stay unlinked but reachable, or be `noindex`?**
rc1 has no auth, so the URL is the only access control.
*Recommendation: add `<meta name="robots" content="noindex">` on the admin routes and keep the footer
link, since a prototype nobody can find cannot be reviewed.*

**Q5 — Do the §3.4 defects get fixed in rc1 or later?**
The stale `css/tw.css` duplicate is resolved by §6.1 (it is deleted as part of the port). The
`theme-color` meta (`#1f1c4a`) and the `#area` city-list contradiction are not.
*Recommendation: fix `theme-color` in rc1 — it is a one-line correction with no layout risk. Leave the
city list alone; it needs a content decision, not a code change.*

---

## 16. rc1 mockup scope vs future work

### 16.1 In rc1 — mockup

| Area | rc1 behaviour |
|---|---|
| `/admin/settings` | Renders fields seeded from real published facts; edits live in `useState`; reload discards them; save shows a "not persisted" toast |
| `/admin/design` | Displays logo, icon, colours, accents, segment accents; read-only |
| Sidebar | Two menus; four of seven items are `aria-disabled` mockups |
| Data | Static fixtures in `src/admin/mock/`; no fetch, no API |
| Access | None. No auth, no guard, no roles |
| Marketing pages | Byte-for-byte duplicates of today's three pages, plus the one footer link |

### 16.2 Beyond rc1 — explicitly deferred

| # | Future work | Depends on |
|---|---|---|
| F1 | **Authentication** — login, session, route guard | Must land before any real data exists |
| F2 | **Real persistence** — API + database for settings | F1 |
| F3 | **Working design-token editor** — edit tokens, write back to CSS | F1, F2, and a token-source decision (§6.1) |
| F4 | **Content management** — edit the marketing pages' copy and images | F1, F2 |
| F5 | **Asset management** — upload/replace `assets/images/**` | F1, F2 |
| F6 | **Remaining sidebar pages** — Profile, Notifications, Security, Assets, Components | F1 |
| F7 | **Reconcile the two button systems** — one button across marketing and dashboard | §8.3 debt |
| F8 | **Static pre-rendering / SEO** for the marketing routes | R4 |
| F9 | **Audit log and roles** | F1, F2 |
| F10 | **Retire the static prototype** (`valvoro-prototype/`) once parity is signed off | rc1 acceptance |
| F11 | **Fix the `#area` city-list contradiction** | A content decision |
| F12 | **Update the `modern-web-app` skill template to Tailwind v4** | R1 |

---

## Appendix A — Evidence index

| Claim | Source |
|---|---|
| 3 pages, 13 home sections, section ids | `valvoro-prototype/index.html` |
| Design tokens | `valvoro-prototype/index.html:21-84` |
| Frame model, gutter ladder | `valvoro-prototype/index.html:86-124` |
| Footer markup and bottom bar | `valvoro-prototype/index.html:1776-1854` |
| Tailwind browser build | `valvoro-prototype/index.html:16-17` |
| `theme-color` `#1f1c4a` | `valvoro-prototype/index.html:10` |
| Stale `css/tw.css` mirror | `valvoro-prototype/css/tw.css:1-33` |
| Footer propagation to sub-pages | `_audit/v2check/gen_pages.py` |
| Verification harness | `_audit/v2check/{verify,diag,mincontent,shots}.py` |
| Site facts | `valvoro-prototype/GROUND_TRUTH-source-facts.txt` |
| Template structure | `valvoro-prototype/GROUND_TRUTH-structure.md` |
| Segment accents are identical today | accent-class scan of `residential.html` / `commercial.html` |
| No node project exists | workspace scan for `package.json` / lockfile |
| 64 registry primitives | <https://ui.shadcn.com/docs/components> |
| 16 sidebar blocks, block descriptions | <https://ui.shadcn.com/blocks/sidebar> |
| `sidebar-08` file list | `https://ui.shadcn.com/r/styles/new-york-v4/sidebar-08.json` |
| Tailwind v4 support, `@theme inline`, `tw-animate-css`, `sonner` | <https://ui.shadcn.com/docs/tailwind-v4> |
| Vite install path | <https://ui.shadcn.com/docs/installation/vite> |
| Scaffold ships Tailwind 3.4.19 | `modern-web-app/scripts/init-webapp.sh:44`, `scripts/template/package.json` |

## Appendix B — Glossary

| Term | Meaning |
|---|---|
| **Slab** | A section rendered as a large rounded card (`.mbox.slab`), the page's basic visual unit |
| **Frame model** | The three nested layout layers `.pad-rl` → `.mbox` → `.shell` |
| **Registry** | The shadcn/ui component registry; components are installed by CLI, not imported from a package |
| **Block** | A registry item containing a page plus several components (e.g. `sidebar-08`) |
| **Two-menu layout** | The shadcn sidebar shell with a primary and a secondary nav group (§9.2) |
| **Segment accent** | A colour assigned to Residential or Commercial (§11.5) |
| **Parity** | The rc1 requirement that the React build duplicates the static pages exactly (§13) |
