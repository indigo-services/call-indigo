/**
 * Step 3 of the commercial-imagery chain: judge the CROP, not the source.
 *
 * `object-cover` crops from the centre, so the question "does this photo work in
 * this slot" cannot be answered by looking at the whole frame. This renders each
 * candidate at the slot's exact ratio so a decapitating crop is visible before it
 * ships - the failure mode the service-card work already hit once.
 *
 * Usage: node scripts/_commercial_crop.cjs <ratio> <position> <out-name> [files...]
 *   ratio     W/H, e.g. 0.621
 *   position  north | centre | south | west | east | attention | entropy
 */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const DROP = path.join(ROOT, "images", "04-Media")

const DEFAULT = [
  "Commercial_1_Janitorial.jpg",
  "Commercial_2_Maintenance.jpg",
  "Commercial_3_Painting.jpg",
  "Commercial_4_Landscaping.jpg",
  "Janitor_background.jpg",
  "routine-maintenance.webp",
  "tm-rowbg-four.jpg",
  "poroject-07.jpg",
  "real-estate.jpg",
  "Austin_Aerial.jpg",
]

const TILE_H = 430
const GAP = 10
const LABEL_H = 26

function labelSvg(w, text) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  return Buffer.from(
    `<svg width="${w}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${w}" height="${LABEL_H}" fill="#111827"/>` +
      `<text x="6" y="18" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#fff">${safe}</text>` +
      `</svg>`,
  )
}

async function main() {
  const ratio = Number(process.argv[2] || 0.621)
  const position = process.argv[3] || "centre"
  const outName = process.argv[4] || `crop-${ratio}`
  const files = process.argv.slice(5)
  const list = files.length ? files : DEFAULT

  const TILE_W = Math.round(TILE_H * ratio)
  const cols = ratio < 1 ? 5 : 3
  const rows = Math.ceil(list.length / cols)
  const sheetW = cols * TILE_W + (cols + 1) * GAP
  const sheetH = rows * (TILE_H + LABEL_H + GAP) + GAP

  const parts = []
  for (let i = 0; i < list.length; i++) {
    const file = list[i]
    const full = path.join(DROP, file)
    if (!fs.existsSync(full)) {
      console.log(`missing: ${file}`)
      continue
    }
    const meta = await sharp(full).metadata()
    const buf = await sharp(full)
      .resize(TILE_W, TILE_H, { fit: "cover", position })
      .toBuffer()
    const col = i % cols
    const row = Math.floor(i / cols)
    const left = GAP + col * (TILE_W + GAP)
    const top = GAP + row * (TILE_H + LABEL_H + GAP)
    parts.push({ input: buf, left, top })
    parts.push({
      input: labelSvg(TILE_W, file.replace(/\.(jpe?g|png|webp)$/i, "")),
      left,
      top: top + TILE_H,
    })
    console.log(
      `${file.padEnd(32)} ${meta.width}x${meta.height} -> ${TILE_W}x${TILE_H} @${position}`,
    )
  }

  const out = path.join(ROOT, ".preview", `${outName}.png`)
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
  console.log(`\nsheet: ${out}  (${sheetW}x${sheetH})  ratio ${ratio} @${position}`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
