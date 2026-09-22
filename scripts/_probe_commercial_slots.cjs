#!/usr/bin/env node
"use strict"
/**
 * Measure the four commercial image slots in a real browser.
 *
 * Every claim in the swap decision depends on the box each slot renders at:
 *   - `natural` vs `rendered` width says whether a candidate would be UPSCALED,
 *     which the repo forbids.
 *   - the rendered ratio says what a candidate must be cropped to at build time,
 *     because `object-cover` crops from the centre and will happily decapitate a
 *     subject that sits off-centre.
 *
 * A screenshot scaled to fit is the wrong instrument for this - it was for hue
 * and it is for geometry too. This reads the numbers off the live DOM.
 *
 * Usage: node scripts/_probe_commercial_slots.cjs --base https://call-indigo.vercel.app
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

const TARGETS = [
  { slot: "hero background", file: "commercial-hero-bg.jpg" },
  { slot: "hero inset", file: "commercial-crew.jpg" },
  { slot: "benefits figure", file: "commercial-facade.jpg" },
  { slot: "final CTA", file: "commercial-cta.jpg" },
]

async function main() {
  const base = flag("base", "https://call-indigo.vercel.app")
  const viewport = flag("viewport", "1440x900")
  const [vw, vh] = viewport.split("x").map(Number)

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const page = await ctx.newPage()
  await page.goto(base + "/commercial", { waitUntil: "networkidle" })
  await page.waitForTimeout(300)

  console.log(`\nbase: ${base}  viewport ${viewport}\n`)
  console.log(
    "slot".padEnd(18) +
      "file".padEnd(20) +
      "rendered".padEnd(14) +
      "ratio".padEnd(8) +
      "natural".padEnd(14) +
      "scale",
  )
  console.log("-".repeat(86))

  for (const t of TARGETS) {
    const info = await page.evaluate((f) => {
      const img = document.querySelector(`img[src$="${f}"]`)
      if (!img) return null
      const r = img.getBoundingClientRect()
      const cs = getComputedStyle(img)
      return {
        rw: Math.round(r.width),
        rh: Math.round(r.height),
        nw: img.naturalWidth,
        nh: img.naturalHeight,
        objectFit: cs.objectFit,
      }
    }, t.file)
    if (!info) {
      console.log(`${t.slot.padEnd(18)}${t.file.padEnd(20)}NOT FOUND`)
      continue
    }
    const ratio = info.rw / info.rh
    const scale = info.rw / info.nw
    console.log(
      t.slot.padEnd(18) +
        t.file.padEnd(20) +
        `${info.rw}x${info.rh}`.padEnd(14) +
        ratio.toFixed(3).padEnd(8) +
        `${info.nw}x${info.nh}`.padEnd(14) +
        (scale > 1 ? `UPSCALE ${scale.toFixed(2)}x` : `${scale.toFixed(2)}x`) +
        `  [${info.objectFit}]`,
    )
    console.log(
      `  -> candidate must supply >= ${info.rw}x${info.rh} and be pre-cropped to ` +
        `${ratio.toFixed(3)}:1\n`,
    )
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
