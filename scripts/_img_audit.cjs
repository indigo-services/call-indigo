/**
 * Audit every image in public/assets/images/ for optimisation headroom.
 *
 * Reports, per file: pixel dimensions, bytes, bytes-per-pixel, whether it carries
 * an alpha channel, and whether the JPEG is progressive. Bytes-per-pixel is the
 * useful signal for still images -- a well-encoded photo lands around 0.10-0.35
 * B/px; much above that means the file is carrying pixels or bits it does not
 * need at the size it is displayed.
 *
 * Also estimates what a lossless-in-appearance re-encode would save, by
 * re-encoding to a temp buffer at the same dimensions and comparing sizes.
 *
 * Usage: node scripts/_img_audit.cjs [--reencode-check]
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const PUB = path.resolve(__dirname, "..", "public", "assets", "images")

async function main() {
  const check = process.argv.includes("--reencode-check")
  const files = fs.readdirSync(PUB).sort()

  let totalBytes = 0
  let totalPixels = 0
  const rows = []

  for (const f of files) {
    const p = path.join(PUB, f)
    const st = fs.statSync(p)
    let meta
    try {
      meta = await sharp(p).metadata()
    } catch {
      rows.push({ f, dims: "unreadable", bytes: st.size, bpp: 0, flags: "?" })
      totalBytes += st.size
      continue
    }

    const px = (meta.width || 0) * (meta.height || 0)
    const bpp = px ? st.size / px : 0
    const flags = []
    if (meta.hasAlpha) flags.push("alpha")
    if (meta.format === "jpeg" && meta.isProgressive) flags.push("progressive")
    if (meta.format) flags.push(meta.format)

    let saving = 0
    if (check && meta.format === "jpeg") {
      const buf = await sharp(p).jpeg({ quality: 80, mozjpeg: true, progressive: true }).toBuffer()
      saving = st.size - buf.length
    } else if (check && meta.format === "png") {
      const buf = await sharp(p).png({ compressionLevel: 9, palette: true }).toBuffer()
      saving = st.size - buf.length
    }

    totalBytes += st.size
    totalPixels += px
    rows.push({
      f,
      dims: `${meta.width}x${meta.height}`,
      bytes: st.size,
      bpp,
      flags: flags.join(" "),
      saving,
    })
  }

  rows.sort((a, b) => b.bytes - a.bytes)

  console.log(
    `${"file".padEnd(32)} ${"dims".padEnd(12)} ${"bytes".padStart(8)} ${"B/px".padStart(7)} ${"saving".padStart(8)}  flags`,
  )
  console.log("-".repeat(96))
  for (const r of rows) {
    console.log(
      `${r.f.padEnd(32)} ${r.dims.padEnd(12)} ${String(r.bytes).padStart(8)} ` +
        `${r.bpp.toFixed(3).padStart(7)} ${String(r.saving || "").padStart(8)}  ${r.flags}`,
    )
  }

  const totalSaving = rows.reduce((a, r) => a + (r.saving || 0), 0)
  console.log("-".repeat(96))
  console.log(
    `${rows.length} files | ${(totalBytes / 1024).toFixed(0)} KiB total | ` +
      `${(totalPixels / 1e6).toFixed(1)} MP | re-encode saving ${(totalSaving / 1024).toFixed(0)} KiB ` +
      `(${((totalSaving / totalBytes) * 100).toFixed(0)}%)`,
  )
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
