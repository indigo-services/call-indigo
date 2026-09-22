/**
 * Does the hero background's JPEG quality survive the page scrim?
 *
 * The band paints `color-mix(in srgb, var(--color-commercial) 88%, transparent)`
 * over the photo, so only 12% of the image's amplitude reaches the screen - and
 * that same 88% suppresses compression artefacts. The question "is q56 enough"
 * is therefore answerable by compositing the real scrim in sharp and measuring
 * the difference, instead of shipping a guess.
 *
 * `.slab-photo::before` also carries the slab's 16px radius, which this does not
 * model; the band's interior is what is being judged.
 *
 * Usage: node scripts/_hero_bg_scrim.cjs
 */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media", "Austin_Aerial.jpg")
const OUT = path.join(ROOT, ".preview")
const RATIO = 2.092
const W = 1820

// The commercial page primary, at the 88% the stylesheet mixes it to.
const SCRIM = { r: 0x2c, g: 0x3a, b: 0x96, alpha: 0.88 }

const QUALITIES = [82, 68, 56, 50]

async function encode(q) {
  return sharp(SRC)
    .resize(W, Math.round(W / RATIO), { fit: "cover", position: "centre" })
    .jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer()
}

async function scrimmed(buf) {
  const { width, height } = await sharp(buf).metadata()
  return sharp(buf)
    .composite([
      {
        input: {
          create: {
            width,
            height,
            channels: 4,
            background: { ...SCRIM },
          },
        },
        blend: "over",
      },
    ])
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
}

async function main() {
  const raw = {}
  for (const q of QUALITIES) {
    const buf = await encode(q)
    raw[q] = await scrimmed(buf)
    console.log(
      `${W}x${Math.round(W / RATIO)}  q${q}  ${(buf.length / 1024).toFixed(1)} KiB raw`,
    )
  }

  const ref = raw[QUALITIES[0]]
  console.log(
    `\nAgainst q${QUALITIES[0]}, AFTER the 88% scrim (0-255 per channel):\n`,
  )
  for (const q of QUALITIES.slice(1)) {
    const a = raw[q].data
    const b = ref.data
    let sum = 0
    let max = 0
    const n = a.length
    for (let i = 0; i < n; i++) {
      const d = Math.abs(a[i] - b[i])
      sum += d
      if (d > max) max = d
    }
    console.log(
      `  q${String(q).padStart(2)}  mean |delta| ${(sum / n).toFixed(2)}   max |delta| ${max}`,
    )
  }

  // A crop from the busiest part of the frame, both scrimmed, for the eye.
  const crop = { left: 500, top: 260, width: 900, height: 430 }
  const tiles = []
  for (const q of [82, 56]) {
    tiles.push(
      await sharp(raw[q].data, {
        raw: { width: raw[q].info.width, height: raw[q].info.height, channels: 3 },
      })
        .extract(crop)
        .png()
        .toBuffer(),
    )
  }
  const sheet = path.join(OUT, "hero-bg-scrim-compare.png")
  fs.mkdirSync(OUT, { recursive: true })
  await sharp({
    create: {
      width: crop.width,
      height: crop.height * 2 + 30,
      channels: 3,
      background: { r: 20, g: 20, b: 20 },
    },
  })
    .composite([
      { input: tiles[0], left: 0, top: 0 },
      { input: tiles[1], left: 0, top: crop.height + 30 },
    ])
    .png()
    .toFile(sheet)
  console.log(`\nscrimmed crop, q82 on top / q56 below: ${sheet}`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
