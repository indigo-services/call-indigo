#!/usr/bin/env node
"use strict"
/**
 * Final proof on the SHIPPED stylesheet: no candidate injection, no inline
 * overrides. Everything a candidate sheet proved was proved against values pushed
 * onto the live DOM — which is exactly the thing that can differ from what the
 * committed CSS does. This shoots the three bands as the build actually defines
 * them, and reads the painted colour back out.
 *
 * It also exercises the trap directly: `.slab-photo::before` paints at 88%, so if
 * a scrim were still a literal the measured tint would not match the measured
 * slab. Both are read and compared.
 *
 *   scripts/_devshot.sh --run scripts/_probe_blue_shipped.cjs
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

const EXPECTED = {
  home: "#2a5aa2",
  residential: "#215583",
  commercial: "#2c3a96",
}

const ROUTES = [
  { name: "home", route: "/", selector: "section.scrim-blue" },
  { name: "residential", route: "/residential", selector: "section.scrim-blue" },
  { name: "commercial", route: "/commercial", selector: "section.scrim-blue" },
]

/** "rgb(a, b, c)" or "rgba(a, b, c, x)" or "color(srgb r g b / x)" -> {r,g,b,a} in 0-255 */
function parseColour(s) {
  if (!s) return null
  let m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(s)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
  // color(srgb 0.16 0.35 0.63 / 0.9) — computed style for color-mix in Chromium
  m = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/.exec(s)
  if (m) return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a: m[4] === undefined ? 1 : +m[4] }
  return null
}
const hex = (c) =>
  "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
function near(a, b, tol = 3) {
  return Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol
}

async function main() {
  const base = process.argv[process.argv.indexOf("--base") + 1] || "http://127.0.0.1:5199"
  const outDir = ".preview/blues"
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })

  let failures = 0
  const cells = []
  const W = 1360
  const H = 380
  const HEADER = 30

  for (const t of ROUTES) {
    const page = await ctx.newPage()
    await page.goto(base + t.route, { waitUntil: "networkidle" })
    await page.addStyleTag({
      content: `*,*::before,*::after{transition:none!important;animation:none!important}.reveal{opacity:1!important;transform:none!important}`,
    })
    await page.waitForTimeout(400)

    const el = page.locator(t.selector).first()
    if ((await el.count()) === 0) {
      console.log(`  ! ${t.name}: no ${t.selector}`)
      failures++
      await page.close()
      continue
    }
    await el.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -40))
    await page.waitForTimeout(250)

    // Read what actually painted — never the value that was requested.
    const m = await page.evaluate((sel) => {
      const n = document.querySelector(sel)
      const cs = getComputedStyle(n)
      const before = getComputedStyle(n, "::before")
      return {
        bg: cs.backgroundColor,
        token: cs.getPropertyValue("--color-residential").trim(),
        brand: cs.getPropertyValue("--color-brand").trim(),
        scrim: before.backgroundColor,
      }
    }, t.selector)

    const want = parseColour(
      (() => {
        const h = EXPECTED[t.name]
        return `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`
      })(),
    )
    const got = parseColour(m.bg)
    const scrim = parseColour(m.scrim)

    const okBg = got && near(got, want)
    const okScrim = scrim && near(scrim, want)
    if (!okBg || !okScrim) failures++

    console.log(
      `  ${t.name.padEnd(12)} slab ${got ? hex(got) : m.bg}  ${okBg ? "== expected" : `!= ${EXPECTED[t.name]}`}` +
        `   scrim ${scrim ? hex(scrim) : m.scrim} (a=${scrim?.a ?? "?"})  ${okScrim ? "derived ok" : "SCHEM MISMATCH"}`,
    )

    const box = await el.boundingBox()
    const band = path.join(outDir, `shipped-${t.name}.png`)
    await page.screenshot({
      path: band,
      clip: { x: box.x, y: box.y, width: box.width, height: Math.min(380, box.height) },
    })

    const buf = await sharp(band).resize(W, H, { fit: "cover", position: "top" }).png().toBuffer()
    const svg = Buffer.from(
      `<svg width="${W}" height="${HEADER}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${W}" height="${HEADER}" fill="#0b1220"/>
         <text x="14" y="21" font-family="monospace" font-size="16" fill="#ffffff">
           SHIPPED ${t.name}  slab ${got ? hex(got) : "?"}  scrim ${scrim ? hex(scrim) : "?"} @ ${scrim?.a ?? "?"}
         </text>
       </svg>`,
    )
    cells.push(
      await sharp({ create: { width: W, height: H + HEADER, channels: 3, background: "#ffffff" } })
        .composite([{ input: svg, left: 0, top: 0 }, { input: buf, left: 0, top: HEADER }])
        .png()
        .toBuffer(),
    )
    await page.close()
  }

  if (cells.length) {
    const cellH = H + HEADER
    await sharp({ create: { width: W, height: cellH * cells.length, channels: 3, background: "#ffffff" } })
      .composite(cells.map((b, i) => ({ input: b, left: 0, top: i * cellH })))
      .png()
      .toFile(path.join(outDir, "shipped.png"))
    console.log(`\n  -> ${path.join(outDir, "shipped.png")}`)
  }

  await browser.close()
  console.log(failures === 0 ? "\n  SHIPPED COLOURS MATCH" : `\n  ${failures} MISMATCH(ES)`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
