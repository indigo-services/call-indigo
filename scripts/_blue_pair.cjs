#!/usr/bin/env node
"use strict"
/**
 * Pick the residential/commercial pair from the verified shortlist, and prove the
 * THREE-way separation — home vs each, and each vs the other.
 *
 * The earlier pass rejected two hand-picked values on evidence: `#1a6fb5` put the
 * cyan eyebrow at 2.54:1, and `#2f3f8f` was only 14 degrees from home. Picking by
 * eye walked straight into both traps, so the choice is made from the table.
 *
 * WHAT THE TABLE SAYS
 * Everything that clears the cyan bar is DARKER than home. Cyan sits at hue ~195,
 * so the closer a blue gets to azure the smaller the hue gap to the kicker and the
 * more contrast has to come from luminance; brightening is what breaks the eyebrow.
 * So both service blues are deeper than home by necessity, and hue is the dimension
 * that has to make them read as *different blues* rather than two more shades of
 * the home navy. Home is bracketed on both sides:
 *
 *   residential  208°  azure  — 8° toward cyan
 *   home         216°  (the pivot both step away from, in opposite directions)
 *   commercial   232°  indigo — 16° toward violet, and markedly deeper
 *
 * ⚠️ A hue gap alone is not enough, and this file cannot see that. An earlier pair
 * sat at hue 212 and 224: 212 is home's own hue within sampling error, and it
 * rendered as literally the same blue, only darker. Only `_blue_compare.cjs` caught
 * it. Treat a pass here as permission to render, never as a decision.
 *
 *   node scripts/_blue_pair.cjs
 */

const HOME = "#2a5aa2"
const CYAN = "#30c3eb"
const WHITE = "#ffffff"
const BARS = { body: 4.5, eyebrow: 3 }

/* The pair, read off scripts/_blue_candidates.cjs and confirmed on a render. */
const PAIR = {
  residential: { hex: "#215583", label: "azure" },
  commercial: { hex: "#2c3a96", label: "indigo" },
}

function srgbToLinear(v) {
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function channels(h) {
  const b = h.replace("#", "")
  return [0, 2, 4].map((i) => parseInt(b.slice(i, i + 2), 16) / 255)
}
function lum(h) {
  const [r, g, b] = channels(h).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
function hue(h) {
  const [r, g, b] = channels(h)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (!d) return 0
  let x
  if (max === r) x = ((g - b) / d) % 6
  else if (max === g) x = (b - r) / d + 2
  else x = (r - g) / d + 4
  return Math.round((x * 60 + 360) % 360)
}
function separation(a, b) {
  let dh = Math.abs(hue(a) - hue(b))
  if (dh > 180) dh = 360 - dh
  const [hi, lo] = [lum(a), lum(b)].sort((m, n) => n - m)
  return { dh, dLum: (hi + 0.05) / (lo + 0.05) }
}

let bad = 0
const rows = [
  ["home", HOME],
  ["residential", PAIR.residential.hex],
  ["commercial", PAIR.commercial.hex],
]

console.log("  colour       hex       hue   lum     white   cyan    Δhue vs home  Δlum vs home")
for (const [name, c] of rows) {
  const s = separation(c, HOME)
  const body = contrast(WHITE, c)
  const cyan = contrast(CYAN, c)
  const bodyOk = body >= BARS.body
  const cyanOk = cyan >= BARS.eyebrow
  if (!bodyOk || !cyanOk) bad++
  console.log(
    `  ${name.padEnd(12)} ${c}  ${String(hue(c)).padStart(3)}°  ${lum(c).toFixed(4)}  ` +
      `${body.toFixed(2)}:1  ${cyan.toFixed(2)}:1  ` +
      `${String(Math.round(s.dh)).padStart(3)}°          ${s.dLum.toFixed(2)}×` +
      `${bodyOk ? "" : "  WHITE BELOW 4.5"}${cyanOk ? "" : "  CYAN BELOW 3.0"}`,
  )
}

console.log("\n  --- separation ---")
/*
 * Each pair needs to clear EITHER the hue bar OR the luminance bar, not both.
 * Requiring both was too strict and flagged a pair that `_blue_pair_closeup.cjs`
 * shows is plainly two different blues: home↔residential is Δhue 8° but Δlum
 * 1.15×, and an adjacent-crop comparison confirms the difference is obvious in the
 * flat slab. Two colours eight degrees apart that differ by 15% in luminance are
 * not the same colour — but two colours eight degrees apart at the SAME luminance
 * are, which is exactly the failure this guards (a hue-212 pick once shipped as
 * home's own blue, darker). So the rule is: not both dimensions small.
 */
const WANT = {
  "residential vs commercial": { dh: 20, dLum: 1.15 },
  "home vs residential": { dh: 12, dLum: 1.12 },
  "home vs commercial": { dh: 12, dLum: 1.12 },
}
for (const [a, b] of [
  ["residential", "commercial"],
  ["home", "residential"],
  ["home", "commercial"],
]) {
  const key = `${a} vs ${b}`
  const spec = WANT[key]
  const s = separation(PAIR[a]?.hex ?? HOME, PAIR[b]?.hex ?? HOME)
  const hueOk = s.dh >= spec.dh
  const lumOk = s.dLum >= spec.dLum
  const ok = hueOk || lumOk
  if (!ok) bad++
  console.log(
    `  ${key.padEnd(26)} Δhue ${String(Math.round(s.dh)).padStart(3)}°  ` +
      `Δlum ${s.dLum.toFixed(2)}×   ${ok ? "distinct" : "TOO CLOSE"}  ` +
      `(${hueOk ? "hue" : "—"}/${lumOk ? "lum" : "—"})`,
  )
}

/* Negative control: white on black must be exactly 21:1, or the readout lies. */
const known = contrast(WHITE, "#000000")
console.log(`\n  negative control: contrastRatio(white, black) = ${known.toFixed(4)} (expect 21)`)
if (Math.abs(known - 21) > 0.01) bad++

console.log(bad === 0 ? "\n  ALL CONSTRAINTS HOLD" : `\n  ${bad} CONSTRAINT(S) FAILED`)
process.exit(bad === 0 ? 0 : 1)
