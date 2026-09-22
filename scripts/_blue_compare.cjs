#!/usr/bin/env node
"use strict"
/**
 * The three-way decision sheet: home vs the two finalists, stacked at the same
 * frame so the only variable is the colour.
 *
 * The 9-band sheet was the wrong instrument for judging hue — scaled to fit, every
 * band was too small to see. Judgement needs one band at full width, so this
 * stacks exactly three and nothing else.
 *
 *   node scripts/_blue_compare.cjs
 */

const path = require("path")
const sharp = require(path.join(
  process.env.WORKBUDDY_NODE_WORKSPACE ||
    "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules",
  "sharp",
))

const CYAN = "#30c3eb"
const WHITE = "#ffffff"

function ch(h) { const b = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(b.slice(i, i + 2), 16) / 255) }
function sl(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
function lum(h) { const [r, g, b] = ch(h).map(sl); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
function con(a, b) { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
function hue(h) {
  const [r, g, b] = ch(h)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  if (!d) return 0
  let x
  if (mx === r) x = ((g - b) / d) % 6; else if (mx === g) x = (b - r) / d + 2; else x = (r - g) / d + 4
  return Math.round((x * 60 + 360) % 360)
}

const SET = [
  { file: "home.png", name: "HOME ", token: "--color-brand", hex: "#2a5aa2" },
  { file: "residential2.png", name: "RESID", token: "--color-residential", hex: "#215583" },
  { file: "commercial1.png", name: "COMMERCIAL", token: "--color-commercial", hex: "#2c3a96" },
]

const DIR = ".preview/blues"

async function main() {
  const W = 1360
  const H = 380
  const HEADER = 30
  const cells = []

  for (const s of SET) {
    const band = await sharp(path.join(DIR, s.file))
      .resize(W, H, { fit: "cover", position: "top" })
      .png()
      .toBuffer()
    const label =
      `${s.name}  ${s.hex}  hue ${hue(s.hex)}°  ${s.token}   ` +
      `white ${con(WHITE, s.hex).toFixed(2)}:1   cyan ${con(CYAN, s.hex).toFixed(2)}:1`
    const svg = Buffer.from(
      `<svg width="${W}" height="${HEADER}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${W}" height="${HEADER}" fill="#0b1220"/>
         <text x="14" y="21" font-family="monospace" font-size="16" fill="#ffffff">${label}</text>
       </svg>`,
    )
    cells.push(
      await sharp({ create: { width: W, height: H + HEADER, channels: 3, background: "#ffffff" } })
        .composite([{ input: svg, left: 0, top: 0 }, { input: band, left: 0, top: HEADER }])
        .png()
        .toBuffer(),
    )
  }

  const total = cells.length * (H + HEADER)
  await sharp({ create: { width: W, height: total, channels: 3, background: "#ffffff" } })
    .composite(cells.map((buf, i) => ({ input: buf, left: 0, top: i * (H + HEADER) })))
    .png()
    .toFile(path.join(DIR, "decision.png"))

  console.log(`  -> ${path.join(DIR, "decision.png")}\n`)
  console.log("  separation (home is the pivot):")
  const pairs = [
    ["home", SET[0].hex],
    ["residential", SET[1].hex],
    ["commercial", SET[2].hex],
  ]
  for (const [name, hex] of pairs) {
    const dh = Math.abs(hue(SET[0].hex) - hue(hex))
    const s = 360 - dh
    const [hi, lo] = [lum(SET[0].hex), lum(hex)].sort((a, b) => b - a)
    console.log(
      `    ${name.padEnd(12)} Δhue ${String(Math.min(dh, s)).padStart(3)}°   Δlum ${((hi + 0.05) / (lo + 0.05)).toFixed(2)}×`,
    )
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
