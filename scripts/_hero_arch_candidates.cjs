#!/usr/bin/env node
"use strict"
/**
 * Which client photos can fill the arch slot at all, and what do they look like?
 *
 * The arch is 376x556 and renders at NATURAL size, so a source must be at least
 * 376 wide AND 556 tall to cover it without upscaling. `_slot_swap.cjs` has the
 * same rule ("an upscaled swap would be softer, not sharper") and
 * `_commercial_build.cjs` aborts on it. This filters first, then sheets only the
 * survivors, so no time is spent judging crops that could never ship.
 *
 * Usage: node scripts/_hero_arch_candidates.cjs
 */
const path = require("path")
const fs = require("fs")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const sharp = require(path.join(WORKSPACE, "sharp"))

const OUT_W = 376
const OUT_H = 556
const TILE_W = 430
const PAD = 12
const LABEL_H = 40
const MEDIA = "images/04-Media"

/** Everything not already spoken for on `/`, plus a few likely generalists. */
const CANDIDATES = [
  "Construction_1_Housing.jpg",
  "Construction_2_Flooring.jpg",
  "Construction_3_Roofing.jpg",
  "Specialty_2_PowerWashing.jpg",
  "Specialty_3_Restoration.jpg",
  "Commercial_2_Maintenance.jpg",
  "Commercial_4_Landscaping.jpg",
  "handyman.png",
  "row-handyman-pic030.png",
  "row-handyman-pic06.png",
  "team-img001.jpg",
  "team-img002.jpg",
  "team-img005.jpg",
  "team-img006.jpg",
  "poroject-07.jpg",
  "real-estate.jpg",
  "tm-rowbg-four.jpg",
  "flooring.jpg",
  "routine-maintenance.jpg",
]

async function main() {
  const viable = []

  console.log(`slot: ${OUT_W}x${OUT_H} natural-size — a source must be >= ${OUT_W}x${OUT_H}\n`)
  console.log(`${"candidate".padEnd(32)} ${"size".padEnd(12)} ${"ratio".padEnd(8)} verdict`)
  console.log("-".repeat(76))

  for (const name of CANDIDATES) {
    const src = path.join(MEDIA, name)
    if (!fs.existsSync(src)) {
      console.log(`${name.padEnd(32)} ${"—".padEnd(12)} ${"—".padEnd(8)} missing`)
      continue
    }
    const m = await sharp(src).metadata()
    const ok = m.width >= OUT_W && m.height >= OUT_H
    // A cover-crop scales by max(outW/srcW, outH/srcH); >1 means upscaling.
    const scale = Math.max(OUT_W / m.width, OUT_H / m.height)
    console.log(
      `${name.padEnd(32)} ${`${m.width}x${m.height}`.padEnd(12)} ` +
        `${(m.width / m.height).toFixed(3).padEnd(8)} ` +
        (ok ? "viable" : `REJECT — would upscale ${scale.toFixed(2)}x`),
    )
    if (ok) viable.push({ name, src })
  }

  if (!viable.length) {
    console.log("\nnothing viable")
    return
  }

  const tiles = []
  for (const v of viable) {
    const buf = await sharp(v.src).resize(OUT_W, OUT_H, { fit: "cover", position: "centre" }).jpeg({ quality: 80 }).toBuffer()
    tiles.push({ buf, label: v.name.replace(/\.(jpg|png)$/, "") })
  }

  const tileH = Math.round((TILE_W * OUT_H) / OUT_W)
  const cols = Math.min(5, tiles.length)
  const rows = Math.ceil(tiles.length / cols)
  const sheetW = PAD + cols * (TILE_W + PAD)
  const sheetH = PAD + rows * (LABEL_H + tileH + PAD)

  const composites = []
  for (let i = 0; i < tiles.length; i++) {
    const cx = i % cols
    const cy = Math.floor(i / cols)
    const x = PAD + cx * (TILE_W + PAD)
    const y = PAD + cy * (LABEL_H + tileH + PAD)
    composites.push({
      input: await sharp(tiles[i].buf).resize(TILE_W, tileH, { fit: "fill" }).png().toBuffer(),
      left: x,
      top: y + LABEL_H,
    })
    composites.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${LABEL_H}">` +
          `<text x="0" y="26" font-family="Segoe UI, Arial, sans-serif" font-size="19" ` +
          `font-weight="700" fill="#111">${tiles[i].label}</text></svg>`,
      ),
      left: x,
      top: y,
    })
  }

  // Generated sheet — `.preview/` is gitignored (see .gitignore).
  const dest = "C:/tmp/indigo/.preview/hero-arch-candidates.png"
  require("fs").mkdirSync(path.dirname(dest), { recursive: true })
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#e9edf4" } })
    .composite(composites)
    .png()
    .toFile(dest)
  console.log(`\n${viable.length} viable -> ${dest} (${sheetW}x${sheetH})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
