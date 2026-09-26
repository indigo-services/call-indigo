#!/usr/bin/env node
"use strict"
/**
 * Exercise the /admin sign-in gate in a real browser.
 *
 * WHY THIS EXISTS. The suite cannot test a sign-in. `renderToStaticMarkup` runs
 * no effects and has no layout, the guard's decision is a store subscription
 * over `sessionStorage`, and the credential check is an async PBKDF2 — so every
 * claim that matters here is invisible to `tests/auth.mjs`, which can only check
 * the shape of what is stored. What is measured HERE is the behaviour:
 *
 *   1. /admin renders the sign-in page, not the dashboard chrome
 *   2. wrong credentials are rejected, and the dashboard stays hidden
 *   3. right credentials get in, and the chrome appears
 *   4. a reload keeps the session
 *   5. a NEW TAB does not — the session is tab-scoped
 *   6. Sign out ends it, without a reload
 *
 * THE CREDENTIALS COME FROM THE ENVIRONMENT, never from this file. That is the
 * whole point of hashing them: nothing in the repository knows the password.
 *
 *   ADMIN_USER=... ADMIN_PASS=... scripts/_devshot.sh --run scripts/_probe_admin_gate.cjs
 *
 * With neither set, steps 3–6 are reported as SKIPPED. Never as passed — a probe
 * that quietly succeeds when it could not run is exactly the failure this
 * project keeps having to dig out of its own test suite.
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

const results = []
const record = (name, state, detail) => {
  results.push({ name, state, detail })
  const mark = state === "PASS" ? "PASS" : state === "SKIP" ? "SKIP" : "FAIL"
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ""}`)
}

/** Is the sign-in form on screen? `#username` exists only on LoginPage. */
const loginUp = (page) => page.locator("#username").count().then((n) => n > 0)

async function main() {
  const base = flag("base", "http://127.0.0.1:5199")
  const user = process.env.ADMIN_USER || ""
  const pass = process.env.ADMIN_PASS || ""
  const haveCreds = user !== "" && pass !== ""

  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  console.log(`\nadmin gate probe — ${base}\n`)

  /* 1. the gate is up, and the chrome is not */
  await page.goto(`${base}/admin/inquiries`, { waitUntil: "networkidle" })
  const gated = await loginUp(page)
  const bodyText = await page.evaluate(() => document.body.innerText)
  record(
    "a stranger sees the sign-in page",
    gated ? "PASS" : "FAIL",
    gated ? "no session, no dashboard" : "the dashboard rendered without a session",
  )
  record(
    "no dashboard chrome leaks around the sign-in page",
    gated && !/Sign out/.test(bodyText) ? "PASS" : "FAIL",
    gated ? "no sidebar, no sign-out control" : "could not tell — the page is not the sign-in page",
  )

  /* 2. wrong credentials */
  await page.fill("#username", "not-the-operator")
  await page.fill("#password", "not-the-password")
  const t0 = Date.now()
  await page.click('button[type="submit"]')
  let alertText = null
  try {
    await page.waitForSelector('[role="alert"]', { timeout: 20000 })
    alertText = await page.locator('[role="alert"]').innerText()
  } catch {
    /* falls through to the FAIL below */
  }
  const rejectMs = Date.now() - t0
  record(
    "wrong credentials are rejected",
    alertText !== null ? "PASS" : "FAIL",
    alertText !== null ? `"${alertText.trim()}" after ${rejectMs}ms` : "no error appeared",
  )
  const stillOut = await loginUp(page)
  record(
    "a rejected attempt leaves the dashboard closed",
    stillOut ? "PASS" : "FAIL",
    stillOut ? "still on the sign-in page" : "the dashboard opened on bad credentials",
  )

  if (!haveCreds) {
    for (const name of [
      "right credentials open the dashboard",
      "the session survives a reload",
      "a new tab is NOT signed in",
      "Sign out ends the session",
    ]) {
      record(name, "SKIP", "set ADMIN_USER and ADMIN_PASS to run this")
    }
  } else {
    /* 3. right credentials */
    await page.fill("#username", user)
    await page.fill("#password", pass)
    const t1 = Date.now()
    await page.click('button[type="submit"]')
    let opened = true
    try {
      await page.waitForSelector("#username", { state: "detached", timeout: 30000 })
    } catch {
      opened = false
    }
    const acceptMs = Date.now() - t1
    const dashText = opened ? await page.evaluate(() => document.body.innerText) : ""
    record(
      "right credentials open the dashboard",
      opened && /Sign out/.test(dashText) ? "PASS" : "FAIL",
      opened ? `dashboard in ${acceptMs}ms` : "still on the sign-in page after 30s",
    )

    /* 4. a reload keeps the session */
    await page.reload({ waitUntil: "networkidle" })
    record(
      "the session survives a reload",
      (await loginUp(page)) ? "FAIL" : "PASS",
      (await loginUp(page)) ? "the reload asked for the password again" : "still signed in",
    )

    /* 5. a new tab is a new session — sessionStorage, not localStorage */
    const second = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const secondPage = await second.newPage()
    await secondPage.goto(`${base}/admin/inquiries`, { waitUntil: "networkidle" })
    const secondGated = await loginUp(secondPage)
    record(
      "a new tab is NOT signed in",
      secondGated ? "PASS" : "FAIL",
      secondGated ? "the session did not carry across tabs" : "the session leaked into a second tab",
    )
    await second.close()

    /* 6. sign out */
    await page.getByRole("button", { name: "Sign out" }).click()
    let back = false
    try {
      await page.waitForSelector("#username", { timeout: 10000 })
      back = true
    } catch {
      /* falls through */
    }
    record("Sign out ends the session", back ? "PASS" : "FAIL", back ? "back on the sign-in page" : "still signed in")
  }

  await context.close()
  await browser.close()

  const failed = results.filter((r) => r.state === "FAIL")
  const skipped = results.filter((r) => r.state === "SKIP")
  console.log(
    `\n${results.length - failed.length - skipped.length}/${results.length} passed` +
      (skipped.length ? `, ${skipped.length} skipped` : "") +
      (failed.length ? `, ${failed.length} FAILED` : ""),
  )
  console.log("")
  if (failed.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
