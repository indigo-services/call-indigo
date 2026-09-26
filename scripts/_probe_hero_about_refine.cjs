#!/usr/bin/env node
"use strict"
/**
 * Measure the two 2026-09-26 revision targets, BEFORE changing anything.
 *
 *   A. the home hero's Emergency card — inner padding, the disc's size, and
 *      whether the disc protrudes above the card's top edge and by how much.
 *      "Halfway out" is a claim about two rects, so it is checkable: the disc's
 *      top should sit ~h/2 above the card's top edge.
 *   B. the #about photo row — the two figures, the "15+ Years" badge, and where
 *      the badge sits relative to the SEAM between the two photos.
 *
 * Both are Home-only (`.navy-box` is written once, in HomePage.tsx; the badge
 * exists on no other route), so one route covers both.
 *
 * Usage:
 *   scripts/_devshot.sh --run scripts/_probe_hero_about_refine.cjs
 *   node scripts/_probe_hero_about_refine.cjs --base https://call-indigo.com
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
    return { w: px(r.width), h: px(r.height), x: px(r.left), y: px(r.top), right: px(r.right), bottom: px(r.bottom) }
  }
  const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null)

  /* ── A. the Emergency card ─────────────────────────────────────────────── */
  const navy = document.querySelector(".navy-box")
  const navyCs = navy ? getComputedStyle(navy) : null
  /* The disc is the card's first `aria-hidden` child. Selected by role rather
     than by colour class so the same selector works before and after the
     repaint — a probe that has to be edited in step with the change cannot
     measure the change. */
  const disc = navy ? navy.querySelector('[aria-hidden="true"]') : null
  const glyph = disc ? disc.querySelector("svg") : null
  const title = navy ? navy.querySelector("b") : null
  const sub = navy ? navy.querySelector("b + span") : null

  const navyBox = rect(navy)
  const discBox = rect(disc)

  /* ── B. the #about photo row ───────────────────────────────────────────── */
  /* The badge is found by its content, not its classes: `sup.closest("div")` is
     the 15+ wrapper whatever the utility list says. */
  const sup = document.querySelector("#about sup")
  const badge = sup ? sup.closest("div") : null
  const badgeBox = rect(badge)

  /* The photo row: the badge's nearest ancestor that holds BOTH figures. */
  let row = badge
  while (row && row.querySelectorAll("figure").length < 2) row = row.parentElement
  const figs = row ? Array.from(row.querySelectorAll("figure")) : []
  const photo = (f) => {
    const img = f ? f.querySelector("img") : null
    return { box: rect(f), src: img ? (img.getAttribute("src") || "").split("/").pop() : null }
  }
  const [fa, fb] = figs.map(photo)
  const rowBox = rect(row)

  /* The seam is the midpoint of the horizontal gap between the two photos, i.e.
     where a badge "between the two photos" belongs. */
  let seam = null
  if (fa?.box && fb?.box) seam = px((fa.box.right + fb.box.x) / 2)

  const overlap = (a, b) =>
    a && b ? px(Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x))) : null
  /* Positive = the badge hangs BELOW that photo's bottom edge. The two photos are
     different heights (their own aspect ratios at their own widths), so the badge
     cannot be flush with both; this says which one it clears and which it
     overhangs. */
  const below = (a, b) => (a && b ? px(a.bottom - b.bottom) : null)

  return {
    navy: {
      present: !!navy,
      shown: navy ? getComputedStyle(navy).display !== "none" && navyBox.w > 0 : false,
      box: navyBox,
      bg: cs(navy, "backgroundColor"),
      radius: cs(navy, "borderRadius"),
      padding: navyCs
        ? [navyCs.paddingTop, navyCs.paddingRight, navyCs.paddingBottom, navyCs.paddingLeft].join(" ")
        : null,
      titleColor: cs(title, "color"),
      subColor: cs(sub, "color"),
    },
    disc: {
      present: !!disc,
      box: discBox,
      bg: cs(disc, "backgroundColor"),
      /* The claim: the disc's top sits h/2 ABOVE the card's top edge. */
      protrusion: navyBox && discBox ? px(navyBox.y - discBox.y) : null,
      glyph: glyph ? rect(glyph) : null,
      /* The disc's margin-bottom is the gap to the "Emergency" line, but the
         line box's own leading makes the visual gap larger — print both. */
      gapToTitle: discBox && title ? px(title.getBoundingClientRect().top - discBox.bottom) : null,
    },
    about: {
      figCount: figs.length,
      a: fa,
      b: fb,
      seam,
      badge: { present: !!badge, box: badgeBox, shown: badge ? getComputedStyle(badge).display !== "none" : false },
      badgeCentre: badgeBox ? px(badgeBox.x + badgeBox.w / 2) : null,
      /* Positive = the badge centre is right of the seam. Zero means centred ON
         it, which is what the horizontal lockup asks for. */
      offSeam: badgeBox && seam !== null ? px(badgeBox.x + badgeBox.w / 2 - seam) : null,
      overlapA: overlap(badgeBox, fa?.box),
      overlapB: overlap(badgeBox, fb?.box),
      rowBox,
      belowRow: below(badgeBox, rowBox),
      belowA: below(badgeBox, fa?.box),
      belowB: below(badgeBox, fb?.box),
    },
    viewport: { w: window.innerWidth, docW: document.documentElement.scrollWidth },
    pageH: document.body.scrollHeight,
  }
}

/* ── contrast, so "is the white text readable on red" is arithmetic ──────── */
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
  const c = { r: a.r * a.a + b.r * (1 - a.a), g: a.g * a.a + b.g * (1 - a.a), b: a.b * a.a + b.b * (1 - a.a) }
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

    console.log(
      `\n--- ${w}px  (docW ${r.viewport.docW}${r.viewport.docW > w ? "  *** HORIZONTAL OVERFLOW ***" : ""})`,
    )

    /* ── A ─────────────────────────────────────────────────────────────── */
    const n = r.navy
    const d = r.disc
    if (!n.present) {
      console.log("  A. emergency card   : ABSENT")
    } else {
      console.log(
        `  A. emergency card   : shown=${n.shown} ${n.box.w}x${n.box.h} @x${n.box.x},y${n.box.y}  radius=${n.radius}`,
      )
      console.log(`     padding          : ${n.padding}   bg=${n.bg}`)
      console.log(
        `     disc             : ${d.present ? `${d.box.w}x${d.box.h} bg=${d.bg}` : "ABSENT"}` +
          (d.glyph ? `   glyph=${d.glyph.w}x${d.glyph.h}` : ""),
      )
      const want = d.box ? Math.round((d.box.h / 2) * 10) / 10 : null
      const got = d.protrusion
      console.log(
        `     protrusion       : ${got}px above the card's top edge  (half the disc = ${want}px)  ` +
          `gap to "Emergency" = ${d.gapToTitle}px`,
      )
      console.log(
        `     white on card bg : title ${contrast(n.titleColor, n.bg)}:1   ` +
          `sub ${contrast(n.subColor, n.bg)}:1   (AA: 4.5 small, 3.0 for >=24px bold)`,
      )
      console.log(
        `     white on disc bg : ${contrast("rgb(255,255,255)", d.bg)}:1   (AA 3.0 for a non-text mark)`,
      )
    }

    /* ── B ─────────────────────────────────────────────────────────────── */
    const a = r.about
    if (a.figCount < 2) {
      console.log(`  B. about photo row  : ${a.figCount} figure(s) found — cannot measure`)
    } else {
      console.log(
        `  B. photo row        : A=${a.a.box.w}x${a.a.box.h}@x${a.a.box.x} "${a.a.src}"   ` +
          `B=${a.b.box.w}x${a.b.box.h}@x${a.b.box.x} "${a.b.src}"`,
      )
      console.log(
        `     seam between them: x=${a.seam}   badge=${a.badge.shown ? `${a.badge.box.w}x${a.badge.box.h}` : "hidden"} ` +
          `@x${a.badge.box.x},y${a.badge.box.y} centre=${a.badgeCentre}`,
      )
      console.log(
        `     badge vs seam    : ${a.offSeam}px right of the seam   ` +
          `overlap A=${a.overlapA}px  B=${a.overlapB}px`,
      )
      console.log(
        `     badge vs bottoms : ${a.belowRow}px below the row   ` +
          `A=${a.belowA}px  B=${a.belowB}px  (positive = hangs past that photo's bottom edge)`,
      )
    }

    console.log(`  page height         : ${r.pageH}`)
    await ctx.close()
  }

  await browser.close()
  console.log("")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
