# Changelog

All changes to the Call Indigo website are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
with pre-release tags for release candidates.

---

## [Unreleased] — working dashboard, public inquiry page, copy pass, client punch list

### Client punch list v1.0.1 — pending, needs clarity (TBD)

| # | Request | Why it is still open |
|---|---|---|
| T2 | **"Each service icon has a stack issue with the color"** (home + residential) | The *symptom* is clear, the *remedy* is not. Measured: all six `services-icon*.png` are pure-white glyphs (`#ffffff`, alpha) inside a chip that is `bg-sky` (`#30c3eb`), a `3px` white ring, and `14px` padding — so the glyph renders at roughly 28px inside a 62px chip. Any of those three surfaces could be the "stack issue". Needs: is it the chip colour, the white ring, or the padding? |
| T3 | **"Get the Hero images relevant or make the textual impact larger"** (other) | Two alternatives offered, no choice made, and "relevant" needs a subject. The current hero image is `hero-arch.jpg` (a technician on a service call). Needs: replace the imagery, enlarge the type, or both — and if imagery, what should it show? |
| T4 | **"Then get the ToS and Privacy finished up"** (other), now restated as: *"update the terms of service and privacy policy to match the old version of the company's website at `indigoservices-tx.com`"* | The two documents still ship behind a visible "Sample language — have this reviewed before publishing" warning, and finishing them is an owner/lawyer decision, not a copy edit. **The old site cannot supply the text.** It has **no Terms page at all** — absent from its own 53-URL `page-sitemap.xml`, and `/terms/`, `/terms-of-service/` and `/terms-and-conditions/` each 404 — and its only legal page, `/privacy-policy/`, is the **unedited WordPress boilerplate**: it still carries literal `**Suggested text:**` prefixes and clauses about blog comments, Gravatars, a login page, password resets and registered user profiles, none of which this site has (it has no comments, no accounts, no login). Copying either verbatim would ship placeholder scaffolding to visitors and describe data practices that do not exist, while omitting the ones that do — the inquiry form collects name, phone, email, property type, service, urgency and message, behind a captcha and a honeypot. Needs: the client's actual approved text, or a decision to author one for this site. Tracked as a release blocker, not a code task. **Partially advanced 2026-09-20:** six statements in our own copy that were false about this build have been corrected in all four copies — see "Legal copy — audited against the build" below. What remains is the client's decision on marketing texts and analytics, plus counsel review. |
| T5 | **Does "drop management" also cover the descriptive uses?** (commercial) | The product names are renamed (see below). Two descriptive uses of the word remain on the commercial page: the hero chip **"National facility management"** and **"…without a full management commitment"** in the services box. Those describe a service category rather than the membership product, so they were left. Needs: keep or reword. |
| T6 | **The home membership eyebrow now repeats its heading** | The block reads `MEMBERSHIP` above `Indigo Home & Facility Membership`. The eyebrow was not in the instruction so it was left alone. Needs: drop the eyebrow, or keep it. |
| T7 | **The home membership block: which reading of "at the top level"?** | Implemented as *heading* = "Indigo Home & Facility Membership", *CTA* = "BECOME A MEMBER", body under — which matches the residential and commercial boxes. The alternative reading is *eyebrow* = the name and *h2* = "BECOME A MEMBER". Needs: confirm. |

### Client punch list v1.0.1 — completed

Confirmed requests, all verified by `npm test` (67 checks).

**Ribbon**

- Deleted the **"Residential & commercial services"** span — the nav directly below it
  already carries Residential and Commercial.
- The counties line is now **"Proudly serving: Hays, Travis, and Williamson
  counties"**. Anchored on the pin glyph, because the same phrase appears in the
  Terms and the Privacy policy as a factual statement and those are untouched.
- Mobile legibility: ribbon text **12px → 14px**, and the header phone number is
  now **shown on mobile at 15px** with a larger icon. It was hidden below `md`,
  which left a bare icon with no number — that is the illegibility reported.

**Home page**

- Dropped the **plumber-with-wrench visual** (the `banner-plumber-img` overlay and
  its `<figure>`).
- The **Emergency button now renders on mobile.** Rather than re-anchor an
  absolutely-positioned box over a hero column that has stacked, it drops into
  normal flow below the arch, centred at a fixed width.
- Stat: **`250+` "Projects Completed" → `52,550+` "Jobs Completed"**.
- **"Our Services" → "One Call, All Services"**, with the heading below it now
  **"Our Home & Facility Services"**.
- **Hero carousel** — the second word of "Expert …" cycles Plumbing → Electrical →
  HVAC → Home Services → Facility Services every 2.6s. The options differ in width
  by more than 3x, so a measured auto-fit scales the word's font-size down until
  the longest one fits the column; without it the line would wrap on the long
  options and the hero's height would change on every tick. Rotation is skipped
  under `prefers-reduced-motion`.
- **Membership block** now reads "Indigo Home & Facility Membership" → a
  **BECOME A MEMBER** call to action → the body text. See T6/T7.
- **Unpublished the Real Repairs section** (`#results`).
- **Unpublished Check Service Availability** (`#area`), including the ZIP form.
  The `useSiteChrome` binding and `service-area.ts` are kept and still unit-tested
  — the guard finds no form and does nothing — because the section is expected
  back. Its unit tests remain green.
- **"bonded" removed** from the About bullet, the FAQ answer and the footer.

**Residential page**

- **"Indigo Home Management" → "Indigo Home Membership"**, in the value-prop
  heading and the membership card.
- The membership card now reads name → **Become a Member** → body, with the CTA
  moved above the paragraph.
- Services heading updated to match the home page.

**Commercial page**

- **"Indigo Facility Management" → "Indigo Facility Membership"**; the card's
  eyebrow is now "Membership" so it no longer restates "management".
- The membership card reads name → **Become a Member** → body, CTA above the
  paragraph. (The CTA was "Learn More", which no longer appears on this page.)
- The services box now reads eyebrow **"National Commercial Labor"** over heading
  **"Indigo Facility Partners"**.
- The hero chip **"Licensed, bonded & insured in all 50 states"** lost "bonded".

**All pages**

- Footer brand column: **"Licensed, bonded and insured…" → "Licensed and
  insured…"**, injected through the `chrome.ts` seam for `/contact` and applied
  inline on the three mirror pages.
- Both legal documents: **"Indigo Home Management" → "Indigo Home Membership"**.

**Verification added**

Eight checks in a new `Punch list (v1.0.1)` suite, so these cannot silently
regress: no "bonded" anywhere, no "Indigo … Management" product name, the ribbon's
single "Proudly serving" line and bumped mobile size, the header phone not hidden
on mobile, both unpublished sections absent, the hero's rotation target / dropped
wrench / new stat / mobile Emergency button / new headings, the five rotation
options present in the hook, and the CTA-before-body order in each membership
block.

**Not verified — needs a real browser**

- The **hero carousel animation itself**. `IntersectionObserver` and timers do not
  run in the headless renderer, so what is proven is that the target element and
  the five options exist and the fit logic is wired. The rotation, the fade and the
  auto-fit need a look in a tab.
- **Mobile header width.** Showing the phone number at 15px alongside the brand and
  the burger is untested at 320–400px. If it overflows, the fix is to hide the
  number below ~380px only.
- **Layout parity (PRD §13.2)** — still not re-measured, and now further away: the
  hero lost an overlay, the stat numeral is wider, a CTA was added to the
  membership band, and two whole sections are gone. Page height changed by design.

### Brand lockup — the client's icon + wordmark (2026-09-20)

The client supplied the brand as HTML: a `20x20` lucide `phone` glyph inside a `p-2`
`rounded-full` disc, beside a `tracking-[-0.06em]` "Call Indigo" wordmark. It replaces the v1
`call-indigo-mark*.svg` imagery everywhere the brand appears.

- **Twelve lockups across four pages** — header, drawer and footer on `/`, `/residential`,
  `/commercial` and `/contact`. The chrome is *not* shared: `/contact` is built by `chrome.ts`
  from `chrome-markup.ts`, while the three mirror pages each carry their own inline copy. All
  four files were edited, and `scripts/_brand.py` asserted one match per position *per file*
  rather than trusting a repo-wide count — the first draft of that script expected 4 matches per
  pattern per file and reported 12 false failures while the replacement itself was correct.
- **The dark surfaces invert.** The drawer sits on `bg-ink` and the footer on `bg-ink-2`, where
  a `#1e1b4b` disc would be invisible. Those two use a white disc with a `#1e1b4b` glyph and a
  white wordmark; only the header keeps the client's navy-on-light form.
- **The favicon was the last stale surface.** The SVG favicon, `favicon-16.png`,
  `favicon-32.png` and `apple-touch-icon.png` all still carried the v1 indigo — measured
  `#201d4c` at the centre of `favicon-32.png`, against the client's `#1e1b4b`. All four were
  rebuilt from a new `call-indigo-icon.svg` that reproduces the snippet's `20/36` glyph ratio on
  a 96-unit grid. `apple-touch-icon.png` is flattened onto the brand navy, because iOS masks the
  square itself and a transparent corner renders black on some devices.
- **The dashboard followed.** The sidebar's `CI` monogram and the Design System page's Logo card
  both now render the icon lockup, and that card's documented wordmark spec was corrected from
  `tracking-[-.02em]` to `tracking-[-0.06em]`. Kept as inline markup rather than a component:
  PRD §7.1 requires anything rendered under `/admin` to come from the registry, and §7.5 needs a
  sign-off this change has no authority to give.
- **Not a token.** `#1e1b4b` is not in the §3.2 token table, and neither was the `#081f3f` it
  replaces — the lockup has always carried a hex the token set does not name. Recorded in
  PRD §11.1 rather than silently added to the palette.

**Verification added.** Eight checks in a new `Brand lockup` suite: no page still loads the
superseded mark; exactly three branded discs per page, each holding the glyph; the header disc
navy and the drawer/footer discs inverted; all three wordmark spans on the client's tracking
value; the favicon pointing at the new icon; the icon SVG carrying `#1e1b4b` and no v1 indigo
stop; the three raster icons present with the expected PNG colour type; and no `CI` monogram
left in the dashboard. Suite total: 54 → 62 checks.

**Left alone.** Six superseded assets still ship in `public/assets/images/` —
`call-indigo-mark.svg`, `call-indigo-mark-dark.svg`, `call-indigo-logo.svg`, `call-indigo-512.png`,
`indigo-mark.png`, `indigo-mark.ico`. None is referenced by any source file, but `public/` is
copied verbatim into `dist/`, so they are dead v1 brand weight in the deployed bundle. They were
not deleted: `call-indigo-mark.svg` is named in PRD §11.1's history, and removing published brand
assets is the client's call, not a side effect of a rebrand.

This closes **T1 — "Logo and icon need to be reworked"**.

### Legal copy — audited against the build (2026-09-20)

The client asked to bring the Terms and Privacy into line with `indigoservices-tx.com`. That site
cannot supply the text (see **T4**), so the work that *was* available is the same defect class in our
own copy: statements that are demonstrably false about this build. Each was checked against the code.

| Policy claim | What the build actually does | Verdict |
|---|---|---|
| "You give us: … **service address** …" | The inquiry form collects name, phone, email, property type, service, urgency and message. `Inquiry` (`src/lib/data/types.ts`) has no address field, and no input is named for one. | **false** |
| "We collect automatically: IP address, browser and device type, the pages you view, and how you arrived" | No analytics, advertising or tracking script exists anywhere in `src/` or `index.html`. | **false** |
| "This site uses cookies … to understand which pages are useful" | The public site sets **no cookie at all**. The only cookie in the codebase is shadcn's `sidebar_state`, written by `src/components/ui/sidebar.tsx` on `/admin`. | **false** |
| "you agree that we may contact you … including by text message … reply STOP" | The form carries no SMS or marketing consent; its own text beside the button reads "We use your details only to answer this request." The policy **contradicted the form**, and asserting blanket marketing consent the form never obtained is a TCPA exposure. | **contradiction** |
| "software providers who host our **scheduling, payment**, and email tools" | No scheduling or payment integration exists in rc1. | **unsupported** |
| "Improve our **site**, services, and crew routing" | Nothing measures the site. | **unsupported** |

Six corrections, applied to all four copies of the legal text — `chrome-markup.ts`, plus an inline
copy on each mirror page — by `scripts/_legal.py`, which asserts one match per correction per file.

**Kept deliberately:** the "Sample language — not legal advice" warning. These are correctness fixes,
not a legal review, and removing the warning would make unreviewed text look reviewed.

**Also checked and left alone:** the captcha is a **local arithmetic challenge**
(`src/marketing/Captcha.tsx`, zero external calls), so there is no third-party widget to disclose.

**Verification added.** Five checks in a new `Legal copy matches the build` suite. Four couple the
document to the implementation in *both* directions — add an analytics script and it fails, delete
the sentence saying there is none and it fails too; add an address field to the form and it fails.
Negative-controlled: injecting `googletagmanager` into `index.html` fails the tracking check with a
precise message. Suite total: 62 → 67 checks.

**Still open (T4).** The documents remain unreviewed by counsel, and the client's approved text is
still the blocker. Two decisions belong to the client, not to this change: whether they in fact send
marketing texts — if so the form must collect consent before the policy may say so — and whether
they want analytics, which the policy must then declare.

### Overview

The rc1 dashboard was a mockup. This build makes it function: every `/admin` item
is a real page backed by a persisted data layer, and there is a new public
`/contact` page carrying the inquiry form that feeds it. Deliberately exceeds PRD
§5.2's three-entry limit — reconciled in `docs/dashboard-scope.md`.

A second pass then finished the marketing pages: the dead affordances were made to
work, the one interactive control that lied to visitors was fixed, and the
duplicated copy was cut. **That pass changes the copy on the three
prototype-mirror pages, which PRD §5.1 requires to remain textually identical.**
See *Departed from the PRD* at the end of this section for the decision record and
what it costs.

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
- **Verification suite** (`tests/`) — 44 checks over seven suites, run by
  `npm test`. Renders each public route with `react-dom/server` and asserts on the
  output, so it can run in CI and cannot be skipped for being inconvenient. Covers
  the PRD §7 registry and import rules, the §5 routing contract, the §4/§14 stack
  wiring, the ZIP decision, and the markup itself — duplicate ids, broken ARIA
  targets, missing images, dead anchors, unstyled classes. Uses the `esbuild`
  already inside `vite`; no new dependency. See `tests/README.md`.
- **`src/marketing/service-area.ts`** — the ZIP decision as a pure function, so
  the one piece of interactive behaviour on the home page is testable without a
  browser.

### Changed

- **Admin navigation** — `src/admin/routes.ts` is now the single source of truth for
  the sidebar, the breadcrumb and each page's title.
- **Unknown `/admin/*` paths** redirect to the inbox instead of rendering a shell.
  §5.2's "no catch-all" rule is preserved as a routing property.
- **Broken links fixed** — residential and commercial linked to `index.html#…`,
  a file that does not exist in an SPA (7 links on each page).
- **Marketing copy de-duplicated** — the prototype's copy was written per section,
  so it restated the same facts in adjacent bands. Removed: the "peace of mind"
  sentence that appeared twice in the membership card, the "500+ crews / 250+
  locations" line that repeated the data ribbon directly above it, the county list
  that followed a city list in the same paragraph, and four benefit bullets that
  opened by restating their own section intro. "Hays, Travis, and Williamson
  counties" appeared 25 times across `src/`; it now appears once per page that
  legitimately states it.
- **Service-area city list reconciled** — `#area` named Austin / Round Rock /
  Cedar Park / Pflugerville / Georgetown while the footer named Austin / Buda /
  Kyle / San Marcos. Both were plausible (Williamson vs Hays County) and they
  contradicted. Resolved to **Austin, Buda, Kyle, and San Marcos**, which is the
  ground-truth `serviceAreaCities` list and the version the footer already used.
  This closes PRD §16.2 **F11**.
- **Footer copyright no longer announces the build** — `© Call Indigo LLC —
  prototype reconstruction for demo purposes.` became `© Call Indigo LLC. All
  rights reserved.` on all four surfaces. Leftover scaffolding language from the
  port, shipped to visitors.
- **Footer bottom bar no longer repeats the brand column** — the
  `Licensed, bonded, and insured.` span sat directly under a column that already
  said it.
- **Four vestigial classes removed** — `eyebrow-brand` (×12), `banner-col`,
  `stat-k` and `inner-wrap` appeared in the markup but in no stylesheet: not
  `src/index.css`, not the compiled output, and not the prototype. They were
  no-ops by CSS default, so removing them cannot shift layout.

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
- **The ZIP check told every visitor we cover them** — the prototype revealed the
  result once three characters were typed, and the markup shipped a hardcoded
  success message reading *"✓ Great news — we cover your area with same-day
  service!"*. So `00000` was accepted, and the page promised same-day service,
  which is not a published fact about this business. It now validates a real
  5-digit ZIP (or ZIP+4) against the blocks the three served counties sit in —
  `786xx` and `787xx` — with three distinct outcomes, a live-clearing verdict, and
  `role="status"` + `aria-describedby` so the answer is announced. A ZIP outside
  the blocks gets an invitation to call rather than a refusal, because the ranges
  are a proxy for the county list, not the list itself.
- **12 inert `Learn more →` spans** — each rendered as a call to action and did
  nothing when clicked. Now anchors to `/contact`.
- **11 dead footer anchors on `/contact`** — the shared footer links `#services`,
  `#about`, `#process`, `#faq` and `#estimate`, none of which exist on the inquiry
  page. Rewritten to `/#…` so they navigate home and land on the section.
- **`Call Call Indigo`** — the commercial page's `<h2>` shipped the doubled word.
  It came from the prototype's `Call {brandName}` interpolation, where the brand
  string already began with "Call".

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
- **Layout parity has not been re-run since the copy changed** (PRD §13.2). The
  headless suite covers broken images, dead anchors and unstyled classes; the
  ±1px landmark and ≤0.5% pixel thresholds need a real browser at 1920 / 1440 /
  390 and were last measured against the pre-cleanup copy. Two things can move:
  the absolutely-positioned hero `.navy-box`, `.years-experience-con` badge and
  `.plumber-img` overlay, which sit against flow height the shortened sentences
  changed; and `/contact`, which shares the footer whose copy was edited. This
  blocks **F10** (retire `valvoro-prototype/`), which is gated on parity sign-off.

### Departed from the PRD

PRD §5.1 requires the three public routes to be **exact textual duplicates** of
`valvoro-prototype/*.html`, with §13 parity as the acceptance test. This pass
removed duplicated copy from those pages, so the two cannot both hold. The
decision and its scope:

| | |
|---|---|
| **What changed** | Copy on `/`, `/residential` and `/commercial` — sentences cut, four facts reconciled, scaffolding language removed |
| **What did not** | Routes, structure, section `id`s, class names, the `BODY_HTML` rendering model, the shared-chrome injection seams, and the element count. No `<img>` was added or removed |
| **Why** | The request was to remove duplicated and unnecessary copy. That is a later instruction than §5.1, and §5.1's own purpose — that the port be provably faithful — is served by the behavioural checks, which are now automated where they previously were not |
| **Cost** | §13's pixel thresholds can no longer be the acceptance test *for copy*. They still apply to layout, and must be re-measured (see the limitation above) |
| **Recorded in** | `tests/README.md` (the assertions that replaced the copy-parity check) and PRD §15 Q5, which previously recommended leaving the city list alone |

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
