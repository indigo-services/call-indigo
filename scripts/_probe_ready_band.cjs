/**
 * _probe_ready_band.cjs — does a BLACK FADE actually exist on any band?
 *
 * Issue #21 (client item 11) claims: "a CSS gradient in src/index.css. The client
 * is describing an asymmetry — black on the left, none on the right."
 *
 * `grep -rn "gradient" src/` returns NOTHING, so the issue's stated cause does not
 * match the code. Before writing (or refusing to write) any fix, establish what is
 * actually rendered: walk every element, read its computed background-image, and
 * report any that is a gradient — with its direction and its stops.
 *
 *   scripts/_devshot.sh --run scripts/_probe_ready_band.cjs
 */
const path = require("path")
const WORKSPACE = "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

function scan() {
  const out = []
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el)
    const bg = cs.backgroundImage
    if (!bg || bg === "none") continue
    const b = el.getBoundingClientRect()
    if (b.width < 2 || b.height < 2) continue
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 70),
      id: el.id || null,
      // Which band/section this sits in.
      section: el.closest("section")?.id || el.closest("section")?.className?.toString().slice(0, 40) || null,
      image: bg.slice(0, 220),
      isGradient: /gradient\(/.test(bg),
      // A "black fade" would have a stop at or near rgb(0,0,0).
      hasBlack: /rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(bg),
      box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
    })
  }
  return out
}

(async () => {
  const base = process.argv.includes("--base")
    ? process.argv[process.argv.indexOf("--base") + 1]
    : "http://127.0.0.1:5199"
  const browser = await chromium.launch({ executablePath: CHROME })
  const page = await browser.newPage({ viewport: { width: 1920, height: 900 } })
  await page.goto(base + "/", { waitUntil: "networkidle" })
  // Reveal-on-scroll: every band is `opacity: 0` until scrolled past, so scroll
  // the whole page first or the scan misses most of it.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(600)

  const found = await page.evaluate(scan)
  const gradients = found.filter((f) => f.isGradient)
  const blacks = found.filter((f) => f.hasBlack)

  console.log(`elements with a background-image: ${found.length}`)
  console.log(`  … of which GRADIENT: ${gradients.length}`)
  console.log(`  … of which contain a BLACK stop: ${blacks.length}`)
  console.log()

  if (gradients.length === 0) {
    console.log("NO GRADIENT IS RENDERED ANYWHERE ON THE HOME PAGE.")
  } else {
    console.log("── gradients ────────────────────────────────────────────")
    for (const g of gradients) {
      console.log(`  ${g.tag}.${g.cls}  [section: ${g.section}]`)
      console.log(`     ${g.image}`)
      console.log(`     box ${g.box.w}x${g.box.h} @ ${g.box.x},${g.box.y}  black-stop=${g.hasBlack}`)
    }
  }

  await browser.close()
})()
