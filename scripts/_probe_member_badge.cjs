#!/usr/bin/env node
"use strict"
/**
 * Verify the F9 -> dashboard path in a real browser.
 *
 * WHY THIS EXISTS
 * `tests/verify.mjs` renders pages with `renderToStaticMarkup`, which does NOT run
 * effects. `InquiriesPage` reads its rows through `useApiData`, so under the suite
 * it renders in its SKELETON state and the inquiry rows — and therefore the Member
 * badge — are invisible to it. That is not a gap the suite can close from its own
 * side, so it is closed here instead: seed the store, open a record, and look.
 *
 * The badge is shown only for `member === "yes"`, so this asserts BOTH directions.
 * A check that only looked for "yes" would pass just as well on a page that
 * painted the badge on every record, including the ones predating the question.
 *
 * Usage:
 *   scripts/_devshot.sh --run scripts/_probe_member_badge.cjs
 */
const path = require("path")

const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

const { chromium } = require(path.join(WORKSPACE, "playwright-core"))

function flag(name, dflt) {
  const i = process.argv.indexOf("--" + name)
  return i === -1 ? dflt : process.argv[i + 1]
}

const KEY = "call-indigo:v1:inquiries"

/* Three records, one per answer state. `old` deliberately has NO `member` key at
   all, which is what an inquiry written before 2026-09-25 looks like. */
function record(id, name, member) {
  const r = {
    id,
    name,
    email: `${id}@example.com`,
    phone: "(512) 555-0142",
    propertyType: "residential",
    service: "Plumbing",
    urgency: "soon",
    message: "Water is pooling under the kitchen sink and the cabinet floor is soaked.",
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: "",
  }
  if (member !== undefined) r.member = member
  return r
}

const SEED = [
  record("seed-yes", "Amanda Reyes", "yes"),
  record("seed-no", "Brandon Cole", "no"),
  record("seed-old", "Casey Lin", undefined),
]

async function badgeOn(page, name) {
  await page.locator("tr", { hasText: name }).first().click()
  await page.waitForTimeout(350)
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return { open: false, labels: [] }
    const labels = Array.from(dialog.querySelectorAll("span"))
      .map((s) => s.textContent.trim())
      .filter(Boolean)
    return { open: true, labels }
  })
}

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const browser = await chromium.launch({ executablePath: CHROME })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })

  // Seeded before any app script runs, so the store is already populated when
  // `useApiData` first reads it and `isSeeded()` reports true.
  await ctx.addInitScript(
    ([key, rows]) => window.localStorage.setItem(key, JSON.stringify(rows)),
    [KEY, SEED],
  )

  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))

  await page.goto(base + "/admin/inquiries", { waitUntil: "networkidle" })
  await page.waitForTimeout(600)

  const rows = await page.locator("tbody tr").count()
  console.log(`\n=== /admin/inquiries — the Member badge ===`)
  console.log(`  rows rendered       : ${rows} (expected 3)`)

  const results = []
  for (const [name, want] of [
    ["Amanda Reyes", true],
    ["Brandon Cole", false],
    ["Casey Lin", false],
  ]) {
    const r = await badgeOn(page, name)
    const has = r.labels.includes("Member")
    results.push({ name, want, has })
    console.log(
      `  ${name.padEnd(14)} member=${String(want).padEnd(5)} badge=${String(has).padEnd(5)} ` +
        `${has === want ? "PASS" : "FAIL"}   badges: ${r.labels.slice(0, 5).join(", ")}`,
    )
    await page.keyboard.press("Escape")
    await page.waitForTimeout(250)
  }

  const bad = results.filter((r) => r.has !== r.want)
  console.log(`  rows=3               : ${rows === 3 ? "PASS" : "FAIL"}`)
  console.log(`  F9 dashboard badge  : ${bad.length === 0 ? "PASS" : "FAIL"}`)
  if (errors.length) console.log(`  page errors         : ${errors.slice(0, 3).join(" | ")}`)

  await browser.close()
  process.exit(bad.length === 0 && rows === 3 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
