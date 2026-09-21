/**
 * Preview helper: composite the credentials row at its REAL rendered size so its
 * balance can be judged without a browser.
 *
 * The markup is `flex flex-wrap items-center justify-center gap-11` with
 * `h-10 w-auto object-contain` on every badge. gap-11 = 2.75rem = 44px, h-10 =
 * 2.5rem = 40px. Because the badges have different aspect ratios, `w-auto` means
 * their WIDTHS differ a lot, which is the thing worth looking at.
 *
 * Renders twice: in colour, and with the shipped `opacity-55 grayscale`.
 *
 * Usage: node scripts/_credential_row.cjs
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const PUB = path.resolve(__dirname, "..", "public", "assets", "images")

const FILES = [
  "credential-bbb-accredited.png",
  "credential-angies-list.png",
  "credential-homeadvisor-elite.png",
  "credential-homeadvisor-top-rated.png",
  "credential-google-reviews.png",
  "credential-facebook-reviews.png",
]

const H = 40 // h-10
const GAP = 44 // gap-11
const PAD = 40
const SHELL = 1417

async function row(grayscale) {
  const tiles = []
  for (const f of FILES) {
    const src = path.join(PUB, f)
    let img = sharp(src).resize({ height: H, fit: "inside" })
    if (grayscale) img = img.grayscale().composite([]).linear(1, 0)
    const meta = await sharp(src).metadata()
    const w = Math.round((meta.width / meta.height) * H)
    let buf = await img.png().toBuffer()
    if (grayscale) {
      // `opacity-55` over white == blend toward white by 55% opacity.
      buf = await sharp(buf)
        .ensureAlpha(0.55)
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer()
    }
    tiles.push({ buf, w })
  }

  const totalW = tiles.reduce((a, t) => a + t.w, 0) + GAP * (tiles.length - 1)
  const W = SHELL + PAD * 2
  const comps = []
  let x = Math.round((W - totalW) / 2)
  for (const t of tiles) {
    comps.push({ input: t.buf, left: x, top: PAD })
    x += t.w + GAP
  }

  return {
    buf: await sharp({
      create: { width: W, height: H + PAD * 2, channels: 3, background: "#ffffff" },
    })
      .composite(comps)
      .png()
      .toBuffer(),
    widths: tiles.map((t) => t.w),
    totalW,
  }
}

async function main() {
  const colour = await row(false)
  const grey = await row(true)

  console.log(`badge widths at h-10 (40px): ${colour.widths.join(", ")}`)
  console.log(`row width incl. gaps: ${colour.totalW}px (shell is ${SHELL}px)`)
  console.log(`widest / narrowest = ${(Math.max(...colour.widths) / Math.min(...colour.widths)).toFixed(1)}x`)

  const out = path.join(PUB, "..", "..", "..", ".preview", "credential-row.png")
  const outPath = path.resolve(__dirname, "..", ".preview", "credential-row.png")
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp({
    create: { width: colour.buf ? 1497 : 0, height: (H + PAD * 2) * 2 + 20, channels: 3, background: "#dddddd" },
  })
    .composite([
      { input: colour.buf, left: 0, top: 0 },
      { input: grey.buf, left: 0, top: H + PAD * 2 + 20 },
    ])
    .jpeg({ quality: 90 })
    .toFile(outPath)

  console.log(`\nsheet: ${outPath}  (top: colour, bottom: shipped grayscale+opacity)`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
