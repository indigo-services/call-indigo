#!/usr/bin/env node
"use strict"
/**
 * DECISIVE test for the hero h1 wrap: is the trailing "." the cause?
 *
 * `_probe_hero_rotate.cjs` found the symptom (h1 grows exactly one line-height
 * on "Facility Services", at every viewport). `_probe_hero_wrap.cjs` tried to
 * confirm the period was the culprit by comparing rect `top`s - which does NOT
 * work, because the rotating span is an `inline-block` and is baseline-aligned,
 * so its box top is not the line top. That probe reported "YES" on every row
 * including the ones whose h1 height never changed, i.e. it was measuring an
 * artifact. Kept as a cautionary example; this is the probe that settles it.
 *
 * The test that cannot be fooled: measure the h1's height with the trailing
 * text node present, then DELETE that node and measure again.
 *   - If removing the "." makes the height constant across all words, the
 *     period was the sole cause.
 *   - If the height still varies, something else is wrapping too.
 *
 * Usage: node scripts/_probe_hero_dot.cjs --base http://127.0.0.1:5199
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
const WIDTHS = [1920, 1440, 1199, 991, 768, 390]

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })

  console.log(`\nbase: ${base}`)
  console.log("h1 height with the trailing '.' present vs the node deleted.\n")
  console.log(
    "vw".padEnd(6) +
      "word".padEnd(19) +
      "withDot".padEnd(9) +
      "noDot".padEnd(8) +
      "delta".padEnd(7) +
      "parent".padEnd(9) +
      "cw".padEnd(6) +
      "dotW",
  )
  console.log("-".repeat(84))

  const rows = []

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
        const h1 = el.closest("h1")
        const parent = el.parentElement
        const next = el.nextSibling
        const dotNode = next && next.nodeType === 3 ? next : null

        // Width of the trailing text, measured while it is still attached.
        let dotW = 0
        if (dotNode) {
          const rng = document.createRange()
          rng.selectNodeContents(dotNode)
          for (const rc of rng.getClientRects()) dotW += rc.width
        }

        const heightWith = (() => {
          el.textContent = word
          return Math.round(h1.getBoundingClientRect().height)
        })()

        // Detach the trailing node, re-measure, then put it back exactly.
        let heightWithout = heightWith
        if (dotNode) {
          dotNode.remove()
          el.textContent = word
          heightWithout = Math.round(h1.getBoundingClientRect().height)
          el.parentNode.insertBefore(dotNode, el.nextSibling)
        }
        el.textContent = word

        return {
          withDot: heightWith,
          noDot: heightWithout,
          dotW: Math.round(dotW),
          parentTag: parent ? parent.tagName : "?",
          cw: parent ? parent.clientWidth : 0,
          h1Tag: h1.tagName,
        }
      }, word)

      if (!r) {
        console.log("no #hero-rotate")
        break
      }
      rows.push({ vw: w, word, ...r })
      console.log(
        String(w).padEnd(6) +
          word.padEnd(19) +
          String(r.withDot).padEnd(9) +
          String(r.noDot).padEnd(8) +
          String(r.withDot - r.noDot).padEnd(7) +
          `${r.parentTag}/${r.h1Tag}`.padEnd(9) +
          String(r.cw).padEnd(6) +
          r.dotW,
      )
    }
    console.log("")
    await ctx.close()
  }

  // Verdict: within each viewport, is the no-dot height constant?
  console.log("=".repeat(84))
  for (const w of WIDTHS) {
    const set = rows.filter((r) => r.vw === w)
    if (!set.length) continue
    const withSet = new Set(set.map((r) => r.withDot))
    const noSet = new Set(set.map((r) => r.noDot))
    console.log(
      `vw ${String(w).padEnd(6)} withDot: ${withSet.size} distinct height(s) ` +
        `[${[...withSet].join(", ")}]   noDot: ${noSet.size} distinct ` +
        `[${[...noSet].join(", ")}]`,
    )
  }
  console.log("")

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
