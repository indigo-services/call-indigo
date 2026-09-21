/**
 * Preview helper: crop each mapped client photo to the service-card window and
 * composite the six results into one sheet, so the framing of all six can be
 * judged in a single look instead of six.
 *
 * Also renders a second sheet at the card's real CSS size (454x210) so the
 * result is seen at the size a visitor actually gets.
 *
 * Usage: node scripts/_contact_sheet.cjs <position> [sheetWidth]
 *   position: north | centre | attention | entropy
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media")

const MAP = [
  ["1 Plumbing", "Residential_4_Plumbing.jpg"],
  ["2 Electrical", "Residential_2_Electric.jpg"],
  ["3 HVAC", "Residential_3_HVAC.jpg"],
  ["4 Carpentry", "Construction_1_Housing.jpg"],
  ["5 Painting", "painting.jpg"],
  ["6 Handyman", "Residential_1_Repairs.jpg"],
]

const CARD_W = 454
const CARD_H = 210
const RATIO = CARD_W / CARD_H

async function main() {
  const position = process.argv[2] || "north"
  const sheetW = Number(process.argv[3] || 640)
  const tileH = Math.round(sheetW / RATIO)
  const cols = 2
  const rows = 3
  const gap = 8

  const tiles = []
  for (const [label, file] of MAP) {
    const from = path.join(SRC, file)
    const buf = await sharp(from)
      .resize(sheetW, tileH, { fit: "cover", position })
      .toBuffer()
    tiles.push({ label, buf })
    console.log(`${label.padEnd(14)} ${file.padEnd(30)} -> ${sheetW}x${tileH}`)
  }

  const sheetWpx = cols * sheetW + (cols + 1) * gap
  const sheetHpx = rows * tileH + (rows + 1) * gap

  const composites = tiles.map((t, i) => ({
    input: t.buf,
    left: gap + (i % cols) * (sheetW + gap),
    top: gap + Math.floor(i / cols) * (tileH + gap),
  }))

  const out = path.join(ROOT, ".preview", `sheet-${position}.png`)
  fs.mkdirSync(path.dirname(out), { recursive: true })

  await sharp({
    create: {
      width: sheetWpx,
      height: sheetHpx,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png()
    .toFile(out)

  console.log(`\nsheet: ${out}  (${sheetWpx}x${sheetHpx}, order 1-2 / 3-4 / 5-6)`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
