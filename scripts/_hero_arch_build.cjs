#!/usr/bin/env node
"use strict"
/**
 * Build (or preview) the five per-service hero arch images.
 *
 * The arch slot on `/` is NATURAL SIZE - `HomePage.tsx` carries no `w-full` on
 * it, so the FILE'S OWN PIXEL DIMENSIONS *are* its rendered box (406x586
 * border-box at 376x556 content, per the comment at HomePage.tsx:317). A swap
 * that changes the dimensions moves the hero. So every output here is pinned to
 * the incumbent `hero-arch.jpg`'s exact 376x556, and the script refuses to run
 * if it cannot produce that.
 *
 * The client sources are 1080x702 landscape (1.538); the arch is 0.676 portrait.
 * A cover-crop to the arch therefore keeps only ~35% of the source's width, and
 * a centred crop decapitates people in most of these frames. `focus` is
 * therefore per-image and is chosen by LOOKING at `--sheet`, never guessed.
 *
 * Usage:
 *   node scripts/_hero_arch_build.cjs --sheet     # contact sheet of the crops
 *   node scripts/_hero_arch_build.cjs --write     # write public/assets/images/
 */
const path = require("path")
const fs = require("fs")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const sharp = require(path.join(WORKSPACE, "sharp"))

// The incumbent, and the contract every output must honour.
const ARCH = "public/assets/images/hero-arch.jpg"
const OUT_W = 376
const OUT_H = 556
const QUALITY = 74

const MEDIA = "images/04-Media"
const OUTDIR = "public/assets/images"

/**
 * One entry per word in `ROTATION` (`src/marketing/hero-rotation.ts`), in that
 * order — a test asserts the two lists agree.
 *
 * `focus` is per-image and was chosen by looking at `--sheet`, never guessed.
 * The axis that matters is HORIZONTAL: cropping 1.538 landscape to 0.676
 * portrait consumes the source's whole height, so `north`/`south` are no-ops
 * here (see `_hero_arch_focus.cjs`). Plumbing is `east` because that is where
 * the technician actually is — `west` is an empty cabinet panel.
 */
const PICKS = [
  { word: "Plumbing", file: "hero-arch-plumbing.jpg", src: `${MEDIA}/Residential_4_Plumbing.jpg`, focus: "east" },
  { word: "Electrical", file: "hero-arch-electrical.jpg", src: `${MEDIA}/Residential_2_Electric.jpg`, focus: "centre" },
  { word: "HVAC", file: "hero-arch-hvac.jpg", src: `${MEDIA}/Residential_3_HVAC.jpg`, focus: "centre" },
  // NOT `Residential_1_Repairs.jpg`: `about-img2.jpg` is already built from that
  // photo and renders further down this same page ("Property inspection"), so the
  // hero would show the same picture twice. `row-handyman-pic030.png` is the only
  // spare candidate with a PERSON in it, and at 424x560 it is already near the
  // arch's 0.676 so almost nothing is cropped. It is a cut-out on a real alpha
  // channel (corners 255,255,255,0), which is why it needs `backdrop` — flattened
  // to JPEG without one it would ship as a black rectangle.
  { word: "Home Services", file: "hero-arch-home.jpg", src: `${MEDIA}/row-handyman-pic030.png`, focus: "centre", backdrop: true },
  { word: "Facility Services", file: "hero-arch-facility.jpg", src: `${MEDIA}/Commercial_1_Janitorial.jpg`, focus: "centre" },
]

/**
 * Studio backdrop for cut-out sources, so a portrait sits with the four in-situ
 * crops instead of reading as a different kind of image. A soft vertical
 * gradient in the page's own light tones (`--color-mist` #f4f8fe family), which
 * also matches the slot: the incumbent `hero-arch.jpg` is a bright, airy
 * close-up, so a dark backdrop would be the jarring choice here, not a light one.
 */
const BACKDROP_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${OUT_H}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#f7fafe"/><stop offset="1" stop-color="#d7e3f5"/>` +
    `</linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/></svg>`,
)

const SHEET_W = 602 // 1.6x the shipped width - big enough to judge framing
const PAD = 14
const LABEL_H = 46

function arg(name) {
  return process.argv.includes("--" + name)
}

async function main() {
  // The incumbent's dimensions are the contract; re-derive them, don't assume.
  const incumbent = await sharp(ARCH).metadata()
  if (incumbent.width !== OUT_W || incumbent.height !== OUT_H) {
    throw new Error(
      `hero-arch.jpg is ${incumbent.width}x${incumbent.height}, not ${OUT_W}x${OUT_H}. ` +
        `The arch is a natural-size slot, so this script's output size must be re-derived.`,
    )
  }
  console.log(`incumbent arch: ${incumbent.width}x${incumbent.height}  <- the contract\n`)

  const write = arg("write")
  const sheet = arg("sheet") || !write

  const tiles = []

  for (const p of PICKS) {
    const meta = await sharp(p.src).metadata()

    // A cover-crop scales by max(outW/srcW, outH/srcH); above 1 it is upscaling,
    // which `_slot_swap.cjs` names as the thing to avoid ("an upscaled swap would
    // be softer, not sharper"). Refuse rather than quietly ship a soft hero.
    const coverScale = Math.max(OUT_W / meta.width, OUT_H / meta.height)
    if (coverScale > 1.001) {
      throw new Error(
        `${p.word}: ${path.basename(p.src)} is ${meta.width}x${meta.height}; ` +
          `covering ${OUT_W}x${OUT_H} would upscale it ${coverScale.toFixed(2)}x.`,
      )
    }

    let buf
    if (p.backdrop) {
      // `contain`, not `cover`: a cut-out's subject must never be cropped, so the
      // slack goes to the backdrop rather than to a lost shoulder.
      const cut = await sharp(p.src)
        .resize(OUT_W, OUT_H, {
          fit: "contain",
          position: "centre",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
      buf = await sharp(BACKDROP_SVG)
        .composite([{ input: cut }])
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
    } else {
      buf = await sharp(p.src)
        .resize(OUT_W, OUT_H, { fit: "cover", position: p.focus })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
    }

    const kb = Math.round(buf.length / 1024)
    console.log(
      `${p.word.padEnd(18)} ${path.basename(p.src).padEnd(30)} ` +
        `${meta.width}x${meta.height} (${(meta.width / meta.height).toFixed(3)}) ` +
        `-> ${OUT_W}x${OUT_H} focus=${p.focus.padEnd(7)} ${kb} KiB`,
    )

    if (write) {
      const dest = path.join(OUTDIR, p.file)
      fs.writeFileSync(dest, buf)
      console.log(`    wrote ${dest}`)
    }
    if (sheet) tiles.push({ buf, label: `${p.word}  (${p.focus})` })
  }

  if (sheet) {
    const tileH = Math.round((SHEET_W * OUT_H) / OUT_W)
    const sheetH = PAD + LABEL_H + tileH + PAD
    const sheetW = PAD + tiles.length * (SHEET_W + PAD)
    const composites = []
    tiles.forEach((t, i) => {
      const x = PAD + i * (SHEET_W + PAD)
      const resized = sharp(t.buf).resize(SHEET_W, tileH, { fit: "fill" })
      // sharp needs the buffer; compose via a nested pipeline is not possible,
      // so resize up-front and hand over a raw buffer.
      composites.push({ input: t.buf, left: x, top: PAD + LABEL_H, _resize: [SHEET_W, tileH] })
      composites[composites.length - 1].label = t.label
      composites[composites.length - 1].x = x
    })
    // Do the upscale separately (sharp composites take a buffer, not a pipeline).
    const prepped = []
    for (const c of composites) {
      prepped.push({
        input: await sharp(c.input).resize(c._resize[0], c._resize[1], { fit: "fill" }).png().toBuffer(),
        left: c.left,
        top: c.top,
      })
    }
    // Labels drawn as SVG.
    for (const c of composites) {
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET_W}" height="${LABEL_H}">` +
          `<text x="0" y="30" font-family="Segoe UI, Arial, sans-serif" font-size="22" ` +
          `font-weight="700" fill="#111">${c.label}</text></svg>`,
      )
      prepped.push({ input: svg, left: c.x, top: PAD })
    }

    // Sheets are generated, never hand-edited — the repo keeps them in
    // `.preview/`, which is gitignored (see .gitignore).
    const dest = "C:/tmp/indigo/.preview/hero-arch-sheet.png"
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    await sharp({
      create: { width: sheetW, height: sheetH, channels: 3, background: "#e9edf4" },
    })
      .composite(prepped)
      .png()
      .toFile(dest)
    console.log(`\nsheet -> ${dest}  (${sheetW}x${sheetH})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
