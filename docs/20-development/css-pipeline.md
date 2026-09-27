# CSS pipeline

**Kind:** living · **Owner:** the repo · **Asserted by:** `tests/policy.mjs` ("Tailwind
v4 is wired through the Vite plugin, not PostCSS"; "no `tailwind.config.js`, no
`postcss.config.js`, no `tailwindcss-animate`") · **Last verified:** 2026-09-27 at `2f009a2`

## 1. Tailwind v4, not v3

This project uses **Tailwind CSS v4** via `@tailwindcss/vite`. There is:

- **No `tailwind.config.js`**
- **No `postcss.config.js`**
- **No `tailwindcss-animate`** — use `tw-animate-css` if you need it
- **No `@tailwind` directives** — use `@import "tailwindcss"`

> **If a tool, a guide or a Stack Overflow answer references any of those, it is
> describing v3 and does not apply here.** Configuration lives in
> [`design-tokens.md`](./design-tokens.md)'s `@theme` block, in CSS.

## 2. Where the CSS comes from

Two sources, and only two:

| Source | Owns |
|---|---|
| `src/index.css` | The Tailwind import, the `@theme` token block, the shadcn `:root` mapping, **and the ported marketing design system** — `.pill`, `.hero-h1`, `.banner-*`, `.statistics-*`, `.eyebrow`, `.h-section`, `.slab-photo`, `.scrim-*`, `.card`, `.legal-*` and the spacing rhythm |
| Component files | Tailwind utility classes only |

The marketing design system is **ported verbatim from `valvoro-prototype/css/tw.css`**,
which is itself the generated build of the reference markup's own
`<style type="text/tailwindcss">` block (PRD §6.2). That file is the visual contract.

**Two deliberate edits are applied to the port**, and only two:

1. `background-image` `url()`s are rooted at `/assets/images/…` (i.e. `public/`) so
   Vite resolves them, instead of the prototype's CSS-relative path.
2. The shadcn semantic tokens are kept in their own `:root` + `@theme inline` blocks
   rather than folded into the ported `@theme` — see
   [`design-tokens.md` §2](./design-tokens.md#2-the-two-blocks-and-why-there-are-two).

**Anything else that differs from the prototype is a bug, not an edit.**

## 3. The preflight drift — read this before diagnosing a parity failure

**The Vite plugin emits its own preflight.** This can shift a box by **1–2px** compared
to the Tailwind browser build the static prototype used.

> **That drift is the single most likely cause of a parity failure (PRD §13.3).**

**Measure landmark boxes, not screenshots.** A full-page screenshot scaled to fit is a
poor instrument for a 1px offset — it hides exactly the misalignment you are looking
for. See [`patterns.md` P4](./patterns.md#p4--measure-the-claim-before-changing-anything).

## 4. The class-coverage assertion

The suite has a **stylesheet coverage** check: **every class in the rendered markup is
actually emitted by the compiled CSS.**

This is the check that catches the most common Tailwind v4 mistake — a class that looks
right in the source and does not exist in the output. It has one consequence worth
knowing:

> **It reads the compiled CSS in `dist/`.** `npm run test:only` does **not** rebuild, so
> this check will happily validate a **stale** stylesheet. If you changed
> `src/index.css` or a class in JSX, run `npm run build` first, or use `npm test`.

## 5. Adding CSS

| You want to… | Do |
|---|---|
| Add a brand colour | Add it to `@theme` in `src/index.css`, with a comment naming its source and the value it replaces |
| Map a token a registry component needs | Add the mapping in `:root`, **not** in the component |
| Style a dashboard page | Tailwind utilities, plus the shadcn component's own variants |
| Style a marketing element | The ported class family in `src/index.css` — `.pill`, `.slab`, `.eyebrow`, etc. **Do not introduce a second button system** (F7) |
| Change a breakpoint | Change the gutter ladder in `src/index.css` and re-measure **every** step, not the one you care about |

### 5.1 The two-layers trap

> ⚠️ **A Tailwind class in JSX and a media query in `index.css` are two independent
> sources of truth about the same box, and the one with higher specificity wins.**

Measured: the hero's Emergency card carried `max-md:static` while `index.css` at
≤991px set `.navy-box { display: none }`. The card never appeared on a phone — and
`CHANGELOG.md` claimed it did.

**Grep both layers before believing either.** See
[`patterns.md` P5](./patterns.md#p5--two-layers-can-describe-one-behaviour-and-the-css-wins).
