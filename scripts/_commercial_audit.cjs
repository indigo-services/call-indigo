/**
 * Step 1 of the commercial-imagery chain: measure every candidate before judging
 * any of them.
 *
 * Prints, for (a) the four images the commercial page currently ships and (b) the
 * whole client drop, the intrinsic pixel size, the aspect ratio, and the bytes on
 * disk. Nothing here decides anything - it only rules out the candidates that
 * cannot fill a slot without upscaling or an aspect-ratio lie.
 *
 * Usage: node scripts/_commercial_audit.cjs
 */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const DROP = path.join(ROOT, "images", "04-Media")
const SHIPPED = path.join(ROOT, "public", "assets", "images")

// The four slots the commercial page actually renders, with the constraint each
// one imposes on a swap. `box` is the rendered CSS box where the layout pins it.
const SLOTS = [
  {
    slot: "hero background",
    file: "banner-bg-img.jpg",
    line: 193,
    constraint: "absolute inset-0 size-full object-cover - full bleed, ratio free",
  },
  {
    slot: "hero inset",
    file: "repair-img2.jpg",
    line: 214,
    constraint: "w-full + h-[320/400/470px] object-cover - ratio forced to the box",
  },
  {
    slot: "benefits figure",
    file: "about-img2.jpg",
    line: 315,
    constraint: "w-full only - intrinsic ratio sets the rendered height",
  },
  {
    slot: "final CTA",
    file: "cta-img.jpg",
    line: 334,
    constraint: "w-full only - intrinsic ratio sets the rendered height",
  },
]

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

async function describe(file, dir) {
  const full = path.join(dir, file)
  if (!fs.existsSync(full)) return null
  const meta = await sharp(full).metadata()
  const bytes = fs.statSync(full).size
  const g = gcd(meta.width, meta.height)
  return {
    w: meta.width,
    h: meta.height,
    ratio: (meta.width / meta.height).toFixed(3),
    simple: `${meta.width / g}:${meta.height / g}`,
    mp: ((meta.width * meta.height) / 1e6).toFixed(1),
    kib: (bytes / 1024).toFixed(1),
  }
}

async function main() {
  console.log("=== CURRENTLY SHIPPED IN THE FOUR COMMERCIAL SLOTS ===\n")
  for (const s of SLOTS) {
    const d = await describe(s.file, SHIPPED)
    console.log(`${s.slot}  (line ${s.line})`)
    console.log(`  ${s.file}`)
    if (!d) {
      console.log("  MISSING\n")
      continue
    }
    console.log(
      `  ${d.w}x${d.h}  ratio ${d.ratio} (${d.simple})  ${d.mp} MP  ${d.kib} KiB`,
    )
    console.log(`  lock: ${s.constraint}\n`)
  }

  console.log("\n=== CLIENT DROP: images/04-Media ===\n")
  const files = fs
    .readdirSync(DROP)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
  const rows = []
  for (const f of files) {
    const d = await describe(f, DROP)
    if (d) rows.push({ f, ...d })
  }
  rows.sort((a, b) => Number(b.w) - Number(a.w))
  console.log(
    "file".padEnd(42) +
      "px".padEnd(14) +
      "ratio".padEnd(9) +
      "MP".padEnd(6) +
      "KiB",
  )
  for (const r of rows) {
    console.log(
      r.f.padEnd(42) +
        `${r.w}x${r.h}`.padEnd(14) +
        r.ratio.padEnd(9) +
        r.mp.padEnd(6) +
        r.kib,
    )
  }
  console.log(`\n${rows.length} image files`)
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
