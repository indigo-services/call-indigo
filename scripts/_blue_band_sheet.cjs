#!/usr/bin/env node
"use strict"
/**
 * Render the home / residential / commercial hero bands side by side, so the
 * three-way comparison is made by looking rather than by reading hue numbers.
 *
 * The arithmetic in scripts/_blue_pair.cjs proves the three are *separated*. It
 * cannot prove they read as three different blues rather than three shades of the
 * same one — that is a question about a rendered band with a photo and a scrim
 * over it, and it is the whole point of the request. So: shoot all three at the
 * same viewport, same scroll position, and stack them into one sheet.
 *
 * The two service values are applied to the LIVE DOM rather than by editing the
 * stylesheet, so the sheet can be produced for a candidate set before anything is
 * committed. Inline styles on the page root also beat the `.page-*` class rule,
 * which is what makes a candidate previewable at all.
 *
 *   scripts/_devshot.sh --run scripts/_blue_band_sheet.cjs
 */

const fs = require("fs")
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))
const sharp = require(path.join(WORKSPACE, "sharp"))

const FREEZE = `
  *, *::before, *::after { transition: none !important; animation: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
`

/*
 * Second correction. The first candidate set rendered `#1e5571` (hue 200) and it
 * came back visibly TEAL. The second set fixed the teal but landed at hue 212 —
 * which measured Δhue 0° against home (216°) and rendered as literally the same
 * blue, just darker, confirming that "same hue, more luminance" is not "a
 * different blue".
 *
 * So residential now sweeps hue AWAY from home rather than toward it, and the set
 * brackets home on both sides:
 *   residential  196-208   azure/steel  (below home, away from cyan)
 *   home         216        the pivot
 *   commercial   228-236    deep indigo  (above home)
 *
 * The cyan-eyebrow bar is what limits how far residential can go: cyan sits at
 * ~195°, so every degree toward azure narrows that gap and forces the value darker.
 */
const CANDIDATES = {
  residential: ["#1f507a", "#215583", "#235a8b", "#255f93"],
  commercial: ["#2c3a96", "#2c4196", "#293e8e", "#2e3d9e"],
}

const TARGETS = [
  { name: "home", route: "/", selector: "section.scrim-blue", hex: "#2a5aa2", token: null },
  ...Object.entries(CANDIDATES).flatMap(([name, hexes]) =>
    hexes.map((hex, i) => ({
      name: `${name}${i + 1}`,
      route: `/${name}`,
      selector: "section.scrim-blue",
      hex,
      token: `--color-${name}`,
      pageClass: `page-${name}`,
    })),
  ),
]

function channels(h) {
  const b = h.replace("#", "")
  return [0, 2, 4].map((i) => parseInt(b.slice(i, i + 2), 16) / 255)
}
function srgbToLinear(v) {
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function lum(h) {
  const [r, g, b] = channels(h).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

async function main() {
  const base = process.argv[process.argv.indexOf("--base") + 1] || "http://127.0.0.1:5199"
  const outDir = ".preview/blues"
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })

  const shots = []
  let bandWidth = 0
  let bandHeight = 0

  for (const t of TARGETS) {
    const page = await ctx.newPage()
    await page.goto(base + t.route, { waitUntil: "networkidle" })
    await page.addStyleTag({ content: FREEZE })
    await page.waitForTimeout(400)

    if (t.token) {
      // Derive the scrims from the candidate too — a literal tint left behind
      // would paint over the new slab and the sheet would understate the change.
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(t.hex.slice(i, i + 2), 16))
      await page.evaluate(
        ({ pageClass, token, css, rgb }) => {
          const root = document.querySelector("." + pageClass)
          if (!root) return
          root.style.setProperty(token, css)
          root.style.setProperty("--color-scrim-hero", `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 88%)`)
          root.style.setProperty("--color-scrim-blue", `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 90%)`)
        },
        { pageClass: t.pageClass, token: t.token, css: t.hex, rgb: { r, g, b } },
      )
      await page.waitForTimeout(150)
    }

    const band = page.locator(t.selector).first()
    if ((await band.count()) === 0) {
      console.log(`  ! ${t.name}: ${t.selector} matched nothing`)
      await page.close()
      continue
    }
    await band.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -40))
    await page.waitForTimeout(200)

    const box = await band.boundingBox()
    // Bands can differ in height between routes (home's slab has more copy in it),
    // so each is cropped to a common height rather than assuming they match — the
    // composite below requires equal-width inputs and this keeps it simple.
    bandWidth = Math.max(bandWidth, Math.round(box.width))
    const clipH = Math.min(520, Math.round(box.height))
    bandHeight = Math.max(bandHeight, clipH)

    const file = path.join(outDir, `${t.name}.png`)
    await page.screenshot({ path: file, clip: { x: box.x, y: box.y, width: box.width, height: clipH } })

    /* Measure what actually painted, not what was requested. */
    const painted = await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      const cs = getComputedStyle(el)
      const before = getComputedStyle(el, "::before")
      return {
        bg: cs.backgroundColor,
        token: cs.getPropertyValue("--color-residential").trim(),
        scrim: before.backgroundColor,
      }
    }, t.selector)

    shots.push({ ...t, file, painted })
    console.log(
      `  ${t.name.padEnd(12)} ${t.hex}  white ${contrast("#ffffff", t.hex).toFixed(2)}:1  ` +
        `cyan ${contrast("#30c3eb", t.hex).toFixed(2)}:1`,
    )
    console.log(`               painted bg ${painted.bg}   scrim ${painted.scrim}`)
    await page.close()
  }

  if (shots.length > 0) {
    /*
     * Normalise every band to one box before compositing. Cropping to a common
     * height is not enough: the routes render at slightly different widths (a
     * scrollbar appears on some and not others), and `composite` requires an input
     * no larger than its canvas. Resizing to a shared width is what makes the
     * sheet a fair visual comparison — same frame, same scale, only the colour moves.
     */
    const CELL_H = bandHeight
    const labelled = []
    for (const s of shots) {
      const band = await sharp(s.file).resize(bandWidth, CELL_H, { fit: "cover", position: "top" }).png().toBuffer()
      const header = 34
      const canvas = sharp({
        create: { width: bandWidth, height: CELL_H + header, channels: 3, background: "#ffffff" },
      })
      const svg = Buffer.from(
        `<svg width="${bandWidth}" height="${header}" xmlns="http://www.w3.org/2000/svg">
           <rect width="${bandWidth}" height="${header}" fill="#0f172a"/>
           <text x="16" y="23" font-family="monospace" font-size="17" fill="#ffffff">
             ${s.name}  ${s.hex}  ·  white ${contrast("#ffffff", s.hex).toFixed(2)}:1  ·  cyan ${contrast("#30c3eb", s.hex).toFixed(2)}:1
           </text>
         </svg>`,
      )
      labelled.push(
        await canvas
          .composite([
            { input: svg, left: 0, top: 0 },
            { input: band, left: 0, top: header },
          ])
          .png()
          .toBuffer(),
      )
    }

    const cellH = CELL_H + 34
    await sharp({
      create: { width: bandWidth, height: cellH * labelled.length, channels: 3, background: "#ffffff" },
    })
      .composite(labelled.map((buf, i) => ({ input: buf, left: 0, top: i * cellH })))
      .png()
      .toFile(path.join(outDir, "sheet.png"))

    console.log(`\n  -> ${path.join(outDir, "sheet.png")} (${shots.length} bands, stacked)`)
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
