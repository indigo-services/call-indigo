# Design tokens (PRD §6)

**Kind:** living · **Owner:** `src/index.css` · **Asserted by:** `tests/policy.mjs`
("the design tokens are declared in exactly one file") ·
**Last verified:** 2026-09-27 at `2f009a2`

## 1. One source of truth

**All brand tokens live in `src/index.css`** (1286 lines). There is no other copy, and
the suite fails if a second file declares them.

| Rule | Why |
|---|---|
| **Do not duplicate tokens in component files.** | Two copies means two things to keep in step, and the second one rots. |
| **Do not create a `tokens.ts` that shadows the CSS.** | `src/admin/mock/tokens.ts` exists and is a **display fixture** for the Design System page only (PRD §11). It is labelled a mock and is not a source. |
| **A new token goes in `@theme` in `src/index.css`, with a comment saying why.** | The file's own convention: every line names the template token it came from and the value it replaces. |

### 1.1 Keep hex. Do not "modernise" to OKLCH

**Mixing the two encodings is how a palette silently drifts** (PRD §6.2). Every hex in
the file is measured against the static prototype — `#f4f8fe` is the mist fill sampled
from `01_Home.jpg`, `#696969` is the body copy, `#30c3eb` is the eyebrow and pill
colour. Converting one of them changes the rendered colour and invalidates the
measurement that put it there.

## 2. The two blocks, and why there are two

```
:root            shadcn semantic tokens  (--primary, --foreground, --muted, …)
   ↓ exposed via
@theme inline    --color-primary: var(--primary)   ← so Tailwind emits utilities
@theme           the marketing design system, ported verbatim
```

The split is deliberate and is stated in the file's own header comment: the shadcn
semantic tokens the `/admin` dashboard needs are kept in their **own** `:root` +
`@theme inline` blocks rather than folded into the ported `@theme`, **so the dashboard
and the marketing pages share one palette.**

### 2.1 The semantic mapping

shadcn components read `--primary`, `--foreground`, `--muted` — **not** brand tokens.
The bridge is the `:root` block:

| shadcn token | Value | Brand token it maps to |
|---|---|---|
| `--primary` | `#2a5aa2` | `--color-brand` |
| `--background` | `#ffffff` | `--color-secondary` |
| `--foreground` | `#121b3c` | `--color-ink` |
| `--muted` | `#f4f8fe` | `--color-mist` |
| `--muted-foreground` | `#696969` | `--color-body` |
| `--border` | `#e3e8f2` | `--color-line` |
| `--ring` | `#a8cdf0` | `--color-ring` |
| `--accent` | `#30c3eb` | `--color-sky` |
| `--accent-foreground` | `#091f41` | `--color-ink-2` |
| `--sidebar` | `#091f41` | `--color-ink-2` |
| `--sidebar-accent` | `#154d9f` | `--color-brand-deep` |

> **If you add a registry component that needs a token not yet mapped, add the mapping
> in `:root` — not in the component.**

## 3. The brand palette

Read off the template's own `:root` (`style.css:52-67`) rather than eyeballed.

| Token | Value | Was | Note |
|---|---|---|---|
| `--color-brand` | `#2a5aa2` | `#4a5ea3` | The home primary, and the hue everything else brackets |
| `--color-brand-deep` | `#154d9f` | `#42549b` | |
| `--color-sky` | `#30c3eb` | `#7ec1e9` | The eyebrow and pill colour |
| `--color-sky-soft` | `#aed8f1` | — | |
| `--color-ink` | `#121b3c` | — | Headings use pure `#000` — see `.h-section` |
| `--color-ink-2` | `#091f41` | `#0b1228` | |
| `--color-topbar` | `#091f41` | `#152040` | |
| `--color-ring` | `#a8cdf0` | — | |
| `--color-star` | `#e9bd4b` | — | |
| `--color-mist` | `#f4f8fe` | `#f5f8ff` | Sampled from `01_Home.jpg` |
| `--color-body` | `#696969` | `#5a6478` | |
| `--color-line` | `#e3e8f2` | — | |
| `--color-secondary` | `#ffffff` | — | Resolves to white inside the hero |

## 4. The scrims are derived, and that is load-bearing

```css
--color-scrim-hero: color-mix(in srgb, var(--color-brand) 88%, transparent);
--color-scrim-blue: color-mix(in srgb, var(--color-brand) 90%, transparent);
```

Every photo band carries a `::before` tint. **Each scrim is derived from a primary
rather than written out, so one token drives both the slab and the tint over its
photo.**

**Why this matters more than it looks:** it is what makes the admin colour picker work
at all. A picker that moved only `--color-brand` would leave the old *hardcoded* scrim
painting over the new slab — and because `.slab-photo::before` is opaque-ish at 88%,
the old colour would visibly win and the slab would barely appear to change.

**One visible consequence, recorded deliberately:** the home hero's tint **lifts to
brand at 88%**. `--color-scrim-blue` was already exactly brand at 90%; the hero scrim
was the template's separate `rgb(25 80 160 / 88%)`, a slightly darker blue, and
deriving it is what lets a brand change reach the home hero at all. The three service
scrims are unchanged, because their hardcoded values already equalled their primary.

`color-mix` is Baseline 2023 and Tailwind v4 already emits it.

## 5. Per-page primaries, and the contrast bar that caps them

The three marketing surfaces each carry their own primary, so a visitor can tell which
part of the business they are reading, and so the header's active pill agrees with the
hero it belongs to rather than contradicting it.

| Page | Primary | Hue | White text | Cyan eyebrow |
|---|---|---|---|---|
| Residential | `#215583` | 208 | **7.80:1** | 3.76:1 |
| Home (pivot) | `#2a5aa2` | 216 | **6.81:1** | 3.29:1 |
| Commercial | `#2c3a96` | 232 | **9.76:1** | 4.71:1 |

**All three are blue.** Home is the pivot and is deliberately **not** re-tokenised. The
two service pages bracket home on either side of the hue wheel rather than sitting off
it: residential 8° to the cyan side, commercial 16° the other way, with the luminance
gap (1.15× and 1.43× against home) doing the rest.

### 5.1 The rule that constrains "brighter"

Both service values were chosen so **white body copy clears AA (4.5:1) with room to
spare** *and* **the cyan `.hero-eyebrow` clears the 3:1 large-text bar.**

**That second bar is what caps "brighter".** Cyan sits at hue ~195, so every degree a
primary moves toward it narrows the gap and forces more of the contrast to come from
luminance. **Past roughly 0.119 relative luminance the eyebrow drops under 3:1, from
any hue.** Both service blues are therefore *darker* than home, and hue is what makes
them read as different colours.

### 5.2 Two rejected candidates, and why they are worth remembering

Revised 2026-09-21, twice. The first pass (client direction) had residential at
`#0c6a4e`, replacing `#0a6153` ("dark army green"), and commercial at `#37479e`,
replacing `#3f3d9e` ("purple"). The second pass, same day: **the client asked for blue
tones throughout** rather than green and purple.

**The obvious-looking move was wrong twice over, and both were rejected on a render,
not on paper:**

- hue 200 with normal saturation comes back visibly **TEAL** — the same complaint as
  the green;
- hue 212 renders as **literally home's own blue, only darker**, because it *is*
  home's hue (216) within sampling error.

> **A candidate set is only ever accepted after being shot on the real band**
> (`scripts/_blue_band_sheet.cjs` + `scripts/_blue_compare.cjs`). Arithmetic is
> permission to render, never a decision — see
> [`patterns.md` P4](./patterns.md#p4--measure-the-claim-before-changing-anything).

## 6. Type, radii, shadows, animation

| Group | Token | Value |
|---|---|---|
| **Font** | `--font-sans` | `"Archivo", "Helvetica Neue", Arial, sans-serif` |
| **Radius** | `--radius` | `0.75rem` (shadcn) |
| | `--radius-card` | `18px` (was 52px) |
| | `--radius-panel` | `14px` (was 26px) |
| **Shadow** | `--shadow-lift` | `0 18px 44px rgba(13, 21, 49, .12)` |
| | `--shadow-drop` | `0 30px 70px rgba(9, 14, 33, .35)` |
| **Animation** | `--animate-fade-up` | `fade-up .7s ease both` |
| | `--animate-drawer-in` | `drawer-in .4s cubic-bezier(.7, 0, .2, 1) forwards` |
| | `--animate-drawer-out` | `drawer-out .3s ease forwards` |

### 6.1 The v2 radius tightening

**The template's 50px slab radius is cut to 16px.** This is the single largest visual
departure from the prototype and it is a deliberate v2 decision, not a drift:

| Element | Radius |
|---|---|
| `.slab` | `16px` |
| `.outer-card` | `14px` |
| `.header-card` | `10px` |
| `.pill-topbar` | `0 0 12px 12px` |

**Rule of thumb for anything new: 16px is the largest radius on the page.**

The `.pill-topbar` value is worth noting because it looks arbitrary and is not: zeroing
the **top** radii is why the authored radius is never clamped by CSS's adjacent-corner
rule.

## 7. The gutter ladder

The file carries a measured breakpoint → gutter/inset ladder, ported from the
prototype. Two entries to understand the shape:

```
breakpoint     --gut   --inset
…
1440           13.8px                  a 16px-radius card, text 13.8px in
```

**The rule: measure a gutter against the rendered box, not against the design file.**
The ladder exists so a section's padding and its card's radius stay proportional; a
step that is changed at one breakpoint only will look correct at that width and wrong
at the next.
