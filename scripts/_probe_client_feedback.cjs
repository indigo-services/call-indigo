#!/usr/bin/env node
"use strict"
/**
 * Measure every claim in the 2026-09-25 client feedback round, BEFORE changing
 * anything. One probe, so the numbers in the plan document and the numbers in the
 * after-shot come from the same instrument.
 *
 * Claims measured here:
 *   1/2. the red Emergency button — how big is it on desktop, and does it exist
 *        at all below 991?  (`display:none !important` in index.css ≤991 vs
 *        `max-md:static` in the markup — the two disagree, and CSS wins.)
 *   3.   the hero arch frame — its size, and where its centre sits relative to
 *        the column it lives in and to the viewport.
 *   4.   the mobile carousel — does #hero-rotate's text and #hero-arch's src
 *        actually change with motion ON at 390?
 *   5.   the small round frame (`.banner-img2`) under the hero headline.
 *   6.   the #process step numerals — computed colour vs the card's background.
 *   7.   the DOM order of #reviews / #faq / #brands.
 *   8.   the phone badge floating in the #contact CTA band.
 *   9.   whether the contact form has an "already a member" control.
 *
 * Usage:
 *   scripts/_devshot.sh --run scripts/_probe_client_feedback.cjs
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
  const shown = (el) => {
    if (!el) return false
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  const navy = document.querySelector(".navy-box")
  const fig1 = document.querySelector(".banner-img1")
  const arch = document.getElementById("hero-arch")
  const fig2 = document.querySelector(".banner-img2")
  const row = document.querySelector(".hero-row")
  const inner = document.querySelector(".hero-inner")
  const imgCol = document.querySelector(".banner-img-con")
  // The hero band itself: the `.slab` that contains the arch. Its height is what
  // every change to the arch's size moves, so it is the number to watch.
  const heroBand = arch ? arch.closest("section") : null
  const heroBox = heroBand ? heroBand.getBoundingClientRect() : null

  // The #process numerals. `.text-mist` on a white `.card`.
  const numeral = document.querySelector("#process .card b")
  const numeralCard = numeral ? numeral.closest(".card") : null
  const cs = numeral ? getComputedStyle(numeral) : null
  const cardCs = numeralCard ? getComputedStyle(numeralCard) : null

  // The floating phone badge in the CTA band: the 110px disc is a <span>
  // sibling of the photo inside the band's first column.
  const cta = document.querySelector("#contact .slab-body .relative")
  const badge = cta
    ? Array.from(cta.children).find(
        (n) => n.tagName === "SPAN" && n.querySelector("svg") && getComputedStyle(n).position === "absolute",
      )
    : null

  const order = ["#about", "#services", "#choose", "#estimate", "#process", "#reviews", "#faq", "#brands", "#contact"]
    .map((sel) => ({ sel, i: Array.from(document.querySelectorAll("[id]")).indexOf(document.querySelector(sel)) }))
    .filter((s) => s.i !== -1)

  return {
    navy: {
      present: !!navy,
      shown: shown(navy),
      display: navy ? getComputedStyle(navy).display : null,
      position: navy ? getComputedStyle(navy).position : null,
      box: rect(navy),
    },
    arch: { box: rect(arch), fig: rect(fig1), imgCol: rect(imgCol), inner: rect(inner), row: rect(row) },
    heroBand: rect(heroBand),
    pageH: document.body.scrollHeight,
    small: { present: !!fig2, shown: shown(fig2), box: rect(fig2) },
    numeral: {
      present: !!numeral,
      color: cs ? cs.color : null,
      fontSize: cs ? cs.fontSize : null,
      bg: cardCs ? cardCs.backgroundColor : null,
    },
    badge: { present: !!badge, box: rect(badge), label: badge ? badge.textContent.trim().slice(0, 20) : null },
    order,
    viewport: { w: window.innerWidth, docW: document.documentElement.scrollWidth },
  }
}

/* ── contrast, so the numeral verdict is arithmetic and not an opinion ────── */
function parseRgb(s) {
  const m = /rgba?\(([^)]+)\)/.exec(s || "")
  if (!m) return null
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
}
function lum({ r, g, b }) {
  const f = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function contrast(fg, bg) {
  const a = parseRgb(fg)
  const b = parseRgb(bg)
  if (!a || !b) return null
  // Composite a translucent foreground over its background first — the numerals
  // may be an alpha tint, and comparing raw channels would overstate them.
  const c = {
    r: a.r * a.a + b.r * (1 - a.a),
    g: a.g * a.a + b.g * (1 - a.a),
    b: a.b * a.a + b.b * (1 - a.a),
  }
  const l1 = lum(c)
  const l2 = lum(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })
  console.log(`\nbase: ${base}\n`)

  /* ── 1/2/3/5/6/7/8 — geometry, at every width ──────────────────────────── */
  console.log("=== HOME: hero + section order (reduced motion, so nothing animates) ===")
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const page = await ctx.newPage()
    await page.goto(base + "/", { waitUntil: "networkidle" })
    await page.waitForTimeout(400)
    const r = await page.evaluate(collect)

    const n = r.navy
    console.log(`\n--- ${w}px  (docW ${r.viewport.docW}${r.viewport.docW > w ? "  *** HORIZONTAL OVERFLOW ***" : ""})`)
    console.log(
      `  emergency .navy-box : shown=${n.shown} display=${n.display} position=${n.position} ` +
        (n.box ? `box=${n.box.w}x${n.box.h} @x${n.box.x},y${n.box.y}` : "box=—"),
    )
    const a = r.arch
    if (a.box && a.imgCol) {
      const colCentre = a.imgCol.x + a.imgCol.w / 2
      const archCentre = a.box.x + a.box.w / 2
      console.log(
        `  arch img            : ${a.box.w}x${a.box.h} @x${a.box.x}  centre=${Math.round(archCentre)}  ` +
          `figure=${a.fig ? `${a.fig.w}@x${a.fig.x}` : "—"}`,
      )
      console.log(
        `  arch balance        : imgCol=${a.imgCol.w}@x${a.imgCol.x} centre=${Math.round(colCentre)}  ` +
          `offset from column centre=${Math.round(archCentre - colCentre)}px  ` +
          `viewport centre=${Math.round(r.viewport.w / 2)}`,
      )
      console.log(
        `  hero-row            : ${a.row ? `${a.row.w}@x${a.row.x}` : "—"}   text col=${a.inner ? `${a.inner.w}@x${a.inner.x}` : "—"}`,
      )
      console.log(`  hero band           : ${r.heroBand.w}x${r.heroBand.h}   page height=${r.pageH}`)
    } else {
      console.log("  arch                : not rendered")
    }
    console.log(
      `  small round frame   : present=${r.small.present} shown=${r.small.shown}` +
        (r.small.box ? `  ${r.small.box.w}x${r.small.box.h}` : ""),
    )
    console.log(
      `  #process numeral    : color=${r.numeral.color} on ${r.numeral.bg}  ` +
        `font=${r.numeral.fontSize}  contrast=${contrast(r.numeral.color, r.numeral.bg)}:1`,
    )
    console.log(
      `  CTA phone badge     : present=${r.badge.present}` + (r.badge.box ? `  ${r.badge.box.w}x${r.badge.box.h}` : ""),
    )
    /* `order` is built from a FIXED selector list, so mapping it straight to a
       string re-prints that list and says nothing about the document. The datum
       is `i`, the index of each selector within document.querySelectorAll("[id]").
       Sort by it, and print it, or the line is a rubber stamp. */
    const byDom = [...r.order].sort((a, b) => a.i - b.i)
    if (byDom.length === 0) {
      // A vite dev server can reload the page mid-measure while it re-optimises
      // deps, which leaves a document with nothing in it. Say so loudly and move
      // on — reading `undefined.i` here used to abort the whole probe, so one
      // flaky width silently cost every later measurement.
      console.log("  *** no element on the page carries an id — the page did not render; skipping this width ***")
      await ctx.close()
      continue
    }
    console.log(`  section order (DOM) : ${byDom.map((o) => o.sel).join("  ")}`)
    console.log(`  order indices       : ${byDom.map((o) => `${o.sel}=${o.i}`).join("  ")}`)
    const idx = (sel) => r.order.find((o) => o.sel === sel)?.i
    const ri = idx("#reviews")
    const bi = idx("#brands")
    const fi = idx("#faq")
    const ordered = ri !== undefined && bi !== undefined && fi !== undefined && ri < bi && bi < fi
    console.log(
      `  F7 reviews<brands<faq: ${ordered ? "PASS" : "FAIL"}` +
        `  (reviews=${ri ?? "absent"} brands=${bi ?? "absent"} faq=${fi ?? "absent"})`,
    )
    await ctx.close()
  }

  /* ── 4 — does the carousel actually move, with motion ON? ─────────────── */
  console.log("\n=== HOME: carousel motion ON (this is the mobile complaint) ===")
  for (const w of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await page.goto(base + "/", { waitUntil: "networkidle" })
    const reduced = await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    )
    const seenWords = new Set()
    const seenSrc = new Set()
    for (let i = 0; i < 12; i++) {
      const s = await page.evaluate(() => {
        const rot = document.getElementById("hero-rotate")
        const arch = document.getElementById("hero-arch")
        return {
          word: rot ? rot.textContent : null,
          src: arch ? (arch.getAttribute("src") || "").split("/").pop() : null,
        }
      })
      if (s.word) seenWords.add(s.word)
      if (s.src) seenSrc.add(s.src)
      await page.waitForTimeout(700)
    }
    console.log(
      `  ${String(w).padEnd(5)} reducedMotion=${reduced}  distinct words=${seenWords.size} ${[...seenWords].join(", ")}`,
    )
    console.log(`  ${"".padEnd(5)} distinct arch srcs=${seenSrc.size} ${[...seenSrc].join(", ")}`)
    await ctx.close()
  }

  /* ── 9 — the contact form ─────────────────────────────────────────────── */
  console.log("\n=== CONTACT: does the form ask about membership? ===")
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(base + "/contact", { waitUntil: "networkidle" })
  await page.waitForTimeout(300)
  const form = await page.evaluate(() => {
    const f = document.querySelector("form")
    if (!f) return { found: false }
    const fields = Array.from(f.querySelectorAll("input,select,textarea"))
      .filter((el) => el.type !== "hidden")
      .map((el) => `${el.tagName.toLowerCase()}:${el.name || el.id}`)
    const groups = Array.from(f.querySelectorAll("fieldset")).map((fs) => ({
      legend: fs.querySelector("legend")?.textContent.trim() || "(none)",
      radios: Array.from(fs.querySelectorAll('input[type=radio]')).map((r) => r.value),
    }))
    return { found: true, first: fields[0], fields, groups }
  })
  console.log(`  form found          : ${form.found}`)
  if (form.found) {
    console.log(`  first field         : ${form.first}`)
    console.log(`  field order         : ${form.fields.join("  ")}`)
    console.log(`  radiosets           : ${JSON.stringify(form.groups)}`)
    const memberGroup = form.groups.find((g) => g.radios.join(",") === "yes,no")
    console.log(
      `  F9 member Yes/No    : ${memberGroup ? "PASS" : "FAIL"}` +
        (memberGroup ? `  legend="${memberGroup.legend}"` : "  (no yes/no radioset found)"),
    )
    console.log(
      `  F9 member is first  : ${form.first === "input:member" ? "PASS" : "FAIL"}  (first="${form.first}")`,
    )
  }
  await ctx.close()

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
