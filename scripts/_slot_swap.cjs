/**
 * One-shot: swap the client's photos into the photo slots whose geometry can
 * take them without moving the layout.
 *
 * GEOMETRY RULES (measured from the markup, 2026-09-21)
 *
 *  - `about-img1/2` are `w-full` inside fixed-width figures (`flex-[372]`,
 *    `flex-[347]`) with no height class. Height therefore comes from the image's
 *    own aspect ratio, so the target aspect is read from the CURRENT file and
 *    reproduced exactly. Same aspect => the section cannot move.
 *
 *  - `cta-img` is `w-full ... object-cover` with no height class. Same rule.
 *
 *  - `repair-img1` is `h-[320px] w-full object-cover md:h-[400px] lg:h-[470px]`:
 *    BOTH dimensions are CSS-driven, so its aspect is free. It is emitted at the
 *    source's own ratio and simply enlarged; `object-cover` does the rest.
 *
 *  - `hero-arch` and `choose-img1` render at NATURAL size (no width class), and
 *    `repair-img2` is used at natural size on the home page. Their pixel
 *    dimensions are load-bearing, so they are NOT touched here.
 *
 *  - The four 1820px-wide background images are NOT touched: the client photos
 *    are 1080px, so swapping would LOWER resolution.
 *
 * Usage:
 *   node scripts/_slot_swap.cjs --preview
 *   node scripts/_slot_swap.cjs --apply
 */
const fs = require("node:fs")
const path = require("node:path")

const sharp = require("sharp")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "images", "04-Media")
const PUB = path.join(ROOT, "public", "assets", "images")
const PREVIEW = path.join(ROOT, ".preview")

/** Each entry replaces public/assets/images/<out>. Aspect is derived from the
 *  live file unless `freeAspect` is set. `scale` multiplies the current pixel
 *  width to reach roughly 2x the CSS display width. */
const SWAPS = [
  {
    out: "about-img1.jpg",
    src: "indigo-electician-photo.jpg",
    position: "attention",
    scale: 2, // displays at 372 CSS px
    why: "technician at work; 372px source is soft at 2x",
  },
  {
    out: "about-img2.jpg",
    src: "Residential_1_Repairs.jpg",
    position: "west", // subject stands left of frame
    scale: 2, // displays at 347 CSS px
    why: "the alt text is 'Property inspection' and this is a clipboard inspection",
  },
  {
    out: "cta-img.jpg",
    src: "plumbing-sink.jpg",
    position: "centre",
    scale: 2,
    why: "same subject as the current shot, 1024px instead of 728px",
  },
  {
    out: "repair-img1.jpg",
    src: "tm-rowbg-four.jpg",
    freeAspect: true, // both dimensions are CSS-driven
    width: 1600,
    why: "displays up to 1417x470, so the 745px source is upscaled ~1.9x",
  },
]

async function main() {
  const apply = process.argv.includes("--apply")
  const preview = process.argv.includes("--preview")
  if (!apply && !preview) {
    console.error("pass --preview or --apply")
    process.exit(2)
  }
  const outDir = apply ? PUB : PREVIEW
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`mode: ${apply ? "APPLY -> public/" : "PREVIEW -> .preview/"}\n`)
  console.log(
    `${"file".padEnd(15)} ${"source".padEnd(30)} ${"before".padEnd(12)} ${"after".padEnd(12)} ${"bytes".padEnd(8)} why`,
  )
  console.log("-".repeat(118))

  for (const s of SWAPS) {
    const from = path.join(SRC, s.src)
    const current = path.join(PUB, s.out)
    if (!fs.existsSync(from)) throw new Error(`missing source ${from}`)
    if (!fs.existsSync(current)) throw new Error(`missing current ${current}`)

    const cur = await sharp(current).metadata()
    const src = await sharp(from).metadata()
    const before = `${cur.width}x${cur.height}`

    // Target aspect: the live file's, so a w-full slot cannot move.
    const aspect = cur.width / cur.height

    // Largest box at that aspect which still fits inside the SOURCE. Taking the
    // min against the requested size means we downscale the source but never
    // upscale it -- an upscaled swap would be softer, not sharper.
    const srcAspect = src.width / src.height
    const maxW =
      srcAspect > aspect ? Math.floor(src.height * aspect) : src.width
    const wanted = s.freeAspect ? s.width : cur.width * s.scale
    const w = Math.min(maxW, wanted)
    const h = Math.round(w / aspect)

    if (w < cur.width) {
      console.warn(`  ! ${s.out}: no larger source at this aspect - skipping`)
      continue
    }

    const to = path.join(outDir, s.out)
    await sharp(from)
      .resize(w, h, { fit: "cover", position: s.position })
      .jpeg({ quality: 80, mozjpeg: true, progressive: true })
      .toFile(to)

    const size = fs.statSync(to).size
    console.log(
      `${s.out.padEnd(15)} ${s.src.padEnd(30)} ${before.padEnd(12)} ${`${w}x${h}`.padEnd(12)} ` +
        `${String(size).padEnd(8)} ${s.why}`,
    )
  }

  if (preview) {
    console.log(`\npreviews written to .preview/ - inspect before running --apply`)
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
