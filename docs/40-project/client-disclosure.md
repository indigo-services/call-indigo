# Client disclosure — the Call Indigo website, unabridged

**Kind:** dated · **Owner:** the repo · **Prepared for:** the client · **Last verified:** 2026-09-27 at `322d842`

**Everything this project has built, everything it changed, everything it got wrong, and
everything that is still open — in one document, with the source of each claim named.**

---

## 0. How to read this document

### 0.1 What this is, and what it is not

This is a **disclosure**, not a brochure. It is written so that a reader who has never
opened the repository can see the whole position: what shipped, what it does with a
visitor's data, what is licensed from whom, what is still owed, and which decisions are
yours rather than ours.

It is deliberately **unabridged**. Where a fact is uncomfortable — a template that is
still redistributed in a public repository, a contact form that tells you nothing, a
sign-in that is not access control — it is stated plainly rather than buried. A
disclosure that only lists the good news is a liability, not a document.

**It is not the source of record for anything.** Every section names the internal
document that holds the fact. If this document and the repository disagree, **the
repository wins and this document is the bug** — that is this project's founding rule
([`../00-meta/conventions.md` §1](../00-meta/conventions.md#1-every-claim-is-checkable)).

### 0.2 The rule that governs every claim here

Two markers are used throughout, inherited from
[`../20-development/standards.md` §1](../20-development/standards.md#1-evidence-based-development):

- **[M] — measured.** Read out of the repository or the live site, and the command or
  path that produced it is named.
- **[P] — proposed.** Does not exist yet. Always carries the open question, and the
  question carries a recommendation.

**A number here is never bare.** Every figure either names the command that produces it
or names the document that measured it. This is not style: two documents in this
repository once stated a check count that had been wrong for 60 checks' worth of
releases, because the number had no producer attached and nothing failed when it drifted
([`../00-meta/conventions.md` §3](../00-meta/conventions.md#3-a-number-carries-its-producer)).

### 0.3 Sources of record

This document synthesises the three registers named in its brief — the changelog, the
work-product register, and the artifacts — plus every document bearing on a disclosure.
**Nothing below is the source; each row is where the fact actually lives.**

| Section | Source of record |
|---|---|
| §1 What was built | [`../../CHANGELOG.md`](../../CHANGELOG.md) · [`../../README.md`](../../README.md) · [`../60-reference/routes.md`](../60-reference/routes.md) |
| §2 The work product | [`./artifacts.md`](./artifacts.md) |
| §3 Visitor data | [`../30-operations/observability.md`](../30-operations/observability.md) · [`../../CHANGELOG.md`](../../CHANGELOG.md) §"Legal copy — audited against the build" |
| §4 The `/admin` gate | [`../60-reference/admin-gate.md`](../60-reference/admin-gate.md) · [`../30-operations/security.md`](../30-operations/security.md) |
| §5 Third-party rights | [`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md) · [`../../THIRD-PARTY-NOTICES.md`](../../THIRD-PARTY-NOTICES.md) · [`../../LICENSE`](../../LICENSE) |
| §6 Limitations | [`../20-development/testing.md`](../20-development/testing.md) · [`../60-reference/parity.md`](../60-reference/parity.md) · [`../../PRD.md`](../../PRD.md) §15 |
| §7 Open decisions | [`./tasks.md`](./tasks.md) · [`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md) §5–§6 |
| §8 Deferred product work | [`../../PRD.md`](../../PRD.md) §16.2 · [`./roadmap.md`](./roadmap.md) §2 |
| §9 Deferred engineering | [`./tasks.md`](./tasks.md) §3 |
| §10 How it ships | [`../30-operations/deployment.md`](../30-operations/deployment.md) |
| §11 The summary | this document |

**On the "keep one copy" rule.** [`../00-meta/conventions.md` §4](../00-meta/conventions.md#4-keep-one-copy)
says a fact stated twice should be stated once and linked. This document is a deliberate
exception, and the exception is bounded: it quotes figures because **a client will not
read the internal library**, and every quote names the document that owns it. The
repository's copies remain authoritative; this one is a rendering. The public
attribution register ([`../../THIRD-PARTY-NOTICES.md`](../../THIRD-PARTY-NOTICES.md)) has
exactly the same relationship to the rights register behind it.

---

## 1. What was built, and what it replaced

### 1.1 The three releases

| Version | Date | What it was |
|---|---|---|
| **v1.0** | 2026-09-17 | Three hand-written static HTML pages (`index.html`, `residential.html`, `commercial.html`), styled with a Tailwind browser-build CDN script and an inline `@theme` block duplicated in each page. Superseded; preserved under `archive/v1-prototype/` |
| **v2.0.rc1** | 2026-09-18 | The transition to React 19 + Vite + Tailwind CSS v4 + shadcn/ui, with a **mocked-up** `/admin` dashboard. A release candidate for review, not a production release |
| **Unreleased** | 2026-09-18 → | The dashboard was made to *function* — every `/admin` item is now a real page backed by a persisted data layer — plus a public `/contact` page, a copy pass, a sign-in gate, a rebrand, two rounds of client feedback, and a documentation milestone |

`v2.0.rc1` is still the version in `package.json`. The Unreleased work is substantial and
is recorded, entry by entry, in [`../../CHANGELOG.md`](../../CHANGELOG.md).

### 1.2 The product as it stands

**Call Indigo** — home and facility services for Austin, TX: plumbing, electrical, HVAC,
carpentry, remodeling. Family owned, locally operated since 2012, serving **Hays, Travis
and Williamson counties**. (512) 608-4999 · support@call-indigo.com · 1005 Meredith
Drive, Austin, TX 78748 · **RMP 45574**.

The stack, and why each piece is there:

| Layer | Technology | Note |
|---|---|---|
| Build | Vite 7 | Optimised production builds |
| UI | React 19 + TypeScript 5.9 | A single-page application with client-side routing |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` | **No `tailwind.config.js`, no PostCSS plugin** |
| Dashboard components | shadcn/ui (`new-york` style) | Registry-only under `/admin` (PRD §7) |
| Marketing components | Bespoke | Ported from the static prototype (PRD §8) |
| Routing | React Router 7 | SPA with a client-side fallback |
| Icons | lucide-react | Matches the shadcn `iconLibrary` |
| Dashboard data | `localStorage` behind an async API seam | **Demo only** — see §3.5 |
| Dashboard access | A client-side sign-in gate | **Not access control** — see §4 |
| Node | `^20.19.0 \|\| >=22.12.0` | `package.json` `engines`, pinned in `.nvmrc` |

### 1.3 Every page the build serves

**Public** (PRD §5.1):

| Route | What it is |
|---|---|
| `/` | Home page — 13 sections |
| `/residential` | Residential services sub-page |
| `/commercial` | Commercial services sub-page |
| `/contact` | The inquiry form — writes a real record the dashboard inbox reads |

**Dashboard — all behind the sign-in gate:**

| Route | What it is |
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

An unknown `/admin/*` path **redirects to the inbox** rather than rendering a shell, and
the suite asserts that it is a redirect and not a page. The generated table, with each
page's file and line count, is [`../60-reference/routes.md`](../60-reference/routes.md)
(regenerate with `node scripts/_routes_doc.cjs`).

### 1.4 The state of the build, and what proves it

Every number below names the command that produced it. Measured **2026-09-27 at
`4e9d3fa`**, vite v7.3.6 [M: `../../README.md`, "Verified clean on this commit"].

| Gate | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` | **0 errors** |
| Lint | `npm run lint` | **0 errors, 4 warnings** — `react-refresh/only-export-components` in registry files, pre-existing |
| Build | `npm run build` | **1755 modules** — 810.81 kB JS (239.08 kB gzip) / 126.55 kB CSS (22.40 kB gzip) / 1.46 kB HTML |
| Verification | `npm run test:only` | **142 checks passed** |

Two things about that table are worth saying out loud, because they are the honest part:

1. **One row is machine-checked and three are a snapshot.** The check count cannot drift —
   `tests/run.mjs` compares it against the run that just happened and fails when the two
   disagree. **The build figures are a snapshot**: editing any file under `src/` moves the
   JS byte count, and nothing asserts them yet (task **E10**, §9).
2. **The lint ceiling is pinned at the measured 4 warnings.** It is a floor to tighten,
   never a budget to spend. A gate raised to make a build pass is worse than no gate,
   because the documentation still claims enforcement.

The 65 component classes the prototype relied on (`.pill`, `.hero-h1`, the `.banner-*`
hero geometry, `.statistics-*`, `.eyebrow`, the `.pad-*` spacing rhythm, `.slab-photo`,
`.card`, the `.legal-*` modal system) were absent from `src/index.css` entirely, so the
React pages initially rendered mostly unstyled. They were ported verbatim.
`src/index.css` is now **1286 lines** and is the single source of design tokens
[M: [`../20-development/design-tokens.md`](../20-development/design-tokens.md)].

### 1.5 The verification suite

**142 checks across seven suites**, run by `npm test` (build + suite) or
`npm run test:only` (suite against the build already on disk) [M: `npm run test:only`].

The suite renders each public route with `react-dom/server` and asserts on the **output**,
so it can run in CI and cannot be skipped for being inconvenient. It uses the `esbuild`
already inside `vite` — no new dependency. It covers the PRD §7 registry and import rules,
the §5 routing contract, the §4/§14 stack wiring, and the markup itself: duplicate ids,
broken ARIA targets, missing images, dead anchors, unstyled classes.

**Its limits matter more than its count**, and they are stated in §6.3.

---

## 2. The work product — every artifact, and what may be done with it

Two questions cause real damage, and this section answers both: **is this file tracked or
is it output?**, and **may I delete it?** Source of record:
[`./artifacts.md`](./artifacts.md).

### 2.1 The classes

| Class | Tracked? | Regenerable? | May be deleted? |
|---|---|---|---|
| **Source** — `src/**`, `index.html`, config | Yes | No | **Never** |
| **Documentation** — `docs/**`, root `*.md` | Yes | No | Only by a deliberate decision |
| **Assets** — `public/assets/images/**`, `images/` | `public/` yes, `images/` no | No | **Never** — see §2.2 |
| **Generated, tracked** — `src/marketing/chrome-markup.ts` | Yes | Yes | **Never by hand** — regenerate |
| **Generated, ignored** — `dist/`, `.preview/`, `tests/.tmp/`, `*.tsbuildinfo` | No | Yes | Yes, freely |
| **Session state** — `.workbuddy-ai/`, `overview.md` | No | No | `overview.md` yes; **`.workbuddy-ai/` no** |
| **Archive** — `archive/**` | Code and text yes, **binaries no** | No | Only by a deliberate decision |

### 2.2 Assets — the part that bites

**`public/assets/images/` — 95 files, tracked.** These are the images the site serves
[M: `ls public/assets/images/ | wc -l`]. Three rules apply, and each exists because
something went wrong:

- **Never delete one without checking whether a route renders it.**
- **Never overwrite a photo another route renders.** Several images are shared across
  home, residential and commercial; swapping one to fix one page changes three.
- **Some image slots are natural-size** — the file's own pixels *are* its rendered box.
  Read the slot's classes before swapping a file, or the page moves.

**`images/` — 47 files, gitignored.** The raw media supplied by the client (~19 MB). Only
the crops and resizes derived from it ship, and those live in
`public/assets/images/`. **The leading slash in `.gitignore`'s `/images/` is
load-bearing**: a bare `images/` pattern matches a directory of that name at *any* depth —
including `public/assets/images/` — and would silently untrack every shipped image.

**`archive/**` — code and text tracked, binaries ignored.** `.gitignore` excludes image
and video types under `archive/` to keep the repository light. **Consequence:** the
archived copy of the prototype at `archive/v1-prototype/valvoro-prototype/` is **not
self-contained** — its images are ignored. Compare against the root `valvoro-prototype/`
instead ([`../60-reference/parity.md`](../60-reference/parity.md)).

### 2.3 Generated and ignored — delete freely

| Path | Produced by | Why it is safe |
|---|---|---|
| `dist/` | `npm run build` | Every build recreates it |
| `.preview/` | the probe and sheet scripts under `scripts/` | Rendered verification sheets — generated, never hand-edited |
| `tests/.tmp/` | `tests/harness.mjs` | Transpiled copies of `src/**/*.ts`, written before import |
| `*.tsbuildinfo` | `tsc -b` | Incremental build cache |
| `node_modules/` | `npm install` | Recreated from the lockfile |

> ⚠️ **Deleting `dist/` breaks `npm run test:only`** — it does not rebuild, so the suite
> will fail or, worse, read a stale tree. If you need to move it aside, **move it rather
> than delete it**: `vite build`'s own cleanup of `dist/` can trip a bulk-delete guard.

### 2.4 Generated, but tracked — the one file to be careful with

| File | Generated by | Rule |
|---|---|---|
| `src/marketing/chrome-markup.ts` | `scripts/_brand.py`, `scripts/_legal.py` | **Never hand-edit.** A needle in the generator that stops matching **fails silently** — the script reports success and writes the un-substituted markup. Edit the generator, run it, then verify the **generated** file |

The generated documents are a second case, and they are handled differently:
[`../60-reference/routes.md`](../60-reference/routes.md) and
[`../00-meta/doc-map.md`](../00-meta/doc-map.md) are generated **and** are documents, so
they live in the library and carry a `derived` front-matter line so nobody hand-edits
them. Each has a `--check` mode that exits non-zero when it is stale, and each was
**negative-controlled** — perturbing a row makes the check fail, restoring it makes the
check pass.

### 2.5 Session state, and where new generated things go

| Path | What | Rule |
|---|---|---|
| `.workbuddy-ai/` | Project data and memory | **Not a cache. Do not delete** |
| `overview.md` | A session artifact at the repository root | Gitignored, regenerated each session, **stale the moment it is written**. The durable records are [`../../CHANGELOG.md`](../../CHANGELOG.md) and the devlog under [`../50-sessions/devlog/`](../50-sessions/devlog/) |

**Put new generated output in `.preview/`.** It is already gitignored, and it keeps
generated output out of `docs/` — which matters, because every document under `docs/` must
appear in the index exactly once, and a generated sheet is not a document.

---

## 3. What the site does with visitor data

**The short version: the public site collects one thing, sets nothing, tracks nobody —
and the submission does not reach you.** That last clause is the most important sentence
in this document, and §3.3 is why.

### 3.1 What the inquiry form collects

The `/contact` form collects exactly seven fields, plus a question and a challenge:

| Field | Required |
|---|---|
| **"Already a member?"** — a Yes/No radio group, first, before Name | Yes |
| Name | Yes |
| Phone | Yes |
| Email | Yes |
| Property type | Yes |
| Service | Yes |
| Urgency | Yes |
| Message | Yes |

Plus a **captcha** (§3.4) and a **honeypot**. Every field is marked with the native
`required` attribute as well as custom validation, so assistive technology can announce
it — `noValidate` keeps the custom messages in charge while the attribute is what a
screen reader reads.

**No default is pre-selected** on the membership question: a pre-filled answer to a
question the visitor may never read is fabricated data.

### 3.2 What it does not collect

Verified against the build, not assumed
[M: [`../30-operations/security.md`](../30-operations/security.md) §1, and the audit table
in [`../../CHANGELOG.md`](../../CHANGELOG.md)]:

| | State |
|---|---|
| **Postal / service address** | **Not collected.** `Inquiry` has no address field, and no input is named for one |
| **Cookies** | **None set by the public site.** The only cookie in the codebase is shadcn's `sidebar_state`, written on `/admin` |
| **Analytics / advertising / tracking** | **None.** No such script exists anywhere in `src/` or `index.html` |
| **Third-party scripts at runtime** | **None.** No `<script src="https://…">` anywhere in the tree |
| **Secrets or environment variables** | **None required.** No `.env` is read, no `VITE_*` variable exists |
| **Fonts** | **None bundled.** No `.woff`, `.woff2`, `.ttf`, `.otf` or `.eot` anywhere |

**Why there is no analytics: it is a requirement, not an oversight.** Your own
requirements rule out cookies and third-party trackers, and `CONTRIBUTING.md` names the
rule in *"What we will not merge"* — *"Anything that adds a cookie, analytics, or a
third-party captcha."* A future change that adds analytics therefore **reverses a recorded
decision**, and would have to be agreed rather than made quietly. See §7.3.

### 3.3 ⚠️ The submission goes to the submitter's own browser

> **`/contact` writes the inquiry to the submitter's `localStorage`. The business never
> receives it.**

This is the single most consequential limitation in the project, and it is a direct
consequence of there being no backend.

| | |
|---|---|
| **What happens** | The form validates, shows its success state, and writes a real inquiry record — to the **visitor's** browser |
| **What you see** | Nothing. There is no inbox, no email, no notification |
| **What this means for a demo** | **"The form works" means the form works *in that browser*.** A demo where you fill in the contact form on your own laptop and then check your inbox will find nothing. **Say this out loud before a demo** — it is the most likely thing to be mistaken for a bug in a room full of people |
| **Why it is this way** | There is no server. Building one is PRD §16.2 **F2**, and it is the roadmap (§8.1) |
| **What was built for it** | The `api.ts` seam is `async` on purpose even though the local backend is synchronous, so swapping in a real `fetch` is a change to **one file** |

**The dashboard's data has the same shape.** It lives in `localStorage` under the
versioned namespace `call-indigo:v1:*`, is **per-browser**, is not shared between users or
devices, and is cleared with site data. **`localStorage` is not a database.** It
demonstrates the workflow; it is not a shipped backend
([`../60-reference/data-layer.md`](../60-reference/data-layer.md)).

### 3.4 The captcha

The captcha is a **local arithmetic challenge** (`src/marketing/Captcha.tsx`) with **zero
external calls** — there is no third-party widget, no reCAPTCHA, no hCaptcha, and
therefore nothing to disclose and no visitor data leaving the page.

**It is not a bot defence, and it is not claimed to be.** It stops no determined bot. The
reason that is acceptable is §3.3: the form writes to the visitor's own browser, so there
is nothing to spam. If a real backend lands (F2), **the captcha becomes a real gap** and
would need revisiting.

### 3.5 The six statements we corrected in our own copy

In 2026-09-20 the Terms and Privacy text was audited against the build. Six statements in
our own copy were demonstrably false about this site. Each was checked against the code,
and all six were corrected in **all four copies** of the legal text by
`scripts/_legal.py`, which asserts one match per correction per file.

| Policy claim | What the build actually does | Verdict |
|---|---|---|
| *"You give us: … service address …"* | No address field exists | **false** |
| *"We collect automatically: IP address, browser and device type, the pages you view, and how you arrived"* | No analytics or tracking script exists | **false** |
| *"This site uses cookies … to understand which pages are useful"* | The public site sets **no cookie at all** | **false** |
| *"you agree that we may contact you … including by text message … reply STOP"* | The form carries no SMS or marketing consent, and its own text reads *"We use your details only to answer this request."* The policy **contradicted the form**, and asserting blanket marketing consent the form never obtained is a TCPA exposure | **contradiction** |
| *"software providers who host our scheduling, payment, and email tools"* | No scheduling or payment integration exists | **unsupported** |
| *"Improve our site, services, and crew routing"* | Nothing measures the site | **unsupported** |

**Five checks now couple the legal text to the implementation in both directions** — add
an analytics script and the suite fails; delete the sentence saying there is none and the
suite fails too. Negative-controlled: injecting `googletagmanager` into `index.html` fails
the tracking check with a precise message.

> ⚠️ **The documents themselves are still unreviewed by counsel**, and the client's
> approved text is still the blocker. This is **T4** — see §7.1.

---

## 4. The `/admin` sign-in gate — what it is, and what it is not

Source of record: [`../60-reference/admin-gate.md`](../60-reference/admin-gate.md). Added
2026-09-26 in `e622315`, at your request, with the instruction to implement it **securely**
rather than as a literal string comparison.

### 4.1 What it is

| | |
|---|---|
| **The credential** | The password is a salted **PBKDF2-HMAC-SHA-256 digest at 210,000 iterations**; the username is a salted **SHA-256**. Both halves are derived and compared on **every** attempt, so a wrong username is not measurably faster than a wrong password, and a failure does not say which field was wrong |
| **In the bundle** | **Neither credential is present** — checked directly (`username in bundle: 0`, `password in bundle: 0`) and by a repository-wide grep. For that reason the credentials are **deliberately not reproduced** in any document: writing them down would falsify the property the tests assert |
| **The session** | `sessionStorage`, **12-hour** expiry, dies with the tab, under a key deliberately **outside** the `call-indigo:v1:` namespace so "Reset demo data" cannot sign the operator out |
| **Where it sits** | `RequireAuth` wraps the **layout**, so a stranger never sees the sidebar. It renders `LoginPage` in place of its children. **There is no `/admin/login` route and no redirect**, so there is nothing to loop through |
| **Sign out** | In the sidebar footer |

### 4.2 What it is not — said plainly

> **The gate is not access control, and nothing in the repository may imply that it is.**

There is **no server**, so there is nowhere for a secret to hide from the browser.
**Anyone who can open devtools can set the session flag by hand.** The digests are in the
bundle and are offline-crackable — that is exactly why this is a demo curtain and not a
boundary.

**What it buys:** the dashboard is off the public internet while you are showing it
around. That was the actual requirement.

**Four in-app surfaces state this on screen**, and `tests/auth.mjs` fails if any of them
reverts. A **server-issued session is PRD §16.2 F1** and lands before this dashboard is
pointed at anything real.

### 4.3 What was verified, and how

**The suite structurally cannot test this** — a sign-in is a store subscription plus an
async key-derivation function, and `renderToStaticMarkup` runs no effects and has no
layout. So it was measured in a **real browser** by `scripts/_probe_admin_gate.cjs`:

| Check | Result |
|---|---|
| Wrong credentials rejected | **173 ms**, dashboard still closed |
| Right credentials open it | **250 ms** |
| A reload keeps the session | yes |
| **A new tab does not** | yes |
| Sign out ends it | yes |
| **Measured** | **8/8** |

The credential-dependent steps report **SKIPPED**, never "passed", when `ADMIN_USER` /
`ADMIN_PASS` are unset — so the probe cannot report a green run it did not perform.

**Four stale claims were caught while building this**, three of them documents asserting
the *opposite* of the shipped behaviour. One is worth naming because it is the pattern
this project keeps finding: `tests/policy.mjs` had **required the absence** of
authentication, rejecting `useAuth`, `signIn` and `sessionStorage` by regex. It was
inverted to pin the **boundary** instead — no server session, no token, no `/admin/login`,
and the digests in exactly one module.

### 4.4 Rotation

`scripts/_gen-admin-credential.cjs` prints fresh constants for rotation. It **refuses a
password under 12 characters** and never echoes the password back. `tests/auth.mjs` also
fails if the stored digest is one of seven obvious guesses.

---

## 5. Third-party material and rights

**This is the section with real consequences, and it is the one that changed on
2026-09-27 when the repository was made public.** Source of record:
[`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md), with the
public register at [`../../THIRD-PARTY-NOTICES.md`](../../THIRD-PARTY-NOTICES.md).

### 5.1 The distinction that governs everything

| | |
|---|---|
| **Use** | Your website renders the template's design and images. A ThemeForest licence covers this — it is what the licence is for |
| **Redistribution** | The template's source files and asset library are downloadable from a public repository. **The licence does not cover this** |

**The website is use. The repository is redistribution.** They are not the same act, and
the second is the one that changed.

### 5.2 The measured inventory

**Valvoro — Plumbing Services HTML Template**, ThemeForest item **62644376**
[M: read from `archive/reference-sites/valvoro-template-preview.html`].

| Location | Tracked files | What |
|---|---:|---|
| `archive/audit/v1-audit/vlv/` | **20** | The template's own demo and source — `style.css`, `bootstrap.min.css`, `owl.carousel.js`, jQuery, `wow.js`, and the rest. **915 KB. This is the material exposure**: it is not public anywhere else |
| `valvoro-prototype/` | **87** | The v2 static prototype — the parity baseline; 79 of the 87 are images |
| `public/assets/images/` | **59** | Images **byte-identical** to the template library, **served by the live site today** |
| **Total template-derived tracked files** | **119** | |

[M: `git ls-files archive/audit/v1-audit/vlv | wc -l` → 20; `git ls-files valvoro-prototype | wc -l` → 87.]

### 5.3 What is ours, and what is not

**The answer is not uniform, and both uniform answers are wrong.**

| Layer | Verdict | Evidence |
|---|---|---|
| **Markup** | **Ours** | The template demo has **246** unique classes; the prototype has **488**; only **29 shared** (~12%) |
| **CSS** | **Ours** | The template ships Bootstrap 4 + Owl Carousel. `valvoro-prototype/css/tw.css` is a **generated Tailwind** file — a different stack, re-implemented, not copied |
| **Images** | **The template's** | **59 of 95** files in `public/assets/images/` are **byte-identical** (`cmp -s`); 10 share a filename but differ (your replacements) |
| **Template source** | **The template's** | 20 files, 915 KB, tracked verbatim |

So:

- ✗ *"We rewrote it from scratch."* — 59 images are byte-identical, and the live site
  serves them.
- ✗ *"We copied the template."* — the markup was rewritten and the CSS re-implemented in
  a different stack.
- ✓ **The accurate statement: the design was used as inspiration, and the markup and CSS
  were re-implemented, while 59 images were carried over verbatim.**

**Attribution is not required** by the Envato licence and is not claimed. What *is*
required is that the template not be redistributed, and that authorship not be
misrepresented.

### 5.4 The MIT notice gap — small, real, and simply owed

The bundled open-source libraries inside the template copy are **MIT**, which requires
that the copyright and permission notice be retained in all copies. **Two files have had
theirs stripped** [M: no licence marker in the first 300 bytes]:

```
archive/audit/v1-audit/vlv/assets/css/bootstrap.min.css    ⚠️ no notice
archive/audit/v1-audit/vlv/assets/js/wow.js                ⚠️ no notice
```

Everything else keeps its banner — jQuery 3.7.1, Bootstrap JS 4.6.2, Popper, Owl Carousel
2.3.4 (both files), jQuery Validation 1.9.0, animate.css. The fix is a one-line prepend
per file, and it is **not blocked on any decision** — it is simply owed.

**Vendored components:** `src/components/ui/**` (21 files) are from the shadcn/ui
registry, copied into the repository rather than installed as a package, so they are
redistributed here as source. **MIT**, notice included via the register. **No font files
are bundled**, so there is nothing to attribute there.

### 5.5 The licence record — and the one string that must never be committed

**Two distinct things exist, and only one of them belongs in the repository.**

```
❌  NEVER COMMIT:  the Envato purchase code, Envato API keys, invoice PDFs,
                   account credentials, your Envato account email
```

An Envato **purchase code** is a secret: it verifies the licence, unlocks support, and can
be used to invalidate or abuse the purchase. **A public repository is the worst possible
place for it.** It is held in a private store you control, and the repository records only
the non-sensitive reference.

**A rights record to be completed by you:**

```yaml
asset:        Valvoro — Plumbing Services HTML Template
item_id:      62644376
marketplace:  ThemeForest (Envato)
licence_type: <Regular | Extended>     # unknown — see below
licensee:     <client legal entity>    # see §5.6 — the entity name is unresolved
purchased:    <YYYY-MM-DD>
order_ref:    <invoice or order id>
evidence_at:  <private location the client controls>
purchase_code: REDACTED — held privately, deliberately not in this repository
```

**Why `licence_type` matters.** A **Regular** licence permits one end product used by end
users free of charge; **selling** access to the product requires an **Extended** licence.
Which one you hold determines whether the dashboard may ever be commercialised. It is
worth confirming alongside the purchase code.

### 5.6 The copyright holder is unresolved — and must not be guessed

The repository states two names, and a copyright notice must name the **legal person**:

| Name | Occurrences | Where |
|---|---:|---|
| `Call Indigo LLC` | **105** | `README.md`, `CHANGELOG.md`, and `copyrightName` **in the running application** |
| `Indigo Home & Facility Services` | **26** | `PRD.md`, which identifies it explicitly as the **legal** name, with *Call Indigo* as the business name |

[`../../LICENSE`](../../LICENSE) uses the **legal** name and carries a comment explaining
why. **If that is wrong, it must be corrected in two places** — the `LICENSE` and the
application's `copyrightName` — because the site footer currently renders
*"© Call Indigo LLC"*.

**This is a question for you.** Picking the more frequent string would be a guess dressed
as a measurement.

### 5.7 The 20 tracked template source files — an open decision

`archive/audit/v1-audit/vlv/` is the material exposure. Three options, with honest costs:

| Option | Effect | Cost |
|---|---|---|
| **Leave as-is** | 20 template source files remain public | Redistribution of a commercial template, in your name |
| **Delete in a new commit** | Gone from the current tree, **still in history** | Removes the current exposure only; `git log` still serves them |
| **Purge from history** | Genuinely gone | `git filter-repo` + a force-push across **every commit**. **Every SHA changes**, so every SHA cited in the changelog and the documentation becomes invalid — and this repository's two-commit paperwork convention is built on citing real SHAs |

**Recommendation: decide before choosing.** The licence is yours, so the risk is yours to
accept. **If the answer is "remove it", the cheapest correct sequence is to wait until
`valvoro-prototype/` is retired under PRD §16.2 F10** — at which point the template is no
longer needed for parity — **and purge once**, rather than purging now and again later.

### 5.8 The previous WordPress site — recommendation: do not add it

Your previous site was WordPress, built on this template. The question is whether to bring
those files across and publish them.

**Recommendation: do not.** Four reasons: nothing depends on them (the build compiles,
tests and deploys without them); they would **add** to the redistribution surface, not
reduce it; the design reference already exists in `valvoro-prototype/`; and what needs
preserving is **evidence of the purchase**, which is a reference plus a private store —
not a copy of the thing purchased.

**If you want the WordPress implementation retained**, it belongs in a **separate private
repository**, not alongside a public one.

### 5.9 Attribution summary

| Component | Attribution required? | Action |
|---|---|---|
| Valvoro template | **No** — Envato does not require it, and it must not be claimed as ours | None; §5.7 is the open decision |
| Bootstrap 4.6.2, jQuery 3.7.1, Popper, Owl Carousel 2.3.4, jQuery Validate 1.9.0, animate.css | **Yes** — MIT notice retention | Banners present ✅ |
| `bootstrap.min.css`, `wow.js` | **Yes** — MIT notice retention | ⚠️ **stripped — restore** (§5.4) |
| shadcn/ui components | **Yes** — MIT | Recorded in the register |
| npm dependencies | **Yes** — per package | **Not redistributed**; listed for completeness |
| Fonts | **None bundled** | Nothing to do |
| Client photography | Your own | None |

**One consequence worth stating plainly: the repository is public, but the code is not
open source.** Public visibility is not a licence
([`../../LICENSE`](../../LICENSE) is proprietary and grants no rights by publication).

---

## 6. Known limitations, and what has not been verified

**This section exists because a limitation that is written down is a decision, and one
that is not is a surprise.** Everything here is measured or explicitly marked unverified.

### 6.1 Product limitations

| Limitation | Detail |
|---|---|
| **The gate is client-side** | §4.2. It keeps `/admin` off the public internet; it is not access control. A server-issued session is still owed (F1) |
| **No real backend** | §3.3. The contact form writes to the submitter's browser and the business never receives it |
| **Content management is deferred** | F4. The marketing pages carry their copy inline, so editing Settings does **not** rewrite them. Settings says so on screen |
| **Two button systems** | Marketing uses the bespoke `.pill` family; the dashboard uses shadcn `Button`. Reconciliation is deferred (F7) |
| **Client-rendered SPA** | No server-side rendering or pre-rendering, so each marketing page loses its own server HTML and crawlers and link previews degrade. Accepted for the prototype; static pre-rendering is recommended before a public launch (F8, PRD §15 R4) |
| **The Design System page reads as an editor** | It is display-only. `/admin/design` carries a visible "read-only" note, and "Save" writes to **this browser's `localStorage` only** |
| **No observability** | No error reporting, no analytics, no uptime check. A broken interaction is invisible until someone reproduces it by hand |
| **The captcha stops no bot** | §3.4. Accepted while there is no backend |

### 6.2 Measurements still owed

> **The §13.2 layout-parity thresholds have not been re-run since the marketing copy
> changed, and they are the only acceptance test PRD §13 ever specified.**

| Threshold | State |
|---|---|
| Every landmark box within **±1px** at every viewport | **Not re-measured** |
| Page height within **±0.5%** | **Not re-measured** |
| ≤**0.5%** of pixels differing by more than **8/255** per channel | **Not re-measured** |
| Hard zeros — console errors, broken images, dead anchors, horizontal overflow | **Covered headlessly** |

They need a **real browser** at **1920 / 1440 / 390**. The browser harness lives in
`archive/audit/v1-audit/v2check/` and **is still the only code that can measure them**.

**Two known risks** if a re-measurement is run: the absolutely-positioned boxes (the
hero's `.navy-box`, the `.years-experience-con` badge and the `.plumber-img` overlay) sit
against flow height that the shortened sentences changed; and `/contact` shares the footer
whose copy was edited.

**What this blocks:** retiring `valvoro-prototype/` (F10). The prototype cannot be deleted
until parity is re-measured and signed off. Tracked as **E3**.

### 6.3 What the verification suite cannot see

**This is the most useful section in the document for anyone reviewing the work**, because
a green suite is not the same as a correct site.

| Cannot see | Why |
|---|---|
| **Landmark box positions, page height, pixel differences** | Needs a layout engine. `renderToStaticMarkup` produces no layout |
| **The scroll-reveal animation** | `IntersectionObserver` never fires headlessly. **60 elements** are gated behind `.reveal` (35 home, 16 residential, 9 commercial) — the CSS cascade and the observer port were both verified directly, but the animation itself needs a look in a real tab |
| **Any data-driven admin UI** | Every page using the data layer renders as **skeletons** in the suite, because the read path is an effect and effects do not run. The Member badge, the inquiries table, the Settings pages' saved state — none is checkable from the suite, and each was verified with a dedicated browser probe instead |
| **The hero carousel animation** | What is proven is that the target element and the five rotation options exist and the fit logic is wired. The rotation, the fade and the auto-fit need a real tab |
| **The mobile header width at 320–400px** | Showing the phone number at 15px alongside the brand and the burger is untested at that width. If it overflows, the fix is to hide the number below ~380px only |
| **The arch image swap on a slow connection** | The five files are prewarmed so the first pass should never paint an empty frame, but that has been observed only on localhost and a warm CDN |

**Why this matters:** `renderToStaticMarkup` has **no layout engine**, so the suite is
green on things that are visibly broken. This project has also already shipped a contrast
sweep that cleared both contrast bars arithmetically and still looked wrong. **A headless
preview is not a browser.**

### 6.4 Residual risks carried from the PRD

| # | Risk | State |
|---|---|---|
| **R1** | The workspace's own `modern-web-app` scaffold ships Tailwind 3, contradicting the Tailwind v4 requirement | **Avoided** — bootstrapped manually per PRD §4.2. The skill template is still un-updated (**F12**) |
| **R2** | The Tailwind browser build → Vite CLI build changes CSS emit order and preflight | Silent 1–3px drift. Mitigated by §13.2 measuring landmark boxes — **which is not re-measured** (§6.2) |
| **R3** | Two button systems ship (F7) | Accepted; documented so it is not a surprise |
| **R4** | Client-rendered SPA degrades crawlers and link previews | Accepted for the prototype; **pre-rendering recommended before a public launch** |
| **R5** | The Design System page is display-only but reads as an editor | Mitigated by a visible read-only note on the page |
| **R6** | Porting three large hand-written pages by hand invites transcription drift | Mitigated by porting mechanically and diffing at every step |

**Also carried:** six superseded v1 brand assets still ship in `public/assets/images/`
(`call-indigo-mark.svg`, `call-indigo-mark-dark.svg`, `call-indigo-logo.svg`,
`call-indigo-512.png`, `indigo-mark.png`, `indigo-mark.ico`). None is referenced by any
source file, but `public/` is copied verbatim into the deployed bundle, so they are dead
v1 brand weight. **They were not deleted** — removing published brand assets is your call,
not a side effect of a rebrand.

---

## 7. Open decisions — yours, not ours

**Every item in this section is blocked on you, not on engineering.** In each case the
symptom is clear and the remedy is not.

### 7.1 The client punch list

Source of record: [`./tasks.md`](./tasks.md) §1.

| # | Request | Why it is still open |
|---|---|---|
| **T2** | *"Each service icon has a stack issue with the color"* (home + residential) | Measured: all six `services-icon*.png` are pure-white glyphs (`#ffffff`, alpha) inside a chip that is `bg-sky` (`#30c3eb`), a **3px** white ring, and **14px** padding — so the glyph renders at roughly **28px inside a 62px chip**. **Any of those three surfaces could be the "stack issue".** Needs: is it the chip colour, the white ring, or the padding? |
| **T4** | **The Terms of Service and Privacy text** | **Closed for the prototype** — your instruction was to treat it as done for now. ⚠️ **A *public* launch still needs the real text**: the placeholder copy still carries its own warning, and finishing it is an owner/lawyer decision. **The old site cannot supply the text** — `indigoservices-tx.com` has **no Terms page at all**, and its only legal page is unedited WordPress boilerplate carrying literal `**Suggested text:**` prefixes and clauses about blog comments, Gravatars, a login page, password resets and registered user profiles, none of which this site has. Copying it verbatim would ship placeholder scaffolding to visitors and describe data practices that do not exist. **Needs: your approved text, or a decision to author one for this site** |
| **T5** | Does *"drop management"* also cover the descriptive uses? (commercial) | The product names are renamed. Two *descriptive* uses remain on the commercial page: the hero chip **"National facility management"** and **"…without a full management commitment"**. Those describe a service category rather than the membership product, so they were left. **Needs: keep or reword** |
| **T6** | The home membership eyebrow repeats its heading | The block reads `MEMBERSHIP` above `Indigo Home & Facility Membership`. The eyebrow was not in the instruction so it was left alone. **Needs: drop the eyebrow, or keep it** |
| **T7** | Which reading of *"at the top level"*? (home membership block) | Implemented as *heading* = "Indigo Home & Facility Membership", *CTA* = "BECOME A MEMBER", body under — which matches the residential and commercial boxes. The alternative reading: *eyebrow* = the name, *h2* = "BECOME A MEMBER". **Needs: confirm** |

**Closed already:** **T3** (the hero imagery — you chose relevance over larger type, and the
arch now changes with the rotating service word) and **T4 for the prototype**.

> **A rewrite must not break four facts, all verified against the build:** no cookie is
> set; no analytics exists; the form collects **no postal address**; the captcha is **local
> arithmetic** with no third-party service.

### 7.2 Rights decisions

Source of record: [`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md) §9.

| # | Decision | Blocked on |
|---|---|---|
| 1 | **The 20 tracked template source files** — leave, delete, or purge (§5.7) | **You** — the licence is yours |
| 2 | **Confirm the copyright holder** — `Call Indigo LLC` vs `Indigo Home & Facility Services` (§5.6) | **You** |
| 3 | **Confirm the licence type** — Regular vs Extended (§5.5) | **You** |
| 4 | **Record the licence reference**; keep the purchase code private (§5.5) | **You** |
| 5 | Restore the MIT notices on `bootstrap.min.css` and `wow.js` (§5.4) | **Nobody — owed now** |
| 6 | Do not add the WordPress files (§5.8) | Decision made; recorded |

### 7.3 Two requirements that would reverse a recorded decision

Both of these are reasonable to want, and **both collide with a decision already recorded
in this repository.** Naming the collision is the point — neither should be made quietly.

| If you want… | It reverses | What it would require |
|---|---|---|
| **Analytics** — "which pages are used" | Your own requirement ruling out cookies and third-party trackers, and the *"what we will not merge"* rule in `CONTRIBUTING.md` | Your explicit agreement, in writing; the Privacy policy must then declare it; the suite check that asserts no analytics exists must be inverted |
| **Marketing texts** — contacting visitors by SMS | The form's own text, *"We use your details only to answer this request."* Sending marketing texts without consent the form never collected is a **TCPA exposure** | The form must collect consent **before** the policy may say so |

**Recommendation: do not add analytics.** It is the one item on the "useful next steps"
list that is explicitly *not* recommended
([`../30-operations/observability.md`](../30-operations/observability.md) §4).

---

## 8. Deferred product work (PRD §16.2)

The full table with dependencies is [`./roadmap.md`](./roadmap.md) §2 and
[`../../PRD.md`](../../PRD.md) §16.2.

| # | Work | Depends on | State |
|---|---|---|---|
| **F1** | **Authentication** — a server-issued session | — | **Partly landed.** A client-side prototype gate ships; the real one is owed before any real data exists |
| **F2** | **Real persistence** — API + database | F1 | **Open.** The `api.ts` seam was built for exactly this |
| **F3** | A working design-token editor | F1, F2, a token-source decision | Open. `/admin/design` is read-only today |
| **F4** | Content management for the marketing copy and images | F1, F2 | Open |
| **F5** | Asset management — upload/replace images | F1, F2 | Open. `/admin/assets` discovers from disk, read-only |
| **F6** | The remaining sidebar pages | F1 | **Landed** — Profile, Notifications, Security, Assets and Components are all real pages now |
| **F7** | Reconcile the two button systems | §8.3 debt | Open |
| **F8** | Static pre-rendering / SEO | R4 | Open |
| **F9** | Audit log and roles | F1, F2 | Open |
| **F10** | Retire `valvoro-prototype/` | rc1 acceptance | **Blocked** — needs §13.2 parity re-measured and signed off (§6.2) |
| **F11** | ~~The `#area` city-list contradiction~~ | — | **Closed** — resolved to the four-city list |
| **F12** | Update the `modern-web-app` skill template to Tailwind v4 | R1 | Open |

### 8.1 The one that matters

**F2 is the roadmap.** Every other item either depends on it or is cosmetic next to it.
The contact form currently writes to the **submitter's own browser** — the business never
receives a submission (§3.3).

**F1 gates F2**, and F1 is not a small change: a server-issued session means a server,
which means the project stops being a static single-page application on Vercel.

---

## 9. Deferred engineering work

Ours, and unblocked. Source of record: [`./tasks.md`](./tasks.md) §3.

| # | Task | Why it matters |
|---|---|---|
| **E3** | **Re-measure PRD §13.2 parity** | The copy changed, so the thresholds must be re-measured rather than inherited. **F10 is blocked on it** |
| **E4** | **Build the deploy log** | Release history is prose in the changelog; an automated log — provider, URL, SHA, time, result — closes the "did it ship?" question permanently |
| **E5** | **Rename the phase PRDs' `T`-tasks** to `P<n>-T<n>` | Two unrelated `T`-numbering schemes collide. Deferred because renaming invalidates existing cross-references |
| **E6** | **The wiki drift check** | The wiki is generated manually, so a stale wiki is silent |
| **E7** | **A dependency-vulnerability gate in CI** | Dependabot opens PRs; nothing fails a build on an advisory |
| **E10** | **Machine-check the README's build figures** | The check count is guarded; the build row is not. A one-line edit moved the JS figure **810.79 → 810.81 kB** and nothing failed. ⚠️ The blocker is real: `test:only` does not rebuild, so a naive check would compare against a stale bundle |
| **E12** | **Re-sync the wiki** | The sync is manual and cannot run from a sandbox that refuses child processes. Run `node scripts/_wiki_sync.cjs` from a machine that can spawn git |
| **E13** | **The "how many times" count disagrees across three files** | Three places count this project's recurring documentation defect, and all three count it differently. Nothing maintains any of them |

**Closed on 2026-09-27:** **E1** (the backend-import rule is now asserted, with a positive
control), **E2** (a stale comment), **E8** (the README's check count), **E9** (six stale
`docs/` paths, one of them rendered to the operator in the dashboard UI), **E11** (the wiki
generator reported a failure to run git as a missing wiki). Each is recorded in
[`../../CHANGELOG.md`](../../CHANGELOG.md) with the commit that closed it.

**A note on how these were found**, because it is the character of the work: E8 and E9 were
found *while closing E1 and E2*, and E11 was found while publishing the wiki. **All five
were the same defect shape — an assertion that cannot see the thing it claims to check** —
and that shape is now recorded as a named pattern in
[`../20-development/patterns.md`](../20-development/patterns.md).

---

## 10. How it ships, and how to prove it shipped

Source of record: [`../30-operations/deployment.md`](../30-operations/deployment.md).

### 10.1 Configuration

One file, one rule [M: `vercel.json`]:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**That rewrite is load-bearing.** This is a client-rendered single-page application: the
server has one HTML file and every route is resolved in the browser. Without the catch-all,
a deep link or a refresh on any route other than `/` returns a 404.

| Setting | Value |
|---|---|
| Build command | `npm run build` (`tsc -b && vite build`) |
| Output | `dist/` |

### 10.2 Hostnames

| Hostname | Behaviour |
|---|---|
| `call-indigo.com` | **Production.** Serves this codebase |
| `call-indigo.vercel.app` | **307-redirects** to `call-indigo.com` |

> ⚠️ A custom domain can belong to a *different* Vercel project. Confirm which hostname
> actually serves the project before declaring a deploy live.

### 10.3 The author gate — the thing most likely to cost time

**The rule: when a push succeeds but nothing deploys, the gate is usually *who* authored
the commit, not what is in it. The token used to push is almost never the lever.**

From Vercel's own documentation: on a **Hobby plan with a private repository**, *"the
commit author must be the owner of the Hobby team"* containing the Vercel project. Only
the team owner's commits deploy — everyone else is blocked, no matter which credential
they push with.

| # | Fix | Cost |
|---|---|---|
| 1 | **Re-author the commit as the team owner** | Free, immediate |
| 2 | **Make the repository public** — collaboration is free for public repositories | Free. Exposes source |
| 3 | Upgrade the Vercel team to Pro | Paid |

> **A GitHub personal access token does not help. A GitHub plan upgrade does not help.**
> The plan that gates this is **Vercel's** — this is the most common wrong assumption and
> it costs money.

**This repository's position:** the commit author on `main` is
`Indigo Services <indigobuildops@gmail.com>`, and the repository was made public on
2026-09-27, which per fix 2 makes collaboration free. **Whether the gate is therefore
lifted is [P] and unverified** — it depends on the Vercel project's plan and connection,
neither of which has been read.

### 10.4 The four gates, and CI

`.github/workflows/ci.yml` runs the same four gates on every push to `main` and every pull
request:

| Gate | Command |
|---|---|
| G1 — type check | `npm run typecheck` |
| G2 — lint | `npm run lint` |
| G3 — build | `npm run build` |
| G4 — verification | `npm run test:only` |

### 10.5 Proving a deploy actually shipped the code

> **A `success` status is not proof the change is live.**

1. **Bundle sizes are a strong fingerprint.** A production `index-<hash>.js` byte count
   should equal the locally measured one **exactly**.
2. **For a single-page application, the served HTML is only a shell.** Grep the **JS
   bundle**, not the HTML, for content markers.
3. **Minification renames identifiers.** Search for **string literals and class names** —
   a hex colour, a custom class, a copy string — never a function name.
4. **Confirm the hostname** (§10.2).

### 10.6 What is *not* verified about deployment

**Read this before assuming a push deploys.** None of the following was confirmed:

| Unverified | How to check |
|---|---|
| Whether the Vercel project is connected to this GitHub remote, or deploys from a CLI | Read the Vercel project's Git connection |
| Whether the author gate still applies after the repository went public | Push from a non-owner identity and read the commit status |
| Whether `main` is branch-protected | `gh api repos/indigo-services/call-indigo/branches/main/protection` |
| The Vercel plan and team owner | The Vercel project settings |

**How a problem is found today: by a person using the site.** That is the whole mechanism.

---

## 11. The honest summary

**What is solid.** A React 19 / Vite 7 / Tailwind v4 build of four public routes and nine
dashboard routes, with a real persisted data layer behind an async seam, a working inquiry
form, a sign-in gate on `/admin`, and **142 automated checks** across seven suites running
in CI on every push. The design tokens live in exactly one file. The build is 1755 modules
and the gates are green. A rebrand, two rounds of your feedback, and a documentation
milestone have all landed.

**What is not.** **There is no backend.** The contact form tells you nothing — it writes to
the visitor's own browser (§3.3). The sign-in gate is a curtain, not access control (§4.2).
The marketing pages are not crawlable without JavaScript. The §13.2 layout thresholds have
not been re-measured, which blocks retiring the prototype (§6.2). The Terms and Privacy
text is unreviewed placeholder copy, acceptable for a prototype and not for a launch
(§7.1). And the repository is public while it still redistributes a commercial template's
source and 59 of its images (§5).

**What we owe you regardless of any decision.** The MIT notices on two files (§5.4) — that
is a one-line fix per file and it is simply outstanding.

**What we need from you.** Five punch-list answers (T2, T5, T6, T7, and T4 for a public
launch); the copyright holder's legal name; the licence type; and the decision on the 20
tracked template source files. Everything else on the list is ours.

**The one thing to say out loud before a demo.** Fill in the contact form on your own
laptop and check your inbox, and you will find nothing. **The form works — it just works
in the visitor's browser.** This is the most likely thing in the whole project to be
mistaken for a bug in a room full of people.

**And the character of the work**, which matters for how much you should trust the numbers
above: this repository's rule is that **the repo wins and the document is the bug**. The
figures here were re-measured rather than recalled, the guards were each tested against a
fixture containing the defect they are meant to catch, and the recurring defect this
project has actually suffered from — *an assertion that cannot see the thing it claims to
check* — is written down as a named pattern with its five occurrences rather than quietly
fixed. Where something is unverified, this document says so and says how to verify it.

---

**Last verified:** 2026-09-27 at `322d842`
