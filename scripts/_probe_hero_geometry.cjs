#!/usr/bin/env node
"use strict"
/**
 * Did the hero change move the page, and does the arch actually follow the word?
 *
 * Two questions, one probe:
 *
 *  1. GEOMETRY. Shrinking the rotating word changes where its inline-block's
 *     baseline sits inside the h1's fixed line box, so the h1's own height moves
 *     by a pixel or two even though the word got smaller. Anything below the hero
 *     inherits that. `document.body.scrollHeight` is the unambiguous test, and it
 *     can be run against the LIVE site too — production still serves the old hero,
 *     so live-vs-local isolates this change exactly.
 *
 *  2. SYNC. The arch is supposed to swap to the photograph for whichever service
 *     the headline is naming. Rotation is skipped under reduced motion, so this
 *     half runs with motion ON and watches for a tick.
 *
 * Usage:
 *   node scripts/_probe_hero_geometry.cjs --base http://127.0.0.1:5199
 *   node scripts/_probe_hero_geometry.cjs --base https://call-indigo.vercel.app
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

const WIDTHS = [1920, 1440, 1199, 991, 768, 390]

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })

  console.log(`\nbase: ${base}\n`)
  console.log(`${"vw".padEnd(7)} ${"h1 h".padEnd(7)} ${"hero h".padEnd(8)} ${"page h".padEnd(8)} arch`)
  console.log("-".repeat(74))

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const page = await ctx.newPage()
    await page.goto(base + "/", { waitUntil: "networkidle" })
    await page.waitForTimeout(500)

    const r = await page.evaluate(() => {
      const h1 = document.querySelector(".hero-h1")
      const arch = document.getElementById("hero-arch")
      // The hero band: the h1's nearest positioned ancestor that also contains
      // the arch, which is the section the background image paints.
      let hero = h1
      for (let i = 0; i < 8 && hero?.parentElement; i++) {
        hero = hero.parentElement
        if (hero.querySelector && hero.querySelector("#hero-arch")) break
      }
      return {
        h1: h1 ? Math.round(h1.getBoundingClientRect().height) : null,
        hero: hero ? Math.round(hero.getBoundingClientRect().height) : null,
        page: document.body.scrollHeight,
        arch: arch ? (arch.getAttribute("src") || "").split("/").pop() : "none",
      }
    })
    console.log(
      `${String(w).padEnd(7)} ${String(r.h1).padEnd(7)} ${String(r.hero).padEnd(8)} ` +
        `${String(r.page).padEnd(8)} ${r.arch}`,
    )
    await ctx.close()
  }

  // ── Sync: motion ON, watch the arch follow the word ───────────────────────
  console.log("\nrotation sync (motion on, sampled every 900ms for ~8s):")
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(base + "/", { waitUntil: "networkidle" })

  const seen = new Set()
  for (let i = 0; i < 10; i++) {
    const s = await page.evaluate(() => {
      const rot = document.getElementById("hero-rotate")
      const arch = document.getElementById("hero-arch")
      return {
        word: rot ? rot.textContent : null,
        src: arch ? (arch.getAttribute("src") || "").split("/").pop() : null,
        alt: arch ? arch.getAttribute("alt") : null,
      }
    })
    const key = `${s.word} -> ${s.src}`
    if (!seen.has(key)) {
      seen.add(key)
      console.log(`  ${String(s.word).padEnd(18)} ${s.src}`)
      console.log(`  ${"".padEnd(18)} alt: ${s.alt}`)
    }
    await page.waitForTimeout(900)
  }
  console.log(`\n  ${seen.size} distinct word/arch pairing(s) observed`)
  await ctx.close()
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
