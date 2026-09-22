#!/usr/bin/env node
"use strict"
/**
 * Shortlist blue primaries for residential/commercial BEFORE rendering them.
 *
 * The brief is "blue tones, not green or purple, and different from home"
 * (#2a5aa2, hue 216). Three constraints have to hold at once and they fight each
 * other, so the arithmetic is done here rather than by eye:
 *
 *   1. white body copy   >= 4.5:1   (WCAG AA)
 *   2. cyan eyebrow      >= 3.0:1   (large text; --color-sky #30c3eb)
 *   3. distinguishable from home
 *
 * (3) is the one that is easy to fake, and this script got it wrong once. Home is
 * a *medium* blue, so another blue can separate from it by HUE (slide toward azure
 * ~205 or toward indigo ~235) or by LUMINANCE (go materially darker) — but not by
 * neither. Any candidate within ~12 degrees of 216 AND within ~20% relative
 * luminance of home is a shade of home, not a different colour.
 *
 * ⚠️ THE OUTPUT OF THIS SCRIPT IS NECESSARY BUT NOT SUFFICIENT. It found 69
 * passing candidates on the first sweep and the hand-picked pair from that list
 * still failed on screen: one rendered TEAL (hue 200) and the other rendered as
 * home's own blue (hue 212 — home's hue within sampling error). Passing arithmetic
 * only means a colour is *allowed*; whether it reads as a different blue under a
 * photo and an 88% scrim is a question only a render answers:
 * `_blue_band_sheet.cjs` → `_blue_compare.cjs` (candidates) → `_probe_blue_shipped.cjs`
 * (the committed stylesheet).
 *
 *   node scripts/_blue_candidates.cjs
 */

const HOME = "#2a5aa2"
const CYAN = "#30c3eb"
const WHITE = "#ffffff"

const BARS = { body: 4.5, eyebrow: 3 }

function srgbToLinear(v) {
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function channels(hex) {
  const body = hex.replace("#", "")
  return [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16) / 255)
}
function lum(hex) {
  const [r, g, b] = channels(hex).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
function hue(hex) {
  const [r, g, b] = channels(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (!d) return 0
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return Math.round((h * 60 + 360) % 360)
}
function hex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
}
/** HSL -> RGB, which is the natural way to walk a hue while holding lightness. */
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return hex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

const HOME_HUE = hue(HOME)
const HOME_LUM = lum(HOME)

console.log(`home            ${HOME}  hue ${HOME_HUE}°  luminance ${HOME_LUM.toFixed(4)}`)
console.log(`cyan eyebrow    ${CYAN}  white ${contrast(WHITE, HOME).toFixed(2)}:1  cyan ${contrast(CYAN, HOME).toFixed(2)}:1\n`)

/** How far apart two colours read: hue difference, and the luminance ratio. */
function separation(a, b) {
  let dh = Math.abs(hue(a) - hue(b))
  if (dh > 180) dh = 360 - dh
  const [hi, lo] = [lum(a), lum(b)].sort((m, n) => n - m)
  return { dh, dLum: (hi + 0.05) / (lo + 0.05) }
}

/*
 * Walk a blue band only: azure 200° through indigo 245°. Green (teal, ~170) and
 * purple (~270) are outside it by construction, which is the brief.
 *
 * Lightness is swept because hue alone cannot clear the cyan bar — cyan sits near
 * 195°, so the closer a blue gets to azure the smaller the hue gap to the kicker
 * and the more contrast has to come from luminance.
 */
const ACCENT = 0.55 // --color-sky is a fairly saturated cyan; keep candidates similar

const rows = []
for (let h = 200; h <= 245; h += 5) {
  for (let l = 0.26; l <= 0.46; l += 0.02) {
    const c = hslToRgb(h, 0.58, l)
    const body = contrast(WHITE, c)
    const cyan = contrast(CYAN, c)
    const vsHome = separation(c, HOME)
    if (body < BARS.body) continue
    if (cyan < BARS.eyebrow) continue
    // Reject anything that is merely a shade of home.
    if (vsHome.dh < 12 && vsHome.dLum < 1.2) continue
    rows.push({ c, h, l, body, cyan, lum: lum(c), ...vsHome })
  }
}

rows.sort((a, b) => b.cyan - a.cyan)

console.log(`${rows.length} candidates clear AA white copy AND the 3:1 cyan eyebrow:\n`)
console.log("  hex       hue   lum     white   cyan    vs home")
for (const r of rows) {
  console.log(
    `  ${r.c}  ${String(r.h).padStart(3)}°  ${r.lum.toFixed(4)}  ` +
      `${r.body.toFixed(2)}:1  ${r.cyan.toFixed(2)}:1  ` +
      `Δhue ${String(Math.round(r.dh)).padStart(3)}°  Δlum ${r.dLum.toFixed(2)}×`,
  )
}

/*
 * The two picks. Chosen for legibility of the *set*, not of each colour alone:
 * they must separate from home AND from each other. Home is bracketed on both
 * sides rather than one service blue sitting on top of it —
 *   residential  haze 208  azure   (8° toward cyan, darker)
 *   home         216       the pivot
 *   commercial   haze 232  indigo  (16° toward violet, darker still)
 * so no two of the three share a hue by accident.
 */
console.log("\n--- as shipped ---")
const SHIPPED = { residential: "#215583", commercial: "#2c3a96", home: HOME }
for (const [name, c] of Object.entries(SHIPPED)) {
  const s = separation(c, HOME)
  console.log(
    `${name.padEnd(12)} ${c}  hue ${String(hue(c)).padStart(3)}°  lum ${lum(c).toFixed(4)}  ` +
      `white ${contrast(WHITE, c).toFixed(2)}:1  cyan ${contrast(CYAN, c).toFixed(2)}:1  ` +
      `vs home: Δhue ${Math.round(s.dh)}° Δlum ${s.dLum.toFixed(2)}×`,
  )
}
const pair = separation(SHIPPED.residential, SHIPPED.commercial)
console.log(
  `residential vs commercial: Δhue ${Math.round(pair.dh)}°  Δlum ${pair.dLum.toFixed(2)}×`,
)
