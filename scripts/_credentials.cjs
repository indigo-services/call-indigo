/**
 * One-shot: stage the client's credential badges into public/assets/images/.
 *
 * These replace the six `tc-logo1..6.png` placeholders, which were stock
 * "Logoipsum" marks sitting under the heading "Trusted By Leading Brands" --
 * invented brands making a claim that was not true.
 *
 * Each badge is resized to 3x its rendered height (the row uses `h-10`, i.e.
 * 40 CSS px, so 120px keeps it sharp at 2x DPR and leaves headroom if the row
 * is ever enlarged), and flattened onto white because the source PNGs carry
 * alpha and the band behind them is white.
 *
 * Usage: node scripts/_credentials.cjs
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media")
const OUT = path.join(ROOT, "public", "assets", "images")

const TARGET_H = 120

/** source -> [output name, alt text shown to assistive tech] */
const BADGES = [
  ["bbb-accredited.png", "credential-bbb-accredited.png", "BBB Accredited Business"],
  ["angieslist_SSA_2018.png", "credential-angies-list.png", "Angie's List Super Service Award 2018"],
  ["home-advisor-elite.png", "credential-homeadvisor-elite.png", "HomeAdvisor Elite Service"],
  ["home-advisor-toprated.png", "credential-homeadvisor-top-rated.png", "HomeAdvisor Top Rated"],
  ["google-reviews-logo.png", "credential-google-reviews.png", "Google Reviews"],
  ["facebook-reviews_1024x1024.png", "credential-facebook-reviews.png", "Facebook Reviews"],
]

async function main() {
  console.log(`${"source".padEnd(34)} ${"output".padEnd(38)} ${"in".padEnd(11)} ${"out".padEnd(11)} bytes`)
  console.log("-".repeat(108))

  for (const [srcName, outName, alt] of BADGES) {
    const from = path.join(SRC, srcName)
    if (!fs.existsSync(from)) throw new Error(`missing ${from}`)

    const meta = await sharp(from).metadata()
    const to = path.join(OUT, outName)

    const info = await sharp(from)
      .resize({ height: TARGET_H, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(to)

    console.log(
      `${srcName.padEnd(34)} ${outName.padEnd(38)} ` +
        `${`${meta.width}x${meta.height}`.padEnd(11)} ${`${info.width}x${info.height}`.padEnd(11)} ` +
        `${info.size}  alt="${alt}"`,
    )
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
