# Client feedback round 3 — plan and evidence, 2026-09-26

Two revisions the client raised after seeing round 2 live. Both are **Home-page
only**: `.navy-box` is written once (in `HomePage.tsx`), and the "15+ Years" badge
exists on no other route — so unlike round 2 this touches one page, not three, and
carries no chrome-drift risk.

Instrument: **`scripts/_probe_hero_about_refine.cjs`** (new), run before and after
at the same six widths round 2 used — 1920 / 1440 / 1199 / 991 / 768 / 390. Both
columns of numbers below come from that one probe.

Gate: **`npm test` → 107 checks passed** (was 100; +7 in a new suite,
*Hero Emergency card and About row*).

---

## 1. The Emergency card — red, with its disc half out of the box

> *"Let's make the inner padding of the home hero Emergency Icon Box slightly
> smaller, make the red phone icon larger and protrude out the top of the box
> boundary halfway, and make the background of the box also red — where the icon
> is a dark red and the box bg is a muted same tone red."*

### Measured, before → after

| | before | after |
|---|---|---|
| inner padding @1920 | `22px 28px` | **`19px 25px`** |
| inner padding @1440 | `18px 22px` | **`16px 19px`** |
| inner padding @1199 and below | `15px 18px` | **`13px 16px`** |
| disc | 44×44, `#d92d20` | **58×58, `#6f150e`** |
| glyph | 24px | **30px** |
| disc vs the card's top edge | 22px *inside* it | **29px above it — half of 58** |
| card background | `#091f41` (navy) | **`#b5534a` (muted red)** |
| white on the card bg | 16.36:1 | **4.88:1** |
| white on the disc | 4.83:1 | **11.74:1** |
| card size @1920 | 197.7×210 | 191.7×170 |
| gap disc → "Emergency" | 10px | 10px *(unchanged)* |

The card is shorter than it was (170 vs 210) because the disc's pull-back removes
29px from the content box while the disc itself adds 29px of visual height above
it — so the visual mass is preserved and the disc reads as breaking the box.

### The colour pair is arithmetic, not taste

The card carries a **15px/500** sub-line ("Typical arrival 30–60 min"), so it needs
**4.5:1** — not the 3:1 a 24px+ bold line would. That is the binding constraint,
and it rules out the obvious reading of "muted": a red that is merely *darker*
than the old `#d92d20` fails. Measured:

| candidate | white on it | verdict |
|---|---|---|
| `#d92d20` (the old disc) | 4.83:1 | passes, but it is the saturated red we are moving away from |
| `#c26a5e` | **3.81:1** | **fails** — a "muted red" one step lighter |
| `#b5534a` **← chosen** | **4.88:1** | passes |
| `#96453c` | 6.54:1 | passes, but reads brown rather than red |

`#b5534a` is **hsl(5 41% 50%)** — the same hue as `#d92d20` at 73% saturation,
i.e. genuinely "a muted same-tone red". The disc is **`#6f150e`**, that hue at 24%
lightness, which is "a dark red" literally. White on the disc is 11.74:1.

**Disc against the card is 2.4:1**, and that is deliberate rather than a miss: the
disc is `aria-hidden` decoration and the **phone glyph** is the mark, so WCAG
1.4.11 is answered by the glyph's own 11.74:1 against the disc, not by the disc's
edge against the card. A hard edge there would read as two unrelated shapes.

### Why the protrusion is a derived margin and not `-29px`

"Halfway out of the top edge" is a claim about two rects, so it cannot be asserted
by the suite — `renderToStaticMarkup` has no layout engine. It is measured by the
probe instead, at every width.

What the implementation has to get right is that **half the disc must clear the
card's BORDER box**, and the card's padding pushes its content down from that
border box. So the pull-back is half the disc **plus the card's top padding**:

```css
.navy-box      { --emergency-disc: 58px; --emergency-pad-y: 19px; padding: var(--emergency-pad-y) 25px; }
.emergency-disc{ width: var(--emergency-disc); height: var(--emergency-disc);
                 margin-top: calc(-1 * (var(--emergency-disc) / 2 + var(--emergency-pad-y))); }
```

A literal `margin-top: -29px` would lift the disc only **11px** clear at the base
breakpoint (29 − 19 padding), not 29 — and it would drift at every breakpoint,
because `--emergency-pad-y` changes at each one. The derivation is pinned by two
tests, including a **positive control** that feeds the detector `-29px` and
requires it to complain.

**One knock-on.** At ≤991 the hero column stacks and the arch-to-card gap was
20px. A disc protruding 29px would have driven **9px into the photograph**, so the
gap became **49px** — 20 + 29 — which preserves exactly the original daylight.
Confirmed by eye at 991, 768 and 390.

---

## 2. The "15+ Years" badge — two revisions, and the photos swap

> *"the icon box 15+ Years Experience need to be between the two photos to the
> left, but with the images swapped so the icon box doesn't overlap the left image
> person's photo."*

### Where it was, measured

`right: -29%` of the **right photo's wrapper**. At 1920 that put the badge at
x744.6 — **360px to the right of the seam** between the photos, 104px of it ON the
right photo, and its last **100px hanging past the photo row entirely**, out over
the white slab.

### Revision 1 — the badge's left edge on the seam

`.years-badge { position: absolute; left: -30px; top: 0; bottom: 0; margin: auto }`

`-30px` is not arbitrary: **30px is the row's own gap** (`gap-[30px]`), so the
badge's left edge lands exactly on the left photo's right edge. It bridges the
gutter and overlaps the right photo only.

| width | left photo | right photo | overlap on left | overlap on right |
|---|---|---|---|---|
| 1920 | `about-img2.jpg` 347 | `about-img1.jpg` 372 | **0px** | 175px |
| 1440 | 263.5 | 282.5 | **0px** | 175px |
| 1199 | 223.3 | 239.4 | **0px** | 175px |
| 991 | 260 | 280 | **0px** | 175px |
| 768 | 260 | 280 | **0px** | 175px |
| 390 | — | — | badge hidden (`max-md:hidden`, unchanged) | — |

`left: -30px` rather than a percentage because the thing it has to match is the
gutter, and the gutter is a fixed 30px at every width where the badge is on
screen. (At ≤767 the row's gap drops to 0 — and the badge is hidden there, so the
two never disagree.)

The photos swap as asked, and **the width allocations travel with them**:
`flex-[347]`/`max-w-[347px]` now sit on `about-img2.jpg` and `flex-[372]` on
`about-img1.jpg`. Those numbers are each file's own natural width (372 for
`about-img1`, 347 for `about-img2`), so leaving them behind would upscale the
347px source into a 372px box and squeeze the other.

### Why the swap is the safe way round — read off the source pixels

The instruction has an ambiguity worth recording, because the two readings give
different layouts. A 205px badge cannot straddle a 30px gutter without covering
both photos, so something has to be covered. Which side is safe was measured with
**`scripts/_face_extent.cjs`** — it scans the source images inside the exact strip
the badge occupies (the badge is 301px tall and centred, so the strip is a known
band of each file), and prints a density profile of person-coloured columns:

- **`about-img2.jpg`** (blue cap, property inspection): skin-coloured columns run
  from **50% to 97%** of the frame. His **face is at the right edge**, so on the
  LEFT a badge at the seam would go through it. Its left 50% is his back and
  shoulder — safe.
- **`about-img1.jpg`** (two technicians): the young man's face sits in the middle
  of the frame; the **left edge is wall, cabinet and a hand**. The older man's
  polo shirt and forearm occupy the right edge.

So the safe arrangement for a badge pinned at the seam is the one shipped:
`about-img2.jpg` on the left (untouched), `about-img1.jpg` on the right (its left
edge covered).

### Verified by eye — and the one thing that is tight

A badge can satisfy every geometric check and still land on a face, so a **4× crop
of the badge's right edge at its widest point** (`scripts/_crop.cjs`) was
inspected: it shows the older man's **polo shirt and forearm. No face.**

**The honest caveat.** The badge is 205px wide in a 30px gutter, so it necessarily
covers part of the right photo — 175px of 372px at 1920, and 175px of **282px** at
1440, i.e. 62%. At 1440 the clearance from the technician's hair at the badge's
upper corner is the tightest point in the layout: **single-digit pixels, no
overlap.** Nothing is covered, but there is not much air. See open question Q1.

### Revision 2 (same day) — horizontal, and centred at the bottom

> *"update the 15+ Years of Service to make it a horizontal icon box, blue icon on
> left, '15+…' text on right. and be centered bottom middle between the two
> photos."*

The first revision put the badge's **left edge** on the seam. "Centred" is a
different anchor, so it became a **two-part** mechanism:

`.years-badge { position: absolute; left: -15px; transform: translateX(-50%); bottom: 22px }`

`-15px` is **half** the row's 30px gap, which lands the badge's left edge on the
seam's midpoint; `translateX(-50%)` then shifts its **centre** onto it. Both halves
are load-bearing — `left` alone leaves the badge entirely to the *right* of the
seam. That is exactly why the test asserts the transform explicitly instead of
just "a negative `left`": the previous anchor satisfies the weaker claim.

| width | badge | centre vs seam | overlap left | overlap right | bottom vs row |
|---|---|---|---|---|---|
| 1920 | 264×100 | **0px** | 117px | 117px | −22px |
| 1440 | 222.8×84 | **0px** | 96.4px | 96.4px | −16px |
| 1199 | 222.8×84 | **0px** | 96.4px | 96.4px | −16px |
| 991 | 222.8×84 | **0px** | 96.4px | 96.4px | −16px |
| 768 | 222.8×84 | **0px** | 96.4px | 96.4px | −16px |
| 390 | hidden | — | — | — | — |

The overlaps are now **symmetric** — the badge straddles the seam rather than
sitting inside the right photo — and every dimension moved into a `--yb-*`
variable with a ≤1440 step, so **the whole lockup shrinks with the photos**
(264×100 → 222.8×84). That step *is* the Q1 fix: the 62% coverage Q1 flagged
becomes 96.4 of 263.5 = **37%** at 1440, and the single-digit clearance from the
technician's hair disappears because the badge no longer reaches that corner.

**Faces re-checked for the new band, not the old one.** `_face_extent.cjs` had the
band's vertical position hardcoded as *centred* — correct for the 301px vertical
lozenge it was written for, wrong for a bottom-anchored lockup. It now takes the
band's top explicitly, and says so when you omit it. Re-measured with the real
band:

- **left photo**, rows **617–700** (88–100% of the frame): the man's overalls and a
  pale surface. His **face is at the top of the frame — outside the band.**
- **right photo**, rows **1094–1294** (82–97%): the wooden counter and both men's
  forearms. **Faces at the top — outside the band.**

⚠️ A caveat about that instrument: its `skin` predicate
(`r>140 && r>g>b && r−b>25`) **matches warm wood**, so the right photo reports
47–100% "skin" across every column — that is the worktop, not skin. Read the
profile as *"where is the top of this frame"* and confirm faces by eye.

**Verified by eye at 1920** with a 2× crop: white card, `rounded-[18px]`, a navy
disc holding the family glyph at the left, "15+" over "Years of Experience" at the
right. No face under it.

**One judgement call worth naming.** The row is `items-center` and the two photos
have different heights (at 1920, 559.2 against 669), so the shorter left photo has
~55px of dead space above and below it. A badge anchored 22px above the **row's**
bottom therefore hangs **32.9px below the left photo's** bottom edge, and its
lower-left corner sits on the white slab with only its shadow for an edge. That is
the literal reading of "bottom middle between the two photos" and it is what
shipped; the alternative — anchoring to the shorter photo's bottom — would put the
badge mid-way up the right photo instead. Flagged, not changed unilaterally.

---

## Open questions — answers needed to finish

### Q1. The badge is 205px in a 30px gutter. Shrink it at ≤1440? — **CLOSED**

**Answer: yes — the recommendation, implemented in revision 2 above.** Every
dimension is now a `--yb-*` variable with a ≤1440 step, so the lockup scales with
the photos (264×100 → 222.8×84) and coverage at 1440 falls from 62% to 37%. The
tight corner from the technician's hair is gone with it.

*The question as it was asked, kept for the record:* at 1920 the badge covers 47% of the right photo and the clearance is comfortable.
At 1440 and below the photos shrink (372 → 282) while the badge does not, so it
covers **62%** and the clearance drops to a few pixels. The badge is at the
reference template's size (205×301) and the client did not ask for it to change.

- **Recommend:** scale it one step at ≤1440 (e.g. 172×253) so it stays
  proportionate to the photos, keeping `left: -30px`. Nothing else moves.
- Alternative: leave it exactly as the reference has it and accept the tight
  corner on laptops.
- Alternative: reduce the row's gap so the gutter is narrower and the badge tucks
  in further — **not recommended**, it changes the photo rhythm.

### Q2. F4 — "on mobile the carousel does not move" — **CLOSED, no action**

The client confirmed this was **user-specific** (their own device/browser), not a
site defect. Nothing changed. The original finding stands: locally and on the live
site at 390px with motion on, the probe sees **4 distinct words and 4 distinct arch
photographs** across 12 samples; only `prefers-reduced-motion: reduce` stops it,
and that is respected on purpose.

### Q3. T4 — the Terms of Service and Privacy text — **CLOSED for the prototype**

The client's answer: **treat it as done for now — this is a prototype.** The pages
ship as they are. The release-blocker status moves with it: the placeholder copy
still carries its own warning, so a *public* launch would still need the real text.
Facts a rewrite must not break, all verified against the build: **no cookie is
set**, **no analytics exists**, the form collects **no postal address**, and the
**captcha is local arithmetic** with no third-party service.

### Q4. Punch list T2, T5, T6, T7 *(needs the client's decisions)*

Unchanged from the round-2 plan document. T2/T5–T7 are still open; **T3 is
closed**.

---

## Status of the whole client-feedback thread

| | state |
|---|---|
| Round 1 — hero imagery, headline wrap, legal notice | shipped `ca91664` |
| Round 2 — nine requests | shipped `788913f`, live and verified byte-identical |
| Round 3, revision 1 — Emergency card + badge at the seam | shipped `67d11f9` |
| Round 3, revision 2 — horizontal badge, bottom-centred | **implemented, 109 checks green, not yet pushed** |
| F4 (mobile carousel) | closed — user-specific, no action |
| T4 (ToS/Privacy) | closed for the prototype; a public launch still needs the real text |
| Punch list T2, T5–T7 | open — needs Q4 |
