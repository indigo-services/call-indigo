#!/usr/bin/env node
"use strict"
/**
 * End-to-end proof that the Design System colour picker rethemes the real pages.
 *
 * WHY A BROWSER
 * The suite can assert the token map, the hex parsing and that the stylesheet
 * derives its scrims — none of which proves a pick reaches a marketing page. That
 * chain runs through a native colour input, a React controlled input, a
 * `localStorage` round-trip and a CSS `color-mix()` that re-resolves when its
 * variable changes. Only a browser can settle it.
 *
 * WHAT IT CHECKS
 *   1. the section's computed background actually becomes the picked colour
 *   2. the hero's ::before scrim follows it (the trap — a stale literal scrim
 *      paints over the new slab and the pick appears not to work)
 *   3. Save survives a reload
 *   4. leaving the page without saving does NOT leave the preview applied
 *
 * It restores the defaults at the end, so running it does not leave a test
 * colour in the browser.
 *
 *   scripts/_devshot.sh --run scripts/_probe_theme_picker.cjs
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

const FREEZE = `
  *, *::before, *::after { transition: none !important; animation: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
`

/** An obviously-not-shipped colour, so a false pass is impossible. */
const TEST_HEX = "#b3005e"
const TEST_RGB = "rgb(179, 0, 94)"

/**
 * Set a React-controlled input's value.
 *
 * Assigning `el.value` directly does not fire React's onChange: React keeps its
 * own value tracker and sees no change. Going through the prototype setter
 * bypasses that tracker, so the dispatched event looks like a real edit.
 *
 * Takes ONE argument because `page.evaluate(fn, arg)` passes exactly one — a
 * three-parameter signature silently receives only the first.
 */
const SET_INPUT = ({ selector, index, value }) => {
  const el = document.querySelectorAll(selector)[index]
  if (!el) return false
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set
  setter.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
  return true
}

const COLOR_INPUT = 'input[type="color"]'
const setPicker = (page, index, value) =>
  page.evaluate(SET_INPUT, { selector: COLOR_INPUT, index, value })

async function readBand(page) {
  return page.evaluate(() => {
    const section = document.querySelector("section.scrim-hero")
    if (!section) return null
    return {
      slab: getComputedStyle(section).backgroundColor,
      scrim: getComputedStyle(section, "::before").backgroundColor,
    }
  })
}

async function main() {
  const base = process.argv[process.argv.indexOf("--base") + 1] || "http://127.0.0.1:5199"
  const outDir = ".preview/picker"
  fs.mkdirSync(outDir, { recursive: true })

  const results = []
  const record = (name, ok, detail) => {
    results.push({ name, ok, detail })
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`)
  }

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  })
  const page = await ctx.newPage()

  /* ── 1. the picker renders ─────────────────────────────────────────────── */
  await page.goto(base + "/admin/design", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: FREEZE })
  await page.waitForSelector('input[type="color"]', { timeout: 10000 })
  const pickers = await page.locator('input[type="color"]').count()
  record("three colour inputs render", pickers === 3, `found ${pickers}`)
  await page.locator("h1").first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(outDir, "design-page.png"), fullPage: false })

  /* ── 2. baseline ───────────────────────────────────────────────────────── */
  await page.goto(base + "/residential", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: FREEZE })
  const before = await readBand(page)
  record("baseline band reads the shipped green", before?.slab === "rgb(12, 106, 78)", before?.slab)
  await page.locator("section.scrim-hero").first().screenshot({ path: path.join(outDir, "before.png") })

  /* ── 3. pick a colour on the design page ───────────────────────────────── */
  await page.goto(base + "/admin/design", { waitUntil: "networkidle" })
  await page.waitForSelector('input[type="color"]', { timeout: 10000 })
  // Index 1 is Residential — THEME_TOKENS is [home, residential, commercial].
  await setPicker(page, 1, TEST_HEX)
  await page.waitForTimeout(200)
  const textField = await page.locator('input[id="primary---color-residential"]').inputValue()
  record("the hex field follows the picker", textField.toLowerCase() === TEST_HEX, textField)

  /* ── 4. does the marketing page actually change? ───────────────────────── */
  await page.goto(base + "/residential", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: FREEZE })
  const previewed = await readBand(page)
  const slabHex = previewed?.slab?.replace(/\s/g, "")
  record("the hero slab takes the picked colour", slabHex === TEST_RGB.replace(/\s/g, ""), slabHex)
  // The trap: if the scrim were a literal it would still be the old green here.
  const scrimIsOld = /12,\s*106,\s*78/.test(previewed?.scrim ?? "")
  record(
    "the hero scrim follows the pick (not the old green)",
    !scrimIsOld && previewed?.scrim !== before?.scrim,
    previewed?.scrim,
  )
  await page.locator("section.scrim-hero").first().screenshot({ path: path.join(outDir, "preview.png") })

  /* ── 5. save, then confirm it survives a reload ────────────────────────── */
  await page.goto(base + "/admin/design", { waitUntil: "networkidle" })
  await page.waitForSelector('input[type="color"]', { timeout: 10000 })
  await setPicker(page, 1, TEST_HEX)
  await page.waitForTimeout(150)
  await page.getByRole("button", { name: /Save to this browser/i }).click()
  await page.waitForTimeout(600)

  await page.goto(base + "/residential", { waitUntil: "networkidle" })
  const afterReload = await readBand(page)
  record(
    "the saved colour survives a reload",
    afterReload?.slab?.replace(/\s/g, "") === TEST_RGB.replace(/\s/g, ""),
    afterReload?.slab,
  )

  /* ── 6. an unsaved preview must not linger ─────────────────────────────── */
  await page.goto(base + "/admin/design", { waitUntil: "networkidle" })
  await page.waitForSelector('input[type="color"]', { timeout: 10000 })
  await setPicker(page, 1, "#00ff00")
  await page.waitForTimeout(150)
  await page.goto(base + "/residential", { waitUntil: "networkidle" })
  const afterLeaving = await readBand(page)
  record(
    "an unsaved preview reverts on leaving the page",
    afterLeaving?.slab?.replace(/\s/g, "") === TEST_RGB.replace(/\s/g, ""),
    `still ${afterLeaving?.slab} (the saved value, not #00ff00)`,
  )

  /* ── 7. restore the shipped defaults ───────────────────────────────────── */
  await page.goto(base + "/admin/design", { waitUntil: "networkidle" })
  await page.waitForSelector('input[type="color"]', { timeout: 10000 })
  const defaults = ["#2a5aa2", "#0c6a4e", "#37479e"]
  for (let i = 0; i < defaults.length; i++) {
    await setPicker(page, i, defaults[i])
    await page.waitForTimeout(100)
  }
  await page.getByRole("button", { name: /Save to this browser/i }).click()
  await page.waitForTimeout(600)
  await page.goto(base + "/residential", { waitUntil: "networkidle" })
  const restored = await readBand(page)
  record("defaults restored", restored?.slab?.replace(/\s/g, "") === "rgb(12,106,78)", restored?.slab)

  await browser.close()

  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} browser checks passed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
