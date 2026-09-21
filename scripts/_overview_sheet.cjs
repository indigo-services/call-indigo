/**
 * Preview helper: contact sheet of every client-supplied image, in filename
 * order, so the whole drop can be reviewed in one look and mapped to slots.
 *
 * Prints the index order so a position in the sheet can be traced back to a
 * filename.
 *
 * Usage: node scripts/_overview_sheet.cjs [tileWidth] [cols]
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media")

async function main() {
  const tileW = Number(process.argv[2] || 210)
  const cols = Number(process.argv[3] || 8)

  const files = fs
    .readdirSync(SRC)
    .filter((f) => /\.(png|jpe?g)$/i.test(f))
    .sort()

  const tileH = tileW
  const rows = Math.ceil(files.length / cols)
  const gap = 6

  const tiles = []
  for (const f of files) {
    const buf = await sharp(path.join(SRC, f))
      .resize(tileW, tileH, { fit: "contain", background: { r: 236, g: 236, b: 236 } })
      .png()
      .toBuffer()
    tiles.push({ f, buf })
  }

  const W = cols * tileW + (cols + 1) * gap
  const H = rows * tileH + (rows + 1) * gap

  const composites = tiles.map((t, i) => ({
    input: t.buf,
    left: gap + (i % cols) * (tileW + gap),
    top: gap + Math.floor(i / cols) * (tileH + gap),
  }))

  const out = path.join(ROOT, ".preview", "overview.png")
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp({ create: { width: W, height: H, channels: 3, background: { r: 236, g: 236, b: 236 } } })
    .composite(composites)
    .png()
    .toFile(out)

  files.forEach((f, i) => {
    const r = Math.floor(i / cols) + 1
    const c = (i % cols) + 1
    console.log(`r${r}c${c}  ${f}`)
  })
  console.log(`\nsheet: ${out} (${W}x${H})`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
