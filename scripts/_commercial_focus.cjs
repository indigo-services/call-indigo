/**
 * Step 2b: the shortlist at a size worth judging.
 *
 * The first sheet put 19 tiles on one canvas and the content became unreadable -
 * the same lesson the colour work learned: a sheet scaled to fit is the wrong
 * instrument. This renders only the on-point commercial candidates, two up, at
 * 900px per tile.
 *
 * Usage: node scripts/_commercial_focus.cjs
 */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const DROP = path.join(ROOT, "images", "04-Media")
const SHIPPED = path.join(ROOT, "public", "assets", "images")

const TILE_W = 900
const BOX_H = 620
const GAP = 12
const LABEL_H = 30

const ITEMS = [
  ["CURRENT hero bg", SHIPPED, "banner-bg-img.jpg"],
  ["CURRENT hero inset", SHIPPED, "repair-img2.jpg"],
  ["CURRENT benefits fig", SHIPPED, "about-img2.jpg"],
  ["CURRENT final CTA", SHIPPED, "cta-img.jpg"],
  ["Commercial_1_Janitorial", DROP, "Commercial_1_Janitorial.jpg"],
  ["Commercial_2_Maintenance", DROP, "Commercial_2_Maintenance.jpg"],
  ["Commercial_3_Painting", DROP, "Commercial_3_Painting.jpg"],
  ["Commercial_4_Landscaping", DROP, "Commercial_4_Landscaping.jpg"],
]

function textSvg(w, h, text, bg, size) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${w}" height="${h}" fill="${bg}"/>` +
      `<text x="10" y="${h - 9}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="bold" fill="#ffffff">${safe}</text>` +
      `</svg>`,
  )
}

async function main() {
  const cols = 2
  const rows = Math.ceil(ITEMS.length / cols)
  const sheetW = cols * TILE_W + (cols + 1) * GAP
  const sheetH = rows * (LABEL_H + BOX_H + GAP) + GAP
  const parts = []

  for (let i = 0; i < ITEMS.length; i++) {
    const [label, dir, file] = ITEMS[i]
    const full = path.join(dir, file)
    const meta = await sharp(full).metadata()
    const img = await sharp(full)
      .resize(TILE_W, BOX_H, { fit: "inside", withoutEnlargement: false })
      .toBuffer()
    const tile = await sharp({
      create: {
        width: TILE_W,
        height: BOX_H,
        channels: 3,
        background: { r: 222, g: 228, b: 236 },
      },
    })
      .composite([{ input: img, gravity: "center" }])
      .png()
      .toBuffer()
    const col = i % cols
    const row = Math.floor(i / cols)
    const left = GAP + col * (TILE_W + GAP)
    const top = GAP + row * (LABEL_H + BOX_H + GAP)
    parts.push({ input: tile, left, top })
    parts.push({
      input: textSvg(
        TILE_W,
        LABEL_H,
        `${label}  [${meta.width}x${meta.height}]`,
        "#111827",
        18,
      ),
      left,
      top: top + BOX_H,
    })
    console.log(`${label.padEnd(26)} ${meta.width}x${meta.height}`)
  }

  const out = path.join(ROOT, ".preview", "commercial-focus.png")
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 3,
      background: { r: 248, g: 250, b: 252 },
    },
  })
    .composite(parts)
    .png()
    .toFile(out)
  console.log(`\nsheet: ${out}  (${sheetW}x${sheetH})`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
