/**
 * Hero headline rotation — the half that is arithmetic, not DOM.
 *
 * The hero h1 reads `Expert <word>.` and the client asked for `<word>` to cycle
 * through the service categories, with the arch photograph beside it changing to
 * match. Three things have to agree, so they live together here and the DOM half
 * (`useSiteChrome`) reads them rather than restating them:
 *
 *   - `ROTATION`      the categories, in cycle order
 *   - `ARCH_BY_SERVICE` / `ARCH_ALT_BY_SERVICE`   the photograph for each
 *   - `fitFontSize`   how far the word must come down to keep the headline still
 *
 * WHY THE TRAILING PERIOD IS PART OF THE SUM
 * ------------------------------------------
 * The markup is
 *
 *     Expert <br> <span id="hero-rotate">Plumbing</span>.
 *
 * The period is a SIBLING text node, not part of the span. The span is what gets
 * resized, so the period does NOT shrink with it — it stays at the h1's full
 * size. A fit that measures only the word therefore leaves the column exactly
 * full and the period overflows by its own width, drops onto a second line, and
 * grows the hero by one line-height every time the longest option comes round.
 *
 * Measured at all six breakpoints (`scripts/_probe_hero_dot.cjs`): with the
 * period present the h1 has two distinct heights — the base, and the base plus
 * exactly one `line-height` — and deleting that single text node collapses it to
 * one. So `fitFontSize` budgets for the period explicitly.
 */

/** The service categories the hero cycles through, in order. */
export const ROTATION = ["Plumbing", "Electrical", "HVAC", "Home Services", "Facility Services"] as const

export type ServiceCategory = (typeof ROTATION)[number]

/**
 * The arch photograph for each category.
 *
 * These are 376x556 because the arch slot is NATURAL SIZE — `HomePage.tsx`
 * carries no `w-full` on it, so the file's own pixel dimensions ARE its rendered
 * box (376x556 content inside a 406x586 border-box). A swap that changes them
 * moves the hero, so `scripts/_hero_arch_build.cjs` pins every output to the
 * incumbent's exact dimensions and refuses to run if they no longer match.
 */
export const ARCH_BY_SERVICE: Record<ServiceCategory, string> = {
  Plumbing: "/assets/images/hero-arch-plumbing.jpg",
  Electrical: "/assets/images/hero-arch-electrical.jpg",
  HVAC: "/assets/images/hero-arch-hvac.jpg",
  "Home Services": "/assets/images/hero-arch-home.jpg",
  "Facility Services": "/assets/images/hero-arch-facility.jpg",
}

/** Alt text for each arch photograph — it must describe the image actually shown. */
export const ARCH_ALT_BY_SERVICE: Record<ServiceCategory, string> = {
  Plumbing: "Call Indigo plumber working on the pipework under a sink",
  Electrical: "Call Indigo electrician wiring a distribution panel",
  HVAC: "Call Indigo HVAC technician in safety gear on site",
  "Home Services": "Call Indigo handyman with a tool belt and a spirit level",
  "Facility Services": "Call Indigo crew cleaning and maintaining a commercial office",
}

/**
 * `scrollWidth` is an integer while line-breaking uses fractional glyph
 * advances, so the budget is rounded down by a pixel rather than landing exactly
 * on the boundary and losing the line to rounding.
 */
const SUBPIXEL_GUARD = 1

/**
 * The largest whole-pixel font-size at which the widest rotation option still
 * fits `available`, once the trailing punctuation has taken its share.
 *
 * `widest` and `trailing` are both measured at `base`. Returns `null` when no
 * reduction is needed, so the caller can leave the stylesheet's size alone —
 * which is also the signal that the stylesheet is already small enough.
 */
export function fitFontSize(
  base: number,
  widest: number,
  available: number,
  trailing: number,
): number | null {
  if (!(base > 0) || !(widest > 0) || !(available > 0)) return null
  const room = available - trailing - SUBPIXEL_GUARD
  if (room <= 0) return null
  if (widest <= room) return null
  return Math.floor((base * room) / widest)
}
