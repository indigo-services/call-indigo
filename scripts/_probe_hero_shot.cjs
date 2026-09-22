#!/usr/bin/env node
"use strict"
/**
 * Screenshot the hero in each state, and the Emergency card close up.
 *
 * Deterministic rather than sampled: it sets the word and the arch directly, so
 * every rotation state is captured without waiting on the 2600ms tick.
 *
 * Usage: node scripts/_probe_hero_shot.cjs --base http://127.0.0.1:5199
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

const STATES = [
  { word: "Plumbing", src: "hero-arch-plumbing.jpg" },
  { word: "Electrical", src: "hero-arch-electrical.jpg" },
  { word: "HVAC", src: "hero-arch-hvac.jpg" },
  { word: "Home Services", src: "hero-arch-home.jpg" },
  { word: "Facility Services", src: "hero-arch-facility.jpg" },
]

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  // Screenshots are generated — `.preview/` is gitignored (see .gitignore).
  const out = flag("out", "C:/tmp/indigo/.preview/shots")
  require("fs").mkdirSync(out, { recursive: true })

  const browser = await chromium.launch({ executablePath: CHROME })

  // ── Desktop: the hero, one shot per rotation state ────────────────────────
  for (const w of [1440, 1920]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const page = await ctx.newPage()
    await page.goto(base + "/", { waitUntil: "networkidle" })
    await page.waitForTimeout(500)

    for (const s of STATES) {
      await page.evaluate(
        (s) => {
          const rot = document.getElementById("hero-rotate")
          const arch = document.getElementById("hero-arch")
          if (rot) rot.textContent = s.word
          if (arch) arch.src = `/assets/images/${s.src}`
        },
        s,
      )
      await page.waitForTimeout(250)
      const file = path.join(out, `hero-${w}-${s.word.replace(/\s+/g, "-").toLowerCase()}.png`)
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: 880 } })
      console.log(`  ${file}`)
    }
    await ctx.close()
  }

  // ── The Emergency card, close up ──────────────────────────────────────────
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  })
  const page = await ctx.newPage()
  await page.goto(base + "/", { waitUntil: "networkidle" })
  await page.waitForTimeout(500)
  const box = await page.evaluate(() => {
    const card = document.querySelector(".navy-box")
    if (!card) return null
    const r = card.getBoundingClientRect()
    return { x: r.x - 24, y: r.y - 24, width: r.width + 48, height: r.height + 48 }
  })
  if (box) {
    const file = path.join(out, "emergency-card.png")
    await page.screenshot({ path: file, clip: box })
    console.log(`  ${file}  (card ${Math.round(box.width - 48)}x${Math.round(box.height - 48)})`)
  } else {
    console.log("  no .navy-box found")
  }
  await ctx.close()

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
