#!/usr/bin/env node
"use strict"
/**
 * Measure the services-card icon chip IN THE LIVE BROWSER, on the deployed site.
 *
 * WHY
 * The chip's defect was a paint-order problem, and `renderToStaticMarkup` has no
 * layout engine, so the test suite can only assert that the `relative` class is
 * present - not that it actually puts the chip on top. This closes that gap by
 * asking the real compositor what it painted: it screenshots the card, then counts
 * the pixels that are the chip's cyan, restricted to the chip's own column (a
 * whole-card scan catches cyan elsewhere and reports nonsense - measured 98px on a
 * 62px chip before the scan was narrowed).
 *
 * USAGE
 *   node scripts/_probe_live_chip.cjs --base https://call-indigo.vercel.app
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

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

async function main() {
  const base = flag("base", "https://call-indigo.vercel.app")
  const scale = 2
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: scale,
    reducedMotion: "reduce",
  })
  const page = await ctx.newPage()
  await page.goto(base + "/#services", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: FREEZE })
  await page.waitForTimeout(400)

  /* The first service card's chip. */
  const chip = page.locator("#services .grid > *").first().locator("img.bg-sky").first()
  const n = await chip.count()
  if (!n) {
    console.log("  ! no chip matched #services .grid > * img.bg-sky")
    process.exit(1)
  }
  const geo = await chip.boundingBox()
  const card = await page.locator("#services .grid > *").first()
  const cardFile = path.join(".preview", "live", "_card.png")
  fs.mkdirSync(path.dirname(cardFile), { recursive: true })
  await card.screenshot({ path: cardFile })

  const cardBox = await card.boundingBox()
  const relX = geo.x - cardBox.x
  const relY = geo.y - cardBox.y

  const { data, info } = await sharp(cardFile)
    .raw()
    .toBuffer({ resolveWithObject: true })

  /* Chip cyan is #30c3eb (48,195,235). Count only pixels in the chip's own
     column, +/- 8 css px, so cyan elsewhere in the card cannot inflate it.

     Do NOT compare the total against the full box area: the white glyph sits
     inside the chip, so a perfectly healthy chip measures ~91% cyan by area.
     The defect clipped the chip's TOP edge, so the load-bearing measurement is
     whether the chip's own top rows are cyan at all - under the bug the photo
     wrapper painted over the first 32 css px and those rows came back as photo. */
  const x0 = Math.max(0, Math.round((relX - 8) * scale))
  const x1 = Math.min(info.width, Math.round((relX + geo.width + 8) * scale))
  const yTop = Math.round(relY * scale)
  const yBot = Math.min(info.height, Math.round((relY + geo.height) * scale))
  const isCyan = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    return r >= 35 && r <= 65 && g >= 180 && g <= 210 && b >= 220 && b <= 250
  }
  let cyan = 0
  let firstCyanRow = -1
  for (let y = yTop; y < yBot; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * info.width + x) * info.channels
      if (isCyan(i)) {
        cyan++
        if (firstCyanRow === -1) firstCyanRow = y
      }
    }
  }
  const cyanCss = cyan / (scale * scale)
  const inner = Math.max(0, geo.width - 6) * Math.max(0, geo.height - 6) // 3px white border
  const firstCyanCss = firstCyanRow === -1 ? -1 : (firstCyanRow - yTop) / scale

  console.log(`  chip box        : ${geo.width.toFixed(1)} x ${geo.height.toFixed(1)} css px`)
  console.log(`  chip offset     : x=${relX.toFixed(1)} y=${relY.toFixed(1)} within the card`)
  console.log(`  visible cyan    : ${cyanCss.toFixed(0)} css px (inner box is ${inner.toFixed(0)})`)
  console.log(`  first cyan row  : ${firstCyanCss.toFixed(1)} css px from the chip's top`)
  console.log(`                    ~3 = just inside the 3px white border (healthy)`)
  console.log(`                    ~32 = the photo wrapper is still painting over the top`)
  console.log(`  verdict         : ${firstCyanCss >= 0 && firstCyanCss <= 6 ? "FULL - top edge paints" : "CLIPPED - top edge hidden"}`)

  /* Non-vacuousness check. A probe that cannot fail proves nothing, so re-measure
     with `relative` stripped off the chip in the live DOM. If the number does not
     move to ~32, the probe is not actually observing paint order and its green
     result above is meaningless. */
  if (process.argv.includes("--sensitivity")) {
    await page.evaluate(() => {
      const img = document.querySelector("#services .grid > * img.bg-sky")
      if (img) img.className = img.className.replace(/(^|\s)relative(\s|$)/, "$1$2")
    })
    await page.waitForTimeout(200)
    const geo2 = await chip.boundingBox()
    const card2 = await card.boundingBox()
    const f2 = path.join(".preview", "live", "_card_broken.png")
    await card.screenshot({ path: f2 })
    const r2 = await sharp(f2).raw().toBuffer({ resolveWithObject: true })
    const rx0 = Math.max(0, Math.round((geo2.x - card2.x - 8) * scale))
    const rx1 = Math.min(r2.info.width, Math.round((geo2.x - card2.x + geo2.width + 8) * scale))
    const ryTop = Math.round((geo2.y - card2.y) * scale)
    const ryBot = Math.min(r2.info.height, Math.round((geo2.y - card2.y + geo2.height) * scale))
    let first2 = -1
    for (let y = ryTop; y < ryBot && first2 === -1; y++) {
      for (let x = rx0; x < rx1; x++) {
        const i = (y * r2.info.width + x) * r2.info.channels
        const r = r2.data[i], g = r2.data[i + 1], b = r2.data[i + 2]
        if (r >= 35 && r <= 65 && g >= 180 && g <= 210 && b >= 220 && b <= 250) { first2 = y; break }
      }
    }
    const first2Css = first2 === -1 ? -1 : (first2 - ryTop) / scale
    console.log(`  --sensitivity   : with \`relative\` removed, first cyan row = ${first2Css.toFixed(1)} css px`)
    console.log(`                    ${first2Css > 20 ? "probe IS sensitive to paint order (good)" : "probe did NOT detect the bug - result above is untrustworthy"}`)
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
