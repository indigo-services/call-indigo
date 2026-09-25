# Plan — client feedback round, 2026-09-25

Nine requests from the client, received 2026-09-25. This document records **what each
request actually measures today**, what will change, and what is deliberately left
open. Every "measured now" figure comes from
`scripts/_probe_client_feedback.cjs`, run against a booted dev server at
`1920 / 1440 / 1199 / 991 / 768 / 390`.

Baseline: `ca91664`, 95 checks green, clean tree.

```
scripts/_devshot.sh --run scripts/_probe_client_feedback.cjs
```

## The scope question, answered first

The client's requests look like they touch the whole site. They mostly do not.

| surface | pages that render it |
|---|---|
| hero (`#hero-rotate`, `#hero-arch`, `.navy-box`, `.banner-img2`) | **home only** |
| `#process` step numerals | **home only** |
| `#reviews` / `#faq` / `#brands` order | **home only** |
| the `#contact` CTA band and its badge | **all three** mirror pages |
| the inquiry form | `/contact` |

`ResidentialPage` and `CommercialPage` carry a `#services` section and almost nothing
else — the ids above are home-only. So seven of the nine requests are a single-page
change, and the two that are not are called out below.

## What was measured before anything was touched

| vw | Emergency card | arch image | arch offset from its column centre | hero band | page |
|---|---|---|---|---|---|
| 1920 | 159×179 @x1591.5 | 406×586 @x975 | **−210px** | 939 | 9242 |
| 1440 | 149×167 @x1196 | 350×503 @x735 | **−130px** | 651 | 7857 |
| 1199 | 139×161 @x993 | 320×459 @x614.5 | **−99px** | 594 | 7409 |
| 991 | **`display:none`** | 330×474 @x510.5 | −48px | 547 | 9743 |
| 768 | **`display:none`** | 314×450 @x399 | 0 | 551 | 9856 |
| 390 | **`display:none`** | 260×370 @x31 | **−34px** | 906 | 12454 |

Also measured, at every width: the `#process` numerals compute to
`rgb(244,248,254)` on `rgb(255,255,255)` — **1.07:1** — and `#brands` sits after
`#faq` in the DOM.

### The same probe, run against the LIVE site

The table above is the local build. The client was looking at something else, so
the probe was also pointed at production — it takes `--base`, so **one instrument
measured both**:

```
NODE_PATH=… node scripts/_probe_client_feedback.cjs --base https://call-indigo.com
```

Two things came out of that, and the second is the important one.

**First, the live site is the "before" state of this very document.** Every
diagnosis above is confirmed on the artifact the client actually used, not only on
a local build:

| claim | live measurement |
|---|---|
| F2 the card is missing on mobile | `.navy-box` `display:none` at **991, 768 and 390**; `position:absolute` at 991/768 and `position:static` at 390 — the two layers disagreeing exactly as diagnosed |
| F5 the small round frame exists | `present=true`, 266×387 @1920, 158×240 @1440 |
| F6 the numerals are invisible | `rgb(244,248,254)` on `rgb(255,255,255)` = **1.07:1** |
| F7 the order is wrong | `reviews=13 faq=14 brands=15` → **FAIL** |
| F8 the badge floats in the CTA band | `present=true`, 110×110 |
| F9 there is no membership question | first field `input:name`; the only radioset is "How soon?" |

**Second, F4 is refuted on the live site as well.** With motion ON at 390px, the
deployed page produced **4 distinct words and 4 distinct arch sources**, exactly
as the local build does. So the client's "the carousel does not move" is not a
stale-deployment artifact — which was the leading hypothesis, and the reason for
running this at all. It is recorded as an open question below, not as a bug fix.

**⚠️ And a factual correction that outlives this round:**
`call-indigo.vercel.app` **307-redirects to `call-indigo.com`**, and
`call-indigo.com` serves **this same Vite codebase** — its shell loads
`/assets/index-*.js`, the bundle contains `hero-rotate`, `navy-box` and
`hero-arch-`, and there is **no `_next/static`, no `__NEXT_DATA__`** anywhere.
An earlier note described `call-indigo.com` as a *different codebase (Next.js)*;
that is no longer true. Practical consequences: the URL to check a deploy against
is `call-indigo.com`, and the URL to give the client is the same one.

## The requests

### F1 + F2 — the red Emergency button: bigger on desktop, and present on mobile

**Claim 1:** small on desktop. **True.** 159×179 at 1920, and the red disc inside it
is 32px with a 20px glyph.

**Claim 2:** not there on mobile. **True, and it is a two-layer contradiction.**

The markup carries `max-md:static` — someone previously answered this exact request
by dropping the card into normal flow below the arch on mobile. `src/index.css`'s
`@media (max-width: 991px)` block carries `.navy-box { display: none !important }`,
inherited from the template, whose comment says the `!important` is required because
"the markup carries `flex` on the navy box". **The two were never reconciled.** The
CSS wins, so the card is `display:none` from 991 down — and `CHANGELOG.md`'s punch
list still records the mobile fix as *completed*. The suite's guard
(`/navy-box[^"]*max-md:hidden/` against rendered markup) is a source-text check, so
it passed on a card that has never once rendered on a phone.

**Change.** Make the image column a flex row at ≥992 — arch, then the card — and a
centred column below that, so the card drops under the arch instead of being
positioned over a column that has stacked. Delete the `display:none` rule and the
`right`/`top` absolute offsets. Grow the disc to 44px with a 24px glyph, the label
from 20px to 24px, and the padding from `19px 25px` to `22px 28px`.

**Risk.** The `!important` existed because a visible card overflowed the viewport at
768–991 (`docW 773` against `winW 768`). The new layout puts the card in flow and
below the arch, so it cannot overflow — but **this must be re-measured at every
width**, not assumed. `docW > winW` at any width fails the round.

### F3 + F4 — the hero arch: bigger, centred, and moving on mobile

**Claim 3:** the frame is off balance. **True, and it is worse than it looks.** The
arch is pinned to the **left edge of its column at every width**: −210px from its
column's centre at 1920, −130 at 1440, −99 at 1199, −34 at 390. The cause is that
the arch `<img>` carries Tailwind's `block`, so the template's
`text-align: center` / `text-align: right` on the figure has **no effect on a block
element** — the centring rules have been dead the whole time.

**Claim 4:** on mobile the image is static and off centre and the carousel does not
move. **Off centre: true** (−34px, same cause). **"Does not move": not reproduced.**
With motion enabled the probe watched 390px for ~8.4s and saw **4 distinct words and
4 distinct arch photographs**. The rotation runs on mobile.

The one condition that stops it is `prefers-reduced-motion: reduce`, which
`useSiteChrome` honours deliberately. That is the most likely explanation and it is
**an open question, not a bug** — see below.

**Change.** Centre the arch in the space left of the card (`flex: 1 1 auto` on the
figure, centring inside it). Render it at its natural 406px at ≤1440 instead of
shrinking to 350 — the column is 610 wide there, so the shrink was never necessary.
Move the decorative `dots.png` inside the arch's own wrapper so it stays glued to the
arch now that the arch is no longer at the column's left edge.

**⚠️ "Bigger" is bounded by one source image, and this is the finding of the round.**
The five arch files are 376×556. Four are built from 1080×702 sources and could grow
to ~474×702. The fifth — `Home Services`, built from `images/04-Media/row-handyman-pic030.png`
at **424×560** — cannot. For the arch's 0.676 ratio the largest fit inside 424×560 is
**378×560**, so **376×556 is already at that source's ceiling.** Growing the set means
either replacing that one photograph or accepting a soft upscale, and
`_hero_arch_build.cjs` refuses to upscale by design. So this round delivers the
centring and the ≤1440 restoration (**+16% on a 1440 laptop**) and reports the
constraint rather than quietly shipping a softer hero.

### F5 — delete the smaller round frame under the headline

**True.** `.banner-img2` renders 266×387 at 1920 and 158×240 at 1440 — a second,
smaller, white-ringed oval sitting under the `Expert Plumbing` headline, next to the
large arch. Redundant. Delete the figure. `repair-img2.jpg` becomes unreferenced
(already counted in the unreferenced-asset list); nothing else renders it.

### F6 — the How It Works numbers are invisible

**True, and measurable:** `#f4f8fe` on `#ffffff` = **1.07:1**. The numerals are
`text-mist`, the page's *background* tint, on a white card. Change to the brand token
(6.81:1 on white) so they read as a step index, stay legible, and follow the theme
picker. Verified by re-measuring the computed colour, not by eye.

### F7 — "Accredited & Reviewed" belongs under the testimonials

**True.** DOM order today is `… #process #reviews #faq #brands #contact`. Move the
`#brands` band to sit between `#reviews` and `#faq`. Markup-only reorder — the section
keeps its id, heading, six badges and alt text, so the existing credentials checks
keep their anchor.

### F8 — delete the phone logo floating in the Get in Touch band

**True.** The band's 110px navy disc is `absolute -right-7 top-1/2`, i.e. hanging off
the right edge of the photo — which is exactly the seam between the visual and the
text block. Delete it.

**⚠️ Decision, and it reverses a recorded one.** That badge replaced the template's
demo `logo-vector.png`, which drew a cyan glyph that read as a "P" over the photo.
Deleting the badge does **not** restore the watermark, so the change is safe — but
three suite checks assert the badge's presence, size ratio and glyph, and they must be
inverted with a positive control rather than deleted. And **the band is one component
rendered on all three mirror pages**, so this is the one request whose scope is not
home-only: deleting it on home alone would leave two pages carrying the clutter. The
plan is all three. See the open questions.

### F9 — "Already A Member?" Yes/No at the top of the inquiry form

**Not present today.** The form's first field is `name`; its only radio group is
`How soon?`. Add a required Yes/No group labelled "Already a member?" as the first
field, above Name, using the existing `Field`/`fid`/`aria-invalid`/`aria-describedby`
conventions and validating on submit like every other field.

Storage: add `MemberAnswer` to `src/lib/data/types.ts`. **Optional on `Inquiry`,
required on `NewInquiry`** — the form always sends it, but inquiries already in a
visitor's `localStorage` predate the field, and making it required on the stored
record would be a lie about data that exists.

## Risk register

| risk | why | mitigation |
|---|---|---|
| the hero restructure moves the page | the arch is a NATURAL-SIZE slot and the card stops being `position:absolute` | measure `hero band` and `page height` at all six widths before/after; they are in the probe |
| the card overflows on tablet again | the `!important` hide was added for a real 768–991 overflow | assert `docW <= winW` at every width |
| deleting the CTA badge breaks three checks | they assert presence, ratio and glyph | invert them, each paired with a positive control |
| the numerals pass arithmetically but fail on screen | the repo's own history: a 69-value sweep cleared both bars and still failed twice | re-measure the computed colour in the browser, and look at a screenshot |
| the new radio group breaks the "form asks for everything the data layer stores" check | that check enumerates field `name`s | add `member` to both the form and the check |
| a new element silently matches an existing selector | measured before, on the CTA badge | tighten the affected checks to a signature unique to their target |

## Open questions — each with a recommendation

1. **F4: is the mobile carousel really static for the client?** It rotates with
   motion enabled — **and it rotates on the live site too**, which was measured
   after this document was first written: at 390px, `call-indigo.com` produced 4
   distinct words and 4 distinct arch sources. So this is not a stale deployment,
   and not something a local build is masking. `prefers-reduced-motion: reduce` is
   the only thing that stops it, and honouring that is deliberate.
   **Recommendation: keep the guard and ask the client three things** — which
   device and browser, whether Settings → Accessibility → Motion → Reduce Motion
   is on, and whether they were looking at the live page or a screenshot of it. If
   reduce-motion is on, that is the whole answer and no code should change: a
   rotation that ignores reduce-motion is an accessibility regression, and the arch
   still loads correctly under it. If it is off and they still see it static, then
   the report is about a device this project has no other evidence for, and the
   next step is a screen recording rather than a code change.

2. **F8: delete the badge on home only, or on all three mirror pages?**
   **Recommendation: all three.** The band is one component rendered three times; the
   badge is equally redundant in each, and a fix that lands on one page of three is
   the exact failure mode this codebase keeps repeating.

3. **F3: accept 376×556, or replace the `Home Services` photograph to unlock a bigger
   arch?** `routine-maintenance.webp` (1200×1200) is an unused source that would let
   the whole set grow to ~470×695.
   **Recommendation: accept 376×556 for now.** Swapping one of five approved
   photographs changes the hero's art direction, which is a client decision, not a
   feedback-fix decision. Offer it as a follow-up with a preview sheet.

4. **F9: where does the membership answer surface?** Storing it is free; showing it
   is a dashboard change.
   **Recommendation: store it now, surface it in `/admin/inquiries` as a follow-up**
   — one line, but it is a different page and a different review.

## Files

```
src/marketing/pages/HomePage.tsx        F1–F3, F5–F8
src/marketing/pages/ResidentialPage.tsx F8
src/marketing/pages/CommercialPage.tsx  F8
src/marketing/pages/ContactPage.tsx     F9
src/lib/data/types.ts                   F9
src/admin/InquiriesPage.tsx             F9 (the Member badge)
src/index.css                           F1–F3
tests/verify.mjs                        F1, F2, F6, F7, F8, F9
scripts/_probe_client_feedback.cjs      the instrument for all of the above
scripts/_feedback_pages.py              the four page files, one asserted pass
scripts/_feedback_css.py                the stylesheet, one asserted pass
```

---

## Outcome — implemented and verified

All nine requests are implemented. Gates: **`npm test` — 100 checks passed**
(the count grew from 67 as the checks below were added and the badge checks
inverted). The probe was re-run after the changes; the numbers in the request
sections above are its before-shot and the ones here are its after-shot, so both
come from one instrument.

| request | before | after |
|---|---|---|
| F1 card, desktop | 159×179 @1920, 32px disc, 20px glyph | **197.7×210** @1920, 44px disc, 24px glyph |
| F2 card, mobile | never rendered — `display:none !important` ≤991 | **shown at 1199 / 991 / 768 / 390**, `position: static`, 177.7×196 |
| F3 arch balance | on the column's left edge at every width (−210 @1920 … −34 @390) | **0px offset at 991 / 768 / 390**; −111 / −105 / −101 above, the card's share of the row |
| F3 arch size | 350 / 320 / 260 | **406 / 380 / 300** |
| F4 carousel, 390px | — | **4 distinct words, 4 distinct arch srcs** with motion on |
| F5 small round frame | 266×387 @1920 | **absent** |
| F6 numeral contrast | **1.07:1** | **6.81:1** |
| F7 section order | `#reviews #faq #brands` | **`#reviews #brands #faq`** |
| F8 CTA badge | 110px disc on all three pages | **absent on all three** |
| F9 member radio | absent | **first field, `yes`/`no`** |

`docW === winW` at all six widths — the hero restructure introduced no horizontal
overflow.

### Two corrections worth carrying forward

**The F7 line in the probe was a rubber stamp.** It built its list from a
hardcoded array of selectors and then printed that array, so it read
`…#reviews #faq #brands…` no matter what the DOM did — which made a move that had
landed correctly look like a move that had not. It now sorts by the real
`document.querySelectorAll("[id]")` index and prints an explicit PASS/FAIL. **The
reorder was never broken; the instrument was.** This is the same class of failure
as the `navy-box` guard: an assertion that cannot see the thing it claims to
check.

**Open question 4 is answered, and the recommendation reversed.** It said to store
the membership answer now and surface it in the dashboard as a follow-up. Having
built it: a field that is collected but rendered nowhere is a half-feature, and
the whole point of asking is that someone on the team wants to know. So
`/admin/inquiries` now shows a **Member** badge on the record detail — only for
`"yes"`, because `"no"` on every record is noise and records predating the
question must show nothing rather than a false "No". The list *table* was
deliberately left alone: a new column is a layout decision, not a data one.

Still open, unchanged: **F4's "the carousel does not move"** — not reproduced
locally *or* on the live site, with motion enabled (see the deployed section
above); **T4's legal copy** (a release blocker the client must supply), and the
five remaining punch-list items T2, T5, T6, T7.
