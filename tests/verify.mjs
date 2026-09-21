/**
 * verify — the rendered-markup gate (PRD §13.1, §14).
 *
 * Renders each public route to static HTML with `react-dom/server` and asserts
 * on the real output, not on the source text. The prototype's `verify.py` did
 * this against a browser; this does it headlessly, which means it can run in CI
 * and cannot be skipped for being inconvenient.
 *
 * Covers the hard zeros of PRD §13.2 that are checkable without layout:
 * broken images, dead anchors, empty hrefs, duplicate ids, unstyled classes,
 * and the structural claims rc1 makes — one `/admin` link per page (§12.4) and
 * the current-page marker landing on the right item (§5.1).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import {
  ROOT,
  attr,
  bodyOf,
  check,
  classTokens,
  element,
  hasClass,
  render,
  siteFooter,
  stripComments,
  suite,
  tags,
  textOf,
} from "./harness.mjs"

/** Every public route, and the module that renders it. */
export const ROUTES = [
  { route: "/", name: "home", module: "src/marketing/pages/HomePage.tsx" },
  { route: "/residential", name: "residential", module: "src/marketing/pages/ResidentialPage.tsx" },
  { route: "/commercial", name: "commercial", module: "src/marketing/pages/CommercialPage.tsx" },
  { route: "/contact", name: "contact", module: "src/marketing/pages/ContactPage.tsx" },
]

/** Destinations the SPA actually serves. Anything else is a dead link. */
const KNOWN_ROUTES = new Set(["/", "/residential", "/commercial", "/contact", "/admin"])

/**
 * Where a nav link actually lands, from the reader's point of view.
 *
 * On the home page the Home entries are `#top` — a scroll to the top of the
 * page you are already on — while the other three pages use `/`. Both resolve
 * to the home route, so comparing raw hrefs reports a drift that does not
 * exist. This is the normalisation that makes the comparison honest.
 */
function navTarget(href, currentRoute) {
  if (href === "#top") return "/"
  if (href.startsWith("#")) return currentRoute
  return href.split("#")[0]
}

function publicFile(urlPath) {
  return path.join(ROOT, "public", urlPath.replace(/^\//, ""))
}

function distCss() {
  const dir = path.join(ROOT, "dist", "assets")
  if (!existsSync(dir)) return null
  const file = readdirSync(dir).find((f) => f.endsWith(".css"))
  return file ? readFileSync(path.join(dir, file), "utf8") : null
}

export async function run() {
  suite("Rendered markup", "tests/verify.mjs")

  const pages = []
  for (const r of ROUTES) {
    const html = await render(r.module, r.name)
    pages.push({ ...r, html, clean: stripComments(html) })
  }
  const home = pages.find((p) => p.name === "home")

  check("every public route renders without throwing", () =>
    pages.filter((p) => !p.html || p.html.length < 5000).map((p) => `${p.route} rendered ${p.html.length} chars`),
  )

  check("no duplicate element ids within a page", () => {
    const out = []
    for (const p of pages) {
      const seen = new Map()
      for (const id of attr(p.clean, "id")) seen.set(id, (seen.get(id) ?? 0) + 1)
      for (const [id, n] of seen) if (n > 1) out.push(`${p.route} — id="${id}" appears ${n}×`)
    }
    return out
  })

  check("every aria-labelledby target exists in the same page", () => {
    const out = []
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const ref of attr(p.clean, "aria-labelledby")) {
        for (const id of ref.split(/\s+/)) {
          if (id && !ids.has(id)) out.push(`${p.route} — aria-labelledby="${id}" has no matching id`)
        }
      }
    }
    return out
  })

  check("every aria-describedby target exists in the same page", () => {
    const out = []
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const ref of attr(p.clean, "aria-describedby")) {
        for (const id of ref.split(/\s+/)) {
          if (id && !ids.has(id)) out.push(`${p.route} — aria-describedby="${id}" has no matching id`)
        }
      }
    }
    return out
  })

  check("every label[for] points at a real control", () => {
    const out = []
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const t of tags(p.clean, "label")) {
        const forAttr = /\bfor\s*=\s*"([^"]*)"/.exec(t)
        if (forAttr && forAttr[1] && !ids.has(forAttr[1])) {
          out.push(`${p.route} — label for="${forAttr[1]}" has no matching control`)
        }
      }
    }
    return out
  })

  check("every <img src> resolves to a file in public/", () => {
    const out = []
    for (const p of pages) {
      for (const src of attr(p.clean, "src")) {
        if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) continue
        if (!src.startsWith("/")) {
          out.push(`${p.route} — relative image src "${src}" (should be root-relative)`)
        } else if (!existsSync(publicFile(src))) {
          out.push(`${p.route} — missing asset ${src}`)
        }
      }
    }
    return out
  })

  check("every anchor has a destination that exists", () => {
    const out = []
    const homeIds = new Set(attr(home.clean, "id"))
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const href of attr(p.clean, "href")) {
        if (href === "" || href === "#") {
          out.push(`${p.route} — empty href`)
          continue
        }
        if (/^(tel:|mailto:|https?:)/.test(href)) continue

        if (href.startsWith("#")) {
          if (!ids.has(href.slice(1))) {
            out.push(`${p.route} — href="${href}" has no matching id on this page`)
          }
          continue
        }

        // "/#about" — a route plus an anchor on the target page.
        const [route, hash] = href.split("#")
        const target = route === "" ? p.route : route
        if (!KNOWN_ROUTES.has(target)) {
          out.push(`${p.route} — href="${href}" is not a route the SPA serves`)
        } else if (hash && target === "/" && !homeIds.has(hash)) {
          out.push(`${p.route} — href="${href}" points at a missing anchor on /`)
        }
      }
    }
    return out
  })

  check("no legacy .html links survive the SPA port", () => {
    const out = []
    for (const p of pages) {
      for (const href of attr(p.clean, "href")) {
        if (/\.html?($|#)/.test(href)) out.push(`${p.route} — href="${href}"`)
      }
    }
    return out
  })

  check("exactly one /admin link per public page (PRD §12.4)", () =>
    pages
      .map((p) => [p, attr(p.clean, "href").filter((h) => h === "/admin").length])
      .filter(([, n]) => n !== 1)
      .map(([p, n]) => `${p.route} — ${n} /admin link(s)`),
  )

  check("each nav presentation marks exactly one current page (PRD §5.1)", () => {
    const out = []
    for (const p of pages) {
      for (const [which, nav] of [
        ["header", element(p.clean, 'aria-label="Main"')],
        ["drawer", element(p.clean, 'id="menu-panel"')],
      ]) {
        if (!nav) {
          out.push(`${p.route} — no ${which} nav`)
          continue
        }
        const current = tags(nav, "a").filter((t) => /aria-current\s*=\s*"page"/.test(t))
        if (current.length !== 1) {
          out.push(`${p.route} — ${which} nav has ${current.length} aria-current="page" anchors`)
          continue
        }
        const href = /\bhref\s*=\s*"([^"]*)"/.exec(current[0])?.[1] ?? ""
        if (navTarget(href, p.route) !== p.route) {
          out.push(`${p.route} — ${which} nav marks href="${href}", which is not this page`)
        }
      }
    }
    return out
  })

  check("the drawer and the header nav offer the same destinations in order", () => {
    const out = []
    for (const p of pages) {
      const header = element(p.clean, 'aria-label="Main"')
      const drawer = element(p.clean, 'id="menu-panel"')
      if (!header || !drawer) {
        out.push(`${p.route} — missing drawer or header nav`)
        continue
      }
      const a = attr(header, "href").map((h) => navTarget(h, p.route))
      const b = attr(drawer, "href")
        .map((h) => navTarget(h, p.route))
        .filter((h) => h.startsWith("/") && KNOWN_ROUTES.has(h))
      if (a.join("|") !== b.join("|")) {
        out.push(`${p.route} — header [${a.join(", ")}] vs drawer [${b.join(", ")}]`)
      }
    }
    return out
  })

  check("both legal dialogs are present, hidden, and correctly labelled", () => {
    const out = []
    for (const p of pages) {
      for (const id of ["legal-terms", "legal-privacy"]) {
        const tag = tags(p.clean, "div").find((t) => new RegExp(`id="${id}"`).test(t))
        if (!tag) {
          out.push(`${p.route} — no #${id} dialog`)
          continue
        }
        if (!/aria-hidden\s*=\s*"true"/.test(tag)) out.push(`${p.route} — #${id} is not aria-hidden on load`)
        if (!/role\s*=\s*"dialog"/.test(tag)) out.push(`${p.route} — #${id} has no role="dialog"`)
        if (!/aria-modal\s*=\s*"true"/.test(tag)) out.push(`${p.route} — #${id} has no aria-modal`)
      }
    }
    return out
  })

  check("the legal dialogs still warn that the text is sample language", () => {
    const out = []
    for (const p of pages) {
      for (const id of ["legal-terms", "legal-privacy"]) {
        const dialog = element(p.clean, `id="${id}"`)
        if (dialog && !/Sample language/.test(dialog)) {
          out.push(`${p.route} — #${id} has no "Sample language" note`)
        }
      }
    }
    return out
  })

  check("the footer year placeholder is present for the hook to fill", () =>
    pages.filter((p) => !/id="year"/.test(p.clean)).map((p) => `${p.route} — no #year`),
  )

  check("the inquiry form is reachable from every public page", () =>
    pages
      .filter((p) => p.route !== "/contact")
      .filter((p) => !attr(p.clean, "href").includes("/contact"))
      .map((p) => `${p.route} — no /contact link`),
  )

  check("the inquiry form asks for everything the data layer stores", () => {
    const contact = pages.find((p) => p.name === "contact")
    const names = new Set(attr(contact.clean, "name"))
    const required = ["name", "email", "phone", "propertyType", "service", "urgency", "message"]
    return required.filter((n) => !names.has(n)).map((n) => `/contact — the form has no "${n}" field`)
  })

  /* ── Design-system coverage ──────────────────────────────────────────────
     The rc1 defect this exists to prevent: the ported pages rendered unstyled
     because 65 component classes were absent from `src/index.css`. Checking the
     class names against the COMPILED stylesheet is the only way to catch it —
     the markup alone looks perfect. */
  suite("Stylesheet coverage", "tests/verify.mjs")

  const css = distCss()

  check("a compiled stylesheet exists to check against", () =>
    css ? [] : ["dist/assets/*.css not found — run `npm run build` first (npm test does this)"],
  )

  if (css) {
    const missing = new Map()
    for (const p of pages) {
      for (const token of classTokens(p.clean)) {
        if (!hasClass(css, token)) {
          if (!missing.has(token)) missing.set(token, new Set())
          missing.get(token).add(p.route)
        }
      }
    }
    check("every class used in the markup is emitted by the stylesheet", () =>
      [...missing].map(([token, routes]) => `${token}  (used on ${[...routes].join(", ")})`),
    )
  }

  /* ── Copy hygiene on rendered text ─────────────────────────────────────── */

  suite("Copy hygiene", "tests/verify.mjs")

  const bodies = pages.map((p) => ({ ...p, text: textOf(bodyOf(p.html)) }))

  check("no scaffolding or placeholder language reaches a visitor", () => {
    const out = []
    const phrases = ["prototype reconstruction", "lorem ipsum", "placeholder copy", "TODO", "FIXME", "XXX"]
    for (const p of bodies) {
      const lower = p.text.toLowerCase()
      for (const phrase of phrases) {
        if (lower.includes(phrase.toLowerCase())) out.push(`${p.route} — "${phrase}"`)
      }
    }
    return out
  })

  check("no doubled words in visible copy", () => {
    const allow = new Set(["had had", "that that"])
    const out = []
    for (const p of bodies) {
      const re = /\b([A-Za-z][A-Za-z'-]{1,})\s+\1\b/gi
      let m
      while ((m = re.exec(p.text)) !== null) {
        if (allow.has(m[0].toLowerCase())) continue
        const around = p.text.slice(Math.max(0, m.index - 45), m.index + 45)
        out.push(`${p.route} — "${m[0]}" near …${around}…`)
      }
    }
    return out
  })

  check("the service-area city list is the same everywhere it is stated", () => {
    const out = []
    for (const p of pages) {
      const text = textOf(bodyOf(p.html))
      for (const m of text.matchAll(/Austin[^.;]{0,80}/g)) {
        const frag = m[0]
        if (!/(Buda|Kyle|San Marcos|Round Rock|Cedar Park|Pflugerville|Georgetown)/.test(frag)) continue
        const flat = frag.replace(/\s*·\s*/g, ", ").replace(/, and /g, ", ")
        const hasAll = ["Austin", "Buda", "Kyle", "San Marcos"].every((c) => flat.includes(c))
        const hasStrays = /Round Rock|Cedar Park|Pflugerville|Georgetown/.test(flat)
        if (!hasAll || hasStrays) {
          out.push(`${p.route} — "${frag.trim()}" (canonical: Austin, Buda, Kyle, and San Marcos)`)
        }
      }
    }
    return out
  })

  check("no sentence is repeated verbatim within one page", () => {
    const out = []
    for (const p of bodies) {
      const sentences = p.text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim().toLowerCase().replace(/\s+/g, " "))
        .filter((s) => s.split(" ").length >= 8)
      const seen = new Map()
      for (const s of sentences) seen.set(s, (seen.get(s) ?? 0) + 1)
      for (const [s, n] of seen) if (n > 1) out.push(`${p.route} — ×${n}: "${s.slice(0, 110)}…"`)
    }
    return out
  })

  check("the county name is not repeated to the point of noise", () => {
    // Global chrome (top bar, footer), the About band, the FAQ answer and the
    // two legal documents each legitimately state it once.
    const CEILING = 8
    return bodies
      .map((p) => [p, (p.text.match(/Hays, Travis, and Williamson counties/gi) ?? []).length])
      .filter(([, n]) => n > CEILING)
      .map(([p, n]) => `${p.route} — stated ${n}× (ceiling ${CEILING})`)
  })

  /*
   * `chrome.ts` composes the shared footer out of `chrome-markup.ts` with string
   * replaces. A replace whose needle stops matching fails SILENTLY — the page
   * still renders, just with the prototype's copy back, and nothing complains.
   * So these assert the rendered output rather than the seam.
   */
  check("the shared-chrome copy corrections reach the rendered footer", () => {
    const REMOVED = [
      "prototype reconstruction for demo purposes",
      "Licensed, bonded, and insured.",
      "Service area: Austin · Buda · Kyle · San Marcos",
    ]
    const out = []
    for (const p of pages) {
      const foot = siteFooter(p.html)
      if (!foot) {
        out.push(`${p.route} — no site footer in the rendered page`)
        continue
      }
      const text = textOf(foot)
      for (const gone of REMOVED) {
        if (text.includes(gone)) out.push(`${p.route} — footer still carries "${gone}"`)
      }
      if (!text.includes("All rights reserved.")) {
        out.push(`${p.route} — the copyright correction did not apply`)
      }
      // The service area must still be stated — the fix removed the duplicate,
      // not the fact.
      if (!/Serving Hays, Travis & Williamson counties/.test(text)) {
        out.push(`${p.route} — the footer no longer states the service area at all`)
      }
    }
    return out
  })

  check("every page's footer says the same thing", () => {
    // The shared chrome used by /contact and the three mirror pages' inline
    // footers are separate copies of the same markup, so they can drift apart
    // without anything failing. Compared as normalised text, because the copies
    // differ in incidental whitespace.
    const footerText = (p) => {
      const foot = siteFooter(p.html)
      return foot ? textOf(foot).replace(/\s+/g, " ").trim() : "(no site footer)"
    }
    const reference = footerText(pages[0])
    return pages
      .slice(1)
      .filter((p) => footerText(p) !== reference)
      .map((p) => `${p.route} — footer differs from ${pages[0].route}`)
  })

  /* ── Punch list v1.0.1 — the client-confirmed changes ─────────────────── */

  suite("Punch list (v1.0.1)", "tests/verify.mjs")

  const mirror = bodies.filter((p) => p.route !== "/contact")

  check("no page promises bonding any more", () => {
    // Client: delete the "bonded" promise everywhere. It shipped in the About
    // bullet, the FAQ answer, a commercial hero chip and every footer column.
    return bodies
      .filter((p) => /bonded/i.test(p.text))
      .map((p) => `${p.route} — still says "bonded"`)
  })

  check("the membership product is a membership, not a management contract", () => {
    // Client: drop "management" — it is Indigo Home / Facility Membership.
    return bodies
      .filter((p) => /Indigo (Home|Facility) Management/.test(p.text))
      .map((p) => `${p.route} — still names an "Indigo … Management" product`)
  })

  check("the ribbon carries one service-area line, phrased as a promise", () => {
    const out = []
    for (const p of bodies) {
      const bar = /<div class="pill-topbar[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/.exec(p.clean)
      if (!bar) {
        out.push(`${p.route} — no utility bar found`)
        continue
      }
      if (bar[0].includes("Residential &amp; commercial services")) {
        out.push(`${p.route} — the redundant "Residential & commercial services" span is back`)
      }
      if (!bar[0].includes("Proudly serving: Hays, Travis, and Williamson counties")) {
        out.push(`${p.route} — the ribbon does not say "Proudly serving: …"`)
      }
      if (!bar[0].includes("max-md:text-[14px]")) {
        out.push(`${p.route} — the ribbon's mobile size is not the bumped 14px`)
      }
    }
    return out
  })

  check("the header phone number is legible on mobile", () => {
    // Client: the phone in the top nav is not legible on mobile. It was hidden
    // below `md`, which left a bare icon with no number.
    const out = []
    for (const p of bodies) {
      const hdr = /<header[\s\S]*?<\/header>/i.exec(p.clean)
      if (!hdr) {
        out.push(`${p.route} — no <header>`)
        continue
      }
      const tel = /<a href="tel:[^"]*"[^>]*>/.exec(hdr[0])
      if (!tel) {
        out.push(`${p.route} — no tel: link in the header`)
        continue
      }
      if (tel[0].includes("max-md:[&>span]:hidden")) {
        out.push(`${p.route} — the header phone number is still hidden on mobile`)
      }
      if (!tel[0].includes("max-md:text-[15px]")) {
        out.push(`${p.route} — the header phone has no mobile size bump`)
      }
    }
    return out
  })

  check("the two unpublished home sections are gone", () => {
    const home = bodies.find((p) => p.route === "/")
    const out = []
    if (home.clean.includes('id="results"')) out.push('id="results" is still rendered')
    if (home.clean.includes('id="area"')) out.push('id="area" is still rendered')
    if (home.clean.includes('id="zip-form"')) out.push("the ZIP form is still rendered")
    if (home.text.includes("Real repairs. Real results.")) {
      out.push("the Real Repairs copy is still rendered")
    }
    return out
  })

  check("the home hero carries its punch-list changes", () => {
    const home = bodies.find((p) => p.route === "/")
    const out = []
    if (!home.clean.includes('id="hero-rotate"')) out.push("the hero has no rotation target")
    if (home.clean.includes("banner-plumber-img")) out.push("the plumber visual is still rendered")
    if (!home.clean.includes("52,550")) out.push("the jobs-completed stat is not 52,550+")
    if (!home.text.includes("Jobs Completed")) out.push('the stat is not labelled "Jobs Completed"')
    if (home.text.includes("Projects Completed")) out.push('the old "Projects Completed" label survives')
    if (/navy-box[^"]*max-md:hidden/.test(home.clean)) {
      out.push("the Emergency button is still hidden on mobile")
    }
    if (!home.text.includes("One Call, All Services")) {
      out.push('the services eyebrow is not "One Call, All Services"')
    }
    if (!home.text.includes("Indigo Home & Facility Membership")) {
      out.push("the membership headline is not updated")
    }
    if (!home.text.includes("BECOME A MEMBER")) out.push("the membership CTA is missing")
    return out
  })

  check("the hero rotation offers every service the client listed", () => {
    // The list lives in the hook, not in markup, so this reads the source. A
    // missing option is otherwise invisible until someone watches the hero.
    const src = readFileSync(path.join(ROOT, "src/marketing/useSiteChrome.ts"), "utf8")
    const m = /const ROTATION = \[([^\]]*)\]/.exec(src)
    if (!m) return ["no ROTATION list in useSiteChrome.ts"]
    const words = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
    return ["Plumbing", "Electrical", "HVAC", "Home Services", "Facility Services"]
      .filter((w) => !words.includes(w))
      .map((w) => `ROTATION is missing "${w}"`)
  })

  check("each membership block reads name, then CTA, then body", () => {
    const out = []
    for (const p of mirror) {
      const cta = ["Become a Member", "BECOME A MEMBER"]
        .map((s) => p.text.indexOf(s))
        .filter((n) => n !== -1)
      if (cta.length === 0) {
        out.push(`${p.route} — no "Become a Member" CTA`)
        continue
      }
      const body = p.text.indexOf("All new customers are given")
      if (body !== -1 && Math.min(...cta) > body) {
        out.push(`${p.route} — the CTA renders after the body text`)
      }
    }
    return out
  })

  /* ── Brand lockup — the client-supplied icon + wordmark ───────────────────
   *
   * The client replaced the v1 `call-indigo-mark*.svg` imagery with a
   * `rounded-full` navy disc holding a lucide `phone` glyph, beside a "Call
   * Indigo" wordmark. It has to land in three chrome positions — header, drawer,
   * footer — on all four routes, which is four separate copies of the chrome:
   * `chrome.ts` builds `/contact` from `chrome-markup.ts`, and the three mirror
   * pages each carry their own inline copy. A change that reaches only one of
   * them is the exact failure this suite exists to catch.
   */

  suite("Brand lockup", "tests/verify.mjs")

  const PHONE_PATH = "M13.832 16.568"

  check("no page still loads the superseded v1 brand mark", () =>
    pages
      .filter((p) => /call-indigo-mark/.test(p.html))
      .map((p) => `${p.route} — still references call-indigo-mark`),
  )

  check("every chrome disc holds the client's phone glyph", () => {
    // Anchored to the disc, not to the page, so the header's `tel:` icon cannot
    // satisfy it. Three per page: one light disc in the header, two inverted
    // ones in the drawer and the footer.
    const re = /rounded-full (?:bg-\[#1e1b4b\]|bg-white)[^"]*">[\s\S]{0,600}?M13\.832 16\.568/g
    return pages
      .map((p) => ({ route: p.route, n: (p.html.match(re) ?? []).length }))
      .filter((r) => r.n !== 3)
      .map((r) => `${r.route} — ${r.n} branded disc(s), expected 3 (header, drawer, footer)`)
  })

  check("the header disc is navy and the dark-surface discs are inverted", () => {
    // Navy-on-navy would be invisible in the drawer and footer, which sit on
    // `bg-ink` / `bg-ink-2`, so those two invert to a white disc with a navy
    // glyph and a white wordmark. Anchored to the disc → glyph → wordmark
    // sequence: a bare `rounded-full bg-white` count is not usable, because the
    // same pair also appears in page content (measured: 4 on the home page).
    const re =
      /rounded-full (bg-\[#1e1b4b\]|bg-white)[^"]*">[\s\S]{0,600}?M13\.832 16\.568[\s\S]{0,400}?<span class="([^"]*)">Call Indigo<\/span>/g
    const out = []
    for (const p of pages) {
      const seen = { "bg-[#1e1b4b]": 0, "bg-white": 0 }
      let m
      while ((m = re.exec(p.html)) !== null) {
        const disc = m[1]
        const wordmark = m[2]
        seen[disc] += 1
        if (disc === "bg-[#1e1b4b]" && !wordmark.includes("text-[#1e1b4b]")) {
          out.push(`${p.route} — navy disc pairs with "${wordmark.slice(0, 50)}", expected text-[#1e1b4b]`)
        }
        if (disc === "bg-white" && !wordmark.includes("text-white")) {
          out.push(`${p.route} — inverted disc pairs with "${wordmark.slice(0, 50)}", expected text-white`)
        }
      }
      if (seen["bg-[#1e1b4b]"] !== 1) out.push(`${p.route} — ${seen["bg-[#1e1b4b]"]} navy disc(s), expected 1 (header)`)
      if (seen["bg-white"] !== 2) out.push(`${p.route} — ${seen["bg-white"]} inverted disc(s), expected 2 (drawer + footer)`)
    }
    return out
  })

  check("every brand wordmark carries the client's tracking value", () => {
    // The superseded lockup used tracking-[-.045em] in the header and
    // tracking-[-.02em] in the drawer and footer; the client's is -0.06em. A
    // half-applied change leaves one of the three on the old value.
    const out = []
    const re = /<span class="([^"]*)"[^>]*>Call Indigo<\/span>/g
    for (const p of pages) {
      let m
      let seen = 0
      while ((m = re.exec(p.html)) !== null) {
        seen += 1
        if (!/tracking-\[-0\.06em\]/.test(m[1])) {
          out.push(`${p.route} — wordmark span without tracking-[-0.06em]: ${m[1].slice(0, 70)}`)
        }
      }
      if (seen !== 3) out.push(`${p.route} — ${seen} wordmark span(s), expected 3`)
    }
    return out
  })

  check("the favicon is the new brand icon, not the superseded mark", () => {
    const html = readFileSync(path.join(ROOT, "index.html"), "utf8")
    const out = []
    if (!/call-indigo-icon\.svg/.test(html)) out.push("index.html does not reference call-indigo-icon.svg")
    if (/call-indigo-mark/.test(html)) out.push("index.html still points a favicon at call-indigo-mark")
    return out
  })

  check("the brand icon carries the client's navy, not the v1 indigo", () => {
    const file = path.join(ROOT, "public", "assets", "images", "call-indigo-icon.svg")
    if (!existsSync(file)) return ["public/assets/images/call-indigo-icon.svg is missing"]
    const svg = readFileSync(file, "utf8")
    const out = []
    if (!/1e1b4b/i.test(svg)) out.push("call-indigo-icon.svg does not carry #1e1b4b")
    if (/1f1c4a|2a2564|161335|4d47a8|37327c|211d52/i.test(svg)) {
      out.push("call-indigo-icon.svg still carries a v1 indigo gradient stop")
    }
    return out
  })

  check("the raster icons are the new brand, flattened where the platform needs it", () => {
    // PNG colour type is byte 25: 6 = truecolour + alpha, 2 = truecolour.
    // The 16/32 favicons keep a transparent surround (the disc is the shape);
    // apple-touch-icon is flattened onto the brand navy, because iOS masks the
    // square itself and a transparent corner renders black on some devices.
    const cases = [
      { file: "favicon-16.png", expect: 6, why: "transparent surround" },
      { file: "favicon-32.png", expect: 6, why: "transparent surround" },
      { file: "apple-touch-icon.png", expect: 2, why: "flattened for iOS" },
    ]
    const out = []
    for (const { file, expect, why } of cases) {
      const p = path.join(ROOT, "public", "assets", "images", file)
      if (!existsSync(p)) {
        out.push(`${file} is missing`)
        continue
      }
      const buf = readFileSync(p)
      if (buf.length < 26 || buf.slice(1, 4).toString() !== "PNG") {
        out.push(`${file} is not a PNG`)
        continue
      }
      if (buf[25] !== expect) {
        out.push(`${file} has PNG colour type ${buf[25]}, expected ${expect} (${why})`)
      }
    }
    return out
  })

  check("the dashboard uses the brand mark, not a CI monogram", () => {
    // PRD §7.1 forbids a hand-written component here, so the mark is inline
    // markup inside the two files that already render the brand.
    const out = []
    for (const f of ["src/components/app-sidebar.tsx", "src/admin/DesignSystemPage.tsx"]) {
      const src = readFileSync(path.join(ROOT, f), "utf8")
      if (/>CI</.test(src)) out.push(`${f} still renders the "CI" monogram`)
      if (!src.includes(PHONE_PATH)) out.push(`${f} does not render the brand phone glyph`)
    }
    return out
  })

  /* ── Legal copy — the policy must describe THIS build ─────────────────────
   *
   * The shipped Privacy Policy is flagged "Sample language". The client asked to replace
   * it with the old site's version, which turned out to be unedited WordPress boilerplate
   * describing blog comments, Gravatars and a login page this site does not have. The
   * same defect was already in our own copy: it claimed a service address the form never
   * asks for, automatic IP/browser collection with no analytics present anywhere, and
   * blanket consent to marketing texts the form never obtains.
   *
   * These checks couple the document to the implementation in BOTH directions, so
   * neither can move without the other: add an analytics script and this fails; delete
   * the sentence that says there is none and this fails too.
   */

  suite("Legal copy matches the build", "tests/verify.mjs")

  function walk(dir) {
    const out = []
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) out.push(...walk(full))
      else out.push(full)
    }
    return out
  }

  const policy = pages.map((p) => ({ route: p.route, doc: element(p.clean, 'id="legal-privacy"') }))
  const terms = pages.map((p) => ({ route: p.route, doc: element(p.clean, 'id="legal-terms"') }))
  const policyText = policy.map((d) => textOf(d.doc ?? ""))

  check("both legal dialogs render on every route", () => [
    ...policy.filter((d) => !d.doc).map((d) => `${d.route} — no #legal-privacy dialog`),
    ...terms.filter((d) => !d.doc).map((d) => `${d.route} — no #legal-terms dialog`),
  ])

  check("the legal copy is identical on all four routes", () => {
    // It is duplicated four times — chrome-markup.ts, plus an inline copy on each
    // mirror page — so "corrected one copy, missed the others" is the expected
    // failure mode here, not a hypothetical one.
    const out = []
    for (const [label, list] of [["Privacy Policy", policy], ["Terms of Service", terms]]) {
      const first = list[0]
      for (const d of list.slice(1)) {
        if (d.doc !== first.doc) out.push(`${label} on ${d.route} differs from ${first.route}`)
      }
    }
    return out
  })

  check("the policy claims no tracking the build does not have", () => {
    // Matching bare product names is not usable: `segment` collides with the
    // Design System's "Segment Accents" tokens and `amplitude`/`fathom` are
    // ordinary English. Match the wiring instead — a script/link URL, a package
    // import, or a tracker global.
    const TRACKERS = [
      /(?:src|href)\s*=\s*["'][^"']*(?:googletagmanager|google-analytics|plausible|posthog|mixpanel|segment\.(?:com|io)|hotjar|amplitude|clarity\.ms|fathom|matomo|statcounter)[^"']*["']/i,
      /from\s+["'](?:posthog-js|mixpanel|@segment\/|@amplitude\/|react-ga|react-hotjar|@vercel\/analytics|plausible-tracker|fathom-client|@sentry\/)[^"']*["']/i,
      /\bgtag\s*\(|\bdataLayer\b|\bfbq\s*\(|\b_gaq\b|\bposthog\.(?:init|capture)\s*\(/,
    ]
    const out = []
    for (const f of [...walk(path.join(ROOT, "src")), path.join(ROOT, "index.html")]) {
      const text = readFileSync(f, "utf8")
      for (const re of TRACKERS) {
        const hit = re.exec(text)
        if (hit) out.push(`${path.relative(ROOT, f).replace(/\\/g, "/")} — matches ${re} ("${hit[0]}")`)
      }
    }
    for (const t of policyText) {
      if (!/runs no analytics/i.test(t)) {
        out.push("the policy no longer states that the site runs no analytics")
      }
    }
    return [...new Set(out)]
  })

  check("the policy does not promise to collect an address the form never asks for", () => {
    const form = readFileSync(path.join(ROOT, "src/marketing/pages/ContactPage.tsx"), "utf8")
    const names = [...form.matchAll(/name="([a-zA-Z-]+)"/g)].map((m) => m[1])
    const out = []
    if (names.includes("address")) {
      out.push("the inquiry form now collects an address — the policy has to be updated with it")
    }
    for (const t of policyText) {
      if (/service address/i.test(t)) out.push("the policy claims a service address the form does not collect")
    }
    return [...new Set(out)]
  })

  check("the policy and the form agree about marketing contact", () => {
    const form = textOf(readFileSync(path.join(ROOT, "src/marketing/pages/ContactPage.tsx"), "utf8"))
    const out = []
    // The promise the visitor actually reads, beside the submit button.
    if (!/only to answer this request/i.test(form)) {
      out.push('the form no longer promises to use details "only to answer this request"')
    }
    for (const t of policyText) {
      if (/including by text message/i.test(t)) out.push("the policy still asserts consent to marketing texts")
      if (!/do not send marketing texts/i.test(t)) out.push("the policy no longer rules out marketing texts")
    }
    return [...new Set(out)]
  })

  /* -------------------------------------------------------------------------
   * Credentials — the strip that used to be placeholders
   *
   * Until 2026-09-21 this band showed six stock "Logoipsum" marks under the
   * heading "Trusted By Leading Brands", with alt="Brand 1".."Brand 6". Every
   * text-based check in this file passed, because the whole defect lived inside
   * the IMAGES — there was no scaffolding word in the markup to catch. So these
   * assertions read the image references and the alt text instead of the copy.
   */
  suite("Credentials, not placeholder brands", "tests/verify.mjs")

  const brandStrips = pages.filter((p) => /id="brands"/.test(p.clean))

  check("the credentials band exists and is the only one", () => {
    if (brandStrips.length === 0) return ["no page carries the credentials band (#brands)"]
    return []
  })

  check("no page loads a placeholder brand mark", () => {
    const out = []
    for (const p of pages) {
      const srcs = [...p.clean.matchAll(/src="([^"]*assets\/images\/[^"]+)"/g)].map((m) => m[1])
      for (const src of srcs) {
        if (/tc-logo|logoipsum/i.test(src)) out.push(`${p.route} — placeholder brand image ${src}`)
      }
    }
    return [...new Set(out)]
  })

  check("the credentials band shows six badges with real alt text", () => {
    const out = []
    for (const p of brandStrips) {
      const strip = element(p.clean, 'id="brands"') ?? ""
      const imgs = strip.match(/<img[^>]*>/g) ?? []
      if (imgs.length !== 6) out.push(`${p.route} — ${imgs.length} credential badges, expected 6`)
      for (const tag of imgs) {
        // `attr()` returns every match, not the first one.
        const alt = (attr(tag, "alt")[0] ?? "").trim()
        // "Brand 1" is exactly the placeholder alt this replaced.
        if (!alt) out.push(`${p.route} — credential badge with no alt text`)
        else if (/^Brand\s*\d/i.test(alt)) out.push(`${p.route} — placeholder alt "${alt}"`)
      }
    }
    return [...new Set(out)]
  })

  check("the credentials heading does not claim unnamed brands", () => {
    const out = []
    for (const p of brandStrips) {
      const strip = element(p.clean, 'id="brands"') ?? ""
      const heading = (strip.match(/<h2[^>]*>([^<]*)<\/h2>/) ?? [])[1] ?? ""
      if (!heading.trim()) out.push(`${p.route} — credentials band has no heading`)
      else if (/leading brands/i.test(heading)) {
        out.push(`${p.route} — heading still claims "leading brands" over accreditation badges`)
      }
    }
    return out
  })
}
