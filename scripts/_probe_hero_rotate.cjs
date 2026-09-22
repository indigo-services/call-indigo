#!/usr/bin/env node
"use strict"
/**
 * Does the hero's rotating word actually wrap, and at which widths?
 *
 * The rotation options differ in width by more than 3x ("HVAC" vs "Facility
 * Services"), and `useSiteChrome.ts` already tries to auto-fit them by scaling
 * the span's font-size down when the widest overflows its parent. This measures
 * whether that actually holds - per word, per viewport - instead of trusting it,
 * because "it should fit" and "it fits" are different claims.
 *
 * For each word it reports the span's rendered width against the parent's
 * content width, and whether the h1's height changed (which is the visible
 * symptom: the hero growing on every tick).
 *
 * Usage: node scripts/_probe_hero_rotate.cjs --base http://127.0.0.1:5199
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

const WORDS = ["Plumbing", "Electrical", "HVAC", "Home Services", "Facility Services"]
const WIDTHS = [1920, 1600, 1440, 1280, 1199, 1024, 991, 768, 390]

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })

  console.log(`\nbase: ${base}\n`)
  console.log(
    "vw".padEnd(7) +
      "word".padEnd(20) +
      "font-size".padEnd(11) +
      "span w".padEnd(10) +
      "parent w".padEnd(10) +
      "overflow".padEnd(10) +
      "h1 h",
  )
  console.log("-".repeat(80))

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const page = await ctx.newPage()
    await page.goto(base + "/", { waitUntil: "networkidle" })
    await page.waitForTimeout(600)

    const baseline = await page.evaluate(() => {
      const h1 = document.querySelector(".hero-h1")
      return h1 ? Math.round(h1.getBoundingClientRect().height) : null
    })

    for (const word of WORDS) {
      const r = await page.evaluate((word) => {
        const el = document.getElementById("hero-rotate")
        if (!el) return null
        el.textContent = word
        const span = el.getBoundingClientRect()
        const parent = el.parentElement.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return {
          font: cs.fontSize,
          spanW: Math.round(span.width),
          parentW: Math.round(parent.width),
          h1h: Math.round(el.closest("h1").getBoundingClientRect().height),
          lines: Math.round(span.height / parseFloat(cs.lineHeight || cs.fontSize)),
        }
      }, word)
      if (!r) {
        console.log("no #hero-rotate")
        break
      }
      const over = r.spanW > r.parentW
      console.log(
        String(w).padEnd(7) +
          word.padEnd(20) +
          r.font.padEnd(11) +
          String(r.spanW).padEnd(10) +
          String(r.parentW).padEnd(10) +
          (over ? `YES +${r.spanW - r.parentW}` : "no").padEnd(10) +
          `${r.h1h}${r.h1h !== baseline ? ` (base ${baseline})` : ""}`,
      )
    }
    console.log("")
    await ctx.close()
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
