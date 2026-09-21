#!/usr/bin/env node
"use strict"
/**
 * Render candidate page primaries on the real CTA band, so the colour is chosen by
 * looking rather than by reasoning about hue numbers.
 *
 * Applying a candidate needs THREE variables, not one: the token itself plus the two
 * scrim tints, because `.slab-photo::before` paints the band through an 88%/90% scrim.
 * Setting only the token leaves the old colour winning.
 *
 * Inline styles on the page root beat the `.page-*` class rule, so each candidate is
 * applied to the live DOM and the band is re-shot. All candidates land in one contact
 * sheet, in the order given, so the comparison is apples-to-apples at the same scroll.
 *
 *   scripts/_devshot.sh --run scripts/_primary_candidates.cjs
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

/* Candidate sets. First entry is the colour currently shipped, as the baseline. */
const SETS = [
  {
    name: "residential",
    route: "/residential",
    selector: "section.scrim-blue",
    token: "--color-residential",
    pageClass: "page-residential",
    // "brighter, less army" - lift luminance and slide hue from teal (170) toward green.
    candidates: ["#0a6153", "#0d6b5e", "#0b6a54", "#0c6a4e"],
  },
  {
    name: "commercial",
    route: "/commercial",
    selector: "section.scrim-blue",
    token: "--color-commercial",
    pageClass: "page-commercial",
    // "less purple" - slide hue from violet (241) toward blue.
    candidates: ["#3f3d9e", "#37479e", "#2f4d9e", "#2f519e"],
  },
]

/* WCAG relative luminance + contrast, so the sheet can be read against the bars. */
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
function hue(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (!d) return 0
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return Math.round(h * 60 + (h < 0 ? 360 : 0))
}

const CYAN = "#30c3eb" // --color-sky, the hero kicker
const WHITE = "#ffffff"

async function main() {
  const base = process.argv[process.argv.indexOf("--base") + 1] || "http://127.0.0.1:5199"
  const outDir = ".preview/candidates"
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })

  for (const set of SETS) {
    const page = await ctx.newPage()
    await page.goto(base + set.route, { waitUntil: "networkidle" })
    await page.addStyleTag({ content: FREEZE })
    await page.waitForTimeout(400)

    const band = page.locator(set.selector).first()
    if ((await band.count()) === 0) {
      console.log(`  ! ${set.name}: ${set.selector} matched nothing`)
      await page.close()
      continue
    }
    await band.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -60))
    await page.waitForTimeout(200)
    const box = await band.boundingBox()

    const files = []
    for (const hex of set.candidates) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      await page.evaluate(
        ({ pageClass, token, rgb }) => {
          const root = document.querySelector("." + pageClass)
          if (!root) return
          root.style.setProperty(token, rgb.hex)
          root.style.setProperty("--color-scrim-hero", `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 88%)`)
          root.style.setProperty("--color-scrim-blue", `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 90%)`)
        },
        { pageClass: set.pageClass, token: set.token, rgb: { hex, r, g, b } },
      )
      await page.waitForTimeout(150)
      const file = path.join(outDir, `${set.name}-${hex.slice(1)}.png`)
      await page.screenshot({ path: file, clip: box })
      files.push({ hex, file })
      const cyan = contrast(CYAN, hex)
      const white = contrast(WHITE, hex)
      console.log(
        `  ${set.name.padEnd(12)} ${hex}  hue ${String(hue(hex)).padStart(3)}°  ` +
          `white ${white.toFixed(2)}:1  cyan ${cyan.toFixed(2)}:1  ` +
          `${cyan >= 3 ? "ok" : "CYAN KICKER BELOW 3:1"}`,
      )
    }

    const sheet = sharp({
      create: {
        width: Math.round(box.width),
        height: Math.round(box.height) * files.length,
        channels: 3,
        background: "#ffffff",
      },
    })
    await sheet
      .composite(files.map((f, i) => ({ input: f.file, left: 0, top: Math.round(box.height) * i })))
      .png()
      .toFile(path.join(outDir, `${set.name}-sheet.png`))
    console.log(`  -> ${path.join(outDir, `${set.name}-sheet.png`)} (top = shipped, then in order)\n`)
    await page.close()
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
