#!/usr/bin/env node
"use strict"
/**
 * Settle the one question the numbers cannot: is residential *visibly* a different
 * blue from home, or only measurably?
 *
 * `_blue_pair.cjs` flags home↔residential as TOO CLOSE (Δhue 8°, Δlum 1.15×,
 * against thresholds of 12° and 1.28×). Thresholds are a heuristic, not a fact —
 * so rather than move a colour to satisfy the heuristic, this crops the SAME
 * region out of both bands, scales it up, and puts them adjacent. Differences the
 * eye cannot see at 1:1 often are not there at all; a difference that survives an
 * adjacent comparison is real.
 *
 * It reads the dominant colour out of each crop rather than the CSS, so what is
 * compared is pixels.
 *
 *   node scripts/_blue_pair_closeup.cjs
 */

const path = require("path")
const sharp = require(path.join(
  process.env.WORKBUDDY_NODE_WORKSPACE ||
    "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules",
  "sharp",
))

const DIR = ".preview/blues"
const SRC = [
  { file: "shipped-home.png", name: "HOME" },
  { file: "shipped-residential.png", name: "RESIDENTIAL" },
]

async function main() {
  const W = 460
  const H = 300
  const HEADER = 28
  const cols = []

  for (const s of SRC) {
    const src = path.join(DIR, s.file)
    const meta = await sharp(src).metadata()
    /*
     * Crop the LEFT EDGE of the band — the slab with its scrim and no photo subject
     * in the way, which is the flattest patch of the actual primary. Sampling the
     * centre would land on white body copy and read as near-white.
     */
    const cropW = Math.min(240, Math.round(meta.width * 0.16))
    const cropH = Math.min(meta.height, 300)

    const crop = await sharp(src)
      .extract({ left: 0, top: 40, width: cropW, height: cropH })
      .resize(W, H, { fit: "cover" })
      .png()
      .toBuffer()

    /* Average the crop — the flat patch should be the primary, near enough. */
    const { dominant } = await sharp(crop).stats()
    const hex =
      "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("")

    const svg = Buffer.from(
      `<svg width="${W}" height="${HEADER}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${W}" height="${HEADER}" fill="#0b1220"/>
         <text x="12" y="20" font-family="monospace" font-size="16" fill="#ffffff">
           ${s.name}  crop average ${hex}
         </text>
       </svg>`,
    )

    cols.push(
      await sharp({ create: { width: W, height: H + HEADER, channels: 3, background: "#ffffff" } })
        .composite([{ input: svg, left: 0, top: 0 }, { input: crop, left: 0, top: HEADER }])
        .png()
        .toBuffer(),
    )
    console.log(`  ${s.name.padEnd(12)} crop average ${hex}`)
  }

  /* Side by side, no gutter — adjacent is the whole point. */
  await sharp({ create: { width: W * cols.length, height: H + HEADER, channels: 3, background: "#ffffff" } })
    .composite(cols.map((b, i) => ({ input: b, left: i * W, top: 0 })))
    .png()
    .toFile(path.join(DIR, "closeup.png"))

  console.log(`\n  -> ${path.join(DIR, "closeup.png")}  (left = home, right = residential)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
