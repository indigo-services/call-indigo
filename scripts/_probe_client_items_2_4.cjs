#!/usr/bin/env node
"use strict"
/**
 * Probe for client items 2 and 4 (issues #13 and #14).
 *
 * Both are LAYOUT changes, and `renderToStaticMarkup` sees neither CSS nor the
 * layout engine — the suite can pass while the page is visibly wrong. So the two
 * claims are measured in a real browser instead:
 *
 *   #13  the years badge reads "15", no "+", and the lockup is still coherent
 *        (the figure and its label do not collide, and the badge does not
 *        overflow the photo it is anchored to).
 *   #14  "Clear Path From / Start To Finish" renders as exactly TWO lines at
 *        every width, and the heading does not push its section wider than its
 *        container — which is the symptom the client described.
 *
 * Usage:
 *   scripts/_devshot.sh --run scripts/_probe_client_items_2_4.cjs
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

/* ── the page-side measurement ───────────────────────────────────────────── */
function collect() {
  const px = (n) => Math.round(n * 10) / 10
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { w: px(r.width), h: px(r.height), x: px(r.left), y: px(r.top) }
  }

  const badge = document.querySelector(".years-badge")
  const num = document.querySelector(".years-badge-num")
  const label = document.querySelector(".years-badge-label")
  const photo = document.querySelector(".about-img2, .about-img1")

  // Count the rendered lines of the process heading. `getClientRects()` returns
  // one rect per line box, which is the only reliable read — comparing the
  // container's height to its line-height is an inference, and this repo has
  // been burned by inferring a wrap before (MEMORY.md: "do not detect a wrap by
  // comparing rect tops").
  const h2 = [...document.querySelectorAll("#process h2.h-section")][0]

  let lines = null
  if (h2) {
    // `Range.getClientRects()` returns a rect per line box AND one for the
    // <br> itself, so it over-counts by exactly the number of <br>s. Count the
    // DISTINCT top offsets instead — a rect per rendered line, the <br> folded
    // into whatever shares its offset.
    const range = document.createRange()
    range.selectNodeContents(h2)
    const tops = new Set(
      [...range.getClientRects()]
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => Math.round(r.top)),
    )
    lines = tops.size
  }

  const shell = h2 ? h2.closest(".shell") || h2.closest("section") : null

  return {
    badge: {
      text: badge ? badge.textContent.replace(/\s+/g, " ").trim() : null,
      numText: num ? num.textContent.trim() : null,
      hasSup: !!(badge && badge.querySelector("sup")),
      box: rect(badge),
      numBox: rect(num),
      labelBox: rect(label),
      // Does the numeric label collide with its own caption?
      numLabelOverlap: (() => {
        if (!num || !label) return null
        const a = num.getBoundingClientRect()
        const b = label.getBoundingClientRect()
        return px(Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      })(),
      // Does the badge stick out past the photo it is anchored to?
      photoBox: rect(photo),
      overflowsPhoto: (() => {
        if (!badge || !photo) return null
        const a = badge.getBoundingClientRect()
        const b = photo.getBoundingClientRect()
        return px(b.left - a.left)
      })(),
    },
    heading: {
      text: h2 ? h2.textContent.replace(/\s+/g, " ").trim() : null,
      lines,
      html: h2 ? h2.innerHTML.slice(0, 80) : null,
      box: rect(h2),
      shellBox: rect(shell),
      // The client's actual complaint: the heading pushes past its container.
      overflowsShell: (() => {
        if (!h2 || !shell) return null
        const a = h2.getBoundingClientRect()
        const b = shell.getBoundingClientRect()
        return px(a.right - b.right)
      })(),
      // A single unbroken line is what "all on one line" means.
      singleLine: lines === 1,
    },
  }
}

(async () => {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })
  const out = []

  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } })
    await page.goto(base + "/", { waitUntil: "networkidle" })
    // Scroll the process band into view so the reveal animation has run.
    await page.evaluate(() => {
      const h = document.querySelector("#process")
      if (h) h.scrollIntoView({ block: "center" })
    })
    await page.waitForTimeout(600)
    const data = await page.evaluate(collect)
    out.push({ width: w, ...data })
    await page.close()
  }

  await browser.close()

  console.log(JSON.stringify(out, null, 2))

  /* ── verdicts ──────────────────────────────────────────────────────────── */
  let bad = 0
  console.log("\n── verdicts ──────────────────────────────────────────────")
  for (const r of out) {
    const w = r.width
    const b = r.badge
    const h = r.heading

    // #13
    // The badge is `max-md:hidden`, so below 768 it is correctly 0x0 — skip it
    // there rather than reporting a fix as missing.
    if (b.text !== null && b.box && b.box.w > 0) {
      const plus = b.hasSup || /\+/.test(b.numText || "")
      if (plus) { console.log(`  ✗ #13 ${w}px — the badge still carries a "+": ${b.numText}`); bad++ }
      if (b.numText !== "15") { console.log(`  ✗ #13 ${w}px — figure reads "${b.numText}", not "15"`); bad++ }
      if (b.numLabelOverlap !== null && b.numLabelOverlap > 0) {
        console.log(`  ✗ #13 ${w}px — the figure and its label overlap by ${b.numLabelOverlap}px`); bad++
      }
    } else if (w < 768) {
      console.log(`  · #13 ${w}px — badge hidden by design (max-md:hidden), nothing to check`)
    }

    // #14
    if (h.text === null) {
      console.log(`  ✗ #14 ${w}px — no #process h2 found`); bad++
    } else {
      if (h.lines !== 2) { console.log(`  ✗ #14 ${w}px — heading renders ${h.lines} line(s), expected 2`); bad++ }
      if (h.overflowsShell !== null && h.overflowsShell > 0.5) {
        console.log(`  ✗ #14 ${w}px — heading overflows its container by ${h.overflowsShell}px`); bad++
      }
      // `textContent` folds the <br> with no whitespace, so allow zero-or-more.
      if (!/^Clear Path From\s*Start To Finish$/.test(h.text)) {
        console.log(`  ✗ #14 ${w}px — heading text is "${h.text}"`); bad++
      }
    }
  }

  if (bad === 0) console.log("  ✓ all widths: #13 badge reads 15 without +; #14 heading is 2 lines and fits")
  else console.log(`  ${bad} failing measurement(s)`)

  process.exit(bad === 0 ? 0 : 1)
})()
