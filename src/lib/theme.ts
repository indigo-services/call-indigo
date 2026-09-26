/**
 * The per-page marketing primaries — the one place the three tokens are named.
 *
 * WHY THIS EXISTS
 * Tailwind v4 compiles `bg-residential` to
 * `background-color: var(--color-residential)`, so overriding that custom
 * property on `:root` re-colours every surface that reads it. The "change" half
 * of a colour picker is therefore just `setProperty`, and it works on the
 * marketing pages even though they are raw `BODY_HTML` strings rather than
 * React — they carry the class, the class reads the variable.
 *
 * ⚠️ WHAT "SAVE" CANNOT MEAN HERE
 * This build has no backend, and the `/admin` gate is client-side, so a saved
 * value lives in `localStorage` and is therefore **per-browser**. A visitor keeps
 * seeing the shipped defaults until the token block from `cssTokenBlock()` is
 * committed to `src/index.css` and deployed. That is a deliberate limitation, not
 * a bug to discover later — say it out loud on the page rather than implying the
 * site has changed for everyone.
 *
 * WHY `default` IS DUPLICATED WITH `index.css`
 * The stylesheet needs a value for first paint, before any JS runs; the picker
 * needs one to seed its inputs. CSS cannot import TypeScript, so the hex is
 * written twice on purpose — and the suite asserts the two agree, so the
 * duplication cannot drift silently.
 */

export interface ThemeToken {
  /** Field on `SiteSettings`. */
  key: "themeHome" | "themeResidential" | "themeCommercial"
  /** The CSS custom property Tailwind's utilities read. */
  token: "--color-brand" | "--color-residential" | "--color-commercial"
  /** Human label for the picker. */
  label: string
  /** Which route this primary actually paints. */
  page: string
  /** Must equal the value in `src/index.css`; the suite enforces it. */
  default: string
}

export const THEME_TOKENS: readonly ThemeToken[] = [
  {
    key: "themeHome",
    token: "--color-brand",
    label: "Home",
    page: "every page — it is the baseline the other two move away from",
    default: "#2a5aa2",
  },
  {
    key: "themeResidential",
    token: "--color-residential",
    label: "Residential",
    page: "/residential",
    default: "#215583",
  },
  {
    key: "themeCommercial",
    token: "--color-commercial",
    label: "Commercial",
    page: "/commercial",
    default: "#2c3a96",
  },
] as const

/** `#rgb` or `#rrggbb`, case-insensitive. */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * Coerce a user-supplied value to a lowercase `#rrggbb`, or `null` if it is not
 * a hex colour at all.
 *
 * Returns `null` rather than throwing or falling back to a default: a bad value
 * must be *dropped*, not written. `applyTheme` skipping an invalid entry is what
 * stops a malformed localStorage value from painting the whole site black.
 */
export function normaliseHex(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!HEX.test(trimmed)) return null
  const body = trimmed.slice(1).toLowerCase()
  // Expand the 3-digit form so downstream consumers only ever see 6.
  if (body.length === 3) {
    return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`
  }
  return `#${body}`
}

export type ThemeSettings = Partial<Record<ThemeToken["key"], string>>

/**
 * The token/value pairs a settings object should publish. Invalid or missing
 * entries are omitted, so a partial or corrupt record applies what it can
 * instead of resetting the site.
 */
export function themeDeclarations(settings: ThemeSettings): Array<{ token: string; value: string }> {
  const out: Array<{ token: string; value: string }> = []
  for (const t of THEME_TOKENS) {
    const value = normaliseHex(settings[t.key])
    if (value) out.push({ token: t.token, value })
  }
  return out
}

/**
 * The block to paste into `src/index.css`. This is the bridge from "previewed in
 * my browser" to "live for visitors", and it emits only the token lines: the
 * hero scrims are `color-mix()`-derived from these in CSS, so there is nothing
 * else to keep in sync.
 */
export function cssTokenBlock(settings: ThemeSettings): string {
  const lines = THEME_TOKENS.map((t) => {
    const value = normaliseHex(settings[t.key]) ?? t.default
    return `  ${t.token}: ${value};`
  })
  return lines.join("\n")
}

/**
 * Publish the tokens onto a root element.
 *
 * `root` is injectable so this is testable without a DOM — pass anything with a
 * `style.setProperty`. In the app it is `document.documentElement`.
 */
export function applyTheme(
  root: { style: { setProperty(name: string, value: string): void } },
  settings: ThemeSettings,
): void {
  for (const { token, value } of themeDeclarations(settings)) {
    root.style.setProperty(token, value)
  }
}

/**
 * WCAG relative luminance, and contrast against a reference colour.
 *
 * The picker shows these because a colour that looks good in isolation can put
 * the cyan `.hero-eyebrow` under its 3:1 large-text bar, and the slab's white
 * body copy under 4.5:1. Surfacing the number is cheaper than discovering it on
 * a phone in daylight.
 */
export function relativeLuminance(hex: string): number | null {
  const value = normaliseHex(hex)
  if (!value) return null
  const channels = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  if (la === null || lb === null) return null
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** The eyebrow accent, `--color-sky`. Duplicated from `index.css`, asserted by the suite. */
export const EYEBROW_ACCENT = "#30c3eb"

/** Bars the picker warns against: AA normal text, and AA large text. */
export const CONTRAST_BARS = { body: 4.5, eyebrow: 3 } as const
