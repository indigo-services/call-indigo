/**
 * _probe_reviews_width.cjs — the reviews section's WIDTH treatment, measured.
 *
 * Why this exists. Client item 6 asked for the testimonials to become a
 * carousel, on the grounds that "it looks like there's too much white space".
 * A carousel was built and then reverted on the client's instruction: showing
 * one review at a time read SPARSER than the 3-across row, not denser. This
 * script is the measurement that settled it, kept so the next attempt starts
 * from numbers rather than taste.
 *
 * What it measures, at each width:
 *   - the track's content box and each VISIBLE card's box, so the empty track
 *     either side of the row is a number and not an impression
 *   - how much of the track the cards fill (`fill`)
 *   - how many cards sit on one line (`perRow`), which is what changes at the
 *     `md`/`lg` breakpoints
 *
 * This is a measuring tool, not an assertion tool. It prints; it does not
 * judge.
 *
 *   scripts/_devshot.sh --run scripts/_probe_reviews_width.cjs
 */
const path = require("path")
const WORKSPACE = "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

const WIDTHS = [1920, 1600, 1440, 1280, 1200, 991, 768, 390]

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

function measure() {
  const section = document.querySelector("#reviews")
  const cards = [...document.querySelectorAll("#reviews article")]
  const r = (el) => {
    if (!el) return null
    const b = el.getBoundingClientRect()
    // `top` is REQUIRED here, not decoration: the rows are grouped by it below.
    // Omitting it made `boxes[0].top` undefined, every filter match nothing, and
    // the script print a plausible-looking fill computed from a zero row — an
    // assertion-shaped tool that could not see what it claimed to measure.
    return { x: Math.round(b.x), top: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }
  }
  const sr = r(section)
  const boxes = cards.map(r)
  // Group cards by their rounded `top` — cards sharing a top are on one row.
  // (a few px of tolerance: sub-pixel layout can put two cards 1px apart)
  const firstTop = boxes.length ? boxes[0].top : 0
  const onFirstRow = boxes.filter((b) => Math.abs(b.top - firstTop) <= 2)
  const rowWidth = onFirstRow.reduce((n, b) => n + b.w, 0)
  return {
    cards: boxes.length,
    perRow: onFirstRow.length,
    cardW: boxes[0]?.w ?? null,
    cardH: boxes[0]?.h ?? null,
    sectionW: sr?.w ?? null,
    sectionH: sr?.h ?? null,
    // How much of the section's width the first row occupies.
    fill: sr && rowWidth ? +(rowWidth / sr.w).toFixed(3) : null,
  }
}

(async () => {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })

  console.log("width   cards  perRow  card.w  card.h  section.w  section.h  fill")
  console.log("──────  ─────  ──────  ──────  ──────  ─────────  ─────────  ─────")

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(base + "/", { waitUntil: "networkidle" })
    await page.evaluate(() =>
      document.querySelector("#reviews")?.scrollIntoView({ block: "center" }),
    )
    await page.waitForTimeout(350)
    const m = await page.evaluate(measure)
    console.log(
      `${String(width).padEnd(6)}  ${String(m.cards).padEnd(5)}  ${String(m.perRow).padEnd(6)}  ` +
        `${String(m.cardW).padEnd(6)}  ${String(m.cardH).padEnd(6)}  ` +
        `${String(m.sectionW).padEnd(9)}  ${String(m.sectionH).padEnd(9)}  ${m.fill}`,
    )
    await page.close()
  }

  await browser.close()
  console.log("\n(measure-only: this script asserts nothing)")
})()
