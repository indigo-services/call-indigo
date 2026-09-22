/**
 * Step 4 of the commercial-imagery chain: build the four commercial crops.
 *
 * WHY NEW FILES AND NOT AN OVERWRITE
 * Every image the commercial page renders today is ALSO rendered by HomePage or
 * ResidentialPage - `banner-bg-img.jpg` and `cta-img.jpg` are on all three routes,
 * `repair-img2.jpg` and `about-img2.jpg` on two. Overwriting any of them would
 * re-skin the residential pages too, which is not what was asked for. So each slot
 * gets its own commercial-only file and only CommercialPage points at it.
 *
 * WHY THE CROP IS DONE HERE AND NOT BY `object-cover`
 * `object-cover` crops from the centre. The benefits slot is a 0.621 portrait and
 * the hero inset is 1.262; a centred crop of a 1.538 landscape loses ~60% of the
 * width, which decapitates any subject that is not centred. Cropping at build time
 * means the framing is decided by looking at it, and it is what ships.
 *
 * Every output is sized to the slot's MEASURED rendered box (see
 * `_probe_commercial_slots.cjs`) and never upscales its source.
 *
 * Usage: node scripts/_commercial_build.cjs [--preview]
 *   --preview  write only to .preview/, do not touch public/
 */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const DROP = path.join(ROOT, "images", "04-Media")
const OUT = path.join(ROOT, "public", "assets", "images")
const PREVIEW = path.join(ROOT, ".preview", "commercial")

const PREVIEW_ONLY = process.argv.includes("--preview")

/* Each entry: the slot's measured box, the ratio that box imposes, the source,
   the crop position, and the output size.
   `out` is deliberately the slot's exact rendered size for the natural-size slot
   and ~1.5-2x for the CSS-driven ones. */
const JOBS = [
  {
    out: "commercial-hero-bg.jpg",
    slot: "hero background",
    source: "Austin_Aerial.jpg",
    ratio: 2.092, // measured 1360x650 at 1440 viewport
    position: "centre",
    size: [1820, 870],
    // q56 not q82: measured through the real 88% scrim with
    // `_hero_bg_scrim.cjs`, the two are indistinguishable (mean |delta| 0.61 of
    // 255, max 10) and q56 is 291 KiB against 543. Only 12% of this image's
    // amplitude reaches the screen, so paying for the other 88% is waste.
    quality: 56,
    note: "full-bleed, sits under the 88% scrim; needs the pixels, so it is the aerial",
  },
  {
    out: "commercial-crew.jpg",
    slot: "hero inset",
    source: "Commercial_1_Janitorial.jpg",
    ratio: 1.262, // measured 593x470
    position: "centre",
    size: [886, 702],
    note: "bright office interior - separates from the deep-blue hero band",
  },
  {
    out: "commercial-facade.jpg",
    slot: "benefits figure",
    source: "Commercial_2_Maintenance.jpg",
    ratio: 0.621, // measured 435x701 - NATURAL SIZE, the file size IS the render
    position: "west",
    size: [435, 701],
    note: "portrait; the subject is left of centre so the crop is west, not centre",
  },
  {
    out: "commercial-cta.jpg",
    slot: "final CTA",
    source: "Commercial_3_Painting.jpg",
    ratio: 1.708, // measured 543x318
    position: "centre",
    size: [1080, 632],
    note: "large white wall - separates from the blue CTA band",
  },
]

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

async function main() {
  const dest = PREVIEW_ONLY ? PREVIEW : OUT
  fs.mkdirSync(dest, { recursive: true })
  const built = []

  for (const job of JOBS) {
    const src = path.join(DROP, job.source)
    if (!fs.existsSync(src)) {
      console.error(`MISSING SOURCE: ${job.source}`)
      process.exit(1)
    }
    const meta = await sharp(src).metadata()
    const [tw, th] = job.size
    const targetRatio = tw / th
    if (Math.abs(targetRatio - job.ratio) > 0.01) {
      console.error(
        `RATIO DRIFT: ${job.out} wants ${job.ratio} but ${tw}x${th} is ${targetRatio.toFixed(3)}`,
      )
      process.exit(1)
    }

    // Largest crop the SOURCE can give at this ratio - the no-upscale guard.
    const maxW = Math.min(meta.width, Math.round(meta.height * targetRatio))
    const maxH = Math.round(maxW / targetRatio)
    if (maxW < tw || maxH < th) {
      console.error(
        `WOULD UPSCALE: ${job.source} can supply at most ${maxW}x${maxH} at ` +
          `${targetRatio.toFixed(3)}:1 but ${job.out} needs ${tw}x${th}`,
      )
      process.exit(1)
    }

    const buf = await sharp(src)
      .resize(tw, th, { fit: "cover", position: job.position })
      .jpeg({
        quality: job.quality ?? 82,
        mozjpeg: true,
        chromaSubsampling: "4:4:4",
      })
      .toBuffer()
    fs.writeFileSync(path.join(dest, job.out), buf)

    const g = gcd(tw, th)
    console.log(
      `${job.out.padEnd(28)} ${job.slot.padEnd(16)} ${job.source.padEnd(30)} ` +
        `${meta.width}x${meta.height} -> ${tw}x${th} ` +
        `(${targetRatio.toFixed(3)}:1 = ${tw / g}:${th / g})  ` +
        `max-available ${maxW}x${maxH}  ${(buf.length / 1024).toFixed(1)} KiB`,
    )
    built.push({ job, buf, tw, th })
  }

  // A sheet at the REAL rendered size of each slot, so what is judged is what ships.
  const gap = 14
  const RENDERED = [
    [1360, 650],
    [593, 470],
    [435, 701],
    [543, 318],
  ]
  const tiles = []
  let y = gap
  for (let i = 0; i < built.length; i++) {
    const [rw, rh] = RENDERED[i]
    const img = await sharp(built[i].buf)
      .resize(rw, rh, { fit: "cover", position: "centre" })
      .toBuffer()
    tiles.push({ img, rw, rh, y, label: built[i].job })
    y += rh + 28 + gap
  }
  const sheetW = Math.max(...tiles.map((t) => t.rw)) + gap * 2
  const parts = []
  for (const t of tiles) {
    parts.push({ input: t.img, left: gap, top: t.y })
    const svg = Buffer.from(
      `<svg width="${t.rw}" height="28" xmlns="http://www.w3.org/2000/svg">` +
        `<rect width="${t.rw}" height="28" fill="#111827"/>` +
        `<text x="8" y="19" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#fff">` +
        `${t.label.slot}  ${t.label.out}  rendered ${t.rw}x${t.rh}</text></svg>`,
    )
    parts.push({ input: svg, left: gap, top: t.y + t.rh })
  }
  const sheet = path.join(ROOT, ".preview", "commercial-shipped.png")
  await sharp({
    create: {
      width: sheetW,
      height: y,
      channels: 3,
      background: { r: 240, g: 243, b: 247 },
    },
  })
    .composite(parts)
    .png()
    .toFile(sheet)
  console.log(`\nrendered-size sheet: ${sheet}`)
  if (PREVIEW_ONLY) console.log("(preview only - public/ untouched)")
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
