#!/usr/bin/env node
"use strict"
/**
 * Judge the CROP, not the source, for a candidate arch image.
 *
 * The arch is a 0.676 portrait slot fed by 1.538 landscape sources, so a
 * cover-crop keeps only ~35% of the source's width and the choice of `position`
 * decides whether the subject survives. Looking at the whole source tells you
 * nothing about that; you have to look at the crop.
 *
 * Renders one tile per (candidate x focus) at the shipped aspect, sized for
 * inspection. Same discipline as `_commercial_crop.cjs`.
 *
 * Usage: node scripts/_hero_arch_focus.cjs
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const sharp = require(path.join(WORKSPACE, "sharp"))

const OUT_W = 376
const OUT_H = 556
const TILE_W = 602
const PAD = 14
const LABEL_H = 46
const MEDIA = "images/04-Media"

/**
 * Candidates worth reconsidering, and the focuses to compare.
 *
 * The focuses are HORIZONTAL on purpose. Cropping a 1.538 landscape down to a
 * 0.676 portrait consumes the source's full height, so `north`/`centre`/`south`
 * all resolve to the same crop — measured: the first run of this sheet produced
 * three identical tiles per candidate. Only `west`/`centre`/`east` move anything.
 */
const CANDIDATES = [
  { name: "Plumbing", src: `${MEDIA}/Residential_4_Plumbing.jpg`, focuses: ["west", "centre", "east"] },
  { name: "HVAC", src: `${MEDIA}/Residential_3_HVAC.jpg`, focuses: ["west", "centre", "east"] },
]

async function main() {
  const tiles = []
  for (const c of CANDIDATES) {
    for (const f of c.focuses) {
      const buf = await sharp(c.src)
        .resize(OUT_W, OUT_H, { fit: "cover", position: f })
        .jpeg({ quality: 80 })
        .toBuffer()
      tiles.push({ buf, label: `${c.name} — ${f}` })
    }
  }

  const tileH = Math.round((TILE_W * OUT_H) / OUT_W)
  const sheetW = PAD + tiles.length * (TILE_W + PAD)
  const sheetH = PAD + LABEL_H + tileH + PAD

  const composites = []
  for (let i = 0; i < tiles.length; i++) {
    const x = PAD + i * (TILE_W + PAD)
    composites.push({
      input: await sharp(tiles[i].buf).resize(TILE_W, tileH, { fit: "fill" }).png().toBuffer(),
      left: x,
      top: PAD + LABEL_H,
    })
    composites.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${LABEL_H}">` +
          `<text x="0" y="30" font-family="Segoe UI, Arial, sans-serif" font-size="22" ` +
          `font-weight="700" fill="#111">${tiles[i].label}</text></svg>`,
      ),
      left: x,
      top: PAD,
    })
  }

  // Generated sheet — `.preview/` is gitignored (see .gitignore).
  const dest = "C:/tmp/indigo/.preview/hero-arch-focus.png"
  require("fs").mkdirSync(path.dirname(dest), { recursive: true })
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#e9edf4" } })
    .composite(composites)
    .png()
    .toFile(dest)
  console.log(`sheet -> ${dest} (${sheetW}x${sheetH})  ${tiles.length} tiles`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
