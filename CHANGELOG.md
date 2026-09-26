# Changelog

All changes to the Call Indigo website are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
with pre-release tags for release candidates.

---

## [Unreleased] — working dashboard, public inquiry page, copy pass, client punch list

### Dashboard sign-in gate — a salted client-side credential, 2026-09-26

The client asked for a username and password on `/admin`, with a **secure
implementation** rather than a literal comparison. Shipped as **`e622315`** —
`feat(admin): gate the dashboard behind a salted, client-side credential`. Suite:
**109 → 127 checks** (18 of them in the new `tests/auth.mjs`); the behaviour was
measured in a real browser at **8/8**. Threat model, rotation and risk register:
**`docs/admin-gate.md`**.

**The credential is a digest, not a literal.** The password is a salted
PBKDF2-HMAC-SHA-256 digest at **210,000 iterations**; the username is a salted
SHA-256. Both halves are derived and compared on **every** attempt, so a wrong
username is not measurably faster than a wrong password and a failure does not say
which field was wrong. **Neither credential is in the bundle** — checked directly
(`username in bundle: 0`, `password in bundle: 0`) and by a repo-wide grep. For
that reason **the credentials are deliberately not reproduced in this file**:
writing them here would falsify the property the tests assert.

**Where the gate sits, and why it renders rather than redirects.** `RequireAuth`
wraps `AdminLayout` — the **layout**, so a stranger never sees the sidebar — and
renders `LoginPage` in place of its children. There is no `/admin/login` route and
no redirect, so there is nothing to loop. The session is in `sessionStorage` under
a key deliberately **outside** the `call-indigo:v1:` namespace, so "Reset demo
data" cannot sign the operator out; 12-hour expiry; sign out in the sidebar
footer.

**Verified behaviourally, because the suite structurally cannot.** A sign-in is a
store subscription plus an async KDF, and `renderToStaticMarkup` runs no effects
and has no layout — so `scripts/_probe_admin_gate.cjs` measures it in a browser:
wrong credentials rejected in **173ms** with the dashboard still closed, right
credentials open it in **250ms**, a reload keeps the session, **a new tab does
not**, and Sign out ends it. The credential-dependent steps report **SKIPPED**,
never passed, when `ADMIN_USER` / `ADMIN_PASS` are unset.

**Four things the tests caught, three of them stale claims.**

| Stale claim | What it said | Now |
|---|---|---|
| `tests/policy.mjs` | *required* the **absence** of auth — `useAuth`, `signIn`, `sessionStorage`, all rejected by regex | inverted to pin the **boundary**: no server session, no token, no `/admin/login`, and the digests in exactly one module |
| Profile, Security, change-password, Design System publish note | "there is no authentication" / "anyone who reaches `/admin` has full access" | all four describe the gate; `tests/auth.mjs` scans `src/` for the old sentences and fails, with a control |
| `docs/dashboard-scope.md` §6 + its §9.1 row, `docs/README.md` release gate | "Auth negative — expect zero" | superseded / rewritten |

**What it is not, said plainly.** Client-side. With no server there is nowhere for
a secret to hide from the browser, so anyone who can open devtools can set the
session flag. It keeps the dashboard off the public internet, which is the actual
requirement while the client is showing this around — it is **not access
control**, and the Security page now says so. `PRD.md` §9.1 still reads "No
authentication"; the client overrode that scope, and by convention the PRD is left
as the scope of record while the reconciliation lives in `docs/admin-gate.md`.

**Also.** `scripts/_gen-admin-credential.cjs` prints fresh constants for rotation
and refuses a password under 12 characters, never echoing it back. `tests/auth.mjs`
fails if the stored digest is one of seven obvious guesses, and fails if the
unreferenced `nav-user.tsx` registry code — with its inert "Log out" — is ever
rendered, so it cannot be mistaken for the real sign-out. Two checks matched text
**inside comments** (`localStorage` in a doc block explaining why the session is
*not* in `localStorage`, and `/admin/login` in two comments explaining why no such
route exists); comments are now stripped before every identifier scan. **That is
the fifth and sixth time this trap has produced a false result in this repo.**

### Client feedback round 3, follow-up — the "15+ Years" badge goes horizontal, 2026-09-26

The client's follow-up to the badge work: make it a **horizontal icon box — blue
icon left, "15+…" text right — centred at the bottom between the two photos.**
Home page only. Suite: **107 → 109 checks**. Shipped as **`07c5fbd`** —
`feat(marketing): horizontal, bottom-centred "15+ Years" badge, every dimension
stepped at 1440` — with the instrument fix in **`2eeadaa`**. Measurements, the
source-pixel face check and the judgement call: **`docs/plan-client-feedback-2026-09-26.md`
§ 2, revision 2**.

**The anchor became two parts, and both matter.** `left: -15px` is *half* the
row's 30px gap, which lands the badge's left edge on the seam's midpoint;
`translateX(-50%)` then moves its **centre** there. `left` alone leaves the badge
entirely to the *right* of the seam — which is precisely what the previous round
shipped — so the test asserts the transform explicitly rather than settling for
"a negative `left`".

| width | badge | centre vs seam | overlap left | overlap right |
|---|---|---|---|---|
| 1920 | 264×100 | **0px** | 117px | 117px |
| 1440 / 1199 / 991 / 768 | 222.8×84 | **0px** | 96.4px | 96.4px |
| 390 | hidden | — | — | — |

**Q1 is closed by the same change.** Every dimension the badge renders — box
padding, disc, glyph, figure, label, gap — now reads from a `--yb-*` variable with
a ≤1440 step, so the whole lockup shrinks with the photos. Coverage at 1440 falls
from the **62%** Q1 flagged to **37%**, and the single-digit clearance from the
technician's hair goes with it. The radius is 18px rather than the old 104px
lozenge: the lozenge was exempt from the radius tightening as "a shape rather than
a corner", and a horizontal icon *box* is a corner.

**Faces re-checked, because the covered strip moved.** `_face_extent.cjs` had the
band hardcoded as vertically centred — correct for the old lozenge, wrong for a
bottom-anchored badge — so it now takes the band's top explicitly, and says so
when you omit it. With the real band, **both photos' faces sit above it**: the
badge covers apron and sleeve on the left, worktop and forearms on the right.
⚠️ The tool's `skin` predicate also matches warm wood, so the right photo's
worktop reads as 47–100% "skin" — recorded in its header rather than left as a
trap.

**One judgement call, flagged rather than tuned silently.** The row is
`items-center` and the two photos differ in height (at 1920, 559.2 against 669),
so the shorter left photo has ~55px of dead space above and below it. A badge
anchored 22px above the **row's** bottom therefore hangs **32.9px below the left
photo's** bottom edge, its lower-left corner on the white slab with only its
shadow for an edge. That is the literal reading of "bottom middle between the two
photos" and it is what shipped; anchoring to the shorter photo's bottom instead
would put the badge mid-way up the right photo.

**Q2 and Q3 closed by the client.** Q2 (the mobile carousel) was **user-specific**
— no action, and the round-2 finding stands: the probe still sees four distinct
words and four distinct arch photographs at 390px with motion on. Q3 (ToS and
Privacy) — **"proceed with pages as is, this is a prototype"**; the placeholder
copy still carries its own warning, so a *public* launch would still need the real
text. **Q4 (punch list T2, T5–T7) remains open.**

### Client feedback round 3 — two revisions, 2026-09-26

Measured **before** and after with `scripts/_probe_hero_about_refine.cjs` (new),
at the same six widths the round-2 probe uses. Suite: **100 → 107 checks**. Both
items are Home-page only — `.navy-box` is written once, in `HomePage.tsx`, and the
About badge exists on no other route — so this round touches one page, not three.
Shipped as **`67d11f9`** — `feat(marketing): red Emergency card with a
half-protruding disc, and the About badge moved to the photo seam`. Full
measurements, the source-pixel analysis behind the photo swap, and the open
questions: **`docs/plan-client-feedback-2026-09-26.md`**.

**1. The Emergency card is red, and its disc is half out of the box**

- Inner padding down one step at every breakpoint: **22/28 → 19/25**, 18/22 →
  16/19, 15/18 → 13/16.
- Disc **44px → 58px** with a 30px glyph, and it now protrudes **29px above the
  card's top edge — exactly half of it**, at every width. The probe prints both
  numbers side by side (`protrusion: 29px … half the disc = 29px`), so "halfway"
  is measured rather than asserted.
- The red pair is **computed, not chosen**: card `#b5534a` (white measures
  **4.88:1**), disc `#6f150e` (white **11.74:1**). Both are the same hue as the
  old `#d92d20` disc — one desaturated, one darkened — so it reads as a muted red
  box with a dark red icon. A red merely *darker* than `#d92d20` would have
  failed: white on `#c26a5e` is **3.81:1**, under the 4.5:1 the card's own 15px
  sub-line needs. That arithmetic is now a test.
- The protrusion is a **derived** negative margin — `calc(-1 * (half the disc +
  the card's top padding))` — not a literal `-29px`. Half the disc has to clear
  the card's *border* box, and the padding pushes the content down from it, so a
  literal `-29px` would lift the disc only 11px clear at the base breakpoint; and
  the padding changes at every breakpoint, so the margin has to follow it. Two
  positive-control tests pin the derivation.
- At ≤991 the hero column stacks, so the 20px arch-to-card gap became **49px**.
  The disc protrudes 29px into that gap, and growing it by exactly the protrusion
  keeps the original 20px of daylight. Verified at 991, 768 and 390 — no
  collision with the arch.

**2. The "15+ Years" badge sits between the two photos, and the photos swap**

- The badge was `right: -29%` of the right photo's wrapper. Measured at 1920 it
  sat at x744.6 — **360px to the right of the seam** between the photos, 104px of
  it on the right photo, and its last 100px hanging **past the photo row
  entirely**. It is now `left: -30px` via `.years-badge`, so its left edge lands
  exactly on the left photo's right edge — because 30px *is* the row's own gap.
  It bridges the gutter and overlaps the right photo only: **overlap A = 0px,
  overlap B = 175px, at every width from 1920 down to 768.**
- The photos swap as asked, and **their width allocations travel with them**:
  `flex-[347]` now sits on `about-img2.jpg` and `flex-[372]` on `about-img1.jpg`.
  Those are each file's own natural width, so leaving them behind would upscale
  one source into a bigger box and squeeze the other.
- Why the swap is the safe way round, read off the source pixels rather than
  guessed: `about-img2.jpg` (the technician in the blue cap) has his **face at
  the right edge of his frame**, so on the left a badge at the seam would go
  straight through it. `about-img1.jpg`'s left edge is wall, cabinet and a hand.

**Verified by eye, because a badge can satisfy arithmetic and still land on a
face.** A 4× crop of the badge's right edge at its widest point shows the older
man's polo shirt and forearm — no face. The badge is 205px wide in a 30px gutter,
so it necessarily covers part of the right photo: 175px of 372px at 1920, and
175px of 282px at 1440. At 1440 the clearance from the technician's hair at the
badge's upper corner is the tightest point in the whole layout — single-digit
pixels, no overlap. Flagged to the client with options rather than tuned
silently. The badge is still hidden at ≤767, as before.

### Client feedback round 2 — nine requests, 2026-09-25

Every claim below was measured **before** anything was changed, with
`scripts/_probe_client_feedback.cjs` at six widths (1920 / 1440 / 1199 / 991 /
768 / 390). The same probe produced the after-shot, so both sets of numbers come
from one instrument rather than two. Full evidence, risk register and open
questions with recommendations: **`docs/plan-client-feedback-2026-09-25.md`**.
Suite: **67 → 100 checks**. Shipped as **`788913f`** — `feat(marketing): act on
the client's nine feedback items` (14 files, +1577/−207), pushed to `main` as
`ca91664..656d3e9`.

**Deployed and verified live, 2026-09-25.** `call-indigo.com` now serves
`index-DiVqDhQ1.js` / `index-D85KNRgC.css`, and both are **byte-identical to the
local build** (803,827 and 125,198 bytes — the content hash matching is the proof,
not the status badge). The two bug signatures are gone from the served stylesheet:
`.navy-box{…display:none}` → **0 matches**, `.banner-img2` rule → **0 matches**.

Re-running the probe against production returns the **after** state at all six
widths for every request — the same instrument that recorded the before state, so
the two columns are comparable:

| request | live, before | live, now |
|---|---|---|
| F1/F2 Emergency card | `display:none` at 991 / 768 / 390; 159×179 @1920 | **shown at every width**, 197.7×210 @1920, `position: static` |
| F5 small round frame | present, 266×387 | **absent** |
| F6 numerals | **1.07:1** | **6.81:1** |
| F7 section order | FAIL — `#reviews #faq #brands` | **PASS** |
| F8 CTA phone badge | present, 110×110 | **absent** |
| F9 membership question | absent; first field `name` | **PASS**; first field `member` |
| F4 carousel @390 | 4 distinct words | 4 distinct words *(unchanged — never a bug)* |

⚠️ **The author gate did not apply here**, and it is worth recording that it was
checked rather than assumed: every commit is authored by
`Indigo Services <indigobuildops@gmail.com>`, the same identity as the commits that
deployed before, and GitHub's commit-status API reports `success | Vercel:
Deployment has completed` on `656d3e9`.

**The red Emergency button**

- **Bigger on desktop.** Disc `p-2` → `p-2.5`, glyph 20px → 24px, label 22px →
  26px, sub-label 15px. The card measures **197.7×210 at 1920** (was 159×179);
  the disc alone was 32px with a 20px glyph.
- **It renders on a phone for the first time.** The markup had carried
  `max-md:static` since the previous round — but `index.css` hid `.navy-box` with
  `display: none !important` below 991px, and the stylesheet won. The card had
  **never** appeared on a phone at any point, at any width. It is now a normal
  flow item in a stacked column: **177.7×196 at 1199, 991, 768 and 390**,
  `position: static`.
- ⚠️ **The v1.0.1 entry further down that claims "The Emergency button now renders
  on mobile" was wrong when it was written.** It is corrected here rather than
  quietly deleted, because the guard that missed it is the instructive part: the
  old check tested the *source text* for `navy-box … max-md:hidden`, which cannot
  see a stylesheet rule at all. That check now asserts both layers, and a
  positive control feeds the detector the very rule that caused the bug and
  requires a hit — otherwise an absence assertion passes on a pattern that
  matches nothing.

**The hero arch — bigger, centred, and centred on mobile**

- **Balance.** Measured before: the arch sat on its column's **left edge at every
  width** — its centre 210px left of the column's centre at 1920, 130px at 1440,
  99px at 1199, 34px at 390. The cause was not the flexbox: the arch `<img>`
  carries Tailwind's `block`, so the template's `text-align: center` / `right` on
  the figure **had never applied to it**. Those rules were dead for the life of
  the port.
- The image column is now a centred flex row (`gap: 24px`) and the figure takes
  the slack. Offset from its column's centre is now **0px at 991, 768 and 390**,
  and −111 / −105 / −101px at 1920 / 1440 / 1199 — the residue is the Emergency
  card sharing the row, which is the intended reading.
- **Bigger.** `.banner-img1 img` 350 → **406** at ≤1440, 320 → **380** at ≤1199,
  260 → **300** at ≤767. 406px is the arch source's own ceiling: the `Home
  Services` photograph is 424×560, and `scripts/_hero_arch_build.cjs` refuses to
  upscale a source, so 376×556 content + 12px padding + 3px ring is as large as
  the five arch images can go. Growing it further means replacing all five.
- **Mobile "does not move" was NOT reproduced.** At 390px with motion ON the
  probe observed **4 distinct words and 4 distinct arch sources** — the carousel
  runs on mobile. `prefers-reduced-motion: reduce` is the only thing that stops
  it, and honouring that is deliberate. The off-centre half of the report was
  real and is fixed; the motion half is carried as an open question in the plan,
  not as a bug fix.
- A `hero-arch-slot` wrapper now holds the arch and its decorative dots. Anchored
  to the figure the dots sat at the bottom-left of the whole *column*, off the
  photograph entirely once the figure took the row's slack.

**The redundant small round frame**

- Deleted. It rendered 266×387 at 1920 alongside the larger arch, which is the
  duplication the client described. Its rules (base 266px, ≤1199 140px, ≤991
  `display:none !important`, ≤767 `display:none`) are gone with it, and
  `repair-img2.jpg` is now unreferenced.

**The "How It Works" sequence numbers**

- They shipped as `text-mist` — **#f4f8fe painted on a white card, a contrast
  ratio of 1.07:1**, i.e. invisible, exactly as reported. Now `text-brand`:
  **6.81:1**.

**"Accredited & Reviewed"**

- Moved to sit directly under the testimonials, between `#reviews` and `#faq`,
  on the home page (the only page that has either section). The band renders
  identically wherever it sits, so this is asserted on DOM order — nothing else
  in the suite would notice it sliding back down the page.

**The CTA phone badge**

- Deleted on all three marketing pages. It was a 110px navy disc absolutely
  positioned `-right-7 top-1/2` in the "Get in touch" band. The three suite checks
  that used to assert its presence, its 20/36 lockup ratio and its glyph are
  **inverted** — and the lockup-glyph half, which never depended on the badge, is
  kept as "every chrome lockup still draws one and the same phone glyph".

**Contact form: "Already a member?"**

- New Yes/No radio group as the **first field, before Name**, as requested.
- The data layer models the two directions differently on purpose: `member` is
  **required** on `NewInquiry` and **optional** on `Inquiry`, because inquiries
  written before today have no answer and `readInquiries()` must keep returning
  them rather than inventing one. `Pick` would have inherited the optional
  modifier, so it is restated explicitly.
- Answering it is required, and it is validated first so that the
  focus-the-first-problem path lands on the topmost field. No default is
  pre-selected: a pre-filled answer to a question the visitor may never read is
  fabricated data.
- `/admin/inquiries` now shows a **Member** badge on the record detail — only for
  "yes", since "no" on every record is noise and pre-existing records must show
  nothing rather than a false "No". A badge in the list table was left out
  deliberately; the table's columns are unchanged.

**Measuring instrument fixes (no product effect)**

- The section-order line in `_probe_client_feedback.cjs` re-printed its own
  hardcoded selector list, so it read identically whatever the DOM did. It now
  sorts by the real DOM index and prints an explicit PASS/FAIL. **The F7 move had
  in fact landed correctly** — the line was a rubber stamp, not a measurement.
- Added `scripts/_feedback_pages.py` and `scripts/_feedback_css.py`: single
  asserted passes over the four page files and the stylesheet. Parallel `Edit`
  calls to one file race on the write and the last writer wins *while every call
  reports success*, so the pages and the CSS are edited by one script each that
  fails loudly if a needle stops matching.

**Verified by eye, not only by the suite**

The suite renders markup with `renderToStaticMarkup`, which has no layout engine —
it is green on things that are visibly broken. This project has also already
shipped a contrast sweep that cleared both bars arithmetically and still looked
wrong. So every change above was additionally rendered in a real browser at 1440
and 390 with `scripts/_shot.cjs` and **looked at**: the Emergency card on a phone,
the arch centred at both widths, `01` legible on the white card, the clean
photo/text seam in the CTA band, the six credential badges, and the membership
pills sized for touch at 390. Captures land in `.preview/`, which is gitignored,
so the check costs the working tree nothing. `docW === winW` at all six widths.

**The same probe, run against the live site**

Because the client's report was about the deployed page and not a local build, the
probe was pointed at production too — it takes `--base`, so one instrument
measured both. The live site was the "before" state of this whole section: the
Emergency card `display:none` at 991/768/390, the small round frame present at
266×387, the numerals at **1.07:1**, the order `#reviews #faq #brands`, the 110px
CTA badge, and no membership question. Six of the nine reports are confirmed on the
artifact the client actually used.

**"The carousel does not move" is refuted there as well** — 4 distinct words and 4
distinct arch sources at 390px with motion on, the same as local. So it is not a
stale deployment, which was the leading hypothesis. It stays an open question
rather than a fix.

⚠️ **And a correction that outlives this round:** `call-indigo.vercel.app`
**307-redirects to `call-indigo.com`**, and `call-indigo.com` serves **this same
Vite codebase** — its shell loads `/assets/index-*.js`, the bundle contains
`hero-rotate` / `navy-box` / `hero-arch-`, and there is **no `_next/static` and no
`__NEXT_DATA__`**. An earlier note described that domain as a *different codebase
(Next.js)*. Check a deploy against `call-indigo.com`; give the client the same URL.

**The Member badge, and the one claim the suite could not check**

The dashboard half of F9 is verified by `scripts/_probe_member_badge.cjs`, because
`tests/verify.mjs` structurally cannot reach it: it renders with
`renderToStaticMarkup`, which does not run effects, so `useApiData` never fires and
`/admin/inquiries` renders in its **skeleton** state. The probe seeds one record per
answer state and opens each — `"yes"` shows the badge, `"no"` does not, and a record
with no `member` key at all (what a pre-2026-09-25 inquiry looks like) does not.
Both directions are asserted deliberately: checking only the `"yes"` record would
pass on a page that badged every record.

**F3 was also confirmed as a visual before/after.** At the same 826×586 box, the
deployed column has the arch clipped against its left edge with the card marooned at
the far right and the dots at the bottom-left of the *column*; locally the arch is
centred, the card is larger and adjacent, and the dots have moved with the arch. The
last point is the `hero-arch-slot` rule working, and it is the one part of the change
no offset measurement would have caught — the dots are decorative and carry no id.

### Client punch list v1.0.1 — pending, needs clarity (TBD)

| # | Request | Why it is still open |
|---|---|---|
| T2 | **"Each service icon has a stack issue with the color"** (home + residential) | The *symptom* is clear, the *remedy* is not. Measured: all six `services-icon*.png` are pure-white glyphs (`#ffffff`, alpha) inside a chip that is `bg-sky` (`#30c3eb`), a `3px` white ring, and `14px` padding — so the glyph renders at roughly 28px inside a 62px chip. Any of those three surfaces could be the "stack issue". Needs: is it the chip colour, the white ring, or the padding? |
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
  ⚠️ **This entry was wrong when it was written and is kept only as a record.**
  The markup gained `max-md:static`, but `index.css` still hid `.navy-box` with
  `display: none !important` below 991px and the stylesheet won, so the card did
  not render on a phone until 2026-09-25 — see "Client feedback round 2" above.
  The check that passed here read the source text and could not see the CSS rule.
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

### Home hero — relevant imagery, headline wrap, legal notice (2026-09-22)

Commit `55a9b6f`. Four client requests, verified by `npm test` (**89 → 95 checks**) and
measured in a browser against production.

**T3 resolved — the imagery, not the type.** The client was offered "get the hero images
relevant or make the textual impact larger" and chose relevance, so the arch now changes with
the rotating service word instead of showing one static photograph. Five files at **376x556**,
one per category: `public/assets/images/hero-arch-{plumbing,electrical,hvac,home,facility}.jpg`,
**115,103 bytes** total against the single incumbent's 106,274. Built by
`scripts/_hero_arch_build.cjs`, which refuses to upscale a source and refuses to run at all
if the incumbent's dimensions have changed.

- **The arch is a NATURAL-SIZE slot**, so the file's own pixels *are* its rendered box
  (376x556 content in a 406x586 border-box). Any other size moves the hero — which is why the
  dimensions are pinned by a test as well as by the build script.
- **The crop axis that matters is horizontal.** Cropping a 1.538 landscape down to a 0.676
  portrait consumes the source's whole height, so `north`/`centre`/`south` are no-ops: the
  first focus sheet produced three *identical* tiles per candidate. Plumbing is cropped `east`,
  where the technician actually is; `west` is an empty cabinet panel.
- **"Home Services" is a cut-out on a light backdrop, not a photograph.** `about-img2.jpg`
  renders further down this same page and is already built from `Residential_1_Repairs.jpg`, so
  using that photo would have shown the same picture twice. `row-handyman-pic030.png` was the
  only spare candidate containing a person; it carries a real alpha channel, and flattening it
  to JPEG without a backdrop would have shipped a black rectangle. The backdrop is a *light*
  gradient because the incumbent `hero-arch.jpg` is a bright, airy close-up — dark would have
  been the jarring choice.

**The headline no longer reflows — and it was never the word that wrapped.** The rotating span
always fitted its column. The culprit is the **trailing period**, which is a *sibling* text
node and so does not shrink when the span is scaled down; the fit filled the column exactly and
left the period nowhere to go. It dropped onto a line of its own on "Facility Services" and grew
the hero by **exactly one line-height at every breakpoint** (+119px at 1920/1600, +80px at
1440/1280, +65px at 1199/1024, +60px at 991/768, +50px at 390). The fit now subtracts the
period's width before sizing the word, so every category renders at one constant height. Page
height moves **+0..2px** against the previous build; the 119px jump is gone.

- Proven by deleting the text node and re-measuring: with the period the h1 had **two** distinct
  heights at every viewport, without it **one** (`scripts/_probe_hero_dot.cjs`). Re-confirmed on
  the deployed site.
- `scripts/_probe_hero_wrap.cjs` is committed **superseded, with a header saying why**: it tried
  to detect the wrap by comparing rect `top`s, which is invalid for a baseline-aligned
  `inline-block`, and reported "wrapped" on every row including ones whose height never changed.
  Kept because the mistake is instructive — it *looked* like confirmation.
- `ROTATION` moved out of `useSiteChrome` into `src/marketing/hero-rotation.ts` alongside the
  image map and a pure `fitFontSize`, so the words and their photographs cannot drift apart and
  the arithmetic is testable without a DOM. The new `tests/hero-rotation.mjs` pins the measured
  breakpoint table **and asserts the old formula fails those same cases** — a test that only
  shows the new code passing cannot tell a real fix from a vacuous one.

**The Emergency card carries a red round brand mark.** The template's siren raster is replaced
by the same `rounded-full` disc + 20px lucide `phone` lockup the chrome uses, recoloured
`#d92d20`. `p-1.5` keeps the 32px footprint the old image occupied, so the card does not move;
white on `#d92d20` measures 4.83:1, over the 3:1 bar for a non-text mark. `emergency-icon.png`
(2 KiB) is now unreferenced — the eighth such asset.

**The "Sample language" notice is gone from both legal dialogs.** Removed from all four copies
by `scripts/_legal_notice_removal.py`, which asserts its match count per file because
`tests/verify.mjs` requires the four copies to be byte-identical. **This reverses a decision
recorded below as deliberate:** the warning was kept precisely because removing it makes
unreviewed text look reviewed, and the body of both documents is *still* unreviewed placeholder
copy the client could not supply — **T4 remains a release blocker**. The check that asserted the
warning's presence is inverted rather than deleted, and paired with a positive control, because
an absent dialog would otherwise satisfy "no notice" vacuously.

**Not verified in a browser:** the arch swap's timing on a slow connection. The five files are
prewarmed at init so the first pass through the list should never paint an empty frame, but that
has only been observed on localhost and a warm CDN.

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

**Kept deliberately at the time:** the "Sample language — not legal advice" warning. These are
correctness fixes, not a legal review, and removing the warning would make unreviewed text look
reviewed. **Reversed 2026-09-22** at the client's request — the notice is now removed from all four
copies, and both documents remain unreviewed. See "Home hero — relevant imagery, headline wrap, legal
notice (2026-09-22)" above.

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
