#!/usr/bin/env node
"use strict"
/**
 * Decide the CTA badge variant by looking at it, not by arguing about it.
 *
 * The badge straddles the photo's right edge, so "does it read?" depends on what
 * is behind it at that exact spot - which is a paint question, and therefore a
 * browser question. This captures the badge region on all three CTA bands twice:
 * once as built, once with the disc swapped to the other variant. sharp then
 * stacks the six crops into one sheet so the choice takes one look.
 *
 * Run through the dev-server wrapper so boot/teardown happen in one invocation:
 *   scripts/_devshot.sh --run scripts/_badge_compare.cjs
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

const BANDS = [
  ["home", "/"],
  ["residential", "/residential"],
  ["commercial", "/commercial"],
]

const PAD = 120 // css px of context around the badge
const SCALE = 2

async function main() {
  const base = process.argv[process.argv.indexOf("--base") + 1] || "http://127.0.0.1:5199"
  const outDir = ".preview/badge"
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: SCALE,
    reducedMotion: "reduce",
  })

  const crops = []
  for (const [name, route] of BANDS) {
    const page = await ctx.newPage()
    await page.goto(base + route, { waitUntil: "networkidle" })
    await page.addStyleTag({ content: FREEZE })
    await page.waitForTimeout(400)

    // The badge is the immediate next sibling of the CTA photo - precise, and
    // immune to the Tailwind class escaping that `size-[110px]` would need.
    const badge = page.locator('img[src*="cta-img"] + span').first()
    if ((await badge.count()) === 0) {
      console.log(`  ! ${name}: no badge sibling found after img[src*=cta-img]`)
      await page.close()
      continue
    }

    for (const variant of ["as-built", "swapped"]) {
      if (variant === "swapped") {
        await page.evaluate(() => {
          const span = document.querySelector('img[src*="cta-img"] + span')
          if (!span) return
          const svg = span.querySelector("svg")
          // Flip whichever way the built markup currently reads.
          if (span.className.includes("bg-[#1e1b4b]")) {
            span.className = span.className.replace("bg-[#1e1b4b]", "bg-white")
            if (svg) svg.setAttribute("class", svg.getAttribute("class").replace("text-white", "text-[#1e1b4b]"))
          } else {
            span.className = span.className.replace("bg-white", "bg-[#1e1b4b]")
            if (svg) svg.setAttribute("class", svg.getAttribute("class").replace("text-[#1e1b4b]", "text-white"))
          }
        })
        await page.waitForTimeout(150)
      }

      // The CTA bands sit well below the fold, and `page.screenshot({clip})`
      // clips against the viewport unless fullPage is set - so bring the badge
      // into view and centre it before reading its box. Without this the clip
      // lands outside the captured image and sharp gets nothing.
      await badge.scrollIntoViewIfNeeded()
      await page.evaluate(() => window.scrollBy(0, -60))
      await page.waitForTimeout(200)

      const box = await badge.boundingBox()
      if (!box) {
        console.log(`  ! ${name}/${variant}: badge has no box (hidden at this viewport?)`)
        continue
      }
      const vp = page.viewportSize()
      const clip = {
        x: Math.max(0, Math.min(box.x - PAD, vp.width - (box.width + PAD * 2))),
        y: Math.max(0, Math.min(box.y - PAD, vp.height - (box.height + PAD * 2))),
        width: box.width + PAD * 2,
        height: box.height + PAD * 2,
      }
      const file = path.join(outDir, `${name}-${variant}.png`)
      await page.screenshot({ path: file, clip })
      crops.push({ name, variant, file })
      console.log(
        `  ${name.padEnd(12)} ${variant.padEnd(9)} badge ${Math.round(box.width)}x${Math.round(box.height)} ` +
          `at x=${Math.round(box.x)} -> ${file}`
      )
    }
    await page.close()
  }

  /* Stack into one sheet: rows = bands, cols = variant. */
  if (crops.length) {
    const w = 110 + PAD * 2
    const h = 110 + PAD * 2
    const sheet = sharp({
      create: { width: w * SCALE * 2, height: h * SCALE * 3, channels: 3, background: "#ffffff" },
    })
    const composites = []
    crops.forEach((c, i) => {
      const row = Math.floor(i / 2)
      const col = i % 2
      composites.push({
        input: c.file,
        left: col * w * SCALE,
        top: row * h * SCALE,
      })
    })
    const sheetFile = path.join(outDir, "_sheet.png")
    await sheet.composite(composites).png().toFile(sheetFile)
    console.log(`\ncontact sheet -> ${sheetFile}  (left = as built, right = swapped)`)
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
