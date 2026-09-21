#!/usr/bin/env node
"use strict"
/**
 * Render real pages in a real browser and capture screenshots.
 *
 * WHY THIS EXISTS
 * The project's verification suite asserts on `renderToStaticMarkup` output, which
 * has no layout engine. Anything that depends on CSS - stacking order, negative
 * margins, which element paints over which - is invisible to it. That is exactly
 * how the services-card icon chip shipped looking wrong while 71/71 checks passed.
 * This script is the missing half: it renders, then we look.
 *
 * playwright-core and the chromium build both live in the agent's isolated node
 * workspace / playwright cache - NOT in this project - so package.json stays clean.
 * Override with WORKBUDDY_NODE_WORKSPACE / WORKBUDDY_CHROMIUM if they move.
 *
 * USAGE
 *   node scripts/_shot.cjs --base http://localhost:5199 --out .preview \
 *        --shot services:/#services:#services \
 *        --shot residential:/residential:.hero \
 *        --shot nav:/:header
 *
 *   --shot <name>:<path>:<selector>   selector optional; omit for the viewport
 *   --viewport 1440x900               default 1440x900
 *   --scale 2                         device scale factor, default 2
 *   --full                            capture the full page, not just the viewport
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

/* `.reveal` starts at opacity 0 and only animates in when an IntersectionObserver
   fires, so a headless capture can come back blank. Reduced motion resolves it at
   the CSS level (index.css:981) and this style block covers anything else. */
const FREEZE = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }
  .reveal { opacity: 1 !important; transform: none !important; }
`

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}
function repeated(name) {
  const out = []
  process.argv.forEach((a, i) => {
    if (a === "--" + name) out.push(process.argv[i + 1])
  })
  return out
}

async function main() {
  const base = flag("base", "http://localhost:5199")
  const outDir = flag("out", ".preview")
  const [vw, vh] = flag("viewport", "1440x900").split("x").map(Number)
  const scale = Number(flag("scale", "2"))
  const full = process.argv.includes("--full")
  const shots = repeated("shot")

  if (!shots.length) {
    console.error("no --shot given; see the header comment for usage")
    process.exit(2)
  }
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: scale,
    reducedMotion: "reduce",
  })

  let failures = 0
  for (const spec of shots) {
    const [name, route, selector] = spec.split(":")
    const page = await ctx.newPage()
    const errors = []
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })
    page.on("pageerror", (e) => errors.push(String(e)))

    try {
      await page.goto(base + (route || "/"), { waitUntil: "networkidle" })
      await page.addStyleTag({ content: FREEZE })
      // Let layout settle after the style injection.
      await page.waitForTimeout(400)

      const target = selector ? page.locator(selector).first() : page
      if (selector) {
        const count = await page.locator(selector).count()
        if (!count) {
          console.log(`  ! ${name}: selector ${selector} matched nothing`)
          failures++
        }
      }
      const file = path.join(outDir, `${name}.png`)
      await target.screenshot({ path: file, fullPage: full && !selector })

      const box = selector ? await target.boundingBox() : null
      console.log(
        `  ${name.padEnd(16)} ${route.padEnd(16)} -> ${file}` +
          (box ? `  (${Math.round(box.width)}x${Math.round(box.height)} css px)` : "")
      )
      if (errors.length) {
        console.log(`     console errors: ${errors.slice(0, 3).join(" | ")}`)
      }
    } catch (e) {
      console.log(`  ! ${name}: ${e.message}`)
      failures++
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log(failures ? `\n${failures} shot(s) failed` : "\nall shots captured")
  process.exit(failures ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
