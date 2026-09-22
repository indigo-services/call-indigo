#!/usr/bin/env node
"use strict"
/**
 * WHAT is wrapping in the hero h1 - the word, or the period after it?
 *
 * ⚠️ SUPERSEDED — KEPT FOR THE RECORD. `_probe_hero_dot.cjs` is the probe that
 * settled this; use that one.
 *
 * The method below is INVALID and it produced a false positive on EVERY row. It
 * compares the trailing text node's rect `top` with the span's `top`, but the
 * span is an `inline-block` and is BASELINE-aligned, so its box top is not the
 * line top. Rows whose h1 height never changed still reported "YES, wrapped".
 * Comparing tops cannot answer this question.
 *
 * It is kept rather than deleted because the mistake is instructive: the probe
 * looked like it had confirmed the hypothesis — and the hypothesis happened to be
 * right — but the evidence it offered was worthless. `_probe_hero_dot.cjs`
 * reaches the same conclusion by DELETING the node and re-measuring the h1, which
 * alignment cannot fool.
 *
 * `_probe_hero_rotate.cjs` established the symptom: on "Facility Services" the
 * h1 grows by exactly one line-height at EVERY viewport, while the span itself
 * never exceeds its parent. The markup is `Expert <br> <span>Word</span>.`, so
 * the prime suspect was the trailing period being orphaned onto its own line.
 *
 * Usage: node scripts/_probe_hero_wrap.cjs --base http://127.0.0.1:5199
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

const WORDS = ["Plumbing", "HVAC", "Facility Services"]
const WIDTHS = [1920, 1440, 1199, 991, 768, 390]

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })

  console.log(`\nbase: ${base}`)
  console.log("Does the trailing '.' sit on the same line as the rotating word?\n")
  console.log(
    "vw".padEnd(6) +
      "word".padEnd(19) +
      "spanFont".padEnd(9) +
      "span w".padEnd(8) +
      "h1 cw".padEnd(7) +
      "span top".padEnd(9) +
      "dot top".padEnd(9) +
      "dot w".padEnd(7) +
      "wrap?".padEnd(7) +
      "h1 h",
  )
  console.log("-".repeat(92))

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const page = await ctx.newPage()
    await page.goto(base + "/", { waitUntil: "networkidle" })
    await page.waitForTimeout(600)

    for (const word of WORDS) {
      const r = await page.evaluate((word) => {
        const el = document.getElementById("hero-rotate")
        if (!el) return null
        el.textContent = word
        const h1 = el.closest("h1")
        const span = el.getBoundingClientRect()
        const csH1 = getComputedStyle(h1)

        // The trailing "." lives in a sibling text node.
        const next = el.nextSibling
        let dot = null
        if (next && next.nodeType === 3) {
          const rng = document.createRange()
          rng.selectNodeContents(next)
          const rects = rng.getClientRects()
          if (rects.length) {
            const t = rects[rects.length - 1]
            dot = {
              text: next.nodeValue,
              w: Math.round(t.width),
              top: Math.round(t.top),
              left: Math.round(t.left),
            }
          }
        }
        return {
          spanFont: getComputedStyle(el).fontSize,
          h1Font: csH1.fontSize,
          lineHeight: csH1.lineHeight,
          spanW: Math.round(span.width),
          spanTop: Math.round(span.top),
          h1cw: h1.clientWidth,
          h1h: Math.round(h1.getBoundingClientRect().height),
          dot,
        }
      }, word)

      if (!r) {
        console.log("no #hero-rotate")
        break
      }
      const wrapped = r.dot ? r.dot.top !== r.spanTop : null
      console.log(
        String(w).padEnd(6) +
          word.padEnd(19) +
          r.spanFont.padEnd(9) +
          String(r.spanW).padEnd(8) +
          String(r.h1cw).padEnd(7) +
          String(r.spanTop).padEnd(9) +
          String(r.dot ? r.dot.top : "-").padEnd(9) +
          String(r.dot ? r.dot.w : "-").padEnd(7) +
          (r.dot ? JSON.stringify(r.dot.text) : "no-node").padEnd(7) +
          (wrapped === null ? "?" : wrapped ? "YES" : "no") +
          `   ${r.h1h} (lh ${r.lineHeight})`,
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
