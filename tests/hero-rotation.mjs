/**
 * hero-rotation — the hero headline's fit, and the arch photograph per category.
 *
 * THE BUG THIS EXISTS FOR. The hero h1 reads `Expert <word>.` and the period is a
 * SIBLING text node, not part of the rotating span. The span is what gets scaled
 * down, so the period does NOT shrink with it. Fitting the word alone to the
 * column therefore left the period nowhere to go, and it dropped onto its own
 * line on "Facility Services" — the longest option — growing the hero by exactly
 * one line-height on every tick, at every breakpoint.
 *
 * `scripts/_probe_hero_dot.cjs` measured it in a browser: with the period the h1
 * had TWO distinct heights; deleting that one text node collapsed it to ONE. The
 * numbers in the table below are those measurements, so the fix is pinned to what
 * was actually observed rather than to a round number someone liked.
 *
 * The last check is the one that gives the rest teeth: it asserts the OLD formula
 * fails these same cases. A test that only says "the new thing passes" cannot
 * tell a real fix from a vacuous one.
 */
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"

import { check, load, ROOT, suite } from "./harness.mjs"

const ARCH = { w: 376, h: 556 }

/**
 * Measured at each breakpoint by `_probe_hero_dot.cjs`.
 *
 * `base` and `available` are the h1's own font-size and content width; `trailing`
 * is the period's width at `base` (it does not scale); `widest` is
 * "Facility Services" at `base`, back-computed from its rendered width at the
 * size the old code chose.
 */
const MEASURED = [
  { vw: 1920, base: 126, available: 766, widest: 1287, trailing: 40 },
  { vw: 1440, base: 90, available: 610, widest: 920, trailing: 29 },
  { vw: 1199, base: 70, available: 518, widest: 715, trailing: 22 },
  { vw: 991, base: 55, available: 426, widest: 562, trailing: 18 },
  { vw: 768, base: 44, available: 314, widest: 450, trailing: 18 },
  { vw: 390, base: 44, available: 328, widest: 450, trailing: 14 },
]

/** Width the line actually needs at a given font-size, including the period. */
const lineWidth = (c, size) => (c.widest * size) / c.base + c.trailing

/** What the code did before the fix: fit the word to the whole column. */
const oldFormula = (c) => Math.floor((c.base * c.available) / c.widest)

/** Minimal JPEG SOF reader — the suite takes no new dependencies. */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = buf[i + 1]
    // Standalone markers carry no length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2
      continue
    }
    const len = buf.readUInt16BE(i + 2)
    const isSOF =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isSOF) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    i += 2 + len
  }
  return null
}

export async function run() {
  const { ROTATION, ARCH_BY_SERVICE, ARCH_ALT_BY_SERVICE, fitFontSize } = await load(
    "src/marketing/hero-rotation.ts",
    "hero-rotation",
  )

  suite("Hero rotation", "src/marketing/hero-rotation.ts")

  check("the fit leaves room for the period on the longest option", () => {
    const out = []
    for (const c of MEASURED) {
      const size = fitFontSize(c.base, c.widest, c.available, c.trailing)
      if (size === null) {
        out.push(`${c.vw}px — no reduction, but the line needs ${lineWidth(c, c.base).toFixed(0)}`)
        continue
      }
      const needed = lineWidth(c, size)
      if (needed > c.available) {
        out.push(`${c.vw}px — ${size}px still needs ${needed.toFixed(1)} of ${c.available}`)
      }
    }
    return out
  })

  check("the fit never shrinks a word that already fits", () => {
    // Negative control for the check above: if `fitFontSize` returned a size for
    // everything, the previous check would pass while the type shrank for no
    // reason. Zero trailing width is the degenerate case.
    const out = []
    for (const c of MEASURED) {
      if (fitFontSize(c.base, 100, c.available, 0) !== null) {
        out.push(`${c.vw}px — shrank a 100px word into ${c.available}px`)
      }
    }
    // Boundary. The sub-pixel guard is 1px, so a word with 1px to spare is still
    // left alone while one that fits EXACTLY is shaved by a pixel. That is
    // intended, not sloppy: `scrollWidth` is an integer while line-breaking is
    // fractional, so landing exactly on the boundary can lose the line to
    // rounding. Pinned here so the guard cannot be removed by accident.
    if (fitFontSize(100, 400, 401, 0) !== null) out.push("a word with 1px to spare was shrunk")
    if (fitFontSize(100, 400, 400, 0) === null) out.push("an exact fit ignored the sub-pixel guard")
    return out
  })

  check("the fit is monotonic in the space available", () => {
    // A wider column must never produce a SMALLER word. Guards against a sign or
    // ordering slip that still satisfies the single case above. `null` means "no
    // reduction", i.e. the stylesheet's own size — the largest value available.
    const out = []
    let previous = 0
    for (const available of [200, 300, 400, 500, 600, 800]) {
      const size = fitFontSize(100, 700, available, 20) ?? 100
      if (size < previous) out.push(`available ${available} gave ${size}px, smaller than ${previous}px`)
      previous = size
    }
    return out
  })

  check("the OLD formula fails these same cases", () => {
    // The reason the suite exists. If this ever stops failing, the measurement
    // table no longer describes the bug and the checks above prove nothing.
    const out = []
    for (const c of MEASURED) {
      const size = oldFormula(c)
      if (lineWidth(c, size) <= c.available) {
        out.push(`${c.vw}px — the old ${size}px fits after all; the table is stale`)
      }
    }
    return out
  })

  check("every rotation category has a photograph and alt text", () => {
    const out = []
    for (const word of ROTATION) {
      if (!ARCH_BY_SERVICE[word]) out.push(`"${word}" has no arch image`)
      if (!ARCH_ALT_BY_SERVICE[word]) out.push(`"${word}" has no alt text`)
    }
    // Distinct files: two categories sharing one photograph defeats the point.
    const srcs = ROTATION.map((w) => ARCH_BY_SERVICE[w]).filter(Boolean)
    if (new Set(srcs).size !== srcs.length) out.push("two categories share an arch image")
    return out
  })

  check("the arch files are the slot's exact natural size", () => {
    // The arch renders at NATURAL SIZE, so the file's own pixels ARE its box and
    // a differently-sized file moves the hero. `_hero_arch_build.cjs` enforces
    // this at build time; this catches a file swapped in by hand.
    const out = []
    for (const word of ROTATION) {
      const src = ARCH_BY_SERVICE[word]
      if (!src) continue
      const file = path.join(ROOT, "public", src.replace(/^\//, ""))
      if (!existsSync(file)) {
        out.push(`${word} — missing ${src}`)
        continue
      }
      const size = jpegSize(readFileSync(file))
      if (!size) {
        out.push(`${word} — could not read dimensions of ${src}`)
        continue
      }
      if (size.width !== ARCH.w || size.height !== ARCH.h) {
        out.push(`${word} — ${src} is ${size.width}x${size.height}, must be ${ARCH.w}x${ARCH.h}`)
      }
    }
    return out
  })
}
