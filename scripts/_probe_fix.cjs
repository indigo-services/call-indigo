// One-off: find which CSS change makes the service-card chip paint above the
// photo. Theory is unreliable here (Tailwind preflight sets `img{display:block}`,
// so the chip is a block-level box that comes after the photo div in tree order,
// which should already paint on top). So measure the painted result instead.
const path = require("path")
const WS =
  process.env.NODE_PATH ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const { chromium } = require(path.join(WS, "playwright-core"))
const sharp = require(path.join(WS, "sharp"))
const CHROME =
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
const BASE = (() => {
  const i = process.argv.indexOf("--base")
  return i === -1 ? "http://127.0.0.1:5199" : process.argv[i + 1]
})()

const CHIP = "#services article img[src*='services-icon']"
const WRAP = "#services article > div"

const CANDIDATES = [
  ["baseline (no change)", ""],
  ["chip position:relative", `${CHIP}{position:relative}`],
  ["chip position:relative;z-index:1", `${CHIP}{position:relative;z-index:1}`],
  ["chip display:inline-block", `${CHIP}{display:inline-block}`],
  ["wrapper overflow:visible", `${WRAP}{overflow:visible}`],
  ["wrapper overflow:visible + chip relative", `${WRAP}{overflow:visible}${CHIP}{position:relative}`],
  ["chip transform:translateZ(0)", `${CHIP}{transform:translateZ(0)}`],
  ["chip z-index:1 + wrapper isolation", `${WRAP}{isolation:isolate}${CHIP}{position:relative;z-index:1}`],
]

async function measureCyan(buf, x0, x1) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const isCyan = (r, g, b) => Math.abs(r - 48) < 26 && Math.abs(g - 195) < 26 && Math.abs(b - 235) < 26
  let minY = 1e9, maxY = -1, minX = 1e9, maxX = -1, n = 0
  const xa = x0 == null ? 0 : Math.max(0, x0)
  const xb = x1 == null ? W : Math.min(W, x1)
  for (let y = 0; y < H; y++)
    for (let x = xa; x < xb; x++) {
      const i = (y * W + x) * C
      if (isCyan(data[i], data[i + 1], data[i + 2])) {
        n++
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  return { n, h: maxY < 0 ? 0 : maxY - minY + 1, minY, maxY, minX, maxX, W, H }
}

;(async () => {
  const b = await chromium.launch({ executablePath: CHROME })
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await p.goto(BASE + "/#services", { waitUntil: "networkidle" })
  await p.addStyleTag({
    content: "*{transition:none!important;animation:none!important}.reveal{opacity:1!important;transform:none!important}",
  })
  await p.waitForTimeout(300)

  // The chip's own box, for reference - and its x offset inside the card, so the
  // cyan measurement can be restricted to the chip's column. Without that the
  // whole card is scanned and any other cyan pixel inflates the result.
  const geo = await p.evaluate((sel) => {
    const el = document.querySelector(sel)
    const r = el.getBoundingClientRect()
    const card = el.closest("article").getBoundingClientRect()
    return { y: r.y, bottom: r.bottom, h: r.height, w: r.width, relX: r.x - card.x }
  }, CHIP)
  console.log(
    `chip box: ${geo.h}px tall at y=${geo.y.toFixed(1)}..${geo.bottom.toFixed(1)}  ` +
      `(a fully visible chip shows ~${geo.h - 6}px of cyan: 62 - 2*3 border)\n`,
  )
  console.log("variant".padEnd(40), "cyan px", "cyan h(css)", "bbox x(css)", " verdict")
  console.log("-".repeat(96))

  for (const [label, css] of CANDIDATES) {
    const handle = await p.addStyleTag({ content: css || "/* noop */" })
    await p.waitForTimeout(120)
    const card = p.locator("#services article").first()
    const buf = await card.screenshot()
    const x0 = Math.round((geo.relX - 8) * 2)
    const x1 = Math.round((geo.relX + geo.w + 8) * 2)
    const m = await measureCyan(buf, x0, x1)
    const hCss = m.h / 2
    const verdict = hCss > geo.h - 10 ? "FULL CHIP VISIBLE" : hCss > 30 ? "partial" : "clipped"
    console.log(
      label.padEnd(40),
      String(m.n).padEnd(8),
      hCss.toFixed(1).padEnd(12),
      `${(m.minX / 2).toFixed(0)}..${(m.maxX / 2).toFixed(0)}`.padEnd(12),
      verdict,
    )
    await handle.evaluate((n) => n.remove())
  }

  await b.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
