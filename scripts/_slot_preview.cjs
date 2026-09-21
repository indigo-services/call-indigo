/**
 * Preview helper: for each swappable slot, render the CURRENT image next to two
 * candidate crops from the client drop, at the slot's real aspect ratio.
 *
 * Rows are slots, columns are [current, candidate A, candidate B], so one look
 * decides every swap.
 *
 * Every candidate is cropped to the CURRENT file's aspect ratio, because these
 * slots are CSS-width-driven: height follows the image's aspect, so changing it
 * would move the layout.
 *
 * Usage: node scripts/_slot_preview.cjs [tileWidth]
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media")
const PUB = path.join(ROOT, "public", "assets", "images")

/** slot -> { aspect (w/h of the live file), A, B } */
const SLOTS = [
  {
    name: "about-img1",
    note: "372x669 portrait 0.556 - technician at work",
    aspect: 372 / 669,
    A: { src: "indigo-electician-photo.jpg", position: "attention" },
    B: { src: "team-img006.jpg", position: "centre" },
  },
  {
    name: "about-img2",
    note: "347x559 portrait 0.621 - property inspection",
    aspect: 347 / 559,
    A: { src: "Residential_1_Repairs.jpg", position: "west" },
    B: { src: "routine-maintenance.jpg", position: "centre" },
  },
  {
    name: "cta-img",
    note: "728x426 landscape 1.709 - technician on a call",
    aspect: 728 / 426,
    A: { src: "Commercial_2_Maintenance.jpg", position: "centre" },
    B: { src: "Specialty_3_Restoration.jpg", position: "centre" },
  },
  {
    name: "repair-img1",
    note: "745x669 landscape 1.114 - crew on a residential job",
    aspect: 745 / 669,
    A: { src: "tm-rowbg-four.jpg", position: "centre" },
    B: { src: "poroject-07.jpg", position: "centre" },
  },
]

async function tile(input, w, h, position) {
  // JPEG, not PNG: a sheet of dense photographs as PNG is far too heavy to open.
  return sharp(input)
    .resize(w, h, { fit: "cover", position })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
}

async function main() {
  const tileW = Number(process.argv[2] || 300)
  const gap = 8
  const rows = SLOTS.length
  const cols = 3

  const cells = []
  for (let r = 0; r < rows; r += 1) {
    const slot = SLOTS[r]
    const h = Math.round(tileW / slot.aspect)

    const currentPath = path.join(PUB, `${slot.name}.jpg`)
    const sources = [currentPath, path.join(SRC, slot.A.src), path.join(SRC, slot.B.src)]
    const positions = [undefined, slot.A.position, slot.B.position]

    for (let c = 0; c < cols; c += 1) {
      const buf = await tile(sources[c], tileW, h, positions[c])
      cells.push({ r, c, buf, h })
    }
    console.log(
      `${slot.name.padEnd(14)} aspect ${slot.aspect.toFixed(3)}  ->  ${tileW}x${h}  ` +
        `| current | ${slot.A.src} | ${slot.B.src}`,
    )
  }

  // Rows can differ in height, so compute a per-row offset.
  const rowHeights = SLOTS.map((s) => Math.round(tileW / s.aspect))
  const W = cols * tileW + (cols + 1) * gap
  const H = rowHeights.reduce((a, b) => a + b, 0) + (rows + 1) * gap

  const composites = []
  let y = gap
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = cells.find((x) => x.r === r && x.c === c)
      composites.push({ input: cell.buf, left: gap + c * (tileW + gap), top: y })
    }
    y += rowHeights[r] + gap
  }

  const out = path.join(ROOT, ".preview", "slot-swaps.jpg")
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 226, g: 226, b: 226 } },
  })
    .composite(composites)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out)

  console.log(`\nsheet: ${out} (${W}x${H})  columns: current | A | B`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
