/**
 * Before/after sheet for the commercial imagery swap.
 *
 * Pairs the live page (captured before the change) with the local build (after),
 * section by section, so the review is one look rather than six. Both sides are
 * rendered at the same viewport, and the bounding boxes came back byte-identical
 * - which is itself the evidence that the layout did not move.
 *
 * Usage: node scripts/_commercial_before_after.cjs
 */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const BEFORE = path.join(ROOT, ".preview", "live")
const AFTER = path.join(ROOT, ".preview", "final")
const OUT = path.join(ROOT, ".preview", "commercial-before-after.png")

const SECTIONS = [
  ["Hero band", "commercial-hero.png", "f-hero.png", 1360, 650],
  ["Benefits band", "commercial-bene.png", "f-bene.png", 1360, 881],
  ["Final CTA band", "commercial-cta.png", "f-cta.png", 1360, 378],
]

const W = 1000
const GAP = 14
const LABEL = 30

function label(text, w, bg) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  return Buffer.from(
    `<svg width="${w}" height="${LABEL}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${w}" height="${LABEL}" fill="${bg}"/>` +
      `<text x="10" y="21" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#fff">${safe}</text>` +
      `</svg>`,
  )
}

async function main() {
  const parts = []
  let y = GAP

  for (const [name, beforeFile, afterFile, , ] of SECTIONS) {
    const before = path.join(BEFORE, beforeFile)
    const after = path.join(AFTER, afterFile)
    for (const [file, tag, bg] of [
      [before, `BEFORE  ·  ${name}  ·  live site`, "#7f1d1d"],
      [after, `AFTER  ·  ${name}  ·  local build`, "#14532d"],
    ]) {
      if (!fs.existsSync(file)) {
        console.error(`missing: ${file}`)
        process.exit(1)
      }
      const meta = await sharp(file).metadata()
      const h = Math.round((meta.height / meta.width) * W)
      const img = await sharp(file).resize(W, h, { fit: "cover" }).toBuffer()
      parts.push({ input: label(tag, W, bg), left: GAP, top: y })
      y += LABEL
      parts.push({ input: img, left: GAP, top: y })
      y += h + GAP
      console.log(`${tag.padEnd(48)} ${meta.width}x${meta.height} -> ${W}x${h}`)
    }
  }

  await sharp({
    create: {
      width: W + GAP * 2,
      height: y,
      channels: 3,
      background: { r: 240, g: 243, b: 247 },
    },
  })
    .composite(parts)
    .png()
    .toFile(OUT)
  console.log(`\nsheet: ${OUT}`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
