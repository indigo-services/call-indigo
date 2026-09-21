/**
 * Rasterise the brand icon into the three PNG favicons.
 *
 * The SVGs in `public/assets/images/` were the v1 indigo mark (#201d4c centre,
 * measured). The client's new brand navy is #1e1b4b, so the raster icons were
 * the last surfaces still carrying the superseded colour. There is no rasteriser
 * in the repo and no Pillow in the Python runtime, so this leans on `sharp`,
 * installed into the agent's isolated node workspace — NOT into this project, so
 * `package.json` stays clean. Run it with NODE_PATH pointing at that workspace.
 *
 * 16 and 32 keep the transparent surround (the disc is the whole shape).
 * apple-touch-icon is flattened onto the brand navy, because iOS masks the
 * square itself and a transparent corner renders black on some devices.
 */
const path = require("node:path")
const fs = require("node:fs")
const sharp = require("sharp")

const IMAGES = path.join(__dirname, "..", "public", "assets", "images")
const SRC = path.join(IMAGES, "call-indigo-icon.svg")
const BRAND_NAVY = "#1e1b4b"

const TARGETS = [
  { file: "favicon-16.png", size: 16, flatten: false },
  { file: "favicon-32.png", size: 32, flatten: false },
  { file: "apple-touch-icon.png", size: 180, flatten: true },
]

async function main() {
  const svg = fs.readFileSync(SRC)
  for (const { file, size, flatten } of TARGETS) {
    // A high density makes sharp rasterise the vector at the target size rather
    // than upscaling a 96px render.
    let pipe = sharp(svg, { density: 384 }).resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    if (flatten) pipe = pipe.flatten({ background: BRAND_NAVY })
    const out = path.join(IMAGES, file)
    await pipe.png({ compressionLevel: 9 }).toFile(out)
    const { size: bytes } = fs.statSync(out)
    console.log(`${file.padEnd(22)} ${size}x${size}  ${bytes} bytes  flatten=${flatten}`)
  }
}

main().catch((err) => {
  console.error("FAILED:", err.message)
  process.exit(1)
})
