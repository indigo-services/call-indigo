#!/usr/bin/env node
"use strict"
/* Where does each person actually sit in their frame, WITHIN the strip the
 * badge covers?
 *
 * WHEN TO USE THIS. Whenever a badge, lozenge or any other overlay is placed on
 * top of — or between — photographs, and the question is "does it cover a face".
 * That question cannot be answered from the rendered page by eye at 1:10, and it
 * cannot be answered by arithmetic on the overlay's box alone. It needs the
 * SOURCE pixels. Used on 2026-09-26 to decide which way round the two `#about`
 * photos had to go once the "15+ Years" badge moved into the seam between them:
 * `about-img2.jpg`'s face is at the right edge of his frame (skin columns 50-97%
 * of the width), so it had to go on the LEFT. Answering that by looking at a
 * screenshot is how the badge ended up through his face in the first place.
 *
 * Then confirm the decision by eye anyway: crop the rendered page 4x around the
 * overlay's edge (`crop.cjs` did that) — the arithmetic gives you the margins,
 * the crop tells you what the edge is actually cutting through.
 *
 * Two corrections over the first attempt, both of which produced a confident and
 * wrong answer:
 *   1. the photo does NOT render at its natural width — it renders at whatever
 *      the flex slot leaves (372/282/280 for about-img1). The badge's 301px is
 *      in RENDERED px, so the band it covers has to be converted back into the
 *      source image's rows using the ACTUAL rendered width. The first version
 *      used the natural width, which put the band at 39-61% of the image
 *      instead of the real 27-72% — i.e. it looked just below the face.
 *   2. a single leftmost/rightmost pixel is noise. Print a density profile per
 *      5% column bucket, and only call a column "person" above a threshold.
 *      Note the two detectors answer different questions: `skin` finds FACES,
 *      `skin OR dark` also finds hair and dark clothing, which is what you want
 *      for "is a person there" but NOT for "is a face there". Read both.
 *
 * Usage: _face_extent.cjs <img> <renderedWidth> [bandHeight] [bandTop]
 *   e.g. _face_extent.cjs public/assets/images/about-img2.jpg 347 100 547
 *
 * `bandTop` is the overlay's top edge in RENDERED px, measured from the top of
 * the photo — read it off the layout probe as `badge.y - photo.y`. It matters,
 * and omitting it is now a trap: this script used to assume the band was
 * vertically CENTRED, which was true of the 301px vertical lozenge it was
 * written for. The badge is a bottom-anchored horizontal lockup since the
 * 2026-09-26 revision, so a centred band measures the wrong rows and will report
 * a clearance for a strip the overlay never touches. With no `bandTop` the
 * script still centres the band, but it says so on every run.
 */

const path = require("path")
const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const sharp = require(path.join(WORKSPACE, "sharp"))

const isSkin = (r, g, b) => r > 140 && r > g && g > b && r - b > 25
const isDark = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b < 85

async function main() {
  const file = process.argv[2]
  const renderedW = Number(process.argv[3])
  const badgeH = Number(process.argv[4] || 301)
  const bandTopArg = process.argv[5] === undefined ? null : Number(process.argv[5])

  const img = sharp(file)
  const meta = await img.metadata()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height
  const ch = info.channels

  const scale = renderedW / W // image px -> rendered px
  const renderedH = H * scale
  const bandTopR = bandTopArg === null ? (renderedH - badgeH) / 2 : bandTopArg
  const bandBotR = bandTopR + badgeH
  const y0 = Math.max(0, Math.round(bandTopR / scale))
  const y1 = Math.min(H - 1, Math.round(bandBotR / scale))
  const rows = y1 - y0 + 1

  console.log(`\n${path.basename(file)}  ${W}x${H}  rendered ${renderedW}x${Math.round(renderedH)}`)
  if (bandTopArg === null) {
    console.log("  note: no bandTop given — assuming the overlay is vertically CENTRED in the photo")
  }
  console.log(`  badge is ${badgeH}px tall -> covers image rows ${y0}..${y1} = ${Math.round((y0 / H) * 100)}-${Math.round((y1 / H) * 100)}% of the height`)

  const dens = new Array(W).fill(0)
  const skinDens = new Array(W).fill(0)
  for (let x = 0; x < W; x++) {
    let n = 0
    let s = 0
    for (let y = y0; y <= y1; y++) {
      const i = (y * W + x) * ch
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (isSkin(r, g, b) || isDark(r, g, b)) n++
      if (isSkin(r, g, b)) s++
    }
    dens[x] = n / rows
    skinDens[x] = s / rows
  }

  const bucketise = (d) => {
    const out = []
    for (let b = 0; b < 20; b++) {
      const lo = Math.floor((b * W) / 20)
      const hi = Math.floor(((b + 1) * W) / 20)
      const slice = d.slice(lo, hi)
      const avg = slice.reduce((a, c) => a + c, 0) / slice.length
      out.push(`${b * 5}-${b * 5 + 5}%:${Math.round(avg * 100)}`)
    }
    return out
  }
  const buckets = bucketise(dens)
  const skinBuckets = bucketise(skinDens)
  console.log("  person (skin OR dark) density by column bucket:")
  for (let i = 0; i < 20; i += 5) console.log(`    ${buckets.slice(i, i + 5).join("  ")}`)
  console.log("  SKIN-only density by column bucket (this is where the FACES are):")
  for (let i = 0; i < 20; i += 5) console.log(`    ${skinBuckets.slice(i, i + 5).join("  ")}`)

  const edges = (d, label) => {
    const strong = []
    for (let x = 0; x < W; x++) if (d[x] >= 0.5) strong.push(x)
    if (!strong.length) {
      console.log(`  ${label}: no column is >=50% in the band`)
      return
    }
    const f = strong[0]
    const l = strong[strong.length - 1]
    console.log(
      `  ${label} >=50% columns: ${f}..${l} of ${W} = ${Math.round((f / W) * 100)}%..${Math.round((l / W) * 100)}%` +
        `  -> rendered ${Math.round(f * scale)}..${Math.round(l * scale)} of ${renderedW}` +
        `   clearance LEFT ${Math.round(f * scale)}px  RIGHT ${Math.round(renderedW - l * scale)}px`,
    )
  }
  edges(dens, "person")
  edges(skinDens, "SKIN ")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
