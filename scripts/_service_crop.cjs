/**
 * One-shot: crop the client's service photos to the home-page service card's
 * aspect ratio and write them into public/assets/images/.
 *
 * WHY PRE-CROP
 * The card image window is `h-[210px]` inside a 3-column grid on a 1417 shell
 * with a 28px gap, i.e. ~453.7 x 210 = 2.157:1. The client's photos are
 * 1080x702 = 1.538:1, so `object-cover` would take ~101px off the TOP and the
 * same off the bottom -- which decapitates subjects whose head sits near the
 * top of the frame. Cropping here instead means the browser has nothing left to
 * crop, so framing is decided deliberately rather than by a centring default.
 *
 * Targets 1080x501 (2.156:1) so the card stays sharp at 2x DPR (the card is
 * ~454x210 CSS px, so 2x needs 908x420).
 *
 * Usage:
 *   node scripts/_service_crop.cjs --preview   # write candidates to .preview/
 *   node scripts/_service_crop.cjs --apply     # write into public/assets/images/
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media")
const OUT = path.join(ROOT, "public", "assets", "images")
const PREVIEW = path.join(ROOT, ".preview")

const W = 1080
const H = 501

/**
 * Card slot -> client source. The slot order is the order the cards appear in
 * on both HomePage and ResidentialPage:
 *   1 Plumbing  2 Electrical  3 HVAC  4 Carpentry & Remodeling
 *   5 Painting & Make-Readies  6 Handyman & Repairs
 *
 * `position` is the vertical crop anchor. "north" keeps the top of the frame,
 * which is where these photos put their subjects' heads; sharp's "attention"
 * is used where the subject sits lower and the busiest region is the subject.
 */
const MAP = [
  { out: "services-img1.jpg", src: "Residential_4_Plumbing.jpg", position: "north" },
  { out: "services-img2.jpg", src: "Residential_2_Electric.jpg", position: "north" },
  { out: "services-img3.jpg", src: "Residential_3_HVAC.jpg", position: "north" },
  { out: "services-img4.jpg", src: "Construction_1_Housing.jpg", position: "north" },
  { out: "services-img5.jpg", src: "painting.jpg", position: "north" },
  { out: "services-img6.jpg", src: "Residential_1_Repairs.jpg", position: "north" },
]

async function run() {
  const apply = process.argv.includes("--apply")
  const preview = process.argv.includes("--preview")
  if (!apply && !preview) {
    console.error("pass --preview or --apply")
    process.exit(2)
  }

  const targetDir = apply ? OUT : PREVIEW
  fs.mkdirSync(targetDir, { recursive: true })

  console.log(`mode: ${apply ? "APPLY -> public/" : "PREVIEW -> .preview/"}`)
  console.log(`${"slot".padEnd(18)} ${"source".padEnd(30)} ${"in".padEnd(12)} ${"out".padEnd(12)} bytes`)
  console.log("-".repeat(88))

  for (const item of MAP) {
    const from = path.join(SRC, item.src)
    if (!fs.existsSync(from)) throw new Error(`missing source: ${from}`)

    const meta = await sharp(from).metadata()
    const to = path.join(targetDir, item.out)

    await sharp(from)
      .resize(W, H, { fit: "cover", position: item.position })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(to)

    const size = fs.statSync(to).size
    console.log(
      `${item.out.padEnd(18)} ${item.src.padEnd(30)} ` +
        `${`${meta.width}x${meta.height}`.padEnd(12)} ${`${W}x${H}`.padEnd(12)} ${size}`,
    )
  }
}

run().catch((err) => {
  console.error("FAILED:", err.message)
  process.exit(1)
})
